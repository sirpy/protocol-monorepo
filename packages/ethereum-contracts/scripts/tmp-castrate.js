const {
    getScriptRunnerFactory: S,
    extractWeb3Options,
} = require("./libs/common");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");

/**
 * @dev Castrate current logic contracts (unless already initialized).
 * TODO: remove once not needed anymore
 *
 * Usage: npx truffle exec scripts/tmp-castrate.js
 */
module.exports = eval(`(${S.toString()})()`)(async function (
    args,
    options = {}
) {
    let {protocolReleaseVersion} = options;

    console.log("======== Castrate ========");

    const sf = new SuperfluidSDK.Framework({
        ...extractWeb3Options(options),
        version: protocolReleaseVersion,
        additionalContracts: ["UUPSProxiable", "SuperTokenFactory"],
    });
    await sf.initialize();

    console.log("host addr", sf.host.address);

    const superTokenFactory = await sf.contracts.SuperTokenFactory.at(
        await sf.host.getSuperTokenFactory()
    );

    const proxies = [
        {name: "Superfluid", addr: sf.host.address},
        {name: "CFA", addr: sf.agreements.cfa.address},
        {name: "IDA", addr: sf.agreements.ida.address},
        {name: "SuperTokenFactory", addr: await sf.host.getSuperTokenFactory()},
    ];

    //const logicAddrs = [await superTokenFactory.getSuperTokenLogic()];

    for (proxy of proxies) {
        const name = proxy.name;
        const proxyAddr = proxy.addr;

        console.log(`checking ${name} with proxy at ${proxyAddr}`);
        const logicAddr = await (
            await sf.contracts.UUPSProxiable.at(proxyAddr)
        ).getCodeAddress();
//        console.log("logic at", logicAddr);
//        logicAddrs.push(logicAddr);
//    }
//
//    for (logicAddr of logicAddrs) {
        console.log("logic at", logicAddr);
        const logic = await sf.contracts.UUPSProxiable.at(logicAddr);

        try {
            const neededGas = await logic.castrate.estimateGas();
            //console.log("needed gas", neededGas);
            console.log("uninitialized, fixing...");
            await logic.castrate();
            console.log("castrated!");
        } catch (e) {
            // wtf is e? Seems to depend on the connected RPC
            //console.log("error str", e);
            //console.log("error obj", JSON.stringify(e, null, 2));
            let errMsg;
            if (e.message !== undefined) {
                errMsg = e.message;
            } else {
                errMsg = e;
            }

            if (
                errMsg.indexOf(
                    "Initializable: contract is already initialized"
                ) >= 0
            ) {
                console.log("already initialized");
            } else {
                throw e;
            }
        }
    }

    console.log("all done");
});

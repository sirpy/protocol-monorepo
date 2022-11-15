/*
* Script for getting the data needed to initialized the list of canonical SuperTokens
* in the SuperTokenFactory contract.
* 
* TODO:
* check name and symbol are canonical
* if underlying exists more than once, prioritize the listed one
* check if pointing to canonical logic / created via default methods
* check if default proxy
*/

const metadata = require("@superfluid-finance/metadata");
const {ethers} = require("hardhat");
const fetch = require("node-fetch");
const superTokenArtifact = require("../artifacts/contracts/superfluid/SuperToken.sol/SuperToken.json");

const query = `
query GetTokens {
    tokens(
        first: 1000
      where: {name_starts_with: "Super ", symbol_ends_with: "x"}
    ) {
      id
      name
      symbol
      isListed
      isNativeAssetSuperToken
      underlyingToken {
        id
        name
        symbol
      }
    }
  }
`;

// Slot for Factory contract (keccak256("org.superfluid-finance.FullUpgradableSuperTokenWrapper.factory_slot"))
const FACTORY_SLOT =
    "0xb8fcd5719b3ddf8626f3664705a89b7fc476129a58c1aa5eda57c600cc1821a0";

async function executeTokenQuery(endpoint) {
    const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({query}),
        headers: {"Content-Type": "application/json"},
    });
    if (response.ok) {
        const result = JSON.parse(await response.text());
        if (!result.errors) {
            return result.data;
        } else {
            throw new Error(
                "subgraphQuery errors: " + JSON.stringify(result.errors)
            );
        }
    }
}

// @note TODO: Set this up for the different networks based on your provider URLs
// feel free to replace urls with whatever endpoints you have on hand
// set this
const chainIdToRPCUrlMap = new Map([
    [137, `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`],
    [5, `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`],
]);

async function main() {
    // iterate over networks
    for (let i = 0; i < metadata.networks.length; i++) {
        const chainId = metadata.networks[i].chainId;
        
        if (!chainIdToRPCUrlMap.get(chainId)) {
            continue;
        }

        // execute token query for specific endpoint
        const data = await executeTokenQuery(
            metadata.networks[i].subgraphV1.hostedEndpoint
        );
        const nativeAssetSuperTokens = data.tokens.filter(
            (x) => x.isNativeAssetSuperToken
        );

        // there must be a native asset super token
        if (nativeAssetSuperTokens.length === 0)
            throw new Error("No native asset super token");

        const nativeAssetSuperToken = nativeAssetSuperTokens[0];

        // @note first filter: ADHERES TO NAMING CONVENTION
        // only get supertokens with an underlying AND
        // have name with format: Super + underlying.name (our naming convention) AND
        // have symbol: underlying.symbol + x
        const symbolAndNameFilteredTokens = data.tokens
            .filter(
                (x) =>
                    x.underlyingToken != null &&
                    x.name === "Super " + x.underlyingToken.name &&
                    x.symbol === x.underlyingToken.symbol + "x"
            )
            .map((x) => ({
                ...x,

                // for visibility in console
                underlyingSymbol: x.underlyingToken.symbol,
                underlyingName: x.underlyingToken.name,
            }));
        // get provider given chainId
        console.log(`trying network ${metadata.networks[i].name}`);
        const rpcEndpoint = `https://${metadata.networks[i].name}.rpc.x.superfluid.dev`; // chainIdToRPCUrlMap.get(chainId);

        // create provider for specific network
        const provider = new ethers.providers.JsonRpcProvider(
            rpcEndpoint,
            chainId
        );

        // attach contract to addresses
        const superTokens = symbolAndNameFilteredTokens.map((x) => ({
            contract: new ethers.Contract(
                x.id,
                superTokenArtifact.abi,
                provider
            ),
            data: x,
        }));

        // @note second filter: SEMI-UPGRADABLE ONLY
        // initialize semiUpgradeableSuperTokens with native asset super token
        let semiUpgradeableSuperTokens = [nativeAssetSuperToken];
        for (let i = 0; i < superTokens.length; i++) {
            // check the value of storage at location: FACTORY_SLOT
            // this is only set for UUPSFullyUpgradeable
            const factorySlot = await provider.getStorageAt(
                superTokens[i].data.id,
                FACTORY_SLOT
            );

            // if the factory slot is not empty, we can skip to the next token because we know it is
            // a fully upgradeable super token
            if (factorySlot !== ethers.constants.HashZero) {
                continue;
            }
            // check the super token's code address (implementation address)
            const codeAddress = await superTokens[i].contract.getCodeAddress();

            // if the codeAddress is the zero address we can skip to the next token because we know it is
            // a non upgradeable super token
            if (codeAddress === ethers.constants.AddressZero) {
                continue;
            }

            // if neither of the above is true, it is semi upgradeable
            semiUpgradeableSuperTokens = [
                ...semiUpgradeableSuperTokens,
                superTokens[i].data,
            ];
        }

        // map the data so it can be passed as param for governance action
        const mappedDataForInitialization = semiUpgradeableSuperTokens.map(
            (x) => ({
                superToken: x.id,
                underlyingToken:
                    x.isNativeAssetSuperToken
                        ? ethers.constants.AddressZero
                        : x.underlyingToken.id
            })
        );

        console.log("Network:", metadata.networks[i].name);
        console.log("Chain ID:", metadata.networks[i].chainId);
        console.log({semiUpgradeableSuperTokens});
        console.log({mappedDataForInitialization});
    }
}
main();
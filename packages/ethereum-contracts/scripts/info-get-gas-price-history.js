const { getScriptRunnerFactory: S, hasCode } = require("./libs/common");
const Jsonrpc = require('web3-core-requestmanager/src/jsonrpc'); 
const { errors } = require('web3-core-helpers');
const fs = require("fs");

/**
 * @dev Get the gas price history (EIP-1559 base fee).
 * @param web3 The web3 to be used
 *
 * Usage: npx truffle exec scripts/info-get-gas-price-history.js : {OUTPUT_CSV_FILE}
 *        OUTPUT_CSV_FILE will be overwritten if already exists
 */
 
// source: https://github.com/web3/web3.js/issues/3411#issuecomment-1185052107
function executeAsync(batch) {
    return new Promise((resolve, reject) => {
        const requests = batch.requests;
        batch.requestManager.sendBatch(requests, (err, results) => {
            results = results || [];
            var response = requests.map((request, index) => {
                return results[index] || {};
            }).map((result, index) => {
                if (result && result.error) {
                    return errors.ErrorResponse(result);
                }
                if (!Jsonrpc.isValidResponse(result)) {
                    return errors.InvalidResponse(result);
                }
                return requests[index].format ? requests[index].format(result.result) : result.result;
            });
            resolve(response);
        });
    })
}

// key: chainId, value: activation block
const startBlocks = {
    1: 12965000 // London HF
};

module.exports = eval(`(${S.toString()})()`)(async function (
    args,
    options = {}
) {
    if (args.length !== 1) {
        throw new Error("Wrong number of arguments");
    }
    const fileName = args.pop();
    console.log("file name", fileName);

    web3 = web3 || options.web3;

    const curBlock = await web3.eth.getBlockNumber();
    const chainId = await web3.eth.getChainId();

    console.log("current block", curBlock);

    const MAX_BATCH_SIZE = process.env.BATCH_SIZE || 10;

    const priceData = [];

    // if no START_BLOCK is defined as env var,
    // for known networks, use the EIP-1559 activation block, else a bunch of recent blocks
    const startBlock = process.env.START_BLOCK || 
        startBlocks[chainId] !== undefined 
        ? startBlocks[chainId] 
        : curBlock - 88;

    const nrBatches = Math.ceil((curBlock - startBlock) / MAX_BATCH_SIZE);
    console.log("nr batches:", nrBatches);

    fs.writeFileSync(fileName, "block_number,block_timestamp,base_fee,gas_limit,gas_used\n");

    for (let bi=0; bi<nrBatches; bi++) {
    
        const batch = new web3.BatchRequest();
        const batchStartBlock = startBlock + bi*MAX_BATCH_SIZE;
        const batchEndBlock = Math.min(startBlock + (bi+1)*MAX_BATCH_SIZE, curBlock);
        for (let i = batchStartBlock; i<batchEndBlock; i++) {
            batch.add(web3.eth.getBlock.request(i));
        }
        console.log(`executing batch ${bi} with size ${batch.requests.length}`);
        
        const batchResponse = await executeAsync(batch);
        fs.appendFileSync(fileName, batchResponse
            .map(b => `${b.number},${b.timestamp},${b.baseFeePerGas},${parseInt(b.gasLimit, 16)},${parseInt(b.gasUsed, 16)}`)
            .join("\n"));
        fs.appendFileSync(fileName, "\n");

        /*
	priceData.push(...batchResponse.map(b => ({
            number: b.number,
            timestamp: b.timestamp,
            baseFee: b.baseFeePerGas,
            gasLimit: parseInt(b.gasLimit, 16),
            gasUsed: parseInt(b.gasUsed, 16)
        })));
	*/
    }

    //console.log("priceData:", priceData);
    //fs.writeFileSync(fileName, JSON.stringify(priceData, null, 2));
});

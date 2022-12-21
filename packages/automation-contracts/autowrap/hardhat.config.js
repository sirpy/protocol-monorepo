require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat/config");
require("./script/addStrategy");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            }
        }
    },
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
        goerli: {
            url: process.env.GOERLI_URL || "",
            accounts:
                process.env.GOERLI_PRIVATE_KEY !== undefined ? [process.env.GOERLI_PRIVATE_KEY] : [],
        },
        mumbai: {
            url: process.env.MUMBAI_URL || "",
            accounts:
                process.env.MUMBAI_PRIVATE_KEY !== undefined ? [process.env.MUMBAI_PRIVATE_KEY] : [],
        },
        polygon: {
            url: process.env.POLYGON_URL || "",
            accounts:
                process.env.POLYGON_PRIVATE_KEY !== undefined ? [process.env.POLYGON_PRIVATE_KEY] : [],
        },
        bsc: {
            url: process.env.BSC_URL || "",
            accounts:
                process.env.BSC_PRIVATE_KEY !== undefined ? [process.env.BSC_PRIVATE_KEY] : [],
        },
    },

    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    etherscan: {
        // list supported explorers with: npx hardhat verify --list-networks
        apiKey: {
            avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY,
            polygonMumbai: process.env.POLYGONSCAN_API_KEY,
            goerli: process.env.ETHERSCAN_API_KEY,
            optimisticGoerli: process.env.OPTIMISTIC_API_KEY,
            arbitrumGoerli: process.env.ARBISCAN_API_KEY,
            polygon: process.env.POLYGONSCAN_API_KEY,
            gnosis: process.env.GNOSISSCAN_API_KEY,
            avalanche: process.env.SNOWTRACE_API_KEY,
            optimisticEthereum: process.env.OPTIMISTIC_API_KEY,
            arbitrumOne: process.env.ARBISCAN_API_KEY,
            bsc: process.env.BSCSCAN_API_KEY,
            mainnet: process.env.ETHERSCAN_API_KEY
        }
    },
};

require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat/config");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const hardhatConfig = {
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

// add superfluid supported networks

const sfMetaPromise = import("@superfluid-finance/metadata");
let sfMeta;

// Returns an RPC URL for the given network.
function getRpcUrl(n) {
    // If set, a network specific env var is read, else construction from template is attempted, else none set
    return process.env[`${n.uppercaseName}_RPC`] || process.env.RPC_TEMPLATE?.replace("{{NETWORK_NAME}}", n.name) || "";
}

// Returns a list of accounts for the given network
function getAccounts(n) {
    // in order of priority, provide an override pk or a network specific pk or a fallback pk
    return [ process.env.OVERRIDE_PK || process.env[`${n.uppercaseName}_PK`] || process.env.DEFAULT_PK ];
}


(async () => {
    sfMeta = (await sfMetaPromise).default;
    const sfNetworks = sfMeta.networks
        // uncomment and adapt to your needs in order to include only a subset of networks
        //.filter(n => ["eth-goerli", "avalanche-fuji"].includes(n.name))
        .map(n => ({
            [n.name]: {
                url: getRpcUrl(n),
                accounts: getAccounts(n),
                sfMeta: n
            }
        }));

    //console.log("sfnetworks:", JSON.stringify(sfNetworks, null, 2));


    console.log("HH networks PRE:", JSON.stringify(hardhatConfig.networks, null, 2));
    // merge the dynamically created network list
    Object.assign(hardhatConfig.networks, ...sfNetworks);
    console.log("HH networks POST:", JSON.stringify(hardhatConfig.networks, null, 2));

    module.exports = hardhatConfig;
  }
)()


// hardhat task to list public networks with Superfluid deployment
task("sf-networks", "list supported networks").setAction(
    async (taskArgs, hre) => {
        console.log("available networks:\n", sfMeta.networks.map(n => n.name));
    }
);

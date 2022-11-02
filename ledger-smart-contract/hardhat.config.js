require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()
require("solidity-coverage")
require("hardhat-deploy")
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const COINMARKETCAP_API_KEY =
    process.env.COINMARKETCAP_API_KEY || "ccdea578-d955-441d-8ef7-29a19b9190bd"
const GOERLI_RPC_URL =
    process.env.GOERLI_RPC_URL ||
    "https://eth-goerli.g.alchemy.com/v2/pmtL3h1WMA4psRITQ9ycAnMOeNsdwK5U"
const PRIVATE_KEY =
    process.env.PRIVATE_KEY ||
    "75954fbabd6b1263e014b4d5da74b6650344d5b5524fae9565462aad79ea2dd9"
const ETHERSCAN_API_KEY =
    process.env.ETHERSCAN_API_KEY || "EQMI7ITDPE7FSB4EDRRNWV4283PEGUDAHX"

module.exports = {
    defaultNetwork: "ganache",
    networks: {
        hardhat: {
            chainId: 31337,
            // gasPrice: 130000000000,
        },
        ganache: {
            url: "http://127.0.0.1:8545",
            chainId: 1337,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.6.6",
            },
        ],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
    },
    mocha: {
        timeout: 500000,
    },
}
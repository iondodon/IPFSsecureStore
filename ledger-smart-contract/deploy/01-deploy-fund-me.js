const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify, isTestnetNetwork } = require("../utils/verify")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("Deploying Ledger and waiting for confirmations...")
    const ledger = await deploy("Ledger", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`Ledger deployed at ${ledger.address}`)

    if (isTestnetNetwork(network) && process.env.ETHERSCAN_API_KEY) {
        await verify(ledger.address, [])
    }
}

module.exports.tags = ["all", "ledger"]

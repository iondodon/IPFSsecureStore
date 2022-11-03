const { run } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const verify = async (contractAddress, args) => {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}

const isTestnetNetwork = (network) => !developmentChains.includes(network.name)

module.exports = { verify, isTestnetNetwork }

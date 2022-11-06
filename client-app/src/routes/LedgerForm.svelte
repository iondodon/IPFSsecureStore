<script>
	import { ethers }  from "ethers"
	import { abi, contractAddress } from "./constants"

	let metamaskStatus = "Not Connected"

	async function connect() {
		if (typeof window.ethereum !== "undefined") {
			try {
				await ethereum.request({ method: "eth_requestAccounts" })
			} catch (error) {
				console.log(error)
			}
			metamaskStatus = "Connected"
			const accounts = await ethereum.request({ method: "eth_accounts" })
			console.log(accounts)
		} else {
			console.log("Please install Metamask")
		}
	}

	async function getBalance() {
		if (typeof window.ethereum !== "undefined") {
			const provider = new ethers.providers.Web3Provider(window.ethereum)
			const balance = await provider.getBalance(contractAddress)
			console.log(ethers.utils.formatEther(balance))
		}
	}

	async function withdraw() {
		if (typeof window.ethereum !== "undefined") {
			console.log("Withdrawing...")
			const provider = new ethers.providers.Web3Provider(window.ethereum)
			const signer = provider.getSigner()
			const contract = new ethers.Contract(contractAddress, abi, signer)

			try {
				const transactionResponse = await contract.withdraw()
				await listenForTransactionMine(transactionResponse, provider)
			} catch (error) {
				console.log(error)
			}
		}
	}

	async function registerNewData() {
		const cid = document.getElementById("cid").value
		console.log(`Registering CID ${cid}...`)
		if (typeof window.ethereum !== undefined) {
			const provider = new ethers.providers.Web3Provider(window.ethereum)
			const signer = provider.getSigner()
			const contract = new ethers.Contract(contractAddress, abi, signer)

			try {
				const transactionResponse = await contract.registerNewData("cid")
				await listenForTransactionMine(transactionResponse, provider)
				console.log("Done!")
			} catch (error) {
				console.log(error)
			}
		}
	}

	function getPublishedCids() {
		
	}

	function listenForTransactionMine(transactionResponse, provider) {
		console.log(`Mining ${transactionResponse.hash}...`)
		return new Promise((resolve, _reject) => {
			provider.once(transactionResponse.hash, (transactionReceipt) => {
				console.log(`Completed with ${transactionReceipt.confirmations}`)
				resolve()
			})
		})
	}

</script>

<div class="counter">
	<button id="connectButton" on:click={connect}>{metamaskStatus}</button>
    <button id="registerButton" on:click={registerNewData}>RegisterNewData</button>
	<button id="balanceButton" on:click={getBalance}>GetBalance</button>
	<button id="withdrawButton" on:click={withdraw}>Withdraw</button>
	<button id="getPublishedCidsButton" on:click={getPublishedCids}>Get published CIDs</button>

	<label for="cid">CID</label>
	<input id="cid" placeholder="CID"/>


</div>

<style>

</style>

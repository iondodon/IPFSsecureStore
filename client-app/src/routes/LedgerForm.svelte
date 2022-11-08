<script>
	import { ethers }  from "ethers"
	import { abi, contractAddress } from "./constants"
	import { onMount } from 'svelte'
	import * as IPFS from 'ipfs-core'

	let ipfs = null
	let ethereum = null
	let connectedAccounts = []
	$: metamaskConnectionStatus = connectedAccounts.length > 0 ? "Connected" : "Not conneted"  

	let provider = null
	let signer = null
	let contract = null
	

	onMount(async () => {
		ethereum = window.ethereum
		ipfs = await IPFS.create()

		provider = new ethers.providers.Web3Provider(ethereum)
		signer = provider.getSigner()
		contract = new ethers.Contract(contractAddress, abi, signer)

		ethereum.on('accountsChanged', (accounts) => {
			console.log("Accounts changed", accounts)
			connectedAccounts = accounts
		})
	})

	const connect = async () => {
		if (typeof ethereum === undefined) {
			console.log("Please install Metamask")
		}

		await ethereum.request({ method: "eth_requestAccounts" })
		const accounts = await ethereum.request({ method: "eth_accounts" })
		console.log("Accounts: ", accounts)
	}

	const getBalance = async () => {
		if (typeof ethereum === undefined) {
			return
		}
		const balance = await provider.getBalance(contractAddress)
		console.log(ethers.utils.formatEther(balance))
	}

	const withdraw = async () => {
		if (typeof ethereum === undefined) {
			return
		}

		console.log("Withdrawing...")
		const transactionResponse = await contract.withdraw()
		await listenForTransactionMine(transactionResponse, provider)
	}

	const publishValue = async () => {
		if (typeof ethereum === undefined) {
			return
		}
		if (ipfs === undefined) {
			console.log("IPFS node is not up!")
		}

		const valueToStore = document.getElementById("valueToStore").value
		const response = await ipfs.add(valueToStore)
		console.log("Response ", response)
		const cid = response.path
		const transactionResponse = await contract.publishCid(cid)
		await listenForTransactionMine(transactionResponse, provider)
		console.log("Done!")
	}

	const getPublishedCids = async () => {
		if (typeof ethereum === undefined) {
			return
		}

		console.log("Getting my published CIDs...")
		const ownedCids = await contract.getPublishedCids()
		console.log("Owning CIDs:", ownedCids)
	}

	const getPublishedCidsByUser = async () => {
		if (typeof ethereum === undefined) {
			return
		}

		console.log("Getting published CIDs by user Address...")
		const userAddress = document.getElementById("userAddress").value
		const ownedCids = await contract.getPublishedCidsByUser(userAddress)
		console.log(`User with addrees ${userAddress} ownes:`, ownedCids)
	}

	const getOwnerOfCid = async () => {
		if (typeof ethereum === undefined) {
			return
		}

		console.log("Getting owner of CID...")
		const cid = document.getElementById("cid").value
		const ownerAddress = await contract.getOwnerOfCid(cid)
		console.log(`Owner of CID ${cid} is:`, ownerAddress)
	}

	const listenForTransactionMine = (transactionResponse, provider) => {
		console.log(`Mining ${transactionResponse.hash}...`)
		return new Promise((resolve, _reject) => {
			provider.once(transactionResponse.hash, (transactionReceipt) => {
				console.log(`Completed with ${transactionReceipt.confirmations}`)
				console.log("Transaction receipr", transactionReceipt)
				resolve()
			})
		})
	}

</script>

<div id="form">
	<button id="connectButton" on:click={connect}>{metamaskConnectionStatus}</button>
    <button id="publishValueButton" on:click={publishValue}>Publish Value</button>
	<button id="balanceButton" on:click={getBalance}>GetBalance</button>
	<button id="withdrawButton" on:click={withdraw}>Withdraw</button>
	<button id="getPublishedCidsButton" on:click={getPublishedCids}>Get published CIDs</button>
	<button id="getPublishedCidsByUserButton" on:click={getPublishedCidsByUser}>GetPublishedCidsByUser</button>
	<button id="getOwnerOfCid" on:click={getOwnerOfCid}>GetOwnerOfCid</button>
	<br/>
	<input id="cid" placeholder="CID"/>
	<input id="valueToStore" placeholder="ValueToStore"/>
	<input id="userAddress" placeholder="user address"/>
</div>

<style>
	#form {
		display: flex;
		flex-direction: column;
	}
</style>

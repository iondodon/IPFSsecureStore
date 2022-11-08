<script>
	import { ethers }  from "ethers"
	import { abi, contractAddress } from "./constants"
	import { onMount } from 'svelte'
	import * as IPFS from 'ipfs-core'
	import { Buffer } from "buffer"
	
	let ipfs = null
	let ethereum = null
	$: connectedAccounts = []

	let provider = null
	let signer = null
	let contract = null

	let files = []
	$: cids = []

	$: if (files) {
		// Note that `files` is of type `FileList`, not an Array:
		// https://developer.mozilla.org/en-US/docs/Web/API/FileList
		console.log(files);

		for (const file of files) {
			console.log(`${file.name}: ${file.size} bytes`);
		}
	}
	

	onMount(async () => {
		ethereum = window.ethereum
		ipfs = await IPFS.create()

		provider = new ethers.providers.Web3Provider(ethereum)
		signer = provider.getSigner()
		contract = new ethers.Contract(contractAddress, abi, signer)

		ethereum.on('accountsChanged', (accounts) => {
			console.log("Accounts changed", accounts)
			connectedAccounts = accounts
			if (accounts.length > 0) {
				getPublishedCids()
			} else {
				cids = []
			}
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

	const publishFile = async () => {
		if (typeof ethereum === undefined) {
			return
		}
		if (ipfs === undefined) {
			console.log("IPFS node is not up!")
			return
		}
		if (files.length < 1) {
			console.log("No file selected")
			return
		}
		const reader = new FileReader()

		reader.onloadend = async () => {
			const buf = new Buffer(reader.result)
			const result = await ipfs.add(buf)
			const cid = result.path

			const transactionResponse = await contract.publishCid(cid)
			await listenForTransactionMine(transactionResponse, provider)

			cids = [...cids, cid]

			let url = `https://ipfs.io/ipfs/${cid}`
			console.log(`Url --> ${url}`)
		}

		reader.readAsArrayBuffer(files[0])
    }

	const getPublishedCids = async () => {
		if (typeof ethereum === undefined) {
			return
		}

		console.log("Getting my published CIDs...")
		const ownedCids = await contract.getPublishedCids()
		cids = ownedCids
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

<div id="container">
	<div id="form">
		<div class="alert alert-primary" role="alert">
			{#if connectedAccounts.length > 0}
				Connected wallet address: {connectedAccounts[0]}
			{:else}
				No account connected
			{/if}
		</div>

		<button 
			type="button" 
			class="btn btn-success" 
			id="connectButton" 
			on:click={connect}
			disabled={(() => connectedAccounts.length > 0)()}
		>
			{#if connectedAccounts.length > 0}
				Connected
			{:else}
				Connect to MetaMask
			{/if}
		</button>

		<br/>

		<div class="btn-group" role="group">
			<button class="btn btn-outline-primary" id="publishFileButton" on:click={publishFile}>Publish File</button>

			<button class="btn btn-outline-primary" id="balanceButton" on:click={getBalance}>GetBalance</button>
			<button class="btn btn-outline-primary" id="withdrawButton" on:click={withdraw}>Withdraw</button>
			<button class="btn btn-outline-primary" id="getPublishedCidsButton" on:click={getPublishedCids}>Get published CIDs</button>
			<button class="btn btn-outline-primary" id="getPublishedCidsByUserButton" on:click={getPublishedCidsByUser}>GetPublishedCidsByUser</button>
			<button class="btn btn-outline-primary" id="getOwnerOfCid" on:click={getOwnerOfCid}>GetOwnerOfCid</button>
		</div>

		<br/>

		<div class="input-group mb-3">
			<span class="input-group-text" id="basic-addon3">CID</span>
			<input type="text" class="form-control" id="cid" aria-describedby="basic-addon3">
		</div>

		<div class="input-group mb-3">
			<span class="input-group-text" id="basic-addon3">User wallet address</span>
			<input type="text" class="form-control" id="userAddress" aria-describedby="basic-addon3">
		</div>
		
		<div>
			<label for="formFileLg" class="form-label">Upload a file</label>
			<input class="form-control form-control-lg" name="File to upload" id="fileToUpload" bind:files type="file">
		</div>
	</div>


	<div id="stored-cids">
		<table class="table">
			<caption>List of stored CIDs</caption>
			<thead>
				<tr>
				<th scope="col">CID</th>
				<th scope="col">IPFS address</th>
				</tr>
			</thead>
			<tbody>
				{#each cids as cid}
					<tr>
						<th scope="row">{cid}</th>
						<td>
							<a href="ipfs://{cid}">ipfs://{cid}</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

</div>

<style>
	#container {
		display: flex;
		flex-direction: column;
		margin: auto;
	}

	#stored-cids {
		margin-top: 20px;
	}

	#form {
		margin: auto;
		display: flex;
		flex-direction: column;
	}
</style>

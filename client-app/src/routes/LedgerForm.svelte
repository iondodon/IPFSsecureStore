<script>
	import { ethers }  from "ethers"
	import { abi, contractAddress } from "./constants"
	import { onMount } from 'svelte'
	import * as IPFS from 'ipfs-core'
	import { Buffer } from "buffer"
	import CryptoJS from "crypto-js"
	
	let ipfs = null
	let ethereum = null
	$: connectedAccounts = []

	let provider = null
	let signer = null
	let contract = null

	let files = []
	$: cids = []
	let result = null

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
			showModal(`Connected Accounts ${JSON.stringify(connectedAccounts)}`)
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
		showModal(`Accounts ${JSON.stringify(accounts)}`)
	}

	const getBalance = async () => {
		if (typeof ethereum === undefined) {
			return
		}
		const balance = await provider.getBalance(contractAddress)
		showModal(`Contract value = ${ethers.utils.formatEther(balance)}`)
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
			
			// create string from buf
			const str = buf.toString('utf8')
			console.log('plain', str)
			// encrypt string
			const encrypted = CryptoJS.AES.encrypt(str, "secret key 123").toString()
			console.log('encrypted', encrypted)

			const result = await ipfs.add(encrypted)
			const cid = result.path

			const transactionResponse = await contract.publishCid(cid)
			await listenForTransactionMine(transactionResponse, provider)

			cids = [...cids, cid]

			let url = `https://ipfs.io/ipfs/${cid}`
			showModal(`CID on IPFS: ${cid}`)
		}

		reader.readAsArrayBuffer(files[0])
    }

	const getContentOnCid = async () => {
		if (typeof ethereum === undefined) {
			return
		}
		if (ipfs === undefined) {
			console.log("IPFS node is not up!")
			return
		}

		const cid = document.getElementById("cid").value
		// ipfs download file from cid then download it
		const chunks = []
		for await (const chunk of ipfs.cat(cid)) {
			chunks.push(chunk)
		}
		// get string from chunks
		const str = Buffer.concat(chunks).toString('utf8')
		console.log('str', str)
		// descrypt string
		const decrypted = CryptoJS.AES.decrypt(str, "secret key 123").toString(CryptoJS.enc.Utf8)
		console.log('decrypted', decrypted)
		// get buffer from string
		const buf = Buffer.from(decrypted, 'utf8')

		// const buf = Buffer.concat(chunks)
		const blob = new Blob([buf], { type: "application/octet-stream" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = cid
		document.body.appendChild(a)
		a.click()
	}

	const getPublishedCids = async () => {
		if (typeof ethereum === undefined) {
			return
		}

		console.log("Getting my published CIDs...")
		cids = await contract.getPublishedCids()
		showModal(`Published CIDs: ${JSON.stringify(cids)}`)
	}

	const getPublishedCidsByUser = async () => {
		if (typeof ethereum === undefined) {
			return
		}

		console.log("Getting published CIDs by user Address...")
		const userAddress = document.getElementById("userAddress").value
		const ownedCids = await contract.getPublishedCidsByUser(userAddress)
		showModal(`User with addrees ${userAddress} ownes: ${JSON.stringify(ownedCids)}`)
	}

	const getOwnerOfCid = async () => {
		if (typeof ethereum === undefined) {
			return
		}

		console.log("Getting owner of CID...")
		const cid = document.getElementById("cid").value
		const ownerAddress = await contract.getOwnerOfCid(cid)
		showModal(`Owner of CID ${cid} is: ${ownerAddress}`)
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

	const showModal = (resultContent) => {
		result = resultContent
		var modal = document.getElementById('result-modal')
		modal.style.display = 'block'
	}

	const closeModal = () => {
		var modal = document.getElementById('result-modal')
		modal.style.display = 'none'
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
			<button class="btn btn-outline-primary" id="getContentOnCid" on:click={getContentOnCid}>GetContentOnCid</button>
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

	<div id="result-modal" tabindex="-1" role="dialog">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="exampleModalLabel">Result</h5>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close" on:click={closeModal}>
				<span aria-hidden="true">&times;</span>
				</button>
			</div>
			<div class="modal-body">
				{result}
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-dismiss="modal" on:click={closeModal}>Close</button>
			</div>
			</div>
		</div>
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

	#result-modal {
		display: none;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: fit-content!important;
	}

	.modal-body {
		overflow-wrap: break-word;
	}
</style>

<script>
	import './styles.css'
	// import '../../node_modules/bootstrap/dist/js/bootstrap.bundle'
	import '../../node_modules/bootstrap/dist/css/bootstrap.css'
</script>

<div class="app">
	<main>
		<slot />
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}
</style>

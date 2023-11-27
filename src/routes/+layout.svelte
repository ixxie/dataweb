<script>
	import './app.css';
</script>

<nav>
	<section>
		<img src="hipologo.svg" style="height: 30px;" alt="Hippotese Logo" />
		<h1>Hippotese DataWeb</h1>
	</section>
</nav>
<main>
	<slot />
</main>

<style>
	nav {
		width: 100%;
		height: fit-content;
		display: flex;
		flex-flow: row nowrap;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
	}

	nav > section {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		gap: 0.5rem;
	}

	main {
		width: 100%;
	}
</style>

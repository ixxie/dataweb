<script lang="ts">
	import * as vg from '@uwdata/vgplot';

	import { load } from '$lib/load';
	import { FilterTime, FilterSignal, Timeseries, Distribution, Table } from '$lib/charts';

	let filelist: FileList | undefined;

	const init = async (filelist: FileList | undefined) => {
		let result;
		let selection;
		if (filelist) {
			const connector = await vg.wasmConnector({ log: false, cache: false });
			// load the files
			result = await load(connector.db, filelist);
			// setup the coordinator
			let coordinator = await vg.coordinator();
			coordinator.databaseConnector(connector);
			coordinator.clear();
			// create the selection
			selection = vg.Selection.crossfilter();
		}
		return { ...result, selection };
	};

	let innerWidth: number = 1000;
</script>

<svelte:window bind:innerWidth />

<nav>
	<section>
		<img src="hipologo.svg" style="height: 30px;" />
		<h1>Datagraph Web</h1>
	</section>
	<menu class="fileloader">
		<input
			accept=".csv, text/plain"
			bind:files={filelist}
			id="files"
			name="files"
			type="file"
			multiple
		/>
	</menu>
</nav>
<main>
	{#if filelist}
		{#await init(filelist)}
			<span>Charger...</span>
		{:then { metadata, selection }}
			<article>
				<h2>Graphiques</h2>
				<h3>Séries temporelles minimap</h3>
				<p>Faire glisser horizontalement pour zoomer sur une période</p>
				<FilterTime {selection} {innerWidth} />
				<h3>Séries Temporelles</h3>
				<p>Les valeurs d'effort dans le temps</p>
				<Timeseries {selection} {innerWidth} />
				<h3>Distribution de fréquence minimap</h3>
				<p>Faire glisser horizontalement pour zoomer sur une gamme d'efforts</p>
				<FilterSignal {selection} {innerWidth} />
				<h3>Distribution de fréquence</h3>
				<p>Fréquence d'apparition d'une valeur d'effort</p>
				<Distribution {selection} {innerWidth} />
				<h2>Tableaux</h2>
				<h3>Données de séries temporelles</h3>
				<p>Traitée pour la correction du temps et la transformation des données.</p>
				<Table
					from="traction_collated"
					{selection}
					{innerWidth}
					columns={{
						horodatage: 200,
						t: 50,
						capteur_1: 100,
						...(metadata.sensorCount >= 2 ? { capteur_2: 100 } : {}),
						total: 100
					}}
					align={{
						horodatage: 'left',
						t: 'left',
						capteur_1: 'center',
						...(metadata.sensorCount >= 2 ? { capteur_2: 'center' } : {}),
						total: 'center'
					}}
				/>
			</article>
		{/await}
	{:else}
		<span>Sélectionnez un ou plusieurs fichiers datafficheur pour commencer...</span>
	{/if}
</main>

<style>
	:root {
		--highlight: rgb(148, 187, 121);
		--primary: rgb(56, 56, 56);
		--app-width: min(1200px, 100%);
	}

	.tab {
		padding: 0.2rem 0.4rem;
		border-radius: 0.3rem 0.3rem 0 0;
		opacity: 0.3;
	}

	.tablist {
		margin-top: 1rem;
		padding: 0 1rem;
	}

	.active {
		opacity: 1;
	}

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

	article {
		width: max-content;
		border: 2px solid var(--primary);
		border-radius: 0.5rem;
		padding: 0.5rem;
		display: flex;
		flex-flow: column nowrap;
		justify-content: center;
	}

	button {
		border: 0;
		background-color: var(--primary);
		color: white;
	}

	h1 {
		font-size: 20px;
		text-transform: uppercase;
	}

	h2 {
		font-size: 16px;
		text-transform: uppercase;
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
	}

	span {
		margin: 10rem;
		font-size: larger;
		display: block;
		text-align: center;
	}
</style>

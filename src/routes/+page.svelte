<script lang="ts">
	import * as vg from '@uwdata/vgplot';

	import { load } from '$lib/load';
	import { FilterTime, FilterSignal, Timeseries, Distribution, Table } from '$lib/charts';

	import { setContext } from 'svelte';

	let ready = false;

	let filelist: FileList | undefined;
	$: init(filelist);

	let selection: any;

	let metadata: {} | undefined;

	const setup = async (connector: ReturnType<typeof vg.wasmConnector>) => {
		metadata = await load(connector.db, filelist);
		await vg.coordinator().databaseConnector(connector);
		selection = vg.Selection.crossfilter();
		ready = true;
	};

	const init = (filelist: FileList | undefined) => {
		if (filelist) {
			vg.wasmConnector({ log: false, cache: false }).then(setup);
		}
	};

	let innerWidth: number = 1000;

	setContext('app-state', {
		metadata,
		row: 400,
		css: `
			font-size: 13px;
		`
	});
</script>

<svelte:window bind:innerWidth />

<nav>
	<h1>Datafficheur 2.0</h1>
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
		{#if ready}
			<article>
				<h2>Graphiques</h2>
				<h3>Séries temporelles minimap</h3>
				<p>Faire glisser horizontalement pour zoomer sur une période</p>
				<FilterTime {selection} {innerWidth} />
				<h3>Séries Temporelles</h3>
				<Timeseries {selection} {innerWidth} />
				<h3>Distribution de fréquence minimap</h3>
				<FilterSignal {selection} {innerWidth} />
				<h3>Distribution de fréquence</h3>
				<Distribution {selection} {innerWidth} />
				<h2>Tableaux</h2>
				<h3>Données de séries temporelles</h3>
				<p>Traitée pour la correction du temps et la transformation des données.</p>
				<Table
					from="traction_collated"
					{selection}
					{innerWidth}
					columns={{
						timestamp: 200,
						t: 50,
						sensor1: 100,
						sensor2: 100,
						total: 100
					}}
					align={{
						timestamp: 'left',
						t: 'left',
						sensor1: 'center',
						sensor2: 'center',
						total: 'center'
					}}
				/>
			</article>
		{:else}
			<span>Charger...</span>
		{/if}
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
		font-size: 16px;
		text-transform: uppercase;
	}

	h2 {
		font-size: 14px;
		text-transform: uppercase;
	}

	span {
		margin: 10rem;
		font-size: larger;
		display: block;
	}
</style>

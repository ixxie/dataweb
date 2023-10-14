<script lang="ts">
	import * as vg from '@uwdata/vgplot';

	import { load } from '$lib/load';
	import { Mininav, Timeseries, Distribution, Table } from '$lib/charts';

	import { setContext } from 'svelte';

	let filelist: FileList | undefined;

	let ready = false;
	let selection: any;
	let metadata: {} | undefined;

	$: init(filelist);

	const init = (filelist: FileList | undefined) => {
		if (filelist) {
			vg.wasmConnector({ log: false, cache: false }).then(
				async (connector: ReturnType<typeof vg.wasmConnector>) => {
					metadata = await load(connector.db, filelist);
					await vg.coordinator().databaseConnector(connector);
					selection = vg.Selection.crossfilter();
					ready = true;
				}
			);
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

	let activeTab = 'dashboard';
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
				<h2>graphiques</h2>
				<Mininav {selection} {innerWidth} />
				<Timeseries {selection} {innerWidth} />
				<Distribution {selection} {innerWidth} />
				<h2>tableaux</h2>
				<Table from="traction" {selection} {innerWidth} />
				<Table from="time" {innerWidth} />
			</article>
		{:else}
			<p>Charger...</p>
		{/if}
	{:else}
		<p>Sélectionnez un ou plusieurs fichiers datafficheur pour commencer...</p>
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
		width: 100%;
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
		font-size: 18px;
		text-transform: uppercase;
	}

	h2 {
		font-size: 14px;
		text-transform: uppercase;
	}

	p {
		margin: 10rem;
		font-size: larger;
	}
</style>

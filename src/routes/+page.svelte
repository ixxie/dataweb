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

	setContext('app-state', {
		metadata,
		col: 1000,
		row: 400,
		css: `
			font-size: 13px;
		`
	});

	let activeTab = 'dashboard';

	let timeline: any;
	let zoom: any;
</script>

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
			<menu class="tablist">
				<button
					on:click={() => (activeTab = 'dashboard')}
					class:active={activeTab == 'dashboard'}
					class="tab"
				>
					Dashboard
				</button>
				<button
					on:click={() => (activeTab = 'debug')}
					class:active={activeTab == 'debug'}
					class="tab"
				>
					Debug
				</button>
			</menu>
			{#key activeTab}
				<article class:hidden={activeTab !== 'dashboard'}>
					<Mininav {selection} />
					<Timeseries {selection} />
					<Distribution {selection} />
					<Table from="traction" {selection} />
				</article>
				<article class:hidden={activeTab !== 'debug'}>
					<Table from="time" />
				</article>
			{/key}
		{:else}
			<p>Loading...</p>
		{/if}
	{:else}
		<p>Select a file to use...</p>
	{/if}
</main>

<style>
	:root {
		--highlight: rgb(148, 187, 121);
		--primary: rgb(56, 56, 56);
		--app-width: 1200px;
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
		width: var(--app-width);
		height: fit-content;
		padding: 0.5rem;
		display: flex;
		flex-flow: row nowrap;
		justify-content: space-between;
	}

	main {
		padding: 0.5rem;
		width: fit-content;
	}

	button {
		border: 0;
		background-color: var(--primary);
		color: white;
	}

	article {
		width: var(--app-width);
		border: 2px solid var(--primary);
		border-radius: 0.5rem;
		padding: 0.5rem;
		display: flex;
		flex-flow: column nowrap;
		justify-content: center;
	}

	p {
		margin-top: 200px;
		font-size: larger;
	}
</style>

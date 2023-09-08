<script lang="ts">
	import * as vg from '@uwdata/vgplot';

	import { loadFiles } from '$lib';
	import Table from './Table.svelte';
	import Timeline from './Timeline.svelte';
	import Zoom from './Zoom.svelte';

	let dash: HTMLElement;
	let filelist: FileList | undefined;

	let ready = false;
	let selection: any;

	$: if (filelist) {
		vg.wasmConnector({ log: true, cache: false }).then(async (connector: ReturnType<typeof vg.wasmConnector>) => {
			await loadFiles(connector.db, filelist);
			await vg.coordinator().databaseConnector(connector);
			selection = vg.Selection.crossfilter();
			ready = true;
		});
	}
</script>

<label for="files">Upload files:</label>
<input
	accept=".csv, text/plain"
	bind:files={filelist}
	id="files"
	name="files"
	type="file"
	multiple
/>

<div bind:this={dash} />

{#if ready}
	<Timeline from="traction" x="t" y="force" {selection} />
	<Zoom
		from="traction" x="t" y="force" {selection} 
	/>
	<Table
		from="traction"
		columns={{ sensor: 50, t: 50, force: 50}}
		height={300}
		maxWidth={300}
		{selection}
	/>
{/if}

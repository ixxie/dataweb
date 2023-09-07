<script lang="ts">
	import * as vg from '@uwdata/vgplot';

	import { loadFiles } from '$lib';
	import Table from './Table.svelte';
	import Timeline from './Timeline.svelte';

	let dash: HTMLElement;
	let filelist: FileList | undefined;

	let ready = false;
	let selection: any;

	$: if (filelist) {
		vg.wasmConnector({ log: true }).then(async (connector: ReturnType<typeof vg.wasmConnector>) => {
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
	<Table
		from="traction"
		columns={{ t: 50, time_diff: 50, force: 50, sensor: 50 }}
		height={300}
		{selection}
	/>
{/if}

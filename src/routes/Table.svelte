<script lang="ts">
	import * as vg from '@uwdata/vgplot';
	import { onMount, onDestroy } from 'svelte';

	export let from: string;
	export let columns: {};
	export let height: number;
	export let selection: any;

	let el: HTMLElement;
	let table = vg.table({
		from,
		filterBy: selection,
		columns: Object.keys(columns),
		width: columns,
		height
	});

	onMount(() => {
		el.appendChild(table);
	});
	onDestroy(() => {
		el.removeChild(table);
	});
</script>

<div bind:this={el} />

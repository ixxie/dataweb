<script lang="ts">
	import * as vg from '@uwdata/vgplot';
	import { onMount, onDestroy, getContext } from 'svelte';

	export let from: string;
	export let columns: {} | undefined = undefined;
	export let selection: any | undefined = undefined;
	export let innerWidth: number;

	const app = getContext('app-state');

	let cols = columns ? { columns: Object.keys(columns) } : {};

	let el: HTMLElement;
	$: table = vg.table({
		from,
		...(selection ? { filterBy: selection } : {}),
		width: innerWidth,
		maxWidth: innerWidth,
		height: app.row,
		margin: 0,
		...cols
	});

	onMount(() => {
		el.appendChild(table);
	});
	onDestroy(() => {
		el.removeChild(table);
	});
</script>

<div class="chart" bind:this={el} style={app.css} />

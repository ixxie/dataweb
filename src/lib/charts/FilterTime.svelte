<script lang="ts">
	import * as vg from '@uwdata/vgplot';
	import { onMount, onDestroy, getContext } from 'svelte';

	export let selection: any;
	export let innerWidth: number;

	const app = getContext('app-state');

	let el: HTMLElement;
	$: plot = vg.plot(
		vg.areaY(vg.from('traction'), { x: 't', y: 'signal', fill: 'sensor' }),
		vg.width(innerWidth),
		vg.height(app.row / 3),
		vg.intervalX({ as: selection, field: 't' }),
		vg.yLabel('puissance'),
		vg.style(app.css),
		vg.margin(0),
		vg.grid(true),
		vg.colorScale('categorical'),
		vg.colorLegend()
	);

	onMount(() => {
		el.appendChild(plot);
	});
	onDestroy(() => {
		el.removeChild(plot);
	});
</script>

<div class="chart" bind:this={el} />

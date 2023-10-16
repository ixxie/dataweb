<script lang="ts">
	import * as vg from '@uwdata/vgplot';
	import { onMount, onDestroy, getContext } from 'svelte';

	export let selection: any;
	export let innerWidth: number;

	const app = getContext('app-state');

	let el: HTMLElement;
	$: plot = vg.plot(
		vg.line(vg.from('traction'), {
			x: vg.bin('signal', { steps: 150 }),
			y: vg.count(),
			stroke: 'sensor',
			curve: 'monotone-x'
		}),
		vg.width(innerWidth),
		vg.height(app.row / 3),
		vg.xDomain(vg.Fixed),
		vg.intervalX({ as: selection, field: 'signal' }),
		vg.xNice(),
		vg.yLabel('fréquence'),
		vg.xLabel('puissance'),
		vg.style(app.css),
		vg.margin(0),
		vg.grid(true),
		vg.colorScale('categorical')
	);

	onMount(() => {
		el.appendChild(plot);
	});
	onDestroy(() => {
		el.removeChild(plot);
	});
</script>

<div class="chart" bind:this={el} />

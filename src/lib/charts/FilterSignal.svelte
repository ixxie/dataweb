<script lang="ts">
	import * as vg from '@uwdata/vgplot';
	import { onMount, onDestroy } from 'svelte';

	export let selection: any;
	export let innerWidth: number;

	let el: HTMLElement;
	$: plot = vg.plot(
		vg.line(vg.from('traction'), {
			x: vg.bin('signal', { steps: 150 }),
			y: vg.count(),
			stroke: 'capteur',
			curve: 'monotone-x'
		}),
		vg.width(innerWidth),
		vg.height(120),
		vg.xDomain(vg.Fixed),
		vg.intervalX({ as: selection, field: 'signal' }),
		vg.xNice(),
		vg.yLabel('Fréquence'),
		vg.xLabel('Effort (daN)'),
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

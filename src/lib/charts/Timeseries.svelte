<script lang="ts">
	import * as vg from '@uwdata/vgplot';
	import { onMount, onDestroy, getContext } from 'svelte';

	export let selection: any;
	export let innerWidth: number;

	const app = getContext('app-state');

	let el: HTMLElement;
	$: plot = vg.plot(
		// sensors signal
		vg.line(vg.from('traction', { filterBy: selection }), {
			x: 't',
			y: 'signal',
			stroke: 'sensor',
			opacity: 0.3
		}),
		vg.line(vg.from('traction', { filterBy: selection }), {
			x: 't',
			y: vg.avg('signal').partitionby('sensor').orderby('t').rows([-10, 10]),
			stroke: 'sensor'
		}),
		vg.width(innerWidth),
		vg.height(app.row),
		vg.xDomain(selection),
		vg.yLabel('puissance'),
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

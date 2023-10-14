<script lang="ts">
	import * as vg from '@uwdata/vgplot';
	import { onMount, onDestroy, getContext } from 'svelte';

	export let selection: any;

	const app = getContext('app-state');

	let el: HTMLElement;
	export const plot = vg.plot(
		vg.areaY(vg.from('traction', { filterBy: selection }), {
			x: vg.bin('signal', { steps: 25 }),
			y: vg.count(),
			fill: 'sensor',
			fillOpacity: 0.6,
			inset: 0.5
		}),
		vg.width(app.col),
		vg.height(app.row),
		vg.xDomain(vg.Fixed),
		vg.intervalX({ as: selection }),
		vg.style(app.css),
		vg.margin(0),
		vg.grid(true),
		vg.colorScale('categorical'),
		vg.colorLegend({ columns: 1 })
	);

	onMount(() => {
		el.appendChild(plot);
	});
	onDestroy(() => {
		el.removeChild(plot);
	});
</script>

<div class="chart" bind:this={el} />

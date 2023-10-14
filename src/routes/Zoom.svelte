<script lang="ts">
	import * as vg from '@uwdata/vgplot';
	import { onMount, onDestroy, getContext } from 'svelte';

	export let selection: any;

	const app = getContext('app-state');

	let el: HTMLElement;
	export const plot = vg.plot(
		vg.line(vg.from('traction', { filterBy: selection }), {
			x: 't',
			y: 'signal',
			stroke: 'sensor'
		}),
		vg.width(app.col),
		vg.height(app.row),
		vg.xDomain(selection),
		vg.style(app.css),
		vg.margin(0),
		vg.grid(true)
	);

	onMount(() => {
		el.appendChild(plot);
	});
	onDestroy(() => {
		el.removeChild(plot);
	});
</script>

<div class="chart" bind:this={el} />

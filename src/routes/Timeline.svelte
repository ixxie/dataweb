<script lang="ts">
	import * as vg from '@uwdata/vgplot';
	import { onMount, onDestroy } from 'svelte';

	export let from: string;
	export let x: string;
	export let y: string;
	export let width: number = 600;
	export let height: number = 300;

	export let selection: any;

	let el: HTMLElement;
	const plot = vg.plot(
		vg.line(vg.from(from), { x, y }),
		vg.width(width),
		vg.height(height),
		vg.intervalX({ as: selection })
	);

	onMount(() => {
		el.appendChild(plot);
	});
	onDestroy(() => {
		el.removeChild(plot);
	});
</script>

<div bind:this={el} />

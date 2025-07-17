<script lang="ts">
	import { onMount } from 'svelte';

	let rootEl: HTMLElement;

	onMount(() => {
		console.log('mounted');
	});
</script>

<div bind:this={rootEl} class="check-mill-root"></div>

<style lang="scss">
	.check-mill-root {
		width: 100%;
		max-width: 1280px;
		height: 100%;
		margin-inline: auto;
		overflow: hidden;
	}
</style>

<script lang="ts">
	import { CheckMeMillionTimes } from "@check-mill/core";
	import { onMount } from "svelte";

	let rootEl: HTMLElement;
	let containerEl: HTMLElement;

	onMount(() => {
		CheckMeMillionTimes(rootEl, containerEl);
	});
</script>

<div bind:this={rootEl} class="check-mill-root">
	<div bind:this={containerEl} class="container"></div>
</div>

<style lang="scss">
	.check-mill-root {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>

<script lang="ts">
	import { CheckMeMillionTimes } from '@check-mill/core';
	import { onMount } from 'svelte';

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
	:global {
		.check-mill-root {
			width: 100%;
			max-width: 1280px;
			height: 100%;
			margin-inline: auto;
			overflow: hidden;
		}

		.container {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: var(--container-padding);
			gap: var(--container-gap);
			min-height: 100%;
			user-select: none;
			touch-action: none;
			isolation: isolate;
		}

		._int_slide {
			position: relative;
			width: var(--slide-width);
			height: var(--slide-height);
			background: rgba(255, 255, 255, 0.25);
			box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
			backdrop-filter: blur(4.5px);
			-webkit-backdrop-filter: blur(4.5px);
			border-radius: 10px;
			outline: 1px inset rgba(255, 255, 255, 0.18);
		}

		._int_container {
			width: 100%;
			height: 100%;
			padding: var(--slide-padding);
			overflow: hidden;
			will-change: opacity;
		}

		input[type='checkbox']._int_checkbox {
			width: var(--checkbox-size);
			aspect-ratio: 1;
		}
	}
</style>

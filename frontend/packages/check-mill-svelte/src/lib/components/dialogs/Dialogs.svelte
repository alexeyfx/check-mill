<script lang="ts">
	import BottomSheet from '../bottom-sheet/BottomSheet.svelte';
	import { dialogStore } from './dialog.store';
</script>

<div class="root">
	<div class="overlay" class:overlay--visible={$dialogStore.length + 1}></div>
	{#each $dialogStore as { id, component, props } (id)}
		{#await component() then { default: LoadedComponent }}
			<div class="dialog">
				<svelte:component this={LoadedComponent} {...props} />
			</div>
		{/await}
	{/each}
	<div class="dialog">
		<BottomSheet />
	</div>
</div>

<style lang="scss">
	.root {
		position: fixed;
		top: 0;
		left: 0;
		inline-size: 100%;
		block-size: 100%;
		scrollbar-width: none;
		-ms-overflow-style: none;
		pointer-events: none;
		overflow: hidden;
		overscroll-behavior: none;
		overflow-wrap: break-word;

		&:has(.dialog) {
			pointer-events: auto;
			overflow: auto;
		}
	}

	.overlay,
	.dialog {
		position: fixed;
		inset: 0;
		display: flex;
		block-size: 100%;
		align-items: flex-start;
		outline: none;
		overflow: auto;
		transition-property: filter;
		transition-duration: var(--tui-duration, 0.3s);
		transition-timing-function: ease-in-out;
		scrollbar-width: none;
	}

	.overlay {
		transition-property: opacity;
		transition-duration: 0.3s;
		transition-timing-function: ease-in-out;
		background: rgba(0, 0, 0, 0.75);
		opacity: 0;

		&--visible {
			opacity: 1;
		}
	}

	.dialog {
		position: sticky;
		overscroll-behavior: none;
		filter: brightness(0.25);

		&:last-child {
			pointer-events: auto;
			filter: none;
		}
	}
</style>

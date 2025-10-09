<script lang="ts">
	import { dialogStore } from "./dialog.store";
	import DialogContextProvider from "./DialogContextProvider.svelte";
</script>

<div class="root">
	<div class="overlay" class:_visible={$dialogStore.length}></div>
	{#each $dialogStore as { id, component } (id)}
		<div class="dialog">
			<DialogContextProvider {id}>
				<svelte:component this={component} />
			</DialogContextProvider>
		</div>
	{/each}
</div>

<style lang="scss">
	.root {
		isolation: isolate;
		position: fixed;
		top: 0;
		left: 0;
		inline-size: 100%;
		block-size: 100%;
		scrollbar-width: none;
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
		transition: filter 0.3s ease-in-out;
		scrollbar-width: none;
	}

	.overlay {
		background: rgba(0, 0, 0, 0.6);
		opacity: 0;
		transition: opacity 0.3s ease-in-out;

		&._visible {
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

<script lang="ts">
	import { dialogStore } from './dialogStore';
</script>

<div class="dialogs-root">
	<div class="overlay { 'overlay--visible' }"></div>
	{#each $dialogStore as { id, component, props } (id)}
		<div class="dialog">
			<svelte:component this={component} {...props} />
		</div>
	{/each}
</div>

<style>
	.dialogs-root {
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
		transition-property: filter;
		transition-duration: var(--tui-duration, .3s);
		transition-timing-function: ease-in-out;
		scrollbar-width: none;
	}

	.overlay {
		transition-property: opacity;
		transition-duration: .3s;
		transition-timing-function: ease-in-out;
		background: rgba(0, 0, 0, .75);
		opacity: 0;

		&--visible {
			opacity: 1;
		}
	}

	.dialog {
		position: sticky;
		overscroll-behavior: none;
		filter: brightness(.25);

		&:last-child {
			pointer-events: auto;
			filter: none;
		}
	}
</style>

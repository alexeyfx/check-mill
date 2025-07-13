<script lang="ts">
	import { dialogStore } from './dialogStore';
</script>

<div class="dialog-host">
	{#each $dialogStore as { id, component, props } (id)}
		<div class="dialog-portal">
			<svelte:component this={component} {...props} />
		</div>
	{/each}
</div>

<style>
	.dialog-host {
	}

	.dialog-portal {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.4);
	}
</style>

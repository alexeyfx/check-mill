<script lang="ts">
	import { BottomSheet } from '../bottom-sheet';
	import { Drawer } from '../drawer';

	const isDesktop =
		typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false;

	const Component = isDesktop ? Drawer : BottomSheet;
</script>

<svelte:component this={Component}>
	<slot />
</svelte:component>

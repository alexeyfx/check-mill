<script lang="ts">
	import { BottomSheet } from "../bottom-sheet";
	import { Drawer } from "../drawer";

	const Component = isDesktop() ? Drawer : BottomSheet;

	function isDesktop(): boolean {
		return typeof window !== "undefined"
			? window.matchMedia("(min-width: 768px)").matches
			: false;
	}
</script>

<svelte:component this={Component}>
	<slot />
</svelte:component>

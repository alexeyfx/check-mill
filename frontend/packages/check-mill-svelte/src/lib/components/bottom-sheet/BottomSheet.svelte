<script lang="ts">
	import { onMount } from 'svelte';

	export let snapPoints = [0.25, 0.5, 0.75, 1];
	export let startSnapIndex = 0;

	let stuck = false;
	let activePointers = 0;

	let snapRefs: HTMLDivElement[] = new Array(snapPoints.length);
	let sheetContent: HTMLDivElement;
	let scrollContainer: HTMLDivElement;

	onMount(() => {
		const offsets = getSnapOffsets();
		scrollContainer.scrollTop = offsets[startSnapIndex];
	});

	function getSnapOffsets(): number[] {
		return snapRefs.filter(Boolean).map(({ offsetTop, clientHeight }) => offsetTop + clientHeight);
	}

	function onScrollEvent(delta: number): void {
		activePointers += delta;

		if (delta === 0) {
			stuck = scrollContainer.scrollTop >= sheetContent.offsetTop;
		}

		if ((activePointers += delta) && scrollContainer.scrollTop === 0) {
			// TO-DO: close;
		}
	}
</script>

<div
	bind:this={scrollContainer}
	on:scroll={() => onScrollEvent(0)}
	on:touchstart={() => onScrollEvent(-1)}
	on:touchend={() => onScrollEvent(-1)}
	on:touchcancel={() => onScrollEvent(-1)}
	class="bottom-sheet"
>
	<div class="snaps">
		{#each snapPoints as snapPoint, i (i)}
			<div bind:this={snapRefs[i]} class="snap" style="margin-top: calc(100vh * {snapPoint})"></div>
		{/each}
	</div>

	<div bind:this={sheetContent} class="bottom-sheet-page">
		<slot />
	</div>
</div>

<style lang="scss">
	.bottom-sheet {
		scrollbar-width: none;
		display: flex;
		inline-size: 100%;
		block-size: calc(100% - env(safe-area-inset-top));
		flex-direction: column;
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		margin: env(safe-area-inset-top) auto 0;
		border-radius: 0.75rem 0.75rem 0 0;
	}

	.snaps {
		display: flex;
		block-size: 100%;
		scroll-snap-stop: always;
		scroll-snap-align: start;
		pointer-events: none;
	}

	.snap {
		position: relative;
		top: env(safe-area-inset-bottom);
		scroll-snap-stop: normal;
		scroll-snap-align: start;
		block-size: 1rem;
		inline-size: 1rem;
	}

	.bottom-sheet-page {
		height: 1000px;
		scrollbar-width: none;
		inline-size: 100%;
		border-radius: inherit;
		padding: 0 1rem;
		margin-block-start: auto;
		background: red;
		box-sizing: border-box;
		scroll-snap-stop: always;
		scroll-snap-align: start;
	}
</style>

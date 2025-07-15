<script lang="ts">
	import { onMount } from 'svelte';

	export let snapPoints = [0.25, 0.5, 0.75, 1];
	export let startSnapIndex = 0;

	let stuck = false;
	let activePointers = 0;

	let snapRefs: HTMLDivElement[] = [];
	let sheetContent: HTMLDivElement;
    let scrollContainer: HTMLDivElement;

	onMount(() => {
		const offsets = getSnapOffsets();
		scrollContainer.scrollTop = offsets[initial];
	});

	function getSnapOffsets(): number[] {
		return snapRefs
			.filter(Boolean)
			.map(({ offsetTop, clientHeight}) => offsetTop + clientHeight);
	}

	function onScrollEvent(delta: number): void {
		activePointers += delta;

		if (delta === 0) {
			stuck = hostRef.scrollTop >= sheetContent.offsetTop;
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
			<div
				bind:this={el) => (snapRefs[i] = el)}
				class="snap"
                style="margin-top: calc(100vh * {snapPoint})"			></div>
		{/each}
	</div>
    
	<div bind:this={sheetContent} class="bottom-sheet-page">
		<slot />
	</div>
</div>

<style lang="scss">
	.bottom-sheet {
	}
</style>

<script lang="ts">
	import { onMount } from "svelte";
	import { slideY } from "./transitions";

	import { dialogContext } from "../dialogs";

	export let snapRatios = [0.25, 0.5, 0.75, 1];
	export let initialSnapIndex = 0;

	let stuck = false;
	let activePointers = 0;

	let sheetEl: HTMLDivElement;
	let panelEl: HTMLDivElement;
	let snapMarkers: HTMLDivElement[] = new Array(snapRatios.length);

	const { close } = dialogContext.read();

	onMount(() => {
		const offsets = getSnapOffsets();
		sheetEl.scrollTop = offsets[initialSnapIndex];
	});

	function getSnapOffsets(): number[] {
		return snapMarkers
			.filter(Boolean)
			.map(({ offsetTop, clientHeight }) => offsetTop + clientHeight);
	}

	function onPointerChange(delta: number): void {
		activePointers += delta;

		if (delta === 0) {
			stuck = sheetEl.scrollTop >= panelEl.offsetTop;
		}

		if (!activePointers && sheetEl.scrollTop <= 0) {
			close();
		}
	}
</script>

<div
	bind:this={sheetEl}
	on:scroll={() => onPointerChange(0)}
	on:touchstart={() => onPointerChange(-1)}
	on:touchend={() => onPointerChange(-1)}
	on:touchcancel={() => onPointerChange(-1)}
	on:click|self={close}
	transition:slideY
	class="sheet"
>
	<div class="sheet__snap-markers">
		{#each snapRatios as snapPoint, i (i)}
			<div
				bind:this={snapMarkers[i]}
				class="sheet__snap-marker"
				style="margin-top: calc(100vh * {snapPoint})"
			></div>
		{/each}
	</div>

	<div bind:this={panelEl} class="sheet__panel" class:_stuck={stuck}>
		<div class="sheet__scrollable-content">
			<slot />
		</div>
	</div>
</div>

<style lang="scss">
	.sheet {
		scrollbar-width: none;
		display: block;
		inline-size: 100%;
		block-size: calc(100% - env(safe-area-inset-top));
		flex-direction: column;
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		margin: env(safe-area-inset-top) auto 0;

		&__snap-markers {
			display: flex;
			block-size: 100%;
			scroll-snap-stop: always;
			scroll-snap-align: start;
			pointer-events: none;
		}

		&__snap-marker {
			position: relative;
			top: env(safe-area-inset-bottom);
			scroll-snap-stop: normal;
			scroll-snap-align: start;
			block-size: 1rem;
			inline-size: 1rem;
		}

		&__panel {
			position: relative;
			display: flex;
			flex-direction: column;
			scrollbar-width: none;
			inline-size: 100%;
			height: 100%;
			border-radius: 16px 16px 0 0;
			margin: auto auto 0;
			margin-block-start: auto;
			background-color: #fff;
			box-shadow:
				0 0 2px 0 rgba(26, 27, 30, 0.08),
				0 2px 4px 0 rgba(34, 36, 40, 0.06),
				0 4px 6px 0 rgba(60, 63, 73, 0.04);
			scroll-snap-stop: always;
			scroll-snap-align: start;
			transition: border-radius 0.3s ease;
			will-change: border-radius;

			&._stuck {
				border-radius: 0;
			}
		}

		&__scrollable-content {
			position: relative;
			flex: 1;
		}

		&__panel._stuck &__scrollable-content {
			overflow: auto;
		}
	}
</style>

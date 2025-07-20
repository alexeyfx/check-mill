<script lang="ts">
	import type { ScrollerProps } from "./types";

	let { title, children }: ScrollerProps = $props();
</script>

<div class="scroller">
	<h4 class="scroller__title">{title}</h4>
	<div class="scroller__body">
		<div class="scroller__track">
			{@render children()}
		</div>
	</div>
</div>

<style lang="scss">
	.scroller {
		display: flex;
		flex-direction: column;
		gap: 12px;

		&__title {
			padding-inline: var(--padding-inline);
			font-size: 20px;
			font-weight: 500;
		}

		&__body {
			overflow-x: auto;
			overflow-y: hidden;
			scrollbar-width: none;

			&::-webkit-scrollbar {
				display: none;
			}
		}

		&__track {
			display: flex;
			touch-action: pan-y pinch-zoom;
			gap: 12px;
			width: max-content;
			padding-inline: var(--padding-inline);
		}
	}
</style>

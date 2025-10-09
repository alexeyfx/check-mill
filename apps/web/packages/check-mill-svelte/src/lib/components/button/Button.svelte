<script lang="ts">
	import type { ButtonProps } from "./types";

	let { type = "button", children, ...rest }: ButtonProps = $props();
</script>

<button {type} class="button" {...rest}>
	<span class="button__inner">
		{@render children?.()}
	</span>
</button>

<style lang="scss">
	.button {
		user-select: none;
		font-weight: 600;
		position: relative;
		line-height: 1;
		text-align: center;
		overflow: hidden;
		width: auto;
		cursor: pointer;
		display: inline-block;
		border-radius: 12px;
		border-color: transparent;
		background: #228be6;
		color: #fff;
		height: var(--button-height, 48px);
		padding-inline: 16px;
		vertical-align: middle;
		outline: transparent;

		&__inner {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			overflow: visible;
		}
	}
</style>

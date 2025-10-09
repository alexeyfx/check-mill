<script lang="ts">
	import type { ButtonProps } from "./types";

	let { type = "button", children, ...rest }: ButtonProps = $props();
</script>

<button {type} class="icon-button" {...rest}>
	<span class="icon-button__inner">
		{@render children?.()}
	</span>
</button>

<style lang="scss">
	.icon-button {
		position: relative;
		display: inline-block;
		vertical-align: middle;
		width: auto;
		aspect-ratio: 1;
		padding-inline: 8px;
		background-color: transparent;
		border: 1px solid currentColor;
		border-radius: 0.4em;
		box-shadow: 0.1em 0.1em;
		color: inherit;
		user-select: none;
		font-weight: 600;
		line-height: 1;
		text-align: center;
		outline: transparent;
		cursor: pointer;
		overflow: hidden;
		transition: all 0.3s ease-in-out;

		&:hover {
			background-color: #ffeaea;
			transform: translate(-0.05em, -0.05em);
			box-shadow: 0.15em 0.15em;
		}

		&:active {
			transform: translate(0.05em, 0.05em);
			box-shadow: 0.05em 0.05em;
		}

		&__inner {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			overflow: visible;
		}
	}
</style>

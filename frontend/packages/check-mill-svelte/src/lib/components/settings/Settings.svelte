<script lang="ts">
	import { DialogSwitcher } from "../dialog-switcher";
	import { Scroller } from "../scroller";
	import { IconButton } from "../button";
	import { dialogContext } from "../dialogs";

	let { close } = dialogContext.read();
</script>

<DialogSwitcher>
	<div class="settings">
		<div class="settings__header">
			<h3 class="settings__title">Customization</h3>
			<IconButton onclick={close}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					width="16"
					height="16"
					stroke-width="2"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M6 18 18 6M6 6l12 12"
					/>
				</svg>
			</IconButton>
		</div>
		<div class="settings__body">
			<Scroller title={"Checkbox Variant"}>
				<label class="radio-box">
					<input class="radio-box__input" />
					<div class="radio-box__media"></div>
				</label>
				<label class="radio-box">
					<input class="radio-box__input" />
					<div class="radio-box__media"></div>
				</label>
				<label class="radio-box">
					<input class="radio-box__input" />
					<div class="radio-box__media"></div>
				</label>
				<label class="radio-box">
					<input class="radio-box__input" />
					<div class="radio-box__media"></div>
				</label>
				<label class="radio-box">
					<input class="radio-box__input" />
					<div class="radio-box__media"></div>
				</label>
				<label class="radio-box">
					<input class="radio-box__input" />
					<div class="radio-box__media"></div>
				</label>
				<label class="radio-box">
					<input class="radio-box__input" />
					<div class="radio-box__media"></div>
				</label>
				<label class="radio-box">
					<input class="radio-box__input" />
					<div class="radio-box__media"></div>
				</label>
			</Scroller>
		</div>
	</div>
</DialogSwitcher>

<style lang="scss">
	.settings {
		--padding-inline: 16px;

		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		color: #273f4f;

		&__header {
			flex: none;
			display: flex;
			align-items: center;
			justify-content: space-between;
			height: 80px;
			padding-inline: var(--padding-inline);
			border-bottom: 1px solid #f5cbcb;
		}

		&__title {
			font-size: 24px;
			font-weight: 500;
		}

		&__body {
			position: relative;
			display: flex;
			flex-direction: column;
			gap: 24px;
			flex-grow: 1;
			padding-top: 24px;
		}
	}

	.radio-box {
		position: relative;
		width: auto;
		height: 100px;
		aspect-ratio: 1;
		border-radius: 12px;
		background-color: #fff;
		border: 1px solid #ced4da;

		&._3x2 {
			aspect-ratio: 3/2;
		}

		&__input {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}
	}
</style>

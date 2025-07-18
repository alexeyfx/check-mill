<script lang="ts">
	import { DialogSwitcher } from '../dialog-switcher';
</script>

<DialogSwitcher>
	<div class="settings">
		<div class="settings__header">
			<h3 class="settings__title">Settings</h3>
		</div>
		<div class="settings__extra"></div>
		<div class="settings__body">
			<div class="scroller">
				<div class="scroller__title">
					<h4>Checkbox variant</h4>
				</div>
				<div class="scroller__body"></div>
			</div>
		</div>
	</div>
</DialogSwitcher>

<style lang="scss">
	.settings {
		--padding-inline: 16px;

		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
		padding: 16px 0;
		overflow: hidden;

		&__header {
			padding-inline: var(--padding-inline);
			flex: none;
		}

		&__extra {
			flex: none;
		}

		&__body {
			display: flex;
			flex-direction: column;
			gap: 12px;
			flex-grow: 1;
		}
	}

	.scroller {
		display: flex;
		flex-direction: column;
		gap: 8xp;

		&__title {
			padding-inline: var(--padding-inline);
		}

		&__body {
			display: flex;
			gap: 8px;
			padding-inline: var(--padding-inline);
			overflow-x: auto;
			overflow-y: hidden;
		}
	}
</style>

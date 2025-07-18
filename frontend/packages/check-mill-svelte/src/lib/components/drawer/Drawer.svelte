<script lang="ts">
	import { clickOutside } from '$lib/utils';
	import { dialogContext } from '../dialogs';
	import { slideX } from './transitions';

	const { close } = dialogContext.read();
</script>

<div transition:slideX use:clickOutside={close} class="drawer">
	<slot />
</div>

<style lang="scss">
	.drawer {
		position: absolute;
		top: 8px;
		right: 8px;
		width: min(100%, 360px);
		height: calc(100% - 16px);
		border-radius: 16px;
		background-color: #ffedf3;
		box-shadow:
			0 0 2px 0 rgba(26, 27, 30, 0.08),
			0 2px 4px 0 rgba(34, 36, 40, 0.06),
			0 4px 6px 0 rgba(60, 63, 73, 0.04);
	}
</style>

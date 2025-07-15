<script lang="ts">
	import { slideX } from './drawer.transition';
</script>

<div transition:slideX class="drawer"></div>

<style lang="scss">
	.drawer {
		position: absolute;
		top: 8px;
		right: 8px;
		width: min(100%, 360px);
		height: calc(100% - 16px);
		padding: 8px;
		border-radius: 16px;
		background-color: white;
		box-shadow:
			0 0 2px 0 rgba(26, 27, 30, 0.08),
			0 2px 4px 0 rgba(34, 36, 40, 0.06),
			0 4px 6px 0 rgba(60, 63, 73, 0.04);
	}
</style>

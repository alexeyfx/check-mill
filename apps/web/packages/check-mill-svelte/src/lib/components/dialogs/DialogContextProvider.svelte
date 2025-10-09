<script lang="ts">
	import { dialogContext } from './dialog.context';
	import { dialogStore } from './dialog.store';

	export let id: number;

	dialogContext.write({ close: () => dialogStore.close(id) });
</script>

<slot />

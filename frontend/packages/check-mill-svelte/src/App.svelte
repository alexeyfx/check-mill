<script lang="ts">
	import { Header } from "./lib/components/header";
	import { Dialogs } from "./lib/components/dialogs";
	import { CheckMillRenderer } from "./lib/components/check-mill-renderer";

	import { dialogStore } from "./lib/components/dialogs";
	import { SettingsLazyDialog } from "./lib/components/settings";
</script>

<div class="content">
	<Header />
	<CheckMillRenderer />
</div>
<Dialogs />

<button
	style="position: absolute; bottom: 0; left: 0;"
	on:click={() => dialogStore.open(SettingsLazyDialog)}>Open</button
>

<style lang="scss">
	.content {
		position: relative;
		isolation: isolate;
		height: 100vh;
	}
</style>

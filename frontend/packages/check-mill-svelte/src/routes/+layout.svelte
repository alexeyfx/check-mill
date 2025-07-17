<script lang="ts">
	import Header from '$lib/components/header/Header.svelte';
	import Dialogs from '$lib/components/dialogs/Dialogs.svelte';

	import '../styles/index.scss';
	import { dialogStore } from '$lib/components/dialogs';
	import { SettingsLazyDialog } from '$lib/components/settings';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
	/>
</svelte:head>

<Header />
<slot />
<button on:click={() => dialogStore.open(SettingsLazyDialog)}>Open</button>
<Dialogs />

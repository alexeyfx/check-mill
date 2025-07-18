<script lang="ts">
	import { Header, Dialogs, dialogStore, SettingsLazyDialog } from '$lib/components';
	import '../styles/index.scss';
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
<button
	style="position: absolute; bottom: 0; left: 0;"
	on:click={() => dialogStore.open(SettingsLazyDialog)}>Open</button
>
<Dialogs />

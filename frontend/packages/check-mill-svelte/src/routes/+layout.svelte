<script lang="ts">
	import Header from '$lib/components/header/Header.svelte';
	import DialogHost from '$lib/components/dialog/DialogHost.svelte';
	import '../styles/index.scss';
	import Drawer from '$lib/components/drawer/Drawer.svelte';
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
<DialogHost />
<Drawer />
<slot />

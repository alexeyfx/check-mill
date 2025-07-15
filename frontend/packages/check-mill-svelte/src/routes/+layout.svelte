<script lang="ts">
	import Header from '$lib/components/header/Header.svelte';
	import Dialogs from '$lib/components/dialogs/Dialogs.svelte';
	import BottomSheet from '$lib/components/bottom-sheet/BottomSheet.svelte';

	import '../styles/index.scss';

	let open = false;
	let clear: number;
	$: {
		clearInterval(clear);
		clear = setInterval(() => (open = !open), 1000);
	}
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
<Dialogs />

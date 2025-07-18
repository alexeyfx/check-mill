import { writable } from 'svelte/store';
import type { LazyComponent } from './types';
import type { SvelteComponent } from 'svelte';

type Dialog = {
	id: number;
	component: new () => SvelteComponent;
	props?: Record<string, unknown>;
};

function createDialogStore() {
	const { subscribe, update } = writable<Dialog[]>([]);
	let idCounter = 0;

	async function open(
		lazyComponent: LazyComponent,
		props?: Record<string, unknown>
	): Promise<number> {
		const id = idCounter++;
		const loaded = await lazyComponent();

		update((dialogs) => [...dialogs, { id, component: loaded.default, props }]);

		return id;
	}

	function close(id: number): void {
		update((dialogs) => dialogs.filter((d) => d.id !== id));
	}

	return {
		subscribe,
		open,
		close
	};
}

export const dialogStore = createDialogStore();

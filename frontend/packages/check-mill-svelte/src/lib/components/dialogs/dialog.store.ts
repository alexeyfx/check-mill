import { writable } from 'svelte/store';
import type { LazyComponent } from './types';

type Dialog = {
	id: number;
	component: LazyComponent;
	props?: Record<string, unknown>;
};

function createDialogStore() {
	const { subscribe, update } = writable<Dialog[]>([]);
	let idCounter = 0;

	function open(component: LazyComponent, props?: Record<string, unknown>): number {
		const id = idCounter++;
		update((dialogs) => [...dialogs, { id, component, props }]);
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

import type { Component } from 'svelte';
import { writable } from 'svelte/store';

type DialogItem = {
	id: number;
	component: Component;
	props?: Record<string, unknown>;
};

function createDialogStore() {
	const { subscribe, update } = writable<DialogItem[]>([]);
	let idCounter = 0;

	function open(component: Component, props?: Record<string, unknown>): number {
		const id = idCounter++;
		update((dialogs) => [...dialogs, { id, component, props }]);

		return id;
	}

	function close(id: number) {
		update((dialogs) => dialogs.filter((d) => d.id !== id));
	}

	return {
		subscribe,
		open,
		close
	};
}

export const dialogStore = createDialogStore();

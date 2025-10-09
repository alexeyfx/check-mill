import { getContext, setContext } from 'svelte';

export type ContextKey<T> = {
	id: symbol;
	read: () => T;
	write: (value: T) => void;
};

export function createContextFactory<T>() {
	return create<T>();
}

function create<T>(): ContextKey<T> {
	const id = Symbol();
	const read = (): T => getContext<T>(id);
	const write = (value: T) => setContext<T>(id, value);

	return { id, read, write };
}

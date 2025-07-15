// dialogManager.ts
import type { SvelteComponent } from 'svelte';
import type { TransitionConfig } from 'svelte/transition';

type TransitionSpec = {
	fn: (node: Element, params?: unknown) => TransitionConfig;
	params?: unknown;
};

export interface Dialog<T = unknown, Props = Record<string, unknown>> {
	component: LazyComponent;
	props: Props;
	inTransition?: TransitionSpec;
	outTransition?: TransitionSpec;
	close: (result: T) => void;
}

export type LazyComponent = () => Promise<{ default: typeof SvelteComponent }>;

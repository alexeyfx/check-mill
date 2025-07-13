// dialogManager.ts
import type { SvelteComponent } from 'svelte';
import { type TransitionConfig } from 'svelte/transition';

type TransitionSpec = {
	fn: (node: Element, params?: unknown) => TransitionConfig;
	params?: unknown;
};

export interface Dialog<T = unknown, Props = Record<string, unknown>> {
	component: typeof SvelteComponent;
	props: Props;
	inTransition?: TransitionSpec;
	outTransition?: TransitionSpec;
	close: (result: T) => void;
}

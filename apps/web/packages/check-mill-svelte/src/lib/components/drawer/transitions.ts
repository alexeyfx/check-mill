import type { TransitionConfig } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

export function slideX(node: Element): TransitionConfig {
	return {
		duration: 300,
		easing: cubicOut,
		css: (t) => `transform: translateX(${(1 - t) * 100}%);`
	};
}

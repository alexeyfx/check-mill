import type { TransitionConfig } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

export function slideY(
	node: Element,
	{ delay = 0, duration = 300, easing = cubicOut } = {}
): TransitionConfig {
	return {
		delay,
		duration,
		easing,
		css: (t) => `transform: translateY(${(1 - t) * 100}%);`
	};
}

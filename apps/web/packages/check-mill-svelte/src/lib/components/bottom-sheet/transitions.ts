import type { TransitionConfig } from 'svelte/transition';
import { sineInOut } from 'svelte/easing';

export function slideY(
	_: Element,
	{ delay = 0, duration = 300, easing = sineInOut } = {}
): TransitionConfig {
	return {
		delay,
		duration,
		easing,
		css: (t) => `transform: translateY(${(1 - t) * 100}%);`
	};
}

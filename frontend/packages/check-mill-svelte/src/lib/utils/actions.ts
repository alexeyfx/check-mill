export type TrapFocusOptions = {
	onEscape?: VoidFunction;
	isClosing?: boolean;
};

/**
 * Svelte action that traps focus within a DOM node and handles Escape key
 * @param node - The DOM node to trap focus within
 * @param options - Optional configuration object
 * @returns An action object with destroy method
 */
export function trapFocus(node: HTMLElement, options: TrapFocusOptions | null = {}) {
	if (options === null) {
		return {
			update(newOptions: TrapFocusOptions | null = {}) {
				options = newOptions;
			},

			destroy() {}
		};
	}

	const previous = document.activeElement as HTMLElement | null;
	let isClosingViaOutsideClick = false;
	let isFocusMovedOutside = false;

	function focusable(): HTMLElement[] {
		return Array.from(
			node.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (options === null) {
			return;
		}

		if (event.key === 'Tab') {
			const current = document.activeElement;
			const elements = focusable();
			const first = elements.at(0);
			const last = elements.at(-1);

			if (event.shiftKey && current === first) {
				last?.focus();
				event.preventDefault();
			}

			if (!event.shiftKey && current === last) {
				first?.focus();
				event.preventDefault();
			}
		} else if (event.key === 'Escape' && options.onEscape) {
			isClosingViaOutsideClick = true;
			event.preventDefault();
			options.onEscape();
		}
	}

	function handleFocusOut(event: FocusEvent) {
		if (!node.contains(event.relatedTarget as Node) && event.relatedTarget !== previous) {
			isFocusMovedOutside = true;
		}
	}

	function initialize() {
		if (options === null) {
			return;
		}

		isClosingViaOutsideClick = !!options.isClosing;
		if (!isClosingViaOutsideClick && !isFocusMovedOutside) {
			const elements = focusable();
			if (elements.length > 0) {
				elements[0].focus();
			}
		}

		node.addEventListener('keydown', handleKeydown);
		node.addEventListener('focusout', handleFocusOut);
	}

	function cleanup() {
		if (options === null) {
			return;
		}

		node.removeEventListener('keydown', handleKeydown);
		node.removeEventListener('focusout', handleFocusOut);

		if (!isClosingViaOutsideClick && !isFocusMovedOutside && previous) {
			setTimeout(() => {
				previous.focus({ preventScroll: true });
			}, 0);
		}
	}

	initialize();

	return {
		update(newOptions: TrapFocusOptions | null = {}) {
			node.removeEventListener('keydown', handleKeydown);
			node.removeEventListener('focusout', handleFocusOut);

			if (newOptions && newOptions.isClosing !== undefined) {
				isClosingViaOutsideClick = newOptions.isClosing;
			}

			options = newOptions;

			if (options !== null) {
				node.addEventListener('keydown', handleKeydown);
				node.addEventListener('focusout', handleFocusOut);
			}
		},
		destroy() {
			cleanup();
		}
	};
}

/**
 * SlideFactoryType defines the interface for generating DOM elements
 * that act as structural slide containers.
 */
export interface SlideFactoryType {
	next(): HTMLElement;
	slice(length: number): HTMLElement[];
}

/**
 * SlideFactory is responsible for producing slide container elements.
 * Each slide is a lightweight div with a "slide" class, designed to wrap other content.
 */
export function SlideFactory(): SlideFactoryType {
	/**
	 * Cached template element for efficient cloning.
	 */
	let template: HTMLElement = prefabricate();

	/**
	 * Returns a single cloned slide element.
	 */
	function next(): HTMLElement {
		return template.cloneNode(true) as HTMLElement;
	}

	/**
	 * Returns an array of cloned slide elements.
	 *
	 * @param length The number of slide elements to generate.
	 */
	function slice(length: number): HTMLElement[] {
		return Array.from(
			{ length },
			() => template.cloneNode(true) as HTMLElement
		);
	}

	/**
	 * Creates the base slide template with default styling.
	 * This template is reused and cloned to create slides efficiently.
	 */
	function prefabricate(): HTMLElement {
		const div = document.createElement("div");
		div.classList.add("slide");
		return div;
	}

	return { next, slice };
}

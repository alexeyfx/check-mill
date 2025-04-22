export interface CheckboxFactoryType {
	next(): DocumentFragment;
}

/**
 * CheckboxFactory is responsible for producing reusable groups
 * of checkbox elements using a cached template.
 *
 * This avoids recreating DOM structure from scratch and improves performance.
 */
export function CheckboxFactory(): CheckboxFactoryType {
	/**
	 * Cached template fragment containing the checkbox group.
	 * Built once and cloned for reuse.
	 */
	const template: DocumentFragment = prefabricate();

	/**
	 * Returns a cloned version of the checkbox group.
	 * This allows reuse of the template without modifying the original.
	 */
	function next(): DocumentFragment {
		return template.cloneNode(true) as DocumentFragment;
	}

	/**
	 * Builds the initial checkbox group template.
	 *
	 * @returns A DocumentFragment containing 100 styled checkbox inputs.
	 */
	function prefabricate(): DocumentFragment {
		const fragment = document.createDocumentFragment();

		for (let i = 0; i < 100; i++) {
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.classList.add("checkbox");
			fragment.appendChild(checkbox);
		}

		return fragment;
	}

	return { next };
}


/**
 * @param {SVGRect} inner
 * @param {SVGRect} outer
 */
function isWithin(inner, outer) {
	return outer.x < inner.x && outer.y < inner.y && inner.x + inner.width < outer.x + outer.width && inner.y + inner.height < outer.y + outer.height;
}

function wrap(el, wrapper) {
	el.parentNode.insertBefore(wrapper, el);
	wrapper.appendChild(el);
}

/**
 * @param {SVGSVGElement} svg
 * @param {string} root
 */
export function generateLinkedSVG(svg, root) {

	const nodes = [...svg.querySelectorAll('path:not([fill="none"])')]
		.map(n => [n, [n.nextElementSibling, n.nextElementSibling.nextElementSibling]])
		.filter(([path, texts]) => texts.every(t => t.tagName === 'text'))
		.map(([path, texts]) => {
			return {
				path, texts,
				boundingBox: path.getBBox()
			}
		});

	for (const node of nodes) {
		const parents = [];
		let hasChild = false
		for (const other of nodes) {
			if (node === other) continue;
			if (isWithin(node.boundingBox, other.boundingBox)) parents.push(other)
			if (isWithin(other.boundingBox, node.boundingBox)) hasChild = true
		}
		const url = root + [...parents.map(p => p.texts[0].textContent), node.texts[0].textContent].join('/')
		for (const element of [node.path, ...node.texts]) {
			const anchor = document.createElementNS('http://www.w3.org/2000/svg', 'a');
			anchor.setAttribute('href', url)
			anchor.setAttribute('target', '_blank');
			wrap(element, anchor);
			element.removeAttribute('xmlns');
			anchor.removeAttribute('xmlns');
		}
	}

	return svg.outerHTML.split('\n').filter(line => line.trim()).join('\n')
}

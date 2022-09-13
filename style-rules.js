import { DEFAULT_STYLE_RULES } from "./constants.js";

if (!localStorage.getItem('style-rules')) localStorage.setItem('style-rules', JSON.stringify(DEFAULT_STYLE_RULES))




export function updateStyles() {
	const styleRules = parseStyleRules()
	localStorage.setItem('style-rules', JSON.stringify(styleRules.reduce((obj, { class: className, ...rule }) => ({ ...obj, [className]: rule }), {})));
	cy.style(generateStylesheet(styleRules));
}

function generateStyleRuleHTML(pattern, color, shape, isDefault = false) {
	return `
		<td><input placeholder="Regex" value="${pattern}" ${isDefault ? 'readonly' : ''} /></td>
		<td><input type="color" value="${color}" /></td>
		<td>
			<select>
				${[
			['', 'Default'],
			['ellipse', 'Ellipse'],
			['triangle', 'Triangle'],
			['round-triangle', 'Round Triangle'],
			['rectangle', 'Rectangle'],
			['round-rectangle', 'Round Rectangle'],
			['bottom-round-rectangle', 'Bottom Round Rectangle'],
			['cut-rectangle', 'Cut Rectangle'],
			['barrel', 'Barrel'],
			['rhomboid', 'Rhomboid'],
			['diamond', 'Diamond'],
			['round-diamond', 'Round Diamond'],
			['pentagon', 'Pentagon'],
			['round-pentagon', 'Round Pentagon'],
			['hexagon', 'Hexagon'],
			['round-hexagon', 'Round Hexagon'],
			['concave-hexagon', 'Concave Hexagon'],
			['heptagon', 'Heptagon'],
			['round-heptagon', 'Round Heptagon'],
			['octagon', 'Octagon'],
			['round-octagon', 'Round Octagon'],
			['star', 'Star'],
			['tag', 'Tag'],
			['round-tag', 'Round Tag'],
			['vee', 'Vee'],
		].map(([value, text]) => `<option value="${value}" ${shape === value ? 'selected' : ''}>${text}</option>`).join('\n')}
			</select>
		</td>
		<td>
			<button>Reset</button>
			${!isDefault ? '<button class="btn-danger">Delete</button>' : ''}
		</td>
	`
}

function hookupStyleRuleListeners(row, pattern, color, shape) {
	const [patternInput, colorInput, shapeSelect] = row.querySelectorAll('input, select');
	[patternInput, colorInput, shapeSelect].forEach(e => e.addEventListener('change', updateStyles))
	row.querySelector('button').addEventListener('click', () => {
		patternInput.value = pattern;
		colorInput.value = color;
		shapeSelect.value = shape;
		updateStyles();
	})
	row.querySelector('button.btn-danger')?.addEventListener('click', () => {
		cy.nodes('.' + row.dataset.class).removeClass(row.dataset.class);
		row.remove();
		updateStyles();
	});
}

export function renderStyleRules() {
	for (const [className, { pattern, color, shape }] of Object.entries(JSON.parse(localStorage.getItem('style-rules') || '{}'))) {
		const isDefault = className === 'default-rule'
		const row = document.querySelector(`tr[data-class="${className}"]`) || document.createElement('tr');
		row.dataset.class = className;
		row.innerHTML = generateStyleRuleHTML(pattern, color, shape, isDefault)
		hookupStyleRuleListeners(row, pattern, color, shape)

		if (!document.contains(row)) document.querySelector('.style-rules-wrapper tbody').appendChild(row);
	}
}
renderStyleRules()

document.querySelector('#add-rule').addEventListener('click', () => {
	const row = document.createElement('tr');
	row.dataset.class = Date.now() + '-rule';
	row.innerHTML = generateStyleRuleHTML('', '', '');
	hookupStyleRuleListeners(row, '', '', '');
	document.querySelector('.style-rules-wrapper tbody').appendChild(row);
})



document.querySelector('#reset-rules').addEventListener('click', () => {
	document.querySelector('.style-rules-wrapper tbody').innerHTML = '';
	localStorage.setItem('style-rules', JSON.stringify(DEFAULT_STYLE_RULES));
	renderStyleRules();
})

function parseStyleRules() {
	return [...document.querySelectorAll('.style-rules-wrapper tbody > tr')].map(row => ({
		class: row.dataset.class,
		pattern: row.querySelector('input').value,
		color: row.querySelector('input[type="color"]').value,
		shape: row.querySelector('select').value,
	}));
}



export function generateStylesheet(styleRules = parseStyleRules()) {
	const dark = document.querySelector('html').classList.contains('dark')
	if (window.cy?.styles) {
		const oldStyles = window.cy.styles()
		for (let i = 0; i < oldStyles.length; i++) {
			const rule = oldStyles[i];
			if (!rule.selector.endsWith('-rule')) continue
			cy.nodes(rule.selector).removeClass(rule.selector);
		}
	}

	window.cy?.nodes().forEach(node => {
		for (const rule of styleRules) {
			try {
				if ([node.data('id'), ...node.classes()].some(string => string.match(new RegExp(rule.pattern, 'i')))) {
					node.addClass(rule.class)
				}
			} catch (_) { }
		}
	})
	const outline = dark ? 'white' : 'black';
	const text = dark ? 'black' : 'white'
	return [
		{
			selector: 'node',
			style: {
				label: 'data(label)',
				'border-style': 'solid',
				'border-width': '1',
				'border-color': 'black',
				color: text,
				"text-outline-color": outline,
				"text-outline-width": 1,
				"text-wrap": "wrap",
			}
		}, {
			"selector": ".group",
			"style": {
				"color": e => e.style('background-color'),
				"text-outline-color": 'white',
				"text-outline-width": 1,
				'background-opacity': 0.25,
			}
		}, {
			selector: "edge",
			css: {
				"line-fill": "linear-gradient",
				"line-gradient-stop-colors": e => e.source().style('background-color') + ' ' + e.target().style('background-color')
				,
				"line-gradient-stop-positions": "25 75",
				'target-arrow-shape': 'triangle',
				'target-arrow-color': e => e.target().style('background-color'),
				"curve-style": "straight",
				'underlay-color': 'black',
				'underlay-opacity': 1,
				'underlay-padding': '2',
			}
		}, {
			selector: 'edge[label]',
			css: {
				label: 'data(label)',
				"edge-text-rotation": "autorotate",
				"text-wrap": "wrap",
				"text-outline-color": outline,
				"text-outline-width": 1,
				'font-size': '10'
			}
		}, {
			selector: '.hidden',
			css: {
				display: 'none'
			}
		}, {
			selector: ".request-edge",
			css: {
				'underlay-color': dark ? 'white' : 'black',
				'underlay-padding': '3',
			}
		}, {
			selector: ".request-node",
			css: {
				'border-color': dark ? 'white' : 'black',
				'border-width': '2',
			}
		}, ...styleRules.map(({ class: className, color, shape }) => ({
			"selector": '.' + className,
			"style": {
				"background-color": color || 'inherit',
				shape: shape || 'inherit',
			}
		}))]
}
import handleLabelClick from './label-click.js'


Chart.Tooltip.positioners.myCustomPositioner = (elements, eventPosition) => {
	if (!elements.length) return false
	return {
		x: elements[0].element.x - (elements[0].element.width / 2),
		y: elements[0].element.y
		// You may also include xAlign and yAlign to override those tooltip options.
	};
};

const CHART_COLORS = [
	'rgb(255, 99, 132)',
	'rgb(255, 159, 64)',
	'rgb(255, 205, 86)',
	'rgb(75, 192, 192)',
	'rgb(54, 162, 235)',
	'rgb(153, 102, 255)',
	'rgb(201, 203, 207)'
];

const CANVAS = document.getElementById('myChart')

let CHART;

handleLabelClick(({ label, index }) => zoomToY(index))


CANVAS.addEventListener('click', e => {
	const [element] = CHART.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
	if (!element) return

	const tooltipEl = document.getElementById('chartjs-tooltip')
	if (!tooltipEl.classList.toggle('clicked')) return;

	const event = CHART.data.datasets[element.datasetIndex].data[element.index].event
	renderTooltip(event)
})

CANVAS.addEventListener('contextmenu', (e) => {
	e.preventDefault();
	CHART.resetZoom();
})

function zoomToY(y) {
	let min = Infinity;
	let max = -Infinity
	for (let i = 0; i < CHART.data.datasets.length; i++) {
		const point = CHART.data.datasets[i].data[y]
		if (!point) continue
		min = Math.min(min, point[0])
		max = Math.max(max, point[1])
	}
	min = Math.max(min - 25, 0)
	max += 25
	CHART.zoomScale('x', { min, max }, 'zoom')
	CHART.zoomScale('y', { min: y, max: y }, 'zoom')
}


const requests = await fetch('/requests').then(r => r.text()).then(raw => Flatted.parse(raw))
const labels = Object.entries(requests).map(([_, { start: { request: { method, url } } }]) => `${method} ${url}`)

const datasets = Array.from({ length: Math.max(...Object.values(requests).map(info => info.events.length)) + 1 }, (_, i) => ({ data: [], backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }));

const first = +Object.keys(requests)[0]

let last = 0
for (let i = -1; i < datasets.length; i++) {
	for (let d = 0; d < Object.values(requests).length; d++) {
		const info = Object.values(requests)[d]
		const event = i === -1 ? { type: 'Frontend', start: Math.min(...info.events.map(e => e.start)), end: Math.max(...info.events.map(e => e.end)) } : info.events[i];
		if (!event) continue;
		const point = [(event.start - first), (event.end - first) + 50];
		last = Math.max(last, (event.end - first) + 50)
		point.event = event;
		datasets[i + 1].data.push(point);
	}
}


function renderTooltip(event) {
	const tooltipEl = document.getElementById('chartjs-tooltip')

	let label = 'Unknown';
	if (event.type === 'middleware') label = `${event.handler.name}()`
	else if (event.type === 'redirect') label = `Redirect to ${event.path}`
	else if (event.type === 'view') label = `views/` + event.name
	else if (event.type === 'send') label = `response.send()`
	else if (event.type === 'json') label = `response.json()`
	else if (event.type === 'Frontend') label = '';
	label += ' - ' + (event.end - event.start) + 'ms'
	const urls = {
		added: event.handler && `vscode://file${event.handler.adds[0][0]}`,
		evaluated: event.evaluate_lines && `vscode://file${event.evaluate_lines[0]}`,
		construct: event.handler?.construct && `vscode://file${event.handler.construct[0]}`,
		source: event.handler?.location ? `vscode://file${event.handler.location.path}:${event.handler.location.line}:${event.handler.location.column}` : event.source_line && `vscode://file${event.source_line}`
	}
	tooltipEl.innerHTML = `
						<div>${label}</div>
						${tooltipEl.classList.contains('clicked') && urls ? Object.entries(urls).filter(([_, url]) => url && !url.includes('node_modules') && !url.includes('express-handler-tracker')).reduce((lines, [name, url]) => [...lines, `<a href="${url}">${name[0].toUpperCase() + name.slice(1)}</a>`], []).join('<br/>') : ''}
					`
}


CHART = new Chart(CANVAS, {
	type: 'bar',
	data: {
		labels,
		datasets
	},
	options: {
		responsive: true,
		skipNull: true,
		indexAxis: 'y',
		transitions: {
			zoom: {
				animation: {
					duration: 1000,
					easing: 'linear'
				}
			}
		},
		scales: {
			x: {
				stacked: false,
			},
			y: {
				stacked: false
			}
		},
		parsing: {
			xAxisKey: 'start',
			yAxisKey: 'end'
		},
		plugins: {
			zoom: {
				pan: {
					enabled: true,
					mode: 'xy',
					modifierKey: 'ctrl',
				},
				limits: {
					x: {
						min: 0,
						max: last
					}
				},
				zoom: {
					wheel: {
						enabled: true,
						speed: .25
					},
					pinch: {
						enabled: true
					},
					drag: {
						enabled: true
					},
					mode: 'xy',
					overScaleMode: 'y'
				}
			},
			legend: {
				display: false,
			},
			title: {
				display: true,
				text: 'Requests'
			},
			tooltip: {
				position: 'myCustomPositioner',
				callbacks: {
					label(info) {
						return info.dataset.data[info.dataIndex].label;
					}
				},
				enabled: false,
				external({ chart, tooltip }) {
					let tooltipEl = document.getElementById('chartjs-tooltip');
					// Create element on first render
					if (!tooltipEl) {
						tooltipEl = document.createElement('div');
						tooltipEl.id = 'chartjs-tooltip';
						tooltipEl.innerHTML = '<table></table>';
						document.body.appendChild(tooltipEl);
					}

					if (!tooltip.opacity) tooltipEl.classList.add('hidden')
					else tooltipEl.classList.remove('hidden')
					renderTooltip(tooltip.dataPoints[0].raw.event)
					const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
					tooltipEl.style.left = positionX + tooltip.caretX + 'px';
					tooltipEl.style.top = positionY + tooltip.caretY + 'px';
				}
			}
		}
	}
});

setTimeout(() => zoomToY(Object.values(requests).length - 1), 1000);

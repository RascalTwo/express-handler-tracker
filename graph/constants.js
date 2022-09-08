export const LAYOUTS = {
	'dagre-network': ({
		name: 'dagre',
		ranker: 'network-simplex'
	}),
	'dagre-right': ({
		name: 'dagre',
		ranker: 'tight-tree'
	}),
	'dagre-longest': ({
		name: 'dagre',
		ranker: 'longest-path'
	}),
	'cola': ({
		name: 'cola',
		randomize: true,
		nodeSpacing: () => 25
	}),
	'random': ({
		name: 'random',
	}),
	'grid': ({
		name: 'grid',
	}),
	'circle': ({
		name: 'circle',
	}),
	'concentric': ({
		name: 'concentric',
	}),
	'breadthfirst': ({
		name: 'breadthfirst',
	}),
	'euler': ({
		name: 'euler',
		randomize: true
	}),
	'klay': ({
		name: 'klay',
		klay: {
			direction: 'DOWN'
		},
		nodeDimensionsIncludeLabels: true
	}),
	'elk-box': ({
		name: 'elk',
		elk: {
			'algorithm': 'box',
			'elk.direction': 'DOWN',
		},
		nodeDimensionsIncludeLabels: true,
	}),
	'elk-disco': ({
		name: 'elk',
		elk: {
			'algorithm': 'disco',
			'elk.direction': 'DOWN',
		},
		nodeDimensionsIncludeLabels: true,
	}),
	'elk-force': ({
		name: 'elk',
		elk: {
			'algorithm': 'force',
			'elk.direction': 'DOWN',
		},
		nodeDimensionsIncludeLabels: true,
	}),
	'elk-layered': ({
		name: 'elk',
		elk: {
			'algorithm': 'layered',
			'elk.direction': 'DOWN',
		},
		nodeDimensionsIncludeLabels: true,
	}),
	'elk-mrtree': ({
		name: 'elk',
		elk: {
			'algorithm': 'mrtree',
			'elk.direction': 'DOWN',
		},
		nodeDimensionsIncludeLabels: true,
	}),
	'elk-radial': ({
		name: 'elk',
		elk: {
			'algorithm': 'radial',
			'elk.direction': 'DOWN',
		},
		nodeDimensionsIncludeLabels: true,
	}),
	'elk-rectpacking': ({
		name: 'elk',
		elk: {
			'algorithm': 'rectpacking',
			'elk.direction': 'DOWN',
		},
		nodeDimensionsIncludeLabels: true,
	}),
	'elk-stress': ({
		name: 'elk',
		elk: {
			'algorithm': 'stress',
			'elk.direction': 'DOWN',
		},
		nodeDimensionsIncludeLabels: true,
	})
}

export const DEFAULT_STYLE_RULES = {
	'default-rule': {
		pattern: '.*',
		color: '#729fcf',
		shape: 'ellipse'
	},
	'model-rule': {
		pattern: 'mod(e|a)l',
		color: '#ff0000',
		shape: 'barrel'
	},
	'view-rule': {
		pattern: 'view',
		color: '#0000ff',
		shape: 'vee'
	},
	'controller-rule': {
		pattern: 'controll?er',
		color: '#00ff00',
		shape: 'rhomboid'
	},
	'router-rule': {
		pattern: 'route',
		color: '#ffff00',
		shape: 'concave-hexagon'
	}
}
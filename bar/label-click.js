export default handleLabelClick => {
	const findLabel = (labels, evt) => {
		let found = false;
		let res = null;

		labels.forEach(l => {
			l.labels.forEach((label, index) => {
				if (evt.x > label.x && evt.x < label.x2 && evt.y > label.y && evt.y < label.y2) {
					res = {
						label: label.label,
						index
					};
					found = true;
				}
			});
		});

		return [found, res];
	};

	const getLabelHitboxes = (scales) => (Object.values(scales).map((s) => ({
		scaleId: s.id,
		labels: s._labelItems.map((e, i) => ({
			x: e.translation[0] - s._labelSizes.widths[i],
			x2: e.translation[0] + s._labelSizes.widths[i] / 2,
			y: e.translation[1] - s._labelSizes.heights[i] / 2,
			y2: e.translation[1] + s._labelSizes.heights[i] / 2,
			label: e.label,
			index: i
		}))
	})));

	const plugin = {
		id: 'customHover',
		afterEvent: (chart, event, opts) => {
			const evt = event.event;

			if (evt.type !== 'click') {
				return;
			}
			const [found, labelInfo] = findLabel(getLabelHitboxes(chart.scales), evt);

			if (found) handleLabelClick(labelInfo)

		}
	}
	Chart.register(plugin);
}
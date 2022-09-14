
export let isOffline = !!(window.location.hash || window.location.search) || localStorage.getItem('importing-requests');

export const requests = await (async () => {
	const getLocalInfo = () => {
		const importing = JSON.parse(localStorage.getItem('importing-requests') || '{}');
		if (Object.keys(importing).length) return deserialize(importing);
		return {};
	}
	if (isOffline) return getLocalInfo()

	return fetch('./requests').then(r => r.text()).then(async raw => deserialize(JSON.parse(raw))).catch(err => {
		console.error(err);
		isOffline = true;
		return getLocalInfo()
	});
})();


export const renderInfo = {
	request: Object.values(requests)[0],
	middlewareIndex: 0,
	forward: true,
	tip: undefined,
	lastNode: undefined,
	animating: false,
}

export const viewInfo = await (async () => {
	const getLocalInfo = async () => {
		const importing = JSON.parse(localStorage.getItem('importing-info') || '{}');
		if (Object.keys(importing).length) return importing;
		return {
			modules: [], root: '', views: { directory: '', extension: '' },
			external: {},
			VERSION: await fetch('./version.txt').then(r => r.text())
		}
	}
	if (isOffline) return getLocalInfo()

	return fetch('./info').then(r => r.json()).catch(async err => {
		console.error(err);
		return getLocalInfo()
	});
})();

viewInfo.filepathPrefix = viewInfo.root.startsWith('http') ? viewInfo.root : 'vscode://file' + viewInfo.root
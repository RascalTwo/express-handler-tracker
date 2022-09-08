


export const requests = await fetch('../requests').then(r => r.text()).then(raw => Flatted.parse(raw)).catch(err => {
	console.error(err);
	return {};
});
export const { modules, root, views, VERSION } = await fetch('../info').then(r => r.json()).catch(async err => {
	console.error(err);
	return { modules: [], root: '', views: '', VERSION: await fetch('./version.txt').then(r => r.text()) }
});

export const renderInfo = {
	request: Object.values(requests)[0],
	middlewareIndex: 0,
	forward: true,
	tip: undefined,
	lastNode: undefined,
	animating: false,
}
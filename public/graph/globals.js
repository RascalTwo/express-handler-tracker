


export const requests = await fetch('../requests').then(r => r.text()).then(raw => Flatted.parse(raw));
export const { modules, root, views } = await fetch('../info').then(r => r.json());

export const renderInfo = {
	request: Object.values(requests)[0],
	middlewareIndex: 0,
	forward: true,
	tip: undefined,
	lastNode: undefined
}
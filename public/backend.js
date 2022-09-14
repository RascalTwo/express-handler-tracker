import { viewInfo } from "./globals.js";
import { importData } from "./helpers.js";

const BACKEND_URL = 'http://localhost:3030/';

let token = localStorage.getItem('backend-token')

const searchParams = new URLSearchParams(window.location.search)
const hashParams = new URLSearchParams(window.location.hash.slice(1))
const params = {
	...Object.fromEntries(searchParams.entries()),
	...Object.fromEntries(hashParams.entries())
}

if (params.has('token')) {
	token = params.get('token')
	localStorage.setItem('backend-token', token)

	if (searchParams.has('token')) {
		searchParams.delete('token')
		window.location.search = params.toString() ? '?' + params.toString() : ''
	}
	else {
		hashParams.delete('token')
		window.location.hash = params.toString() ? '#' + params.toString() : ''
	}
}

function getGithubInfoFromUsername(username){
	return fetch('https://api.github.com/users/' + username).then(r => r.json())
}

(async () => {
	const parts = window.location.hash.slice(2).split('/');
	const [owner, repository, authorThing, slug] = parts;

	let authorId = authorThing
	if (authorThing && isNaN(authorThing)) authorId = await getGithubInfoFromUsername(authorThing).then(r => r.id)

	if (
		viewInfo.external.owner === owner &&
		viewInfo.external.repository === repository &&
		viewInfo.external.authorId == authorId &&
		viewInfo.external.slug == slug
	) return;

	const data = await getDataOptions(owner, repository, authorId, slug) || [];
	if (slug) {
		if (!data.length) return alert(`${slug} in ${owner}/${repository} by ${(await getGithubInfo(authorId)).login} not found`);
		importData(deserialize(data[0].content), window.cy);
		return window.location.reload();
	}

	const checkbox = document.querySelector('#modal-2')
	checkbox.nextElementSibling.querySelector('ul').appendChild(data.reduce((frag, option) => {
		const li = document.createElement('li');
		li.innerHTML = `
			<label style="display: flex;">
				<span>${option.slug} in ${option.owner}/${option.repository} by ${option.authorId}</span>
				<button style="float: right;" type="button">Import</button>
			</label>
		`;
		li.querySelector('button').addEventListener('click', async () => {
			const data = (await getDataOptions(option.owner, option.repository, option.authorId, option.slug))[0];
			if (!data) return alert(`${slug} in ${owner}/${repository} by ${authorThing} not found`);
			console.log(deserialize(data.content))
			importData(deserialize(data.content), window.cy);
			window.location.reload();
		})
		frag.appendChild(li);
		return frag;
	}, document.createDocumentFragment()));
	if (owner) checkbox.checked = true;
})().catch(console.error);



export const selfId = await makeBackendFetch('').then(u => u?._id)
export const selfInfo = selfId ? await getGithubInfo(selfId) : null;

if (selfInfo) document.querySelector('#auth-button img').src = selfInfo.avatar_url

export function makeBackendFetch(relative, options = {}){
	return fetch(BACKEND_URL + relative, { ...options, headers: { Authorization: 'Bearer ' + token, ...(options.headers || {}) } }).then(r => r.json()).catch(() => undefined)
}

function getGithubInfo(id){
	return fetch('https://api.github.com/user/' + id).then(r => r.json())
}

/**
 * @returns {Promise<Array<{ authorId: string, owner: string, repository: string, slug: string, content?: any }>>}
 */
export function getDataOptions(owner, repository, author, slug){
	let url = `data/${owner}`;
	if (repository) url += '/' + repository
	if (author) url += '/' + author
	if (slug) url += '/' + slug
	return makeBackendFetch(url)
}

function deleteExternal({ owner, repository, slug }){
	return makeBackendFetch(`data/${owner}/${repository}/${slug}`, { method: 'DELETE'})
}

export async function upsertData(data){
	await makeBackendFetch(`data/${data.external.owner}/${data.external.repository}/${data.external.slug}`, { method: 'POST', body: JSON.stringify(serialize(data)), headers: { 'Content-Type': 'application/json' }});
	await renderMyLIs();
}

const renderMyLIs = (() => {
	const checkbox = document.querySelector('#modal-5');
	const modal = checkbox.nextElementSibling;

	modal.addEventListener('submit', (e) => {
		e.preventDefault()
		localStorage.removeItem('backend-token')
		window.location.reload()
	})


	async function renderMyLIs(){
		const mine = await makeBackendFetch('author/' + selfId) || []

		const ul = modal.querySelector('ul')
		ul.innerHTML = ''
		ul.appendChild(mine.reduce((frag, option) => {
			const li = document.createElement('li');
			li.innerHTML = `
				<label style="display: flex;">
					<span>${option.slug} in ${option.owner}/${option.repository} by ${option.authorId}</span>
					<button style="float: right;" type="button">Import</button>
					<button style="float: right;" type="button">Delete</button>
				</label>
			`;
			const [importButton, deleteButton] = li.querySelectorAll('button')
			importButton.addEventListener('click', async () => {
				const data = (await getDataOptions(option.owner, option.repository, option.authorId, option.slug))[0];
				if (!data) return alert(`${option.slug} in ${option.owner}/${option.repository} by ${option.authorId} not found`);
				importData(deserialize(data.content), window.cy);
				window.location.reload();
			})
			deleteButton.addEventListener('click', () => {
				deleteExternal(option)
				li.remove()
			})

			frag.appendChild(li);
			return frag;
		}, document.createDocumentFragment()));
	}


	document.querySelector('#auth-button').addEventListener('click', async () => {
		if (!selfId) return window.location.href = BACKEND_URL + 'auth/github?returnTo=' + encodeURIComponent(window.location.href)

		renderMyLIs()

		checkbox.checked = true


	})

	return renderMyLIs
})();

// P
//	users need to be able to access a valid token to access their github account on the backend
// R
//	valid token for interacting with site
// E
//	user joins for first time, clicks login button, approves github, is returned and logged in
//	user returns, is logged in
//	user returns after a long time, is not logged in
// P
//	read token from localStorage | url
//	validate token
//		get current user from backend
//		if good, render current user
//	users need to be able to click a link, be taken to my backend, and redirected back here with a token

// P
//	how to render current user status
// R
//	user can tell they are logged in
// E
//	user joins page for first time, can see they are not logged in

// P
//	users need to be able to export to any user + repo combo
// R
//	exported assets are uploaded to the backend under the user + repo + author + slug combo

// P
//	users need to be able to import data from any user + repo + author + slug combo

// P
//	users need to be able to discover what user + repo + author + slug combos exist

// P
//	authors need to be able to delete uploaded data

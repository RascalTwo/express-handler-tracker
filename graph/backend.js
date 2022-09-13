const BACKEND_URL = 'http://localhost:3030/';

let token = localStorage.getItem('backend-token')

export const selfId = await makeBackendFetch('').then(u => u._id)

export function makeBackendFetch(relative, options){
	return fetch(BACKEND_URL + relative, { headers: { Authorization: 'Bearer ' + token }, ...options }).then(r => r.json())
}

export function getGithubUsername(id){
	return fetch('https://api.github.com/user/' + id).then(r => r.json())
}

const params = new URLSearchParams(window.location.search)
if (params.has('token')) {
	token = params.get('token')
	localStorage.setItem('backend-token', token)
}

function getCurrentOptions(){
	const hashParams = new URLSearchParams(window.location.hash.slice(1))
	const owner = hashParams.get('owner');
	const repository = hashParams.get('repository');
	const author = hashParams.get('author');
	const slug = hashParams.get('slug');
}
document.querySelector('#darkTheme').addEventListener('change', e => {
	toggleTheme(e.currentTarget.checked)
})
function toggleTheme(darkTheme) {
	document.querySelector('html').classList.toggle('dark', darkTheme);
}
toggleTheme(document.querySelector('#darkTheme').checked)
import { generateStylesheet } from "./style-rules.js";

document.querySelector('#darkTheme').addEventListener('change', e => {
	toggleTheme(e.currentTarget.checked)
	cy.style(generateStylesheet());
})
function toggleTheme(darkTheme) {
	document.querySelector('html').classList.toggle('dark', darkTheme);
}
toggleTheme(document.querySelector('#darkTheme').checked)
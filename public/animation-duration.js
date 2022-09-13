export let animationDuration = 1000;
(() => {
	const range = document.querySelector('#animation-duration')
	range.addEventListener('change', () => {
		animationDuration = +range.value
	})
	animationDuration = +range.value;
})();

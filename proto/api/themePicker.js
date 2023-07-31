/*!
* Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
* Copyright 2011-2023 The Bootstrap Authors
* Licensed under the Creative Commons Attribution 3.0 Unported License.

HEAVILY EDITED BY RANDAL MEYER

*/

(() => {
	'use strict';

	const storedTheme = localStorage.getItem('theme');

	const getPreferredTheme = () => {
		if (storedTheme) {
			return storedTheme;
		}
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	};

	const setTheme = function (theme) {
		if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			document.documentElement.setAttribute('data-bs-theme', 'dark');
		} else {
			document.documentElement.setAttribute('data-bs-theme', theme);
		}
	};

	setTheme(getPreferredTheme());

	const showActiveTheme = (theme, focus = false) => {
		$(`[data-action="toggleLightDarkMode"]`)
			.removeClass("gi-moon gi-sun d-none")
			.addClass(theme === "dark" ? "gi-moon" : "gi-sun");
	};

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (storedTheme !== 'light' || storedTheme !== 'dark') {
			setTheme(getPreferredTheme());
		}
	});

	window.addEventListener('DOMContentLoaded', () => {
		showActiveTheme(getPreferredTheme());
		$(`[data-action="toggleLightDarkMode"]`).on("click", () => {
			const theme = $(`[data-action="toggleLightDarkMode"]`).hasClass("gi-moon") ? "light" : "dark";
			setTheme(theme);
			showActiveTheme(theme);
			// localStorage.setItem('theme', theme); // this overrides the auto selection
		});
	});

})();
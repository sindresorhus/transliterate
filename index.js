import builtinReplacements from './replacements.js';
import localeReplacements from './locale-replacements.js';

const doCustomReplacements = (string, replacements) => {
	for (const [key, value] of replacements) {
		string = string.replaceAll(key, value);
	}

	return string;
};

const getLocaleReplacements = locale => {
	if (!locale) {
		return [];
	}

	const normalizedLocale = locale.toLowerCase()
		// Norwegian (no) is an alias for Norwegian Bokmål (nb)
		.replace(/^no(-|$)/, 'nb$1');

	return localeReplacements[normalizedLocale]
		|| localeReplacements[normalizedLocale.split('-')[0]]
		|| [];
};

export default function transliterate(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		customReplacements: [],
		...options,
	};

	// Get locale-specific replacements
	const localeSpecificReplacements = getLocaleReplacements(options.locale);

	// Merge replacements: locale-specific > custom > builtin
	const customReplacements = new Map([
		...builtinReplacements,
		...localeSpecificReplacements,
		...options.customReplacements,
	]);

	string = string.normalize();
	string = doCustomReplacements(string, customReplacements);
	string = string.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').normalize();

	// Normalize all dash types to hyphen-minus
	string = string.replaceAll(/\p{Dash_Punctuation}/gu, '-');

	return string;
}

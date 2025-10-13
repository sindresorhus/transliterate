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
		return undefined;
	}

	const normalizedLocale = locale.toLowerCase()
		// Norwegian (no) is an alias for Norwegian Bokmål (nb)
		.replace(/^no(-|$)/, 'nb$1');

	return localeReplacements[normalizedLocale]
		|| localeReplacements[normalizedLocale.split('-')[0]]
		|| undefined;
};

export default function transliterate(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		customReplacements: [],
		...options,
	};

	const localeMap = getLocaleReplacements(options.locale);

	let replacements = builtinReplacements;

	if (localeMap || options.customReplacements.length > 0) {
		replacements = new Map(builtinReplacements);

		if (localeMap) {
			for (const [key, value] of localeMap) {
				replacements.set(key, value);
			}
		}

		for (const [key, value] of options.customReplacements) {
			replacements.set(key, value);
		}
	}

	string = string.normalize();
	string = doCustomReplacements(string, replacements);
	string = string.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').normalize();

	// Normalize all dash types to hyphen-minus
	string = string.replaceAll(/\p{Dash_Punctuation}/gu, '-');

	return string;
}

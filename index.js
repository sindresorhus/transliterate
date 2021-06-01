import deburr from 'lodash.deburr';
import escapeStringRegexp from 'escape-string-regexp';
import builtinReplacements from './replacements.js';

const doCustomReplacements = (string, replacements, preservedCharacters) => {
	for (const [key, value] of replacements) {
		if (preservedCharacters && preservedCharacters.length > 0 && preservedCharacters.includes(key)) {
			continue;
		}

		// TODO: Use `String#replaceAll()` when targeting Node.js 16.
		string = string.replace(new RegExp(escapeStringRegexp(key), 'g'), value);
	}

	return string;
};

export default function transliterate(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		customReplacements: [],
		preservedCharacters: [],
		...options
	};

	const builtinReplacementsMap = new Map([...builtinReplacements]);
	const customReplacementsMap = new Map([...options.customReplacements]);

	string = string.normalize();
	string = doCustomReplacements(string, builtinReplacementsMap, options.preservedCharacters);
	string = doCustomReplacements(string, customReplacementsMap);
	string = deburr(string);

	return string;
}

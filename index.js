import deburr from 'lodash.deburr';
import escapeStringRegexp from 'escape-string-regexp';
import builtinReplacements from './replacements.js';

const doCustomReplacements = (string, replacements, preserveChars) => {
	for (const [key, value] of replacements) {
		regex = new RegExp(escapeStringRegexp(key), 'g');
		if (preserveChars && regex.test(preserveChars)) continue;

		// TODO: Use `String#replaceAll()` when targeting Node.js 16.
		string = string.replace(regex, value);
	}

	return string;
};

export default function transliterate(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		customReplacements: [],
		preserveChars: '',
		...options
	};

	const builtinReplacements = new Map(builtinReplacements);
	const customReplacements = new Map([...options.customReplacements]);

	string = string.normalize();
	string = doCustomReplacements(string, builtinReplacements, options.preserveChars);
	string = doCustomReplacements(string, customReplacements);
	string = deburr(string);

	return string;
}

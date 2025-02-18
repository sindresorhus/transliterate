import builtinReplacements from './replacements.js';

const doCustomReplacements = (string, replacements) => {
	const stringSplit = string.split('');

	for (let i = 0; i < stringSplit.length; i++) {
		const char = stringSplit[i];
		const replacement = replacements.get(char);

		if (replacement) {
			stringSplit[i] = replacement;
		}
	}

	return stringSplit.join('');
};

export default function transliterate(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		customReplacements: [],
		...options
	};

	const customReplacements = new Map([
		...builtinReplacements,
		...options.customReplacements
	]);

	string = string.normalize();
	string = doCustomReplacements(string, customReplacements);
	string = string.normalize('NFD').replace(/\p{Diacritic}/gu, '').normalize();

	return string;
}

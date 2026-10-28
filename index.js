import builtinReplacements from './replacements.js';
import localeReplacements, {localeContextReplacements} from './locale-replacements.js';

// TODO: Use Regex.escape when targeting Node.js 24.
const escapeRegex = string => string.replaceAll(/[$\(\)*+.?\[\\\]^\{\|\}]/gv, String.raw`\$&`);

const buildReplacementPattern = replacements => {
	// Sort by key length descending so longer patterns match first (e.g., 'ու' before 'ո')
	const sortedKeys = replacements.keys().toArray().toSorted((a, b) => b.length - a.length);
	return new RegExp(sortedKeys.map(key => escapeRegex(key)).join('|'), 'gv');
};

// Pre-compile the default pattern for performance
const defaultPattern = buildReplacementPattern(builtinReplacements);

// Pre-compile locale patterns
const localeCache = new Map();

for (const [locale, localeMap] of Object.entries(localeReplacements)) {
	const replacements = new Map(builtinReplacements);
	for (const [key, value] of localeMap) {
		replacements.set(key, value);
	}

	localeCache.set(locale, {
		replacements,
		pattern: buildReplacementPattern(replacements),
		contextReplacements: localeContextReplacements[locale] ?? [],
	});
}

const normalizeLocale = locale => {
	if (!locale) {
		return;
	}

	const normalizedLocale = locale.toLowerCase()
		// Norwegian (no) is an alias for Norwegian Bokmål (nb)
		.replace(/^no(?<suffix>-|$)/v, 'nb$<suffix>');

	if (Object.hasOwn(localeReplacements, normalizedLocale)) {
		return normalizedLocale;
	}

	const prefix = normalizedLocale.split('-', 1)[0];
	if (Object.hasOwn(localeReplacements, prefix)) {
		return prefix;
	}
};

export default function transliterate(string, options) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a string, got \`${typeof string}\``);
	}

	options = {
		customReplacements: [],
		...options,
	};

	const normalizedLocale = normalizeLocale(options.locale);
	const customReplacements = [...options.customReplacements];

	let replacements = builtinReplacements;
	let pattern = defaultPattern;
	let contextReplacements = [];

	if (normalizedLocale) {
		({replacements, pattern, contextReplacements} = localeCache.get(normalizedLocale));
	}

	string = string.normalize();

	// Apply customReplacements separately (avoids expensive regex compilation)
	if (customReplacements.length > 0) {
		// Sort by key length descending so longer patterns match first
		customReplacements.sort((a, b) => b[0].length - a[0].length);
		for (const [key, value] of customReplacements) {
			// A replacement value containing `$&` or `$1` is expanded by `replaceAll`.
			// That is long-standing behaviour and the lint rule that would forbid it
			// can only be satisfied by changing what this option does, so leave it.
			// eslint-disable-next-line unicorn/no-unsafe-string-replacement
			string = string.replaceAll(key, value);
		}
	}

	for (const [contextPattern, value] of contextReplacements) {
		string = string.replaceAll(contextPattern, () => value);
	}

	string = string.replace(pattern, match => replacements.get(match) ?? match);
	string = string.normalize('NFD').replaceAll(/\p{Diacritic}/gv, '').normalize();

	// Normalize all dash types to hyphen-minus. Hyphen-minus itself is excluded, as replacing it with itself is only wasted work.
	string = string.replaceAll(/[\p{Dash_Punctuation}--\-]/gv, '-');

	return string;
}

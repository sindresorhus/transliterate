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
const defaultLocaleData = {
	replacements: builtinReplacements,
	pattern: buildReplacementPattern(builtinReplacements),
	contextReplacements: [],
};

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
		// The Norwegian codes `no` (generic) and `nn` (Nynorsk) use the Bokmål (`nb`) rules
		.replace(/^(?:no|nn)(?<suffix>-|$)/v, 'nb$<suffix>');

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

	const {replacements, pattern, contextReplacements} = localeCache.get(normalizeLocale(options?.locale)) ?? defaultLocaleData;

	// Normalize the keys so they match canonically equivalent input
	const customReplacements = Array.from(options?.customReplacements ?? [], ([key, value]) => [key.normalize(), value]);

	string = string.normalize();

	// Apply customReplacements separately (avoids expensive regex compilation)
	// Sort by key length descending so longer patterns match first
	customReplacements.sort((a, b) => b[0].length - a[0].length);
	for (const [key, value] of customReplacements) {
		// A replacement value containing `$&` or `$1` is expanded by `replaceAll`. This is long-standing behavior, so preserve it.
		// eslint-disable-next-line unicorn/no-unsafe-string-replacement
		string = string.replaceAll(key, value);
	}

	// Custom replacement values can be in any normalization form
	string = string.normalize();

	for (const [contextPattern, value] of contextReplacements) {
		string = string.replaceAll(contextPattern, () => value);
	}

	// Arabic presentation forms are positional variants of the base letters, so they transliterate like the text
	// they decompose to. This also expands the lam-alef ligatures into two letters.
	string = string.replaceAll(/[\u{FB50}-\u{FDFF}\u{FE70}-\u{FEFF}]/gv, match => match.normalize('NFKC'));

	string = string.replace(pattern, match => replacements.get(match) ?? match);
	// ASCII carets and backticks are classified as diacritics but should remain literal punctuation.
	// The negation stroke in `≠` is also not an accent, so it is excluded to keep the meaning.
	string = string.normalize('NFD').replaceAll(/[[\p{Diacritic}--\p{ASCII}]--\u{338}]/gv, '').normalize();

	// Removing diacritics can expose base letters that still need transliteration.
	string = string.replace(pattern, match => replacements.get(match) ?? match);

	// Normalize all dash types to hyphen-minus. Hyphen-minus itself is excluded, as replacing it with itself is only wasted work.
	string = string.replaceAll(/[\p{Dash_Punctuation}--\-]/gv, '-');

	return string;
}

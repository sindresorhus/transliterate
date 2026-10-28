import builtinReplacements from './replacements.js';
import localeReplacements, {localeContextReplacements} from './locale-replacements.js';

// TODO: Use Regex.escape when targeting Node.js 24.
const escapeRegex = string => string.replaceAll(/[$\(\)*+.?\[\\\]^\{\|\}]/gv, String.raw`\$&`);

const buildReplacementPattern = replacements => {
	// Sort by key length descending so longer patterns match first (e.g., 'ու' before 'ո')
	const sortedKeys = replacements.keys().toArray().toSorted((a, b) => b.length - a.length);
	return new RegExp(sortedKeys.map(key => escapeRegex(key)).join('|'), 'gv');
};

// A locale only changes the value of keys that are already in the built-in table, so every locale matches the same characters and can share one pre-compiled pattern. Only the replacement values differ.
const pattern = buildReplacementPattern(builtinReplacements);

const defaultLocaleData = {
	replacements: builtinReplacements,
	contextReplacements: [],
};

const localeCache = new Map();

const getLocaleData = locale => {
	if (locale === undefined) {
		return defaultLocaleData;
	}

	let data = localeCache.get(locale);
	if (data === undefined) {
		data = {
			replacements: new Map([...builtinReplacements, ...localeReplacements[locale]]),
			contextReplacements: localeContextReplacements[locale] ?? [],
		};
		localeCache.set(locale, data);
	}

	return data;
};

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

	const {replacements, contextReplacements} = getLocaleData(normalizeLocale(options?.locale));

	const applyReplacements = input => input.replace(pattern, match => replacements.get(match));

	// Normalize the keys so they match canonically equivalent input
	const customReplacements = Array.from(options?.customReplacements ?? [], ([key, value]) => [key.normalize(), value]);

	// Every replacement key and locale context contains non-ASCII text and the first normalization is a no-op for ASCII, so pure ASCII input can only pass through unchanged. This is the common case for slugs and identifiers.
	if (customReplacements.length === 0 && !/\P{ASCII}/v.test(string)) {
		return string;
	}

	string = string.normalize();

	if (customReplacements.length > 0) {
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
	}

	for (const [contextPattern, value] of contextReplacements) {
		string = string.replaceAll(contextPattern, () => value);
	}

	// Arabic presentation forms are positional variants of the base letters, so they transliterate like the text they decompose to. This also expands the lam-alef ligatures into two letters.
	string = string.replaceAll(/[\u{FB50}-\u{FDFF}\u{FE70}-\u{FEFF}]/gv, match => match.normalize('NFKC'));

	string = applyReplacements(string);

	// Every replacement value is ASCII, so a pure ASCII result has nothing left to strip, match, or dash-normalize. This is the common case for Latin and Cyrillic text.
	if (!/\P{ASCII}/v.test(string)) {
		return string;
	}

	// ASCII carets and backticks are classified as diacritics but should remain literal punctuation.
	// The negation stroke in `≠` is also not an accent, so it is excluded to keep the meaning.
	// Recompose even when no diacritics were removed, since replacements can introduce a base character that composes with a retained combining mark.
	const stripped = string.normalize('NFD').replaceAll(/[[\p{Diacritic}--\p{ASCII}]--\u{338}]/gv, '').normalize();

	// Removing diacritics can expose base letters that still need transliteration. No key survives the pass above, so this second pass can only find characters that the stripping just exposed.
	if (stripped !== string) {
		string = applyReplacements(stripped);
	}

	// Normalize all dash types to hyphen-minus. Hyphen-minus itself is excluded, as replacing it with itself is only wasted work.
	string = string.replaceAll(/[\p{Dash_Punctuation}--\-]/gv, '-');

	return string;
}

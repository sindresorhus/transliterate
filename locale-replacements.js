/**
Language-specific replacement rules.

Keys are BCP-47 language tags (or their prefixes).

Values are arrays of [from, to] replacement pairs.

These replacements take precedence over the default replacements when a matching locale is specified.
*/

// Shared Danish/Norwegian replacements
const danishNorwegianReplacements = [
	['æ', 'ae'],
	['Æ', 'Ae'],
	['ø', 'oe'],
	['Ø', 'Oe'],
	['å', 'aa'],
	['Å', 'Aa'],
];

const localeReplacements = {
	// Swedish
	sv: [
		['ä', 'a'],
		['Ä', 'A'],
		['ö', 'o'],
		['Ö', 'O'],
		['å', 'a'],
		['Å', 'A'],
	],

	// Danish
	da: danishNorwegianReplacements,

	// Norwegian Bokmål
	nb: danishNorwegianReplacements,

	// German
	de: [
		['ä', 'ae'],
		['Ä', 'Ae'],
		['ö', 'oe'],
		['Ö', 'Oe'],
		['ü', 'ue'],
		['Ü', 'Ue'],
		['ß', 'ss'],
		['ẞ', 'Ss'],
	],

	// Turkish
	tr: [
		['â', 'a'],
		['Â', 'A'],
		['ö', 'o'],
		['Ö', 'O'],
		['ü', 'u'],
		['Ü', 'U'],
	],

	// Hungarian
	hu: [
		['ű', 'u'],
		['Ű', 'U'],
		['ö', 'o'],
		['Ö', 'O'],
		['ü', 'u'],
		['Ü', 'U'],
		['á', 'a'],
		['Á', 'A'],
		['é', 'e'],
		['É', 'E'],
		['í', 'i'],
		['Í', 'I'],
		['ó', 'o'],
		['Ó', 'O'],
		['ú', 'u'],
		['Ú', 'U'],
	],

	// Serbian
	sr: [
		['ђ', 'dj'],
		['Ђ', 'Dj'],
		['џ', 'dz'],
		['Џ', 'Dz'],
		['љ', 'lj'],
		['Љ', 'Lj'],
		['њ', 'nj'],
		['Њ', 'Nj'],
		['ћ', 'c'],
		['Ћ', 'C'],
		['ч', 'ch'],
		['Ч', 'Ch'],
		['ш', 'sh'],
		['Ш', 'Sh'],
		['ж', 'zh'],
		['Ж', 'Zh'],
	],
};

// Convert all locale replacements to Maps at module load time
for (const locale of Object.keys(localeReplacements)) {
	localeReplacements[locale] = new Map(localeReplacements[locale]);
}

export default localeReplacements;

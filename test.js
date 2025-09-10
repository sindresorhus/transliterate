import test from 'ava';
import transliterate from './index.js';
import replacements from './replacements.js';

test('main', t => {
	t.is(transliterate('Foo ÿ'), 'Foo y');
	t.is(transliterate('Hællæ, hva skjera?'), 'Haellae, hva skjera?');
	t.is(transliterate('Déjà Vu!'), 'Deja Vu!');
});

test('customReplacements option', t => {
	t.is(transliterate('Zürich', {
		customReplacements: [
			['ä', 'ae'],
			['ö', 'oe'],
			['ü', 'ue'],
			['ß', 'ss']
		]
	}), 'Zuerich');
});

test('all replacements are ASCII', t => {
	const MAX_ASCII_CHARACTER_CODE = 127;

	for (const [original, replacement] of replacements) {
		if (replacement === '') {
			continue;
		}

		t.true(replacement.charCodeAt(0) <= MAX_ASCII_CHARACTER_CODE, `${original} → ${replacement} (code: ${replacement.charCodeAt(0)})`);
	}
});

test('supports German umlauts', t => {
	t.is(transliterate('ä ö ü Ä Ö Ü ß'), 'ae oe ue Ae Oe Ue ss');
});

test('supports Vietnamese', t => {
	t.is(transliterate('ố Ừ Đ'), 'o U D');
});

test('supports Arabic', t => {
	t.is(transliterate('ث س و'), 'th s w');
});

test('supports Persian / Farsi', t => {
	t.is(transliterate('چ ی پ'), 'ch y p');
});

test('supports Urdu', t => {
	t.is(transliterate('ٹ ڈ ھ'), 't d h');
});

test('supports Pashto', t => {
	t.is(transliterate('ګ ړ څ'), 'g r c');
});

test('supports Russian', t => {
	t.is(transliterate('Ж п ю'), 'Zh p yu');
});

test('supports Romanian', t => {
	t.is(transliterate('ș Ț'), 's T');
});

test('supports Turkish', t => {
	t.is(transliterate('İ ı Ş ş Ç ç Ğ ğ'), 'I i S s C c G g');
});

test('supports Armenian', t => {
	t.is(transliterate('Ե ր և ա ն'), 'Ye r yev a n');
});

test('supports Georgian', t => {
	t.is(transliterate('თ პ ღ'), 't p gh');
});

test('supports Latin', t => {
	t.is(transliterate('Ä Ð Ø'), 'Ae D O');
});

test('supports Czech', t => {
	t.is(transliterate('č ž Ň'), 'c z N');
});

test('supports Danish', t => {
	t.is(transliterate('æ ø å Æ Ø Å', {locale: 'da'}), 'ae oe aa Ae Oe Aa');
});

test('supports Dhivehi', t => {
	t.is(transliterate('ޝ ޓ ބ'), 'sh t b');
});

test('supports Greek', t => {
	t.is(transliterate('θ Γ Ξ'), 'th G KS');
});

test('supports Hungarian', t => {
	t.is(transliterate('ű ö Ö', {locale: 'hu'}), 'u o O');
});

test('supports Latvian', t => {
	t.is(transliterate('ā Ņ Ģ'), 'a N G');
});

test('supports Lithuanian', t => {
	t.is(transliterate('ą į Š'), 'a i S');
});

test('supports Macedonian', t => {
	t.is(transliterate('Ќ љ Тс'), 'Kj lj Ts');
});

test('supports Polish', t => {
	t.is(transliterate('ą Ą Ł'), 'a A L');
});

test('supports Serbian', t => {
	t.is(transliterate('ђ џ Ђ Љ', {locale: 'sr'}), 'dj dz Dj Lj');
});

test('supports Slovak', t => {
	t.is(transliterate('ľ Ľ Ŕ'), 'l L R');
});

test('supports Swedish', t => {
	t.is(transliterate('ä ö Ä Ö', {locale: 'sv'}), 'a o A O');
});

test('supports Ukrainian', t => {
	t.is(transliterate('Є Ґ ї'), 'Ye G yi');
});

test('normalizes various dash types to hyphen', t => {
	// Testing various Unicode dash characters
	t.is(transliterate('en–dash'), 'en-dash'); // En dash (U+2013)
	t.is(transliterate('em—dash'), 'em-dash'); // Em dash (U+2014)
	t.is(transliterate('minus−sign'), 'minus-sign'); // Minus sign (U+2212)
	t.is(transliterate('figure‒dash'), 'figure-dash'); // Figure dash (U+2012)
	t.is(transliterate('horizontal―bar'), 'horizontal-bar'); // Horizontal bar (U+2015)
	t.is(transliterate('swung⁓dash'), 'swung-dash'); // Swung dash (U+2053)
	t.is(transliterate('two⸺em⸻dash'), 'two-em-dash'); // Two-em dash (U+2E3A) and Three-em dash (U+2E3B)

	// Combined test
	t.is(transliterate('test–with—various−dashes‒here'), 'test-with-various-dashes-here');
});

test('locale option for language-specific transliteration', t => {
	// Swedish
	t.is(transliterate('Sju sjösjuka sjömän', {locale: 'sv'}), 'Sju sjosjuka sjoman');
	t.is(transliterate('Räksmörgås', {locale: 'sv'}), 'Raksmorgos');
	t.is(transliterate('Räksmörgås', {locale: 'sv-SE'}), 'Raksmorgos'); // Full locale tag

	// German (default behavior)
	t.is(transliterate('Räksmörgås', {locale: 'de'}), 'Raeksmoergas');
	t.is(transliterate('Räksmörgås'), 'Raeksmoergas'); // Without locale, uses default

	// Danish
	t.is(transliterate('Rød grød med fløde', {locale: 'da'}), 'Roed groed med floede');
	t.is(transliterate('Blåbærsyltetøj', {locale: 'da'}), 'Blaabaersyltetoej');

	// Norwegian
	t.is(transliterate('Rød grød med fløde', {locale: 'no'}), 'Roed groed med floede');
	t.is(transliterate('Rød grød med fløde', {locale: 'nb'}), 'Roed groed med floede');

	// Unknown locale falls back to default
	t.is(transliterate('Räksmörgås', {locale: 'unknown'}), 'Raeksmoergas');

	// Custom replacements still work and take precedence
	t.is(transliterate('Räksmörgås', {
		locale: 'sv',
		customReplacements: [['ä', 'ae']]
	}), 'Raeksmorgos');
});

test('Turkish locale support - Issue #34', t => {
	// Turkish uses simplified transliterations compared to German
	t.is(transliterate('Ağır şöförlük', {locale: 'tr'}), 'Agir soforluk');
	t.is(transliterate('âöü', {locale: 'tr'}), 'aou');
	t.is(transliterate('ÂÖÜ', {locale: 'tr'}), 'AOU');

	// Compare with German defaults
	t.is(transliterate('öü', {locale: 'de'}), 'oeue');
	t.is(transliterate('öü'), 'oeue'); // Default behavior
});

test('Latin Ō ō characters - Issue #35', t => {
	t.is(transliterate('Ōdor'), 'Odor');
	t.is(transliterate('tōkyo'), 'tokyo');
	t.is(transliterate('Tōkyō'), 'Tokyo');
});

test('Fixed (c) and (d) replacements - Issue #36', t => {
	t.is(transliterate('ⓒ'), '(c)');
	t.is(transliterate('ⓓ'), '(d)');
});

test('Armenian ու transliteration fix - Issue #31', t => {
	// This was broken because ո was processed before ու
	t.is(transliterate('ու'), 'u');
	t.is(transliterate('ՈՒ'), 'U');
	t.is(transliterate('Ու'), 'U');

	// Full test case from the issue
	t.is(transliterate('ու ՈՒ Ու'), 'u U U');
});

test('Hungarian locale support', t => {
	t.is(transliterate('Magyar őslakók', {locale: 'hu'}), 'Magyar oslakok');
	t.is(transliterate('űű öö', {locale: 'hu'}), 'uu oo');
});

test('Serbian locale support', t => {
	t.is(transliterate('Ђоко џудиста', {locale: 'sr'}), 'Djoko dzudista');
	t.is(transliterate('љубав њихова', {locale: 'sr'}), 'ljubav njikhova');
});

test('Azerbaijani ə and Ə support - Issue #33', t => {
	t.is(transliterate('ədəbiyyat'), 'adabiyyat');
	t.is(transliterate('Ədəbiyyat'), 'Adabiyyat');
	t.is(transliterate('məşhur'), 'mashur');
});

test('Fixed replacement mistakes - Issue #32', t => {
	t.is(transliterate('𝓀'), 'k'); // Was 'h'
	t.is(transliterate('𝕆'), 'O'); // Was 'N'
});

test('French œ ligature support - Issue #7', t => {
	t.is(transliterate('œuf'), 'oeuf');
	t.is(transliterate('Œuvre'), 'OEuvre');
	t.is(transliterate('cœur'), 'coeur');
});

test('detects overlapping replacements not handled by locales', t => {
	// This test helps identify character conflicts that might need locale-specific handling
	const conflicts = [];
	const charMap = new Map();

	// Check global replacements for duplicates
	for (const [char, replacement] of replacements) {
		if (charMap.has(char)) {
			const existing = charMap.get(char);
			if (existing !== replacement) {
				conflicts.push({
					char,
					replacements: [existing, replacement]
				});
			}
		} else {
			charMap.set(char, replacement);
		}
	}

	// Log conflicts for awareness
	if (conflicts.length > 0) {
		console.log(`Found ${conflicts.length} character conflicts in replacements:`);
		for (const c of conflicts) {
			console.log(`  '${c.char}': [${c.replacements.join(', ')}]`);
		}
	}

	// The test passes if there are no conflicts
	t.is(conflicts.length, 0, `Found ${conflicts.length} character conflicts in replacements`);
});

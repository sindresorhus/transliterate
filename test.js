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

test.failing('supports Danish', t => {
	t.is(transliterate('æ ø å Æ Ø Å'), 'ae oe aa Ae Oe Aa');
});

test('supports Dhivehi', t => {
	t.is(transliterate('ޝ ޓ ބ'), 'sh t b');
});

test('supports Greek', t => {
	t.is(transliterate('θ Γ Ξ'), 'th G KS');
});

test.failing('supports Hungarian', t => {
	t.is(transliterate('ű ö Ö'), 'u o O');
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

test.failing('supports Serbian', t => {
	t.is(transliterate('ђ џ Ђ Љ'), 'dj dz Dj Lj');
});

test('supports Slovak', t => {
	t.is(transliterate('ľ Ľ Ŕ'), 'l L R');
});

test.failing('supports Swedish', t => {
	t.is(transliterate('ä ö Ä Ö'), 'a o A O');
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

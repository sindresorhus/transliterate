/* eslint-disable node-test/no-conditional-assertion -- The assertion in the "all replacements are ASCII" test is table-driven: it must run once per entry in `replacements`. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import replacements from './replacements.js';
import transliterate from './index.js';

// Use CPU-time samples so host scheduling pauses do not dominate short benchmarks.
const measureDuration = callback => {
	const samples = Array.from({length: 5}, () => {
		const start = process.cpuUsage();
		callback();
		const elapsed = process.cpuUsage(start);
		return (elapsed.user + elapsed.system) / 1000;
	});

	return samples.toSorted((a, b) => a - b)[2];
};

test('main', () => {
	assert.equal(transliterate('Foo ÿ'), 'Foo y');
	assert.equal(transliterate('Hællæ, hva skjera?'), 'Haellae, hva skjera?');
	assert.equal(transliterate('Déjà Vu!'), 'Deja Vu!');
});

test('customReplacements option', () => {
	assert.equal(transliterate('Zürich', {
		customReplacements: [
			['ä', 'ae'],
			['ö', 'oe'],
			['ü', 'ue'],
			['ß', 'ss'],
		],
	}), 'Zuerich');
});

test('customReplacements as Map', () => {
	const customReplacements = new Map([
		['&', ' and '],
		['@', ' at '],
	]);

	assert.equal(transliterate('file & bar', {customReplacements}), 'file  and  bar');
	assert.equal(transliterate('foo@bar', {customReplacements}), 'foo at bar');
});

test('customReplacements that produce non-ASCII are transliterated', () => {
	// `customReplacements` output should be fully transliterated
	assert.equal(transliterate('foo', {customReplacements: [['foo', 'öäü']]}), 'oeaeue');
	assert.equal(transliterate('test', {customReplacements: [['test', 'Ö']]}), 'Oe');
	assert.equal(transliterate('x', {customReplacements: [['x', 'Москва']]}), 'Moskva');

	// Non-transliterable characters pass through (e.g., emoji)
	assert.equal(transliterate('unicorn', {customReplacements: [['unicorn', '🦄']]}), '🦄');
});

test('all replacements are ASCII', () => {
	const MAX_ASCII_CHARACTER_CODE = 127;

	for (const [original, replacement] of replacements) {
		if (replacement === '') {
			continue;
		}

		assert.ok(replacement.codePointAt(0) <= MAX_ASCII_CHARACTER_CODE, `${original} → ${replacement} (code: ${replacement.codePointAt(0)})`);
	}
});

test('supports German umlauts', () => {
	assert.equal(transliterate('ä ö ü Ä Ö Ü ß'), 'ae oe ue Ae Oe Ue ss');
});

test('supports Vietnamese', () => {
	assert.equal(transliterate('ố Ừ Đ'), 'o U D');
});

test('supports Arabic', () => {
	assert.equal(transliterate('ث س و'), 'th s w');
	assert.equal(transliterate('إ'), 'a'); // Issue #9 - alif with hamza below should be 'a' not 'i'
});

test('supports Persian / Farsi', () => {
	assert.equal(transliterate('چ ی پ'), 'ch y p');
});

test('supports Urdu', () => {
	assert.equal(transliterate('ٹ ڈ ھ'), 't d h');
});

test('supports Pashto', () => {
	assert.equal(transliterate('ګ ړ څ'), 'g r c');
});

test('supports Russian', () => {
	assert.equal(transliterate('Ж п ю'), 'Zh p yu');
});

test('supports Romanian', () => {
	assert.equal(transliterate('ș Ț'), 's T');
});

test('supports Turkish', () => {
	assert.equal(transliterate('İ ı Ş ş Ç ç Ğ ğ'), 'I i S s C c G g');
});

test('supports Armenian', () => {
	assert.equal(transliterate('Ե ր և ա ն'), 'Ye r yev a n');
});

test('supports Georgian', () => {
	assert.equal(transliterate('თ პ ღ'), 't p gh');
});

test('supports Latin', () => {
	assert.equal(transliterate('Ä Ð Ø'), 'Ae D O');
});

test('supports Czech', () => {
	assert.equal(transliterate('č ž Ň'), 'c z N');
});

test('supports Danish', () => {
	assert.equal(transliterate('æ ø å Æ Ø Å', {locale: 'da'}), 'ae oe aa Ae Oe Aa');
});

test('supports Dhivehi', () => {
	assert.equal(transliterate('ޝ ޓ ބ'), 'sh t b');
});

test('supports Greek', () => {
	assert.equal(transliterate('θ Γ Ξ'), 'th G KS');
});

test('supports Hungarian', () => {
	assert.equal(transliterate('ű ö Ö', {locale: 'hu'}), 'u o O');
});

test('supports Latvian', () => {
	assert.equal(transliterate('ā Ņ Ģ'), 'a N G');
});

test('supports Lithuanian', () => {
	assert.equal(transliterate('ą į Š'), 'a i S');
});

test('supports Macedonian', () => {
	assert.equal(transliterate('Ќ љ Тс'), 'Kj lj Ts');
});

test('supports Polish', () => {
	assert.equal(transliterate('ą Ą Ł'), 'a A L');
});

test('supports Serbian', () => {
	assert.equal(transliterate('ђ џ Ђ Љ', {locale: 'sr'}), 'dj dz Dj Lj');
});

test('supports Slovak', () => {
	assert.equal(transliterate('ľ Ľ Ŕ'), 'l L R');
});

test('supports Swedish', () => {
	assert.equal(transliterate('ä ö Ä Ö', {locale: 'sv'}), 'a o A O');
});

test('supports Ukrainian', () => {
	assert.equal(transliterate('Є Ґ ї'), 'Ye G yi');
});

test('normalizes various dash types to hyphen', () => {
	// Testing various Unicode dash characters
	assert.equal(transliterate('en–dash'), 'en-dash'); // En dash (U+2013)
	assert.equal(transliterate('em—dash'), 'em-dash'); // Em dash (U+2014)
	assert.equal(transliterate('minus−sign'), 'minus-sign'); // Minus sign (U+2212)
	assert.equal(transliterate('figure‒dash'), 'figure-dash'); // Figure dash (U+2012)
	assert.equal(transliterate('horizontal―bar'), 'horizontal-bar'); // Horizontal bar (U+2015)
	assert.equal(transliterate('swung⁓dash'), 'swung-dash'); // Swung dash (U+2053)
	assert.equal(transliterate('two⸺em⸻dash'), 'two-em-dash'); // Two-em dash (U+2E3A) and Three-em dash (U+2E3B)

	// Combined test
	assert.equal(transliterate('test–with—various−dashes‒here'), 'test-with-various-dashes-here');
});

test('locale option for language-specific transliteration', () => {
	// Swedish
	assert.equal(transliterate('Sju sjösjuka sjömän', {locale: 'sv'}), 'Sju sjosjuka sjoman');
	assert.equal(transliterate('Räksmörgås', {locale: 'sv'}), 'Raksmorgas');
	assert.equal(transliterate('Räksmörgås', {locale: 'sv-SE'}), 'Raksmorgas'); // Full locale tag

	// German (default behavior)
	assert.equal(transliterate('Räksmörgås', {locale: 'de'}), 'Raeksmoergas');
	assert.equal(transliterate('Räksmörgås'), 'Raeksmoergas'); // Without locale, uses default

	// Danish
	assert.equal(transliterate('Rød grød med fløde', {locale: 'da'}), 'Roed groed med floede');
	assert.equal(transliterate('Blåbærsyltetøj', {locale: 'da'}), 'Blaabaersyltetoej');

	// Norwegian
	assert.equal(transliterate('Rød grød med fløde', {locale: 'no'}), 'Roed groed med floede');
	assert.equal(transliterate('Rød grød med fløde', {locale: 'nb'}), 'Roed groed med floede');

	// Unknown locale falls back to default
	assert.equal(transliterate('Räksmörgås', {locale: 'unknown'}), 'Raeksmoergas');

	// Custom replacements still work and take precedence
	assert.equal(transliterate('Räksmörgås', {
		locale: 'sv',
		customReplacements: [['ä', 'ae']],
	}), 'Raeksmorgas');
});

test('Turkish locale support - Issue #34', () => {
	// Turkish uses simplified transliterations compared to German
	assert.equal(transliterate('Ağır şöförlük', {locale: 'tr'}), 'Agir soforluk');
	assert.equal(transliterate('âöü', {locale: 'tr'}), 'aou');
	assert.equal(transliterate('ÂÖÜ', {locale: 'tr'}), 'AOU');

	// Compare with German defaults
	assert.equal(transliterate('öü', {locale: 'de'}), 'oeue');
	assert.equal(transliterate('öü'), 'oeue'); // Default behavior
});

test('Latin Ō ō characters - Issue #35', () => {
	assert.equal(transliterate('Ōdor'), 'Odor');
	assert.equal(transliterate('tōkyo'), 'tokyo');
	assert.equal(transliterate('Tōkyō'), 'Tokyo');
});

test('Fixed (c) and (d) replacements - Issue #36', () => {
	assert.equal(transliterate('ⓒ'), '(c)');
	assert.equal(transliterate('ⓓ'), '(d)');
});

test('Armenian ու transliteration fix - Issue #31', () => {
	// This was broken because ո was processed before ու
	assert.equal(transliterate('ու'), 'u');
	assert.equal(transliterate('ՈՒ'), 'U');
	assert.equal(transliterate('Ու'), 'U');

	// Full test case from the issue
	assert.equal(transliterate('ու ՈՒ Ու'), 'u U U');
});

test('Hungarian locale support', () => {
	assert.equal(transliterate('Magyar őslakók', {locale: 'hu'}), 'Magyar oslakok');
	assert.equal(transliterate('űű öö', {locale: 'hu'}), 'uu oo');
});

test('Serbian locale support', () => {
	assert.equal(transliterate('Ђоко џудиста', {locale: 'sr'}), 'Djoko dzudista');
	assert.equal(transliterate('љубав њихова', {locale: 'sr'}), 'ljubav njikhova');
});

test('Azerbaijani ə and Ə support - Issue #33', () => {
	assert.equal(transliterate('ədəbiyyat'), 'adabiyyat');
	assert.equal(transliterate('Ədəbiyyat'), 'Adabiyyat');
	assert.equal(transliterate('məşhur'), 'mashur');
});

test('Fixed replacement mistakes - Issue #32', () => {
	assert.equal(transliterate('𝓀'), 'k'); // Was 'h'
	assert.equal(transliterate('𝕆'), 'O'); // Was 'N'
});

test('French œ ligature support - Issue #7', () => {
	assert.equal(transliterate('œuf'), 'oeuf');
	assert.equal(transliterate('Œuvre'), 'OEuvre');
	assert.equal(transliterate('cœur'), 'coeur');
});

test('detects overlapping replacements not handled by locales', () => {
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
					replacements: [existing, replacement],
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
	assert.equal(conflicts.length, 0, `Found ${conflicts.length} character conflicts in replacements`);
});

test('performance scales linearly (no ReDoS)', () => {
	// Test that processing time scales linearly with input size
	// This catches potential ReDoS issues in the regex pattern

	const measure = size => {
		const string = 'äöüß'.repeat(size / 4);
		return measureDuration(() => transliterate(string));
	};

	// Warmup
	measure(1000);

	const time10k = measure(10_000);
	const time100k = measure(100_000);

	// 100k should take roughly 10x as long as 10k (linear scaling)
	// We use 20x as threshold to account for variance
	const ratio = time100k / time10k;
	assert.ok(ratio < 20, `Expected linear scaling but got ${ratio.toFixed(1)}x for 10x input`);
});

test('handles large input efficiently', () => {
	// Regression test for issue #40 - performance should not degrade with long strings
	const longString = '<div class="container">'.repeat(1000);
	const result = transliterate(longString);
	const elapsed = measureDuration(() => transliterate(longString));

	assert.equal(result, longString); // ASCII passthrough
	assert.ok(elapsed < 100, `Expected < 100ms but took ${elapsed.toFixed(1)}ms`);
});

test('options do not cause performance regression', () => {
	// Regression test for issue #41 - locale and customReplacements should not be significantly slower
	const iterations = 1000;
	const testString = 'Ünïcödé strïng wïth lötś öf chäräctérs';

	const measure = fn => {
		// Warmup
		for (let index = 0; index < 100; index++) {
			fn();
		}

		return measureDuration(() => {
			for (let index = 0; index < iterations; index++) {
				fn();
			}
		});
	};

	const baseTime = measure(() => transliterate(testString));
	const localeTime = measure(() => transliterate(testString, {locale: 'de'}));
	const customTime = measure(() => transliterate(testString, {customReplacements: [['ö', 'oe']]}));
	const combinedTime = measure(() => transliterate(testString, {locale: 'de', customReplacements: [['ö', 'oe']]}));

	// Options should not be more than 5x slower than base case
	assert.ok(localeTime / baseTime < 5, `locale option is ${(localeTime / baseTime).toFixed(1)}x slower than default`);
	assert.ok(customTime / baseTime < 5, `customReplacements option is ${(customTime / baseTime).toFixed(1)}x slower than default`);
	assert.ok(combinedTime / baseTime < 5, `locale + customReplacements is ${(combinedTime / baseTime).toFixed(1)}x slower than default`);
});

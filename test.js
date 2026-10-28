/* eslint-disable node-test/no-conditional-assertion -- Assertions iterate over replacement tables and supported locales. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import process from 'node:process';
import replacements from './replacements.js';
import localeReplacements from './locale-replacements.js';
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
	assert.equal(transliterate('Ђорђе Ћирић'), 'Djordje Ciric');
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
	assert.equal(transliterate('hyphen⁃bullet'), 'hyphen-bullet'); // Hyphen bullet (U+2043)

	// Combined test
	assert.equal(transliterate('test–with—various−dashes‒here'), 'test-with-various-dashes-here');

	// Custom replacements see the original dashes, and their output is normalized too
	assert.equal(transliterate('1–2', {customReplacements: [['–', ' to ']]}), '1 to 2');
	assert.equal(transliterate('x', {customReplacements: [['x', 'a—b']]}), 'a-b');
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
	assert.equal(transliterate('Rød grød med fløde', {locale: 'nn'}), 'Roed groed med floede'); // Nynorsk uses the same rules

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

test('Bulgarian locale support - Issue #43', () => {
	assert.equal(transliterate('Щастие Хляб Ъгъл Кольо', {locale: 'bg'}), 'Shtastie Hlyab Agal Kolyo');
	assert.equal(transliterate('Пещера Хасково', {locale: 'bg-BG'}), 'Peshtera Haskovo');
	assert.equal(transliterate('Дадох ѝ книгата', {locale: 'bg'}), 'Dadoh i knigata');

	// Word-final ия is ia
	assert.equal(transliterate('София, Мария-Антоанета', {locale: 'bg'}), 'Sofia, Maria-Antoaneta');
	assert.equal(transliterate('Ия, Ияна, ИЯ, ия, Илиян', {locale: 'bg'}), 'Ia, Iyana, IA, ia, Iliyan');

	// The country name is an exception
	assert.equal(transliterate('Република България', {locale: 'bg'}), 'Republika Bulgaria');
	assert.equal(transliterate('БЪЛГАРИЯ българия', {locale: 'bg'}), 'BULGARIA bulgaria');
	assert.equal(transliterate('Български ВЕЛИКОБЪЛГАРИЯ', {locale: 'bg'}), 'Balgarski VELIKOBALGARIA');
	assert.equal(transliterate('София'), 'Sofiya');
});

test('Bulgarian alphabet follows the Streamlined System', () => {
	const alphabet = 'абвгдежзийклмнопрстуфхцчшщъьюя';
	assert.equal(transliterate(alphabet, {locale: 'bg'}), 'abvgdezhziyklmnoprstufhtschshshtayyuya');
	assert.equal(transliterate(alphabet.toUpperCase(), {locale: 'bg'}), 'ABVGDEZhZIYKLMNOPRSTUFHTsChShShtAYYuYa');
});

test('Bulgarian hard sign is not consumed by the Russian digraph', () => {
	assert.equal(transliterate('съединение Съединение СЪЕДИНЕНИЕ', {locale: 'bg'}), 'saedinenie Saedinenie SAEDINENIE');
	assert.equal(transliterate('ъе Ъе ъЕ ЪЕ', {locale: 'bg-BG'}), 'ae Ae aE AE');
	assert.equal(transliterate('подъезд'), 'podyezd');
	assert.equal(transliterate('съезд'), 'syezd');
});

test('Bulgarian context respects word boundaries and custom replacements', () => {
	assert.equal(transliterate('България-България (България)! Българията прабългария', {locale: 'bg'}), 'Bulgaria-Bulgaria (Bulgaria)! Balgariyata prabalgaria');
	assert.equal(transliterate('Софиянски Ияна', {locale: 'bg'}), 'Sofiyanski Iyana');

	// A combining mark belongs to the letter before it
	assert.equal(transliterate('Велико\u{301}българия', {locale: 'bg'}), 'Velikobalgaria');
	assert.equal(transliterate('Мария\u{301} България\u{301}', {locale: 'bg'}), 'Maria Bulgaria');
	assert.equal(transliterate('Ия\u{301}на България\u{301}ната', {locale: 'bg'}), 'Iyana Balgariyanata');
	assert.equal(transliterate('България', {locale: 'bg', customReplacements: [['България', '🦄']]}), '🦄');
	assert.equal(transliterate('x', {locale: 'bg', customReplacements: [['x', 'България']]}), 'Bulgaria');
});

test('Serbian locale support', () => {
	assert.equal(transliterate('Ђоко џудиста', {locale: 'sr'}), 'Djoko dzudista');
	assert.equal(transliterate('љубав њихова', {locale: 'sr'}), 'ljubav njihova');
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

test('Church Slavonic Cyrillic letters are transliterated', () => {
	assert.equal(transliterate('Ѣ Ѳ Ѵ Ѡ Ѻ'), 'E F I O O');
	assert.equal(transliterate('Ѯ Ѱ Ѹ Ѥ Ҁ Ѿ'), 'Ks Ps U Ye Q Ot');
	assert.equal(transliterate('мѣра'), 'mera');
});

test('Latin ligatures and digraphs are expanded', () => {
	assert.equal(transliterate('ﬀﬁﬂﬃﬄﬅﬆ'), 'fffiflffifflstst');
	assert.equal(transliterate('ſ'), 's');

	// Croatian, Serbian, and Hungarian digraphs
	assert.equal(transliterate('Ǆ ǅ ǆ Ǉ ǈ ǉ Ǌ ǋ ǌ Ǳ ǲ ǳ'), 'DZ Dz dz LJ Lj lj NJ Nj nj DZ Dz dz');

	assert.equal(transliterate('ﬁ', {locale: 'tr'}), 'fi');
	assert.equal(transliterate('ﬁ', {customReplacements: [['ﬁ', 'FI']]}), 'FI');
});

test('full-width ASCII variants are transliterated', () => {
	// U+FF01–U+FF5E are the full-width forms of printable ASCII (U+0021–U+007E)
	const ascii = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
	const fullWidth = Array.from({length: 0x5E}, (_, index) => String.fromCodePoint(0xFF_01 + index)).join('');

	assert.equal(transliterate(fullWidth), ascii);
	assert.equal(transliterate('Ｔｅｓｔ Ｎａｍｅ'), 'Test Name');
	assert.equal(transliterate('１２３！？'), '123!?');
	assert.equal(transliterate('Ａｂ１', {locale: 'sv'}), 'Ab1');
	assert.equal(transliterate('Ａｂ１', {customReplacements: [['Ａｂ', 'X']]}), 'X1');
});

test('typographic quotes and primes become ASCII quotes', () => {
	assert.equal(transliterate('‘x’ ‚x‛ ‹x› ′x‵'), '\'x\' \'x\' \'x\' \'x\'');
	assert.equal(transliterate('“x” „x‟ «x» ″x‶'), '"x" "x" "x" "x"');
	assert.equal(transliterate('‴x‷'), '\'\'\'x\'\'\'');
	assert.equal(transliterate('don’t'), 'don\'t');
	assert.equal(transliterate('«déjà»', {locale: 'de'}), '"deja"');
});

test('emoji presentation selectors are optional', () => {
	// The same emoji can be written with or without the emoji presentation selector (U+FE0F)
	assert.equal(transliterate('#⃣ *⃣ 0⃣ 9⃣'), '# * 0 9');
	assert.equal(transliterate('1⃣2⃣3⃣'), '123');
	assert.equal(transliterate('🅰 🅱 🅾'), 'A B O');
	assert.equal(transliterate('🅰️ 🅱️ 🅾️ 1️⃣ #️⃣'), 'A B O 1 #');
});

test('compatibility forms of ASCII text are transliterated', () => {
	// Squared units, which are common in Japanese and Korean text
	assert.equal(transliterate('1㎏ 2㎒ 3㎡ 4㍱'), '1kg 2MHz 3m2 4hPa');

	// Vertical and small forms of punctuation
	assert.equal(transliterate('︵a︶ ﹙b﹚'), '(a) (b)');
	assert.equal(transliterate('﹐﹒﹔﹖﹗'), ',.;?!');
	assert.equal(transliterate('﹨'), '\\');

	// Segmented and outlined letters
	assert.equal(transliterate('🯱🯲🯳 𜳖𜳗𜳰'), '123 AB0');
	assert.equal(transliterate('𜳯𜳰𜳹'), 'Z09');

	// Every character in these blocks that Unicode defines as a compatibility form of ASCII text reduces to that text
	const ranges = [
		[0x32_CC, 0x32_CF],
		[0x33_00, 0x33_FF],
		[0xFE_10, 0xFE_1F],
		[0xFE_30, 0xFE_68],
		[0xFE_6A, 0xFE_6F],
		[0x1_FB_F0, 0x1_FB_F9],
		[0x1_CC_00, 0x1_CE_BF],
	];
	for (const [start, end] of ranges) {
		for (let codePoint = start; codePoint <= end; codePoint++) {
			const character = String.fromCodePoint(codePoint);
			const decomposed = character.normalize('NFKC');
			if (/^\p{ASCII}+$/v.test(decomposed)) {
				assert.equal(transliterate(character), decomposed, codePoint.toString(16));
			}
		}
	}
});

test('letterlike symbols match the mathematical letters they stand for', () => {
	// The mathematical alphanumeric block is covered, so the same letters in the letterlike block must be too
	assert.equal(transliterate('ℂ ℊ ℎ ℓ ℕ ℙ ℚ ℝ ℤ'), 'C g h l N P Q R Z');
	assert.equal(transliterate('ℬ ℭ ℯ ℰ ℱ ℳ ℴ ℨ'), 'B C e E F M o Z');
	assert.equal(transliterate('ℋ ℌ ℍ ℐ ℑ ℒ ℛ ℜ'), 'H H H I I L R R');
	assert.equal(transliterate('ⅅ ⅆ ⅇ ⅈ ⅉ ℹ ⱼ ⱽ'), 'D d e i j i j V');

	// Symbols that stand for a word decompose to that word
	assert.equal(transliterate('℠ ℡ ℻'), '(sm) TEL FAX');
	assert.equal(transliterate('℀ ℁ ℅ ℆'), 'a/c a/s c/o c/u');
});

test('common typographic symbols are transliterated', () => {
	assert.equal(transliterate('Wait… and then⋯'), 'Wait... and then...');
	assert.equal(transliterate('1⁄2'), '1/2');
	assert.equal(transliterate('№5'), 'No5');
	assert.equal(transliterate('™ © ®'), '(tm) (c) (r)');
	assert.equal(transliterate('¿Qué? ¡Sí!'), '?Que? !Si!');

	// Stacked punctuation and mathematical relations
	assert.equal(transliterate('Wow!! Really?? What?!'), 'Wow!! Really?? What?!');
	assert.equal(transliterate('Wow‼ Really⁇ What⁈ No⁉'), 'Wow!! Really?? What?! No!?');
	assert.equal(transliterate('a․b'), 'a.b');
	assert.equal(transliterate('x⩴y⩵z⩶'), 'x::=y==z===');
});

test('supplemental punctuation is transliterated', () => {
	// Editorial marks from the Supplemental Punctuation block
	assert.equal(transliterate('⸮'), '?');
	assert.equal(transliterate('⸘'), '?!');
	assert.equal(transliterate('⸢a⸣ ⸤b⸥'), '[a] [b]');
	assert.equal(transliterate('⸦a⸧ ⸨b⸩'), '(a) ((b))');
	assert.equal(transliterate('⸜a⸝ ⹙b⹚'), '(a) (b)');
	assert.equal(transliterate('⸲ ⸴ ⹁ ⹂'), ', , , "');
	assert.equal(transliterate('⸵ ⸱ ⸼'), '; . .');
	assert.equal(transliterate('⸪ ⸫'), ': :');
	assert.equal(transliterate('⹠⹡ ⹢a⹣'), '!! (a)');
});

test('Latin letters with a stroke, hook, or bar are transliterated', () => {
	// The base letter is part of the character name, so the value is unambiguous
	assert.equal(transliterate('ƀ Ƃ ƃ Ƈ ƈ Ƌ ƌ'), 'b B b C c D d');
	assert.equal(transliterate('Ƒ ƒ Ɠ Ɨ ƚ Ɲ ƞ Ɵ'), 'F f G I l N n O');
	assert.equal(transliterate('Ƣ ƣ Ƥ ƥ ƫ Ƭ ƭ Ʈ Ʊ'), 'Gh gh P p t T t T U');
	assert.equal(transliterate('Ƶ ƶ Ƞ ȡ Ȣ ȣ Ȥ ȥ'), 'Z z N d Ou ou Z z');
	assert.equal(transliterate('Ɩ ȴ ȵ ȶ ȷ Ⱥ Ȼ ȼ'), 'I l n t j A C c');
	assert.equal(transliterate('Ƚ Ⱦ ȿ ɀ Ǿ ǿ'), 'L T s z O o');
	assert.equal(transliterate('Ɂ ɂ Ƀ Ʉ Ɇ ɇ'), '\' \' B U E e');
	assert.equal(transliterate('Ɉ ɉ ɋ Ɍ ɍ Ɏ ɏ'), 'J j q R r Y y');
});

test('Latin Extended-C letters are transliterated', () => {
	assert.equal(transliterate('Ⱡ ⱡ Ɫ Ᵽ Ɽ'), 'L l L P R');
	assert.equal(transliterate('ⱥ ⱦ Ⱨ ⱨ Ⱪ ⱪ'), 'a t H h K k');
	assert.equal(transliterate('Ⱬ ⱬ Ɑ Ɱ Ɐ Ɒ'), 'Z z A M A A');
	assert.equal(transliterate('ⱱ Ⱳ ⱳ ⱴ Ⱶ ⱶ'), 'v W w v H h');
	assert.equal(transliterate('ⱸ ⱺ Ȿ Ɀ'), 'e o S Z');
});

test('Latin Extended-D letters with a distinguishing mark are transliterated', () => {
	assert.equal(transliterate('Ꜧ ꜧ Ꜳ ꜳ Ꜵ ꜵ Ꜷ ꜷ'), 'H h Aa aa Ao ao Au au');
	assert.equal(transliterate('Ꝁ ꝁ Ꝃ ꝃ Ꝅ ꝅ Ꝉ ꝉ'), 'K k K k K k L l');
	assert.equal(transliterate('Ꝋ ꝋ Ꝏ ꝏ Ꝑ ꝑ Ꝓ ꝓ'), 'O o Oo oo P p P p');
	assert.equal(transliterate('Ꝕ ꝕ Ꝗ ꝗ Ꝙ ꝙ Ꝟ ꝟ'), 'P p Q q Q q V v');
	assert.equal(transliterate('Ꝡ ꝡ Ꝩ ꝩ Ꝫ ꝫ Ꝭ ꝭ Ꝯ ꝯ'), 'Vy vy V v Et et Is is Con con');
	assert.equal(transliterate('Ꞑ ꞑ Ꞓ ꞓ ꞔ ꞕ Ꞗ ꞗ'), 'N n C c c h B b');
	assert.equal(transliterate('Ꞙ ꞙ Ꞡ ꞡ Ꞣ ꞣ Ꞥ ꞥ'), 'F f G g K k N n');
	assert.equal(transliterate('Ꞧ ꞧ Ꞩ ꞩ Ɦ Ɬ Ʝ'), 'R r S s H L J');
	assert.equal(transliterate('Ꞹ ꞹ Ꞔ Ʂ Ᶎ'), 'U u C S Z');
	assert.equal(transliterate('Ꟈ ꟈ Ꟊ ꟊ Ꟍ ꟍ ꞎ'), 'D d S s S s l');
});

test('Latin Extended-D letters are transliterated', () => {
	// Modifier letter capitals, which Unicode classifies as diacritics
	assert.equal(transliterate('꟱ ꟲ ꟳ ꟴ'), 'S C F Q');
	assert.equal(transliterate('Ꟶ ꟶ ꟷ'), 'H h I');
	assert.equal(transliterate('ꟸ ꟹ ꟺ'), 'H oe m');
});

test('Latin letters of African orthographies are transliterated', () => {
	// Hausa and Fula
	assert.equal(transliterate('Ɓ ɓ Ɗ ɗ Ɖ ɖ Ƙ ƙ Ƴ ƴ'), 'B b D d D d K k Y y');
	assert.equal(transliterate('ƙarfin ɗan Adam'), 'karfin dan Adam');

	// Ewe and linguistic writing
	assert.equal(transliterate('Ɣ ɣ Ʋ ʋ Ʃ ʃ Ʒ ʒ'), 'Gh gh V v Sh sh Zh zh');
});

test('Latin letters outside the basic set are transliterated', () => {
	assert.equal(transliterate('1ª 2º'), '1a 2o');

	// The micro sign is a compatibility variant of mu, but it means `micro`
	assert.equal(transliterate('5µm'), '5um');

	assert.equal(transliterate('ĸ Ŀ ŀ ŉ'), 'k L l \'n');
	assert.equal(transliterate('Ŋ ŋ Ŧ ŧ'), 'N n T t');
	assert.equal(transliterate('Ɛ ɛ Ɔ ɔ ǝ'), 'E e O o e');
	assert.equal(transliterate('Ǥ ǥ Ȝ ȝ'), 'G g Y y');
	assert.equal(transliterate('Ƿ ƿ Ǝ ǝ'), 'W w E e');
	assert.equal(transliterate('Ƕ ƕ'), 'Hv hv');
});

test('superscript and subscript characters are transliterated', () => {
	assert.equal(transliterate('x² y³ z¹'), 'x2 y3 z1');
	assert.equal(transliterate('H₂O CO₂'), 'H2O CO2');
	assert.equal(transliterate('⁰¹²³⁴⁵⁶⁷⁸⁹'), '0123456789');
	assert.equal(transliterate('₀₁₂₃₄₅₆₇₈₉'), '0123456789');
	assert.equal(transliterate('⁺⁻⁼⁽⁾ ₊₋₌₍₎'), '+-=() +-=()');
});

test('superscript and subscript letters are transliterated', () => {
	// Superscript digits already work, so their letter counterparts must too. Unicode classifies these as diacritics, so without a replacement they were dropped from the output.
	assert.equal(transliterate('xⁿ xⁱ'), 'xn xi');
	assert.equal(transliterate('2ⁿᵈ 3ʳᵈ'), '2nd 3rd');
	assert.equal(transliterate('xₐ xₑ xₒ xₓ xₕ xₖ xₗ xₘ xₙ xₚ xₛ xₜ'), 'xa xe xo xx xh xk xl xm xn xp xs xt');
	assert.equal(transliterate('xᵃ xᵇ xᵈ xᵉ xᵍ xᵏ xᵐ xᵒ xᵖ xᵗ xᵘ xᵛ'), 'xa xb xd xe xg xk xm xo xp xt xu xv');
	assert.equal(transliterate('ᴬ ᴮ ᴰ ᴱ ᴳ'), 'A B D E G');
	assert.equal(transliterate('ʰ ʷ ʲ ˡ ˢ ˣ'), 'h w j l s x');

	// A modifier letter agrees with the base letter it decomposes to
	assert.equal(transliterate('ᵊ ₔ ᵑ'), 'a a n');

	// The later subscript letters and the phonetic modifier letters
	assert.equal(transliterate('₝ ₞ ₟'), 'w y z');
	assert.equal(transliterate('ᶜ ᶠ ᶻ 𐞥'), 'c f z q');
});

test('currency and fraction symbols are transliterated', () => {
	assert.equal(transliterate('£5 ₤5 ￡5'), 'L5 L5 L5');
	assert.equal(transliterate('½ ⅓ ⅔ ¼ ¾ ⅕ ⅖ ⅗ ⅘'), '1/2 1/3 2/3 1/4 3/4 1/5 2/5 3/5 4/5');
	assert.equal(transliterate('⅙ ⅚ ⅐ ⅛ ⅜ ⅝ ⅞ ⅑ ⅒'), '1/6 5/6 1/7 1/8 3/8 5/8 7/8 1/9 1/10');
	assert.equal(transliterate('⅟₂ ↉ ↄ'), '1/2 0/3 c');
});

test('enclosed alphanumerics are transliterated', () => {
	// Dingbat, circled sans-serif, and negative circled digits one to ten
	assert.equal(transliterate('❶❷❸❹❺❻❼❽❾❿'), '12345678910');
	assert.equal(transliterate('➀➁➂➃➄➅➆➇➈➉'), '12345678910');
	assert.equal(transliterate('➊➋➌➍➎➏➐➑➒➓'), '12345678910');

	// Circled numbers above twenty
	assert.equal(transliterate('㉑ ㉟ ㊱ ㊿'), '21 35 36 50');

	// Encapsulated capitals, in the styles of the already supported circled letters
	assert.equal(transliterate('🄐🄑🄒'), '(A)(B)(C)');
	assert.equal(transliterate('🄰🄱🄲'), 'ABC');
	assert.equal(transliterate('🅐🅑🅒'), 'ABC');

	// Digits with a trailing separator
	assert.equal(transliterate('🄀🄁 🄊'), '0.0, 9,');
	assert.equal(transliterate('🄋🄌'), '00');

	// Encapsulated symbols that stand for several letters
	assert.equal(transliterate('🄫 🄬 🄭 🄮'), 'C R CD WZ');
	assert.equal(transliterate('🅊 🅋 🅌 🅍 🅎 🅏'), 'HV MV SD SS PPV WC');
	assert.equal(transliterate('🅪 🅫 🅬 🆐'), 'MC MD MR DJ');
	assert.equal(transliterate('㉐ ﬩'), 'PTE +');
});

test('Roman numerals are transliterated', () => {
	assert.equal(transliterate('Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ Ⅵ Ⅶ Ⅷ Ⅸ Ⅹ Ⅺ Ⅻ Ⅼ Ⅽ Ⅾ Ⅿ'), 'I II III IV V VI VII VIII IX X XI XII L C D M');
	assert.equal(transliterate('ⅰ ⅱ ⅲ ⅳ ⅴ ⅵ ⅶ ⅷ ⅸ ⅹ ⅺ ⅻ ⅼ ⅽ ⅾ ⅿ'), 'i ii iii iv v vi vii viii ix x xi xii l c d m');
	assert.equal(transliterate('Chapter Ⅳ'), 'Chapter IV');
});

test('longer built-in keys take precedence over neighboring single characters', () => {
	// Overlapping replacement keys must preserve multi-character mappings.
	assert.equal(transliterate('ъе Ъе ъЕ ЪЕ ый Ый ЫЙ ыЙ'), 'ye Ye yE YE iy Iy IY iY');

	// Check Armenian digraphs alongside their individual letters.
	assert.equal(transliterate('ուո ՈՒՈ ՈւՈ'), 'uvo UVo UVo');

	// Check emoji sequences that contain variation selectors.
	assert.equal(transliterate('#️⃣*️⃣0️⃣🅰️🅱️🅾️'), '#*0ABO');

	// Include neighboring characters to expose partial matches.
	assert.equal(transliterate('воуուа'), 'vouua');

	// The locale must preserve its own overlapping replacement rules.
	assert.equal(transliterate('съединение', {locale: 'bg'}), 'saedinenie');
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

test('mathematical script capital G preserves case', () => {
	assert.equal(transliterate('𝒜𝒢𝒩𝒟 𝓰𝓖 𝒢'), 'AGND gG G');
	assert.equal(transliterate('𝒢', {locale: 'sv'}), 'G');
	assert.equal(transliterate('𝒢', {customReplacements: [['𝒢', 'custom']]}), 'custom');
});

test('mathematical dotless i is not an l', () => {
	assert.equal(transliterate('𝚤𝚥 𝚒𝚓 ıi'), 'ij ij ii');
	assert.equal(transliterate('𝚤 + 𝚤'), 'i + i');
	assert.equal(transliterate('𝚤', {locale: 'tr'}), 'i');
});

test('mathematical Greek alphabets are complete and consistent across styles', () => {
	// Bold, italic, bold italic, sans-serif bold, and sans-serif bold italic are consecutive blocks of 58 characters.
	const alphabet = start => Array.from({length: 58}, (_, index) => String.fromCodePoint(start + index)).join('');
	for (let style = 0; style < 5; style++) {
		const characters = alphabet(0x1_D6_A8 + (style * 58));
		assert.equal(transliterate(characters), 'ABGDEZITHIKLMNKSOPRTHSTYFXPSODavgdezithiklmnksoprsstyfxpsodethkfrp', characters);
	}
});

test('all configured replacement strings are entirely ASCII and are reachable', () => {
	for (const [original, replacement] of replacements) {
		assert.match(replacement, /^\p{ASCII}*$/v, original);
		assert.equal(transliterate(original), replacement, original);
	}
});

test('rejects non-string input without coercion', () => {
	for (const value of [undefined, null, false, 42, 42n, Symbol('text'), {}, [], new Object('text')]) {
		assert.throws(() => transliterate(value), TypeError);
	}
});

test('options and their properties are optional', () => {
	for (const options of [undefined, null, {}, {customReplacements: undefined, locale: undefined}]) {
		assert.equal(transliterate('ä', options), 'ae');
	}
});

test('locale tags are case insensitive and use the language prefix', () => {
	assert.equal(transliterate('äöå', {locale: 'SV-se-u-co-standard'}), 'aoa');
	assert.equal(transliterate('æøå', {locale: 'NO-no'}), 'aeoeaa');
	assert.equal(transliterate('æøå', {locale: 'NB-no'}), 'aeoeaa');
	assert.equal(transliterate('æøå', {locale: 'NN-no'}), 'aeoeaa');
	assert.equal(transliterate('öü', {locale: 'TR-tr'}), 'ou');
	for (const locale of ['', 'unknown', '__proto__', 'constructor', 'toString']) {
		assert.equal(transliterate('äöü', {locale}), 'aeoeue');
	}
});

test('custom replacement keys are literal strings', () => {
	const keys = ['$', '(', ')', '*', '+', '.', '?', '[', '\\', ']', '^', '{', '|', '}', '/', '-'];
	for (const key of keys) {
		assert.equal(transliterate(`a${key}b${key}`, {customReplacements: [[key, 'x']]}), 'axbx', key);
	}

	assert.equal(transliterate('🦄🦄', {customReplacements: [['🦄', 'unicorn']]}), 'unicornunicorn');
});

test('custom replacements match longer keys first without mutating caller data', () => {
	const customReplacements = Object.freeze([
		Object.freeze(['a', 'x']),
		Object.freeze(['ab', 'y']),
		Object.freeze(['abc', 'z']),
	]);
	assert.equal(transliterate('abc ab a', {customReplacements}), 'z y x');
	assert.deepEqual(customReplacements, [['a', 'x'], ['ab', 'y'], ['abc', 'z']]);

	const replacementMap = new Map(customReplacements);
	assert.equal(transliterate('abc ab a', {customReplacements: replacementMap}), 'z y x');
	assert.deepEqual([...replacementMap], customReplacements);
});

test('repeated calls do not leak locale or custom replacement state', () => {
	for (let index = 0; index < 3; index++) {
		assert.equal(transliterate('ö', {locale: 'sv'}), 'o');
		assert.equal(transliterate('ö', {customReplacements: [['ö', 'custom']]}), 'custom');
		assert.equal(transliterate('ö'), 'oe');
		assert.equal(transliterate('ö', {locale: 'de'}), 'oe');
	}
});

test('unsupported scripts and emoji are preserved', () => {
	assert.equal(transliterate('中文 🦄 🐈 café'), '中文 🦄 🐈 cafe');

	// Diacritic stripping must not break joiners, skin tones, variation selectors, or flags
	assert.equal(transliterate('👨‍👩‍👧 👍🏽 ❤️ 🇳🇴 🏳️‍🌈'), '👨‍👩‍👧 👍🏽 ❤️ 🇳🇴 🏳️‍🌈');
});

test('lone surrogates are preserved', () => {
	assert.equal(transliterate('\u{D800}ä\u{DFFF}'), '\u{D800}ae\u{DFFF}');
	assert.equal(transliterate('\u{DC00}България', {locale: 'bg'}), '\u{DC00}Bulgaria');
});

test('circled Latin alphabets have no missing M', () => {
	const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const lowercase = uppercase.toLowerCase();
	const circledUppercase = Array.from({length: 26}, (_, index) => String.fromCodePoint(0x24_B6 + index)).join('');
	const circledLowercase = Array.from({length: 26}, (_, index) => String.fromCodePoint(0x24_D0 + index)).join('');
	assert.equal(transliterate(circledUppercase), [...uppercase].map(letter => `(${letter})`).join(''));
	assert.equal(transliterate(circledLowercase), [...lowercase].map(letter => `(${letter})`).join(''));
	assert.equal(transliterate('ⓁⓂⓃ'), '(L)(M)(N)');
});

test('Arabic short vowels do not require direction marks', () => {
	assert.equal(transliterate('بَ بِ بُ'), 'ba bi bu');
	assert.equal(transliterate('كَتَبَ كِتَاب'), 'kataba kitaab');
	assert.equal(transliterate('َ ِ ُ'), 'a i u');
	assert.equal(transliterate('بَ\u{200E} بِ\u{200E}'), 'ba\u{200E} bi\u{200E}');
});

test('Pashto tteh is a t rather than a p', () => {
	assert.equal(transliterate('ټ بټ ټاټ'), 't bt tat');
	assert.equal(transliterate('ټ پ ت ٹ'), 't p t t');
	assert.equal(transliterate('ټ', {customReplacements: [['ټ', 'T']]}), 'T');
});

test('Arabic presentation dhal matches its base letter', () => {
	assert.equal(transliterate('ﺫ ذ'), 'dh dh');
	assert.equal(transliterate('ﺫﺭﺯ'), 'dhrz');
	assert.equal(transliterate('ﺫ', {locale: 'tr'}), 'dh');
});

test('Vietnamese dong sign retains its d identity', () => {
	assert.equal(transliterate('100₫ ₫100 đ'), '100d d100 d');
	assert.equal(transliterate('₫₫'), 'dd');
	assert.equal(transliterate('₫', {customReplacements: [['₫', 'VND']]}), 'VND');
});

test('Macedonian alphabet does not leave Cyrillic letters behind', () => {
	assert.equal(transliterate('Ѓорѓи Ѕвезда Македонија Џем'), 'Gjorgji Dzvezda Makedonija Dzem');
	assert.equal(transliterate('Ѓѓ Ѕѕ Јј Џџ'), 'Gjgj Dzdz Jj Dzdz');
	assert.equal(transliterate('АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ'), 'ABVGDGjEZhZDzIJKLLjMNNjOPRSTKjUFKhTsChDzSh');
	assert.equal(transliterate('Јован језик', {locale: 'sr'}), 'Jovan jezik');
});

test('Serbian h does not use the Russian kh transliteration', () => {
	assert.equal(transliterate('Хвала храна њихова', {locale: 'sr'}), 'Hvala hrana njihova');
	assert.equal(transliterate('Хх', {locale: 'sr-Cyrl-RS'}), 'Hh');
	assert.equal(transliterate('Хх'), 'Khkh');
});

test('Serbian Latin and Cyrillic d with stroke agree', () => {
	assert.equal(transliterate('Đorđe', {locale: 'sr-Latn'}), 'Djordje');
	assert.equal(transliterate('Ђорђе', {locale: 'sr-Cyrl'}), 'Djordje');
	assert.equal(transliterate('Đđ', {locale: 'SR-latn-RS'}), 'Djdj');
	assert.equal(transliterate('Đđ'), 'Dd');
});

test('custom replacements match canonically equivalent text and normalize their output', () => {
	assert.equal(transliterate('e\u{301}', {customReplacements: [['e\u{301}', 'matched']]}), 'matched');
	assert.equal(transliterate('a\u{308}', {customReplacements: new Map([['a\u{308}', 'matched']])}), 'matched');
	assert.equal(transliterate('Ka\u{308}se', {customReplacements: [['ä', 'AE']]}), 'KAEse');
	assert.equal(transliterate('Käse', {customReplacements: [['a\u{308}', 'AE']]}), 'KAEse');
	assert.equal(transliterate('éx', {customReplacements: [['e\u{301}', 'E'], ['éx', 'matched']]}), 'matched');
	assert.equal(transliterate('x', {customReplacements: [['x', 'o\u{308}']]}), 'oe');
	assert.equal(transliterate('x', {customReplacements: [['x', 'o\u{308}']], locale: 'sv'}), 'o');
	assert.equal(transliterate('x', {customReplacements: [['x', 'И\u{306}е\u{308}']]}), 'Yyo');
});

test('accented Greek and Cyrillic bases are transliterated after stripping diacritics', () => {
	assert.equal(transliterate('Ἀθήνα ᾠδή Ἑλλάς'), 'Athina odi Ellas');
	assert.equal(transliterate('тѐст Ѝ ѝ Ѐ ѐ Ӓ ӓ'), 'test I i E e A a');
	assert.equal(transliterate('ἁἂἃἄἅἆἇ ἉἊἋἌἍἎἏ'), 'aaaaaaa AAAAAAA');
	assert.equal(transliterate('Ἀθήνα'.normalize('NFD')), 'Athina');
	assert.equal(transliterate('Й й Ё ё Ї ї'), 'Y y Yo yo Yi yi');
	assert.equal(transliterate('Ѓѓ Ќќ'), 'Gjgj Kjkj');
	assert.equal(transliterate('äöü', {locale: 'de'}), 'aeoeue');
	assert.equal(transliterate('äöü', {locale: 'sv'}), 'aoue');
	assert.equal(transliterate('Ἀθήνα', {customReplacements: [['Ἀ', 'custom']]}), 'customthina');
});

test('negated mathematical relations keep their negation', () => {
	// The negation stroke is not an accent, so removing diacritics must not turn `≠` into `=`
	assert.equal(transliterate('a ≠ b'), 'a ≠ b');
	assert.equal(transliterate('x ∉ A'), 'x ∉ A');
	assert.equal(transliterate('p ≮ q ≯ r'), 'p ≮ q ≯ r');
	assert.equal(transliterate('a\u{338}b'), 'a\u{338}b');
});

test('ASCII diacritics remain literal punctuation in mixed text', () => {
	assert.equal(transliterate('2^3 = 8; `const x = 1;`'), '2^3 = 8; `const x = 1;`');
	assert.equal(transliterate('café^ déjà `vu`'), 'cafe^ deja `vu`');
	assert.equal(transliterate('x', {customReplacements: [['x', '^`é']]}), '^`e');
	assert.equal(transliterate('a\u{301}\u{300}\u{308}'), 'a');
	assert.equal(transliterate('´¨'), '');
});

test('all locale replacement rules are reachable and entirely ASCII', () => {
	for (const [locale, localeMap] of Object.entries(localeReplacements)) {
		for (const [original, replacement] of localeMap) {
			assert.match(replacement, /^\p{ASCII}*$/v, `${locale}: ${original}`);
			assert.equal(transliterate(original, {locale}), replacement, `${locale}: ${original}`);
		}
	}
});

test('characters with locale rules are also transliterated without a locale', () => {
	for (const [locale, localeMap] of Object.entries(localeReplacements)) {
		for (const original of localeMap.keys()) {
			assert.match(transliterate(original), /^\p{ASCII}*$/v, `${locale}: ${original}`);
		}
	}
});

test('readme lists every supported locale', () => {
	const readme = fs.readFileSync(new URL('readme.md', import.meta.url), 'utf8');
	const {section} = readme.match(/### Supported locales\n(?<section>.*?)\n## /sv).groups;
	const documentedLocales = section.matchAll(/^- `(?<locale>[^`]+)`/gmv).map(match => match.groups.locale);
	assert.deepEqual(new Set(documentedLocales), new Set(Object.keys(localeReplacements)));
});

test('documented usage examples produce their documented output', () => {
	assert.equal(transliterate('Fußgängerübergänge'), 'Fussgaengeruebergaenge');
	assert.equal(transliterate('Я люблю единорогов'), 'Ya lyublyu edinorogov');
	assert.equal(transliterate('أنا أحب حيدات'), 'ana ahb hydat');
	assert.equal(transliterate('tôi yêu những chú kỳ lân'), 'toi yeu nhung chu ky lan');
	assert.equal(transliterate('En–dashes and em—dashes are normalized'), 'En-dashes and em-dashes are normalized');
});

test('canonically equivalent input has the same default and locale output', () => {
	const examples = [
		['Fußgängerübergänge', 'de'],
		['Räksmörgås', 'sv'],
		['Blåbærsyltetøj', 'da'],
		['Ёлка Йога', 'unknown'],
		['Ѓорѓи Ќе', 'unknown'],
		['Ἀθήνα ΐ', 'unknown'],
		['ố Ừ Đ', 'unknown'],
		['Й Ѝ Ї', 'bg'],
	];
	for (const [input, locale] of examples) {
		assert.equal(transliterate(input.normalize('NFD')), transliterate(input));
		assert.equal(transliterate(input.normalize('NFD'), {locale}), transliterate(input, {locale}));
	}
});

test('ASCII including punctuation and control characters passes through in every locale', () => {
	const ascii = Array.from({length: 128}, (_, index) => String.fromCodePoint(index)).join('');
	for (const locale of [undefined, ...Object.keys(localeReplacements)]) {
		assert.equal(transliterate(ascii, {locale}), ascii, locale);
		assert.equal(transliterate('', {locale}), '', locale);
	}
});

test('configured mathematical alphabets agree with their Unicode base characters', () => {
	for (const character of replacements.keys()) {
		const codePoint = character.codePointAt(0);
		if (codePoint < 0x1_D4_00 || codePoint > 0x1_D7_FF) {
			continue;
		}

		const base = character.normalize('NFKC');
		if (base === character || !(replacements.has(base) || /^[0-9A-Za-z]$/v.test(base))) {
			continue;
		}

		assert.equal(transliterate(character), transliterate(base), character);
	}
});

test('custom replacements preserve sequential replacement and JavaScript substitutions', () => {
	assert.equal(transliterate('a', {customReplacements: [['a', 'b'], ['b', 'c']]}), 'c');
	assert.equal(transliterate('x', {customReplacements: [['x', '$$$&$1']]}), '$x$1');
	assert.equal(transliterate('xx', {customReplacements: [['x', '[$&]']]}), '[x][x]');
});

test('Latin gha is a consonant rather than an oi digraph', () => {
	assert.equal(transliterate('Ƣƣ'), 'Ghgh');
	assert.equal(transliterate('ƣalaba'), 'ghalaba');
});

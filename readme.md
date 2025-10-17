# transliterate

> Convert Unicode characters to Latin characters using [transliteration](https://en.wikipedia.org/wiki/Transliteration)

Can be useful for [slugification](https://github.com/sindresorhus/slugify) purposes and other times you cannot use Unicode.

## Install

```sh
npm install @sindresorhus/transliterate
```

## Usage

```js
import transliterate from '@sindresorhus/transliterate';

transliterate('Fußgängerübergänge');
//=> 'Fussgaengeruebergaenge'

transliterate('Я люблю единорогов');
//=> 'Ya lyublyu edinorogov'

transliterate('أنا أحب حيدات');
//=> 'ana ahb hydat'

transliterate('tôi yêu những chú kỳ lân');
//=> 'toi yeu nhung chu ky lan'

transliterate('En–dashes and em—dashes are normalized');
//=> 'En-dashes and em-dashes are normalized'
```

## API

### transliterate(string, options?)

#### string

Type: `string`

String to transliterate.

#### options

Type: `object`

##### customReplacements

Type: `Array<string[]> | Map<string, string>`\
Default: `[]`

Add your own custom replacements.

The replacements are run on the original string before any other transformations.

This only overrides a default replacement if you set an item with the same key.

```js
import transliterate from '@sindresorhus/transliterate';

transliterate('Я люблю единорогов', {
	customReplacements: [
		['единорогов', '🦄']
	]
})
//=> 'Ya lyublyu 🦄'
```

You can also pass a `Map`:

```js
transliterate('foo & bar', {
	customReplacements: new Map([
		['&', 'and']
	])
})
//=> 'foo and bar'
```

##### locale

Type: `string`

[BCP-47](https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag) language tag for language-specific transliteration.

When specified, uses language-specific replacement rules for characters that have different transliterations in different languages.

```js
import transliterate from '@sindresorhus/transliterate';

// Swedish: ä→a, ö→o, å→a
transliterate('Räksmörgås', {locale: 'sv'});
//=> 'Raksmorgas'

// German: ä→ae, ö→oe
transliterate('Räksmörgås', {locale: 'de'});
//=> 'Raeksmoergas'
```

### Supported locales

The following locales have specific replacement rules when using the `locale` option:

- `da` - Danish
- `de` - German
- `hu` - Hungarian
- `nb` - Norwegian Bokmål
- `sr` - Serbian
- `sv` - Swedish
- `tr` - Turkish

## Supported languages

Most major languages are supported.

This includes special handling for:

- Arabic
- Armenian
- Czech
- Danish
- Dhivehi
- Georgian
- German (umlauts)
- Greek
- Hungarian
- Latin
- Latvian
- Lithuanian
- Macedonian
- Pashto
- Persian
- Polish
- Romanian
- Russian
- Serbian
- Slovak
- Swedish
- Turkish
- Ukrainian
- Urdu
- Vietnamese

However, Chinese is [currently not supported](https://github.com/sindresorhus/transliterate/issues/1).

## Related

- [slugify](https://github.com/sindresorhus/slugify) - Slugify a string

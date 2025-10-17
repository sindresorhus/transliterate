export type Options = {
	/**
	Add your own custom replacements.

	The replacements are run on the original string before any other transformations.

	This only overrides a default replacement if you set an item with the same key.

	@default []

	@example
	```
	import transliterate from '@sindresorhus/transliterate';

	transliterate('Я люблю единорогов', {
		customReplacements: [
			['единорогов', '🦄']
		]
	})
	//=> 'Ya lyublyu 🦄'
	```

	@example
	```
	import transliterate from '@sindresorhus/transliterate';

	transliterate('foo & bar', {
		customReplacements: new Map([
			['&', 'and']
		])
	})
	//=> 'foo and bar'
	```
	*/
	readonly customReplacements?: ReadonlyArray<[string, string]> | Map<string, string>;

	/**
	[BCP-47](https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag) language tag for language-specific transliteration.

	When specified, uses language-specific replacement rules for characters that have different transliterations in different languages.

	@example
	```
	import transliterate from '@sindresorhus/transliterate';

	// Swedish: ä→a, ö→o, å→a
	transliterate('Räksmörgås', {locale: 'sv'});
	//=> 'Raksmorgas'

	// German: ä→ae, ö→oe
	transliterate('Räksmörgås', {locale: 'de'});
	//=> 'Raeksmoergas'
	```
	*/
	readonly locale?: string;
};

/**
Convert Unicode characters to Latin characters using [transliteration](https://en.wikipedia.org/wiki/Transliteration).

@param string - String to transliterate.

@example
```
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
*/
export default function transliterate(string: string, options?: Options): string;

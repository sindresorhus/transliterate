import {expectType} from 'tsd';
import transliterate from './index.js';

expectType<string>(transliterate('Я люблю единорогов'));
expectType<string>(
	transliterate('Я люблю единорогов', {customReplacements: [['единорогов', '🦄']]})
);

### Unreleased

- **[new]** - number parser - `.numbers()` / `.values()`, with `.get()`, `.parse()`, `.json()`, `.toNumber()`, `.toText()`, `.toCardinal()`, `.toOrdinal()`, `.set()`, `.add()`, `.subtract()`, `.increment()`, `.decrement()`, `.isEqual()`, `.greaterThan()`, `.lessThan()`, `.between()`, `.isOrdinal()`, `.isCardinal()`, `.units()`
- **[new]** - numbers are understood, and written, in every case and gender ('пяти', 'пятью', 'двадцать одна', 'двумястами') - changes keep the case ('с пятью' + 1 → 'с шестью')
- **[new]** - `numbers().decline()` returns the six-case table of a number
- **[new]** - ordinals in every form ('пятого', 'двадцать первая'), numeric ordinals ('5-й', '2-го', '1990-х') and compound ordinals ('двухтысячный', 'двадцатипятитысячный')
- **[new]** - russian digit formats - '3,5', '5 000', '1.234.567', and '5 тыс.', '3 млн', '2 млрд'
- **[new]** - number-words are tagged `#TextValue` in every case-form, and 'тысяча'/'миллион' as `#Multiple`
- **[change]** - 'тыс.', 'млн.', 'млрд.' and 'трлн.' no longer end a sentence
- **[breaking]** - `nlp.TypedPlugin` type is removed
- **[change]** - typescript types rewritten from the real api - core `View` types now come from `compromise`, and the document type is `RuView`
- **[new]** - types for `nlp.fromSpec()`, `nlp.testSpec()` and `nlp.compile()`
- **[change]** - remove `nlp.lazy()` from types and docs - it lives in a plugin now
- **[change]** - minimum node version is 18
- **[update]** - tests moved to `tests/unit`, `tests/types`, `tests/_hmm` and `tests/_backlog`
- **[update]** - suffix-thumb 6.1.0

### 0.0.5 [Nov 2026]

- **[update]** - smaller suffix-thumb format
- **[new]** - support localized tag names
- **[update]** - dependencies

### 0.0.4 [Sep 2026]

- **[change]** - add typescript types
- **[update]** - dependencies

### 0.0.3 [July 2026]

- **[new]** - animacy dictionary - `nouns().isAnimate()`, animate accusatives ('я вижу брата', 'вижу котёнка')
- **[new]** - plural case-declension in `nouns().decline()` - книгам, книгами, книгах; genitive-plural rules (книг, девушек, зданий) with irregulars (лет, людей, детьми)
- **[new]** - sentence-level agreement - pluralizing a noun re-agrees its adjectives, determiners and verb ('новая книга лежала' → 'новые книги лежали')
- **[new]** - noun gender - `nouns().gender()` / `isFeminine()` / `isMasculine()` / `isNeuter()`, with soft-sign + indeclinable dictionaries
- **[new]** - case declension - `nouns().decline()` returns the six-case table (книга → книги, книге, книгу, книгой..)
- **[new]** - `adjectives().toComparative()` (громкий→громче, хороший→лучше) and `toSuperlative()` (самый X / лучший)
- **[new]** - aspect-aware tense transforms - `verbs().toPastTense()` / `toPresentTense()` / `toFutureTense()` / `toInfinitive()`
- **[new]** - `nouns().toPlural()` / `toSingular()` - rule-based with common irregulars (человек→люди)
- **[new]** - `adjectives().toFeminine()` / `toMasculine()` / `toNeuter()` / `toPlural()` gender-agreement
- **[new]** - `verbs().conjugate()` returns aspect, aspect-pair (говорить↔сказать), futureTense (буду говорить / скажу), gerund
- **[new]** - gerund (деепричастие) tagging - 'читая' → `#Gerund`
- **[fix]** - russian suffix-rules (were spanish), root/lemma compute, stress-mark handling, bad conjugation data
- **[new]** - past-tense + imperative conjugation, perfective verbs tagged as future
- **[new]** - declined pronouns, possessives, particles, adverbs, missing prepositions
- **[new]** - ё/е spelling variants, `бы` conditional + `буду` future rules
- **[update]** - deps

### 0.0.1 [Feb 2023]

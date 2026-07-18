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

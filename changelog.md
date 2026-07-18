### 0.0.5 [July 2026]
- **[new]** - noun gender - `nouns().gender()` / `isFeminine()` / `isMasculine()` / `isNeuter()`, with soft-sign + indeclinable dictionaries
- **[new]** - case declension - `nouns().decline()` returns the six-case table (книга → книги, книге, книгу, книгой..)
- **[new]** - `adjectives().toComparative()` (громкий→громче, хороший→лучше) and `toSuperlative()` (самый X / лучший)
- **[new]** - aspect-aware tense transforms - `verbs().toPastTense()` / `toPresentTense()` / `toFutureTense()` / `toInfinitive()`

### 0.0.4 [July 2026]
- **[new]** - `nouns().toPlural()` / `toSingular()` - rule-based with common irregulars (человек→люди)
- **[new]** - `adjectives().toFeminine()` / `toMasculine()` / `toNeuter()` / `toPlural()` gender-agreement
- **[new]** - `verbs().conjugate()` returns aspect, aspect-pair (говорить↔сказать), futureTense (буду говорить / скажу), gerund
- **[new]** - gerund (деепричастие) tagging - 'читая' → `#Gerund`

### 0.0.3 [July 2026]
- **[fix]** - russian suffix-rules (were spanish), root/lemma compute, stress-mark handling, bad conjugation data
- **[new]** - past-tense + imperative conjugation, perfective verbs tagged as future
- **[new]** - declined pronouns, possessives, particles, adverbs, missing prepositions
- **[new]** - ё/е spelling variants, `бы` conditional + `буду` future rules

### 0.0.1 [Feb 2023]
- **[fix]** - 
- **[new]** - 

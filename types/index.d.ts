import type View from 'compromise/view/one'
import type { Lexicon, Match, Net, Plugin, matchOptions } from 'compromise/misc'

export type RussianGender = 'masculine' | 'feminine' | 'neuter'
export type RussianAspect = 'perfective' | 'imperfective'

/** Present or future forms for each grammatical person. */
export interface PersonForms {
  first: string
  second: string
  third: string
  firstPlural: string
  secondPlural: string
  thirdPlural: string
}

/** Gendered Russian past-tense forms. */
export interface PastForms {
  masc: string
  fem: string
  neut: string
  plural: string
}

/** Second-person imperative forms. */
export interface ImperativeForms {
  second: string
  secondPlural: string
}

/** Full conjugation data returned for a Russian verb. */
export interface VerbConjugation {
  infinitive: string
  aspect: RussianAspect
  aspectPair: string | null
  presentTense: PersonForms
  futureTense: PersonForms
  pastTense: PastForms
  imperative: ImperativeForms
  gerund: string | null
}

/** The six grammatical cases represented by the Russian noun API. */
export interface CaseForms {
  nominative: string
  genitive: string
  dative: string
  accusative: string
  instrumental: string
  prepositional: string
}

/** Singular case forms plus the corresponding plural case table. */
export interface NounDeclension extends CaseForms {
  plural: CaseForms
}

/** One of the six grammatical cases. */
export type RussianCase = keyof CaseForms

/** A number, as parsed from the text. */
export interface ParsedNumber {
  /** Was it written with a thousands-separator - '5 000' or '1.234.567'. */
  hasComma: boolean
  /** Leading characters - '$'. A minus-sign is part of `num` instead. */
  prefix: string
  /** The numeric value, or null if it could not be parsed. */
  num: number | null
  /** Trailing characters - '%' or 'km'. */
  suffix: string
  /** Written-out in words, like 'сорок'. False for '40', and for '5 тысяч'. */
  isText: boolean
  /** An ordinal, like 'пятый' or '5-й'. */
  isOrdinal: boolean
  isFraction: boolean
  isMoney: boolean
  /** The case the number was written in - 'пяти' is genitive. Digits are nominative, unless they say otherwise - '5-го'. */
  case: RussianCase
  /** The gender the number was written in - 'одна' and 'первая' are feminine. Most cardinals have none, and are masculine. */
  gender: RussianGender | 'plural'
}

export interface Verbs extends View {
  /** Get the conjugation and aspect data for each selected verb. */
  conjugate(n?: number): VerbConjugation[]
  /** Rewrite selected verbs in the past tense. */
  toPastTense(n?: number): Verbs
  /** Rewrite selected verbs in the present tense. */
  toPresentTense(n?: number): Verbs
  /** Rewrite selected verbs in the future tense. */
  toFutureTense(n?: number): Verbs
  /** Rewrite selected verbs in their infinitive form. */
  toInfinitive(n?: number): Verbs
}

export interface Nouns extends View {
  /** Rewrite selected nouns in their nominative plural form. */
  toPlural(n?: number): Nouns
  /** Rewrite selected nouns in their nominative singular form. */
  toSingular(n?: number): Nouns
  /** Get the inferred grammatical gender of each selected noun. */
  gender(n?: number): RussianGender[]
  /** Keep only feminine nouns. */
  isFeminine(n?: number): Nouns
  /** Keep only masculine nouns. */
  isMasculine(n?: number): Nouns
  /** Keep only neuter nouns. */
  isNeuter(n?: number): Nouns
  /** Keep only nouns inferred or tagged as animate. */
  isAnimate(n?: number): Nouns
  /** Get singular and plural case tables for each selected noun. */
  decline(n?: number): NounDeclension[]
}

export interface Adjectives extends View {
  toMasculine(n?: number): Adjectives
  toFeminine(n?: number): Adjectives
  toNeuter(n?: number): Adjectives
  toPlural(n?: number): Adjectives
  toComparative(n?: number): Adjectives
  toSuperlative(n?: number): Adjectives
}

export interface Numbers extends View {
  /** Get the parsed details of each number. */
  parse(n?: number): ParsedNumber[]
  /** Get the numeric value of each number - 'сорок' → 40, 'минус пять' → -5, '2,5 млн' → 2500000. */
  get(n?: number): (number | null)[]
  /** JSON output, with parsed number data on each match - a number returns only the nth match. */
  json(n?: number | string | object): any
  /** Write each number in all six cases - 'пять', 'пяти', 'пятью'. Null for a number that has no words, like '3,5'. */
  decline(n?: number): (CaseForms | null)[]
  /** Return the unit following each number. */
  units(): View
  /** Return only ordinal numbers - 'пятый', '5-й'. */
  isOrdinal(): Numbers
  /** Return only cardinal numbers - 'пять', '5'. */
  isCardinal(): Numbers
  /** Rewrite these numbers as digits - '40', '-5', '5-го' - and return only the numbers that changed. */
  toNumber(): Numbers
  /** Rewrite these numbers as words - 'сорок', 'минус пять', 'пятого'. */
  toText(): Numbers
  /** Rewrite ordinal numbers as cardinal, in the same case - 'пятого' → 'пяти'. */
  toCardinal(): Numbers
  /** Rewrite cardinal numbers as ordinal, in the same case - 'пяти' → 'пятого'. */
  toOrdinal(): Numbers
  /** Return numbers with this value. */
  isEqual(n: number): Numbers
  /** Alias for .isEqual(). */
  equals(n: number): Numbers
  /** Return numbers larger than n. */
  greaterThan(n: number): Numbers
  /** Return numbers smaller than n. */
  lessThan(n: number): Numbers
  /** Return numbers between min and max. */
  between(min: number, max: number): Numbers
  /** Alias for .between(). */
  isBetween(min: number, max: number): Numbers
  /** Set these numbers to n, keeping their case - 'пяти' → 'сорока'. A string may be a written number, like 'сорок'. */
  set(n: number | string): Numbers
  /** Add n to these numbers - 'сорок' → 'сорок два'. */
  add(n: number | string): Numbers
  /** Alias for .add(). */
  plus(n: number | string): Numbers
  /** Subtract n from these numbers - 'сорок' → 'тридцать восемь'. */
  subtract(n: number | string): Numbers
  /** Alias for .subtract(). */
  minus(n: number | string): Numbers
  /** Add 1 to these numbers - 'сорок' → 'сорок один'. */
  increment(): Numbers
  /** Subtract 1 from these numbers - 'сорок' → 'тридцать девять'. */
  decrement(): Numbers
}

/** options for nlp.fromSpec() */
export interface SpecOptions {
  tags?: 'ignore' | 'use'
  failures?: 'ignore' | 'throw' | 'retain' | 'log'
  verbose?: boolean
}

/** a failed line in a tagging spec */
export interface SpecFailure {
  code: 'length' | 'tags' | 'syntax' | 'match'
  line: number
  text: string
  message: string
  term?: number
  word?: string
  expected?: string[] | number
  actual?: string[] | number
}

/** A compromise document with Russian-specific methods. */
export interface RuView extends View {
  verbs(n?: number): Verbs
  nouns(n?: number): Nouns
  adjectives(n?: number): Adjectives
  /** Numbers written in words or digits - 'двадцать пять', '5 000', 'пятый'. */
  numbers(n?: number): Numbers
  /** Alias for .numbers(). */
  values(n?: number): Numbers
}

/** Parse the given Russian text. */
declare function nlp(text?: string, lexicon?: Lexicon): RuView

declare namespace nlp {
  /** Interpret text without tagging. */
  export function tokenize(text: string, lexicon?: Lexicon): RuView
  /** Mix in a compromise plugin. */
  export function plugin(plugin: Plugin): any
  /** Alias for plugin(). */
  export function extend(plugin: Plugin): any
  /** Turn a match string into its parsed representation. */
  export function parseMatch(match: string, opts?: matchOptions): object[]
  /** Grab library internals. */
  export function world(): object
  /** Grab library metadata. */
  export function model(): object
  /** Grab exposed library methods. */
  export function methods(): object
  /** Get the compute hooks that run automatically. */
  export function hooks(): string[]
  /** Log tagger, matcher, or chunker decisions. */
  export function verbose(toLog?: boolean | string): any
  /** Current semantic version. */
  export const version: string
  /** Connect new tags to the tag graph. */
  export function addTags(tags: object): any
  /** Add words to the lexicon. */
  export function addWords(words: Lexicon, isFrozen?: boolean): any
  /** Turn words into a searchable graph. */
  export function buildTrie(words: string[]): object
  /** alias for nlp.buildTrie() */
  export function compile(words: string[]): object
  /** Compile match objects into an optimized net. */
  export function buildNet(matches: Match[]): Net
  /** Add words to the autocomplete dictionary. */
  export function typeahead(words: Lexicon): any
  /** parse spec text, optionally applying tags or validating its constraints */
  export function fromSpec(spec: string, options?: SpecOptions): RuView & { failures: SpecFailure[] }
  /** returns untagged sentences and failing tagged lines, with validation failures */
  export function testSpec(spec: string, verbose?: boolean, throwError?: boolean): RuView & { failures: SpecFailure[] }
}

export default nlp

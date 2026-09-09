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

/** A compromise document with Russian-specific methods. */
export interface RuView extends View {
  verbs(n?: number): Verbs
  nouns(n?: number): Nouns
  adjectives(n?: number): Adjectives
}

/** Parse the given Russian text. */
declare function nlp(text?: string, lexicon?: Lexicon): RuView

declare namespace nlp {
  /** Interpret text without tagging. */
  export function tokenize(text: string, lexicon?: Lexicon): RuView
  /** Scan through text with minimal analysis. */
  export function lazy(text: string, match?: string): RuView
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
  export function addWords(words: Lexicon): any
  /** Turn words into a searchable graph. */
  export function buildTrie(words: string[]): object
  /** Compile match objects into an optimized net. */
  export function buildNet(matches: Match[]): Net
  /** Add words to the autocomplete dictionary. */
  export function typeahead(words: Lexicon): any
  /** Describe a plugin whose method shape is known. */
  export interface TypedPlugin<Methods extends object> extends Plugin {
    methods: Methods
  }
}

export default nlp

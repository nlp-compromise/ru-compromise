// Compile-time consumer test for types/index.d.ts. This file is never executed.
import nlp from 'ru-compromise'
import type {
  Adjectives,
  CaseForms,
  NounDeclension,
  Nouns,
  PersonForms,
  RuView,
  RussianAspect,
  RussianGender,
  VerbConjugation,
  Verbs,
} from 'ru-compromise'

const doc: RuView = nlp('новая книга лежала на столе')

// Core compromise/one methods remain available.
const text: string = doc.text()
const found: boolean = doc.has('#Noun')
doc.match('#Noun').tag('Checked').out('array')

const verbs: Verbs = nlp('она читала').verbs()
const conjugations: VerbConjugation[] = verbs.conjugate()
const aspect: RussianAspect = conjugations[0].aspect
const present: PersonForms = conjugations[0].presentTense
const firstPerson: string = present.first
const gerund: string | null = conjugations[0].gerund
verbs.toPastTense().toPresentTense().toFutureTense().toInfinitive()
verbs.toPastTense(0)

const nouns: Nouns = doc.nouns()
const genders: RussianGender[] = nouns.gender()
const declensions: NounDeclension[] = nouns.decline()
const pluralCases: CaseForms = declensions[0].plural
const instrumental: string = pluralCases.instrumental
nouns.toPlural().toSingular()
nouns.isFeminine().isMasculine().isNeuter().isAnimate()

const adjectives: Adjectives = doc.adjectives()
adjectives.toMasculine().toFeminine().toNeuter().toPlural()
adjectives.toComparative().toSuperlative()

const tokens: RuView = nlp.tokenize('русский текст')
const version: string = nlp.version
nlp.verbose(true)
nlp.addWords({ 'скейтборд': 'Noun' })
nlp.addTags({ Checked: { is: 'Noun' } })
nlp.buildTrie(['один', 'два'])
nlp.parseMatch('#Noun')

// @ts-expect-error input text must be a string
nlp(25)

export {
  aspect,
  conjugations,
  declensions,
  found,
  firstPerson,
  genders,
  gerund,
  instrumental,
  text,
  tokens,
  version,
}

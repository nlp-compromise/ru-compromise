// Compile-time consumer test for types/index.d.ts. This file is never executed.
import nlp from 'ru-compromise'
import type View from 'compromise/view/one'
import type {
  Adjectives,
  CaseForms,
  NounDeclension,
  Nouns,
  Numbers,
  ParsedNumber,
  PersonForms,
  RuView,
  RussianAspect,
  RussianCase,
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

// numbers
const nums: Numbers = nlp('двадцать пять рублей').numbers()
const values: Numbers = doc.values(0)
const nth: Numbers = doc.numbers(0)
const amounts: (number | null)[] = nums.get()
const parsed: ParsedNumber[] = nums.parse(0)
const num: number | null = parsed[0].num
const isText: boolean = parsed[0].isText
const suffix: string = parsed[0].suffix
const numberCase: RussianCase = parsed[0].case
const numberGender: RussianGender | 'plural' = parsed[0].gender
const numberCases: (CaseForms | null)[] = nums.decline()
const genitive: string | undefined = numberCases[0]?.genitive
const units: View = nums.units()
nums.json()
nums.json(0)
nums.json({ terms: false })
nums.toNumber().toText().toOrdinal().toCardinal()
nums.add(5).subtract(2).increment().decrement()
nums.plus('пять').minus('2')
nums.greaterThan(1).lessThan(100).between(1, 100).isBetween(1, 100)
nums.isEqual(25).equals(25).set(60).set('сорок')
nums.isOrdinal().isCardinal()
// @ts-expect-error comparisons need a number
nums.greaterThan('пять')
// @ts-expect-error a case is one of six
const badCase: RussianCase = 'vocative'

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
  amounts,
  badCase,
  genitive,
  isText,
  nth,
  num,
  numberCase,
  numberGender,
  suffix,
  units,
  values,
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

// spec helpers
const specFailures: import('ru-compromise').SpecFailure[] = nlp.fromSpec('a b', { tags: 'use', failures: 'retain' }).failures
const specDoc: import('ru-compromise').RuView = nlp.testSpec('a b')
nlp.compile(['a', 'b'])
export { specFailures, specDoc }

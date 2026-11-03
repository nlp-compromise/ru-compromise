// CommonJS exports the callable directly; share its API with the ESM declarations.
import type esm from './index.js' with { "resolution-mode": "import" }
import type * as api from './index.js' with { "resolution-mode": "import" }

declare const nlp: typeof esm
declare namespace nlp {
  export type RussianGender = api.RussianGender
  export type RussianAspect = api.RussianAspect
  export type PersonForms = api.PersonForms
  export type PastForms = api.PastForms
  export type ImperativeForms = api.ImperativeForms
  export type VerbConjugation = api.VerbConjugation
  export type CaseForms = api.CaseForms
  export type NounDeclension = api.NounDeclension
  export type Verbs = api.Verbs
  export type Nouns = api.Nouns
  export type Adjectives = api.Adjectives
  export type RuView = api.RuView
  export type TypedPlugin<Methods extends object> = esm.TypedPlugin<Methods>
}

export = nlp

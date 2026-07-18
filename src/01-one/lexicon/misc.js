// hand-curated words with multiple tags, plus ambiguity-pins.
// these win over the packed lexicon and generated conjugations.
let misc = {}

// --- быть (to be) ---
const bytForms = {
  'буду': ['Copula', 'FutureTense', 'FirstPerson'],
  'будешь': ['Copula', 'FutureTense', 'SecondPerson'],
  'будет': ['Copula', 'FutureTense', 'ThirdPerson'],
  'будем': ['Copula', 'FutureTense', 'FirstPersonPlural'],
  'будете': ['Copula', 'FutureTense', 'SecondPersonPlural'],
  'будут': ['Copula', 'FutureTense', 'ThirdPersonPlural'],
  'был': ['Copula', 'PastTense'],
  'была': ['Copula', 'PastTense'],
  'было': ['Copula', 'PastTense'],
  'были': ['Copula', 'PastTense'],
  'будь': ['Copula', 'Imperative'],
  'будьте': ['Copula', 'Imperative'],
  'есть': ['Copula', 'PresentTense'],
}

// --- possessive pronouns (all case-forms) ---
const possessives = [
  'мой', 'моя', 'моё', 'мое', 'мои', 'моего', 'моей', 'моему', 'моим', 'моими', 'мою', 'моём', 'моем', 'моих',
  'твой', 'твоя', 'твоё', 'твое', 'твои', 'твоего', 'твоей', 'твоему', 'твоим', 'твоими', 'твою', 'твоём', 'твоем', 'твоих',
  'наш', 'наша', 'наше', 'наши', 'нашего', 'нашей', 'нашему', 'нашим', 'нашими', 'нашу', 'нашем', 'наших',
  'ваш', 'ваша', 'ваше', 'ваши', 'вашего', 'вашей', 'вашему', 'вашим', 'вашими', 'вашу', 'вашем', 'ваших',
  'свой', 'своя', 'своё', 'свое', 'свои', 'своего', 'своей', 'своему', 'своим', 'своими', 'свою', 'своём', 'своем', 'своих',
]

// --- demonstratives + other adjectival pronouns ---
const determiners = [
  'этот', 'эта', 'эти', 'этого', 'этой', 'этому', 'этим', 'этими', 'эту', 'этом', 'этих',
  'тот', 'та', 'те', 'того', 'той', 'тому', 'тем', 'теми', 'ту', 'том', 'тех',
  'такой', 'такая', 'такое', 'такие', 'такого', 'такому', 'таким', 'такую', 'таком', 'таких', 'такими',
  'каждый', 'каждая', 'каждое', 'каждые', 'каждого', 'каждой', 'каждому', 'каждым', 'каждую', 'каждом', 'каждых',
  'какой', 'какая', 'какое', 'какие', 'какого', 'какому', 'каким', 'какую', 'каком', 'каких',
  'чей', 'чья', 'чьё', 'чье', 'чьи',
  'весь', 'вся',
  'сам', 'сама', 'само', 'сами', 'самого', 'самой', 'самому', 'самим', 'самих', 'самими',
  'самый', 'самая', 'самое', 'самые', 'самую', 'самом', 'самым', 'самыми', 'самых',
  'другой', 'другая', 'другое', 'другие', 'другого', 'другому', 'другим', 'другую', 'другом', 'других', 'другими',
]

// --- particles ---
const particles = [
  'же', 'ж', 'ли', 'ль', 'бы', 'б', 'ведь', 'вот', 'вон', 'уж', 'лишь',
  'разве', 'неужели', 'пусть', 'пускай', 'ну', 'аж', 'мол', 'якобы', 'только', 'даже',
]

// --- negation ---
const negatives = ['не', 'ни', 'нет', 'нету']

// --- modal predicatives - 'надо работать' ---
const modals = [
  'можно', 'нельзя', 'надо', 'нужно', 'нужен', 'нужна', 'нужны',
  'должен', 'должна', 'должно', 'должны', 'пора', 'жаль',
]

// --- question-adverbs ---
const questionAdverbs = ['почему', 'зачем', 'куда', 'откуда', 'отчего', 'сколько', 'столько']

// --- interjections + politeness ---
const expressions = [
  'пожалуйста', 'спасибо', 'привет', 'здравствуй', 'здравствуйте',
  'ладно', 'ой', 'ах', 'ох', 'эх', 'увы', 'ура', 'алло',
]

// --- currency words ---
const currencies = [
  'рубль', 'рубля', 'рублей', 'рублях',
  'доллар', 'доллара', 'долларов',
  'евро', 'копейка', 'копейки', 'копеек',
]

// --- common nouns that look like verb/adjective conjugations ---
// (сила ~ говорила, дело ~ хотело, кровать ~ читать..)
// (кровать, мать, нить.. moved to data/lexicon/nouns/gender.js)
const nounPins = [
  'сила', 'скала', 'стрела', 'акула', 'юла', 'стая', 'зала', 'пила',
  'дела', 'тела', 'дело', 'тело', 'сало', 'мыло', 'одеяло', 'зеркало', 'покрывало', 'начало',
  'детали', 'медали', 'недели', 'качели', 'дому',
]

// --- common adjectives ending in stressed -ой (no reliable suffix-rule) ---
const ojAdjectives = [
  'большой', 'молодой', 'дорогой', 'простой', 'плохой', 'живой', 'злой',
  'чужой', 'родной', 'голубой', 'седой', 'сухой', 'глухой', 'прямой',
  'крутой', 'густой', 'пустой', 'слепой', 'смешной', 'больной', 'основной',
  'мировой',
]

Object.keys(bytForms).forEach(w => {
  misc[w] = bytForms[w]
})
possessives.forEach(w => {
  misc[w] = ['Pronoun', 'Possessive']
})
determiners.forEach(w => {
  misc[w] = 'Determiner'
})
particles.forEach(w => {
  misc[w] = 'Particle'
})
negatives.forEach(w => {
  misc[w] = 'Negative'
})
modals.forEach(w => {
  misc[w] = 'Modal'
})
questionAdverbs.forEach(w => {
  misc[w] = 'Adverb'
})
expressions.forEach(w => {
  misc[w] = 'Expression'
})
currencies.forEach(w => {
  misc[w] = ['Noun', 'Currency']
})
nounPins.forEach(w => {
  misc[w] = 'Noun'
})
ojAdjectives.forEach(w => {
  misc[w] = 'Adjective'
})

export default misc

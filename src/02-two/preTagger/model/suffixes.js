const jj = 'Adjective'
const nn = 'Noun'
const past = 'PastTense'
const inf = 'Infinitive'
const imp = 'Imperative'
const pres = 'PresentTense'
const first = [pres, 'FirstPerson']
const second = [pres, 'SecondPerson']
const third = [pres, 'ThirdPerson']
const firstPl = [pres, 'FirstPersonPlural']
const secondPl = [pres, 'SecondPersonPlural']
const thirdPl = [pres, 'ThirdPersonPlural']

// russian is a highly-inflected language, so word-endings are a strong signal.
// known verb-conjugations are found in the lexicon first - these rules are the
// backstop for unknown words. unmatched words fall-back to Noun, so rules here
// favour precision. ambiguous common words (сила, дело, кровать..) are
// pinned in the lexicon.
export default [
  null,
  {
    // one-letter suffixes
  },
  {
    // two-letter suffixes
    // -- adjectives --
    'ый': jj, // красивый
    'ая': jj, // красивая
    'яя': jj, // синяя
    'ое': jj, // красивое
    'ее': jj, // синее, быстрее
    'ые': jj, // красивые
    'ие': jj, // синие (see noun-guards below)
    'ых': jj, // красивых
    'их': jj, // синих
    'ым': jj, // красивым
    'им': jj, // синим
    'ую': jj, // красивую
    'юю': jj, // синюю
    // -- verbs --
    'аю': first, // читаю
    'яю': first, // гуляю
  },
  {
    // three-letter suffixes
    // -- adjectives --
    'ний': jj, // последний
    'кий': jj, // маленький
    'гий': jj, // строгий
    'хий': jj, // тихий
    'чий': jj, // горячий
    'щий': jj, // настоящий
    'жий': jj, // свежий
    'ший': jj, // хороший
    'ого': jj, // нового
    'его': jj, // синего
    'ому': jj, // новому
    // 'ему' skipped - collides with тему, проблему, систему..
    'ыми': jj, // новыми
    'ими': jj, // синими
    // -- present-tense --
    'ешь': second, // читаешь
    'ёшь': second, // идёшь
    'ишь': second, // говоришь
    'ёте': secondPl, // идёте
    'ите': secondPl, // говорите
    'ают': thirdPl, // читают
    'яют': thirdPl, // гуляют
    'еют': thirdPl, // умеют
    'юют': thirdPl, // воюют
    'тся': pres, // reflexive 3rd-person
    'юсь': first, // боюсь
    'усь': first, // учусь
    // -- past-tense --
    'лся': past, // учился
    'ала': past, // сказала
    'яла': past, // гуляла
    'ела': past, // смотрела
    'ила': past, // говорила
    'ыла': past, // забыла
    'ула': past, // уснула
    'али': past, // сказали
    'яли': past, // гуляли
    'ели': past, // смотрели
    'или': past, // говорили
    'ыли': past, // забыли
    'ули': past, // уснули
    'ало': past, // сказало
    'яло': past, // гуляло
    'ело': past, // смотрело
    'ило': past, // говорило
    'ыло': past, // забыло
    'уло': past, // уснуло
    // -- infinitives --
    'ать': inf, // читать
    'ять': inf, // гулять
    'еть': inf, // смотреть
    'ить': inf, // говорить
    'ыть': inf, // забыть
    'оть': inf, // колоть
    // -- imperatives --
    'йте': imp, // читайте
    'йся': imp, // не бойся
    // -- noun-guards (block 'ие' adjective-rule) --
    'тие': nn, // развитие
    'вие': nn, // условие
    'дие': nn, // орудие
    'лие': nn, // усилие
    'бие': nn, // пособие
  },
  {
    // four-letter suffixes
    // -- nouns --
    'ание': nn, // задание
    'ение': nn, // решение
    'ость': nn, // новость
    'ство': nn, // государство
    // -- present-tense --
    'ется': third, // кажется
    'ится': third, // нравится
    'утся': thirdPl, // смеются
    'ются': thirdPl, // занимаются
    'атся': thirdPl, // боятся
    'ятся': thirdPl, // учатся
    'емся': firstPl, // боремся
    'ёмся': firstPl, // вернёмся
    'имся': firstPl, // учимся
    'аем': firstPl, // читаем
    'яем': firstPl, // гуляем
    'уем': firstPl, // рисуем
    'ает': third, // читает
    'яет': third, // гуляет
    'ует': third, // рисует
    'еет': third, // умеет
    'аете': secondPl, // читаете
    'яете': secondPl, // гуляете
    'уете': secondPl, // рисуете
    // -- past-tense --
    'лась': past, // училась
    'лось': past, // училось
    'лись': past, // учились
    // -- infinitives --
    'нуть': inf, // вернуть
    'ться': [inf, 'Reflexive'], // учиться
  },
  {
    // five-letter suffixes
    'ешься': second, // смеёшься
    'ёшься': second, // вернёшься
    'ишься': second, // учишься
    'етесь': secondPl, // смеётесь
    'итесь': secondPl, // учитесь
    'йтесь': imp, // не бойтесь
  },
  {
    // six-letter suffixes
  },
  {
    // seven-letter suffixes
  },
]

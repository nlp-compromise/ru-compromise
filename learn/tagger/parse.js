import { Document } from 'conllu-core'
import nlp from '../../src/index.js'
// https://github.com/dialogue-evaluation/GramEval2020/tree/master/dataTrain

const mapping = {
  ADJ: 'Adjective',//	прилагательное,порядковое числительное	adjective	новый, первый, должен, самый, сам, нужный
  ADP: 'Preposition',//	предлог	preposition	в, на, с, из-за, а-ля, типа
  ADV: 'Adverb',//	наречие, местоимение-наречие	adverb	так, уже, где, более, внимательно
  AUX: 'Auxiliary',//	вспомогательный грамматический показатель	auxiliary	быть, бы, б
  CCONJ: 'Conjunction',//	сочинительный союз	coordinating conjunction	и, а, но, или, ни, то
  DET: 'Determiner',//	местоимение-прилагательное	determiner (adjectival pronoun)	наш, этот, весь, тот, его, каждый, какой
  INTJ: 'Expression',//	междометие	iterjection	ах, о, а, та-да-дам, алло, ба
  NOUN: 'Noun',//	существительное (нарицательное)	noun	год, человек, время, страна, дело
  NUM: 'Value',//	числительное	numeral	один, два, пять, много, несколько, 1, 10,5, 20.000
  PART: 'Verb',//	частица	particle	не, и, же, только, даже, вот, ли, лишь, просто
  PRON: 'Pronoun',//	местоимение-существительное	pronoun (nominal)	он, это, который, то, я, что, все
  PROPN: 'Noun',//	существительное (собственное)	proper noun	Юрий, Гагарин, Ю. Москва, СССР, Земля, Каштанка, Beatles
  PUNCT: 'PUNCT',//	пунктуация	punctuation mark	,, ., ", -, :, ), (, ?, !, …
  SCONJ: 'Conjunction',//	подчинительный союз	subordinating conjunction	что, как, если, чтобы, когда, то, чем, хотя, поскольку, пока
  SYM: '',//	символ	symbol	%, $, №, °, €, +, =, №№, 😉, ))
  VERB: 'Verb',//	глагол (вкл. причастие, деепричастие)	verb	мочь, быть, стать, говорить, нет, нельзя, некуда, жаль
  X: '',//	другое	foreign and non-words	of, and, the, in, de, mignews.com, @xxxxxx, http://xxxxxx, #ыыы
}


const file = '/Users/spencer/mountain/ru-compromise/learn/tagger/data.txt'
const o = await Document.load(file)
o.sentences.forEach(s => {
  let txt = ''
  const want = {}
  s.tokens.forEach(t => {
    const tag = mapping[t.upos]
    want[t.form] = tag
    if (t.upos !== 'PUNCT') {
      txt += ' '
    }
    txt += t.form
    // console.log(t)
  })
  txt = txt.trim().replace(/ ("|\))/, '$1')
  txt = txt.replace(/\(/, ' (')
  console.log(txt)
})
// console.log(o.sentences[4].toString())
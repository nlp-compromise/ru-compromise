// words that end in a period, but don't end a sentence - 'Dr.'
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default toObj(`
  г гг в вв ул д кв корп с см ср проф акад доц тов гр дж
  напр пр просп пл пос обл ст оз о зам зав гос сев юж зап вост
  т е п н э т.е т.д т.п н.э др проч
  стр рис табл гл изд испр доп тел
  руб коп тыс млн млрд трлн ч мин сек чел кг км см мм мл шт
  янв февр фев апр авг сент окт нояб дек
`)

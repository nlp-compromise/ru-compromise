export default [
  // по-русски, по-моему, по-другому..
  [/^по-[а-яё]+$/, 'Adverb', 'по-русски'],

  // кто-то, что-нибудь, кого-либо..
  [/^(кто|что|кого|кому|чего|чему|кем|чем)-(то|нибудь|либо)$/, 'Pronoun', 'кто-то'],

  // где-то, когда-нибудь, как-то..
  [/^(где|когда|куда|откуда|почему|как)-(то|нибудь|либо)$/, 'Adverb', 'где-то'],

  // какой-то, какая-нибудь..
  [/^как(ой|ая|ое|ие|ого|ому|им|ом|ую|их)-(то|нибудь|либо)$/, 'Determiner', 'какой-то'],

  //web tags
  [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, 'Email'],
  [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, 'Url', 'http..'],
  [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, 'Url', '.com'],

  // timezones
  [/^[PMCE]ST$/, 'Timezone', 'EST'],

  //names
  [/^ma?c'.*/, 'LastName', "mc'neil"],
  [/^o'[drlkn].*/, 'LastName', "o'connor"],
  [/^ma?cd[aeiou]/, 'LastName', 'mcdonald'],

  //slang things
  [/^(lol)+[sz]$/, 'Expression', 'lol'],
  [/^wo{2,}a*h?$/, 'Expression', 'wooah'],
  [/^(hee?){2,}h?$/, 'Expression', 'hehe'],
  [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, 'Verb', 'un-vite'],

  // m/h
  [/^(m|k|cm|km)\/(s|h|hr)$/, 'Unit', '5 k/m'],
  // μg/g
  [/^(ug|ng|mg)\/(l|m3|ft3)$/, 'Unit', 'ug/L'],
]

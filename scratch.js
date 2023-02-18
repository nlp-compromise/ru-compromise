import nlp from './src/index.js'
nlp.verbose('tagger')

let txt = ``
txt = `Не слышны в саду даже шорохи,`//Even rustles are not heard in the garden,
txt = `Всё здесь замерло до утра.`//Everything here was frozen until the morning.
txt = `Если б знали вы, как мне дороги`//If you knew how dear to me
txt = `Подмосковные вечера,`//Moscow Nights,
txt = `Речка движется и не движется,`//The river moves and does not move,
txt = `Вся из лунного серебра.`//All moon silver.
txt = `Песня слышится и не слышится`//The song is heard and not heard
txt = `В эти тихие вечера,`//In these quiet evenings
txt = `Что ж ты милая смотришь искоса,`//Why are you looking askance, dear,
txt = `Низко голову наклоня?`//Tilt your head low?
txt = `Трудно высказать и не высказать`//Difficult to say and not to say
txt = `Всё, что на сердце у меня,`//All that is in my heart,
txt = `А рассвет уже всё заметнее,`//And the dawn is getting stronger
txt = `Так, пожалуйста, будь добра,`//So please be kind

txt = `он действительно крут`

txt = 'я буду танцевать'//i will dance
txt = `Не забудь и ты эти летние Подмосковные вечера`//Don't forget these summer Moscow Nights,
txt = 'Вуячич, Саша'
// txt = 'Люди будут танцевать!'//people will dance
let doc = nlp(txt)
doc.debug()
import test from 'tape'
import nlp from '../../_lib.js'
const here = '[ru-buildNet] '
nlp.verbose(false)

test('buildNet:', function (t) {
  const matches = [
    { match: '{кричать/Verb}' },
    { match: '{читать/Verb}' },
    { match: '{говорить/Verb}' },
    { match: '{салат/Noun}' },
    { match: '{красивый/Adjective}' },
  ]
  const net = nlp.buildNet(matches)
  t.ok(net.hooks.кричать, here + 'кричать')
  t.ok(net.hooks.кричу, here + 'кричу')
  t.ok(net.hooks.кричим, here + 'кричим')
  t.ok(net.hooks.кричат, here + 'кричат')
  t.ok(net.hooks.кричал, here + 'кричал')
  t.ok(net.hooks.кричали, here + 'кричали')
  t.ok(net.hooks.кричи, here + 'кричи')
  t.ok(net.hooks.читать, here + 'читать')
  t.ok(net.hooks.читаю, here + 'читаю')
  t.ok(net.hooks.читаешь, here + 'читаешь')
  t.ok(net.hooks.читала, here + 'читала')
  t.ok(net.hooks.читайте, here + 'читайте')
  t.ok(net.hooks.говорить, here + 'говорить')
  t.ok(net.hooks.говорю, here + 'говорю')
  t.ok(net.hooks.говорят, here + 'говорят')
  t.ok(net.hooks.говорило, here + 'говорило')
  t.ok(net.hooks.салат, here + 'салат')
  t.ok(net.hooks.красивый, here + 'красивый')
  t.end()
})

test('sweep:', function (t) {
  const net = nlp.buildNet([
    { match: 'мороженое', tag: 'Food' },
    { match: 'и пиццу', tag: 'Food' },
  ])
  const doc = nlp('Я люблю мороженое и пиццу. Кот спит.')
  const res = doc.sweep(net)
  t.deepEqual(res.view.out('array'), ['мороженое', 'и пиццу.'], here + 'view has both matches')
  t.equal(res.found.length, 2, here + 'two results')
  t.equal(res.found[0].match, 'мороженое', here + 'first result')
  t.equal(doc.match('#Food+').text(), 'мороженое и пиццу', here + 'tags were applied')
  t.equal(doc.has('кот #Food'), false, here + 'nothing else tagged')
  // no matches
  const none = nlp('кот спит').sweep(net)
  t.equal(none.view.found, false, here + 'empty view')
  t.deepEqual(none.found, [], here + 'empty found')
  t.end()
})

test('sweep without tagging:', function (t) {
  const net = nlp.buildNet([{ match: 'мороженое', tag: 'Food' }])
  const doc = nlp('я люблю мороженое')
  const res = doc.sweep(net, { tagger: false })
  t.equal(res.view.text(), 'мороженое', here + 'tagger:false still matches')
  t.equal(doc.has('#Food'), false, here + 'tagger:false does not tag')
  doc.sweep(net)
  t.equal(doc.match('#Food').text(), 'мороженое', here + 'tags by default')
  t.end()
})

test('sweep with roots:', function (t) {
  const net = nlp.buildNet([{ match: '{кричать/Verb}' }, { match: '{читать/Verb}' }, { match: '{говорить/Verb}' }])
  const arr = [
    ['вчера мы кричали громко', 'кричали'],
    ['он кричит', 'кричит'],
    ['я читаю книгу', 'читаю'],
    ['она читала книгу', 'читала'],
    ['ты читаешь книгу', 'читаешь'],
    ['они говорят тихо', 'говорят'],
    ['он говорил тихо', 'говорил'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).sweep(net).view.text(), want, here + str)
  })
  t.deepEqual(
    nlp('Мы кричали громко. Он кричит!').sweep(net).view.out('array'),
    ['кричали', 'кричит!'],
    here + 'across sentences'
  )
  t.end()
})

test('sweep with tags:', function (t) {
  const net = nlp.buildNet([{ match: '#Pronoun #Verb' }])
  const res = nlp('Я читаю книгу. Она спит.').sweep(net)
  t.deepEqual(res.view.out('array'), ['Я читаю', 'Она спит.'], here + 'pronoun-verb')
  t.end()
})

test('buildTrie + lookup:', function (t) {
  const trie = nlp.buildTrie(['мороженое', 'я люблю', 'нет такого'])
  const doc = nlp('Я люблю мороженое. Также МОРОЖЕНОЕ с лимоном!')
  t.deepEqual(doc.lookup(trie).out('array'), ['Я люблю', 'мороженое.', 'МОРОЖЕНОЕ'], here + 'lookup')
  t.equal(nlp('кот спит').lookup(trie).found, false, here + 'lookup finds nothing')
  t.end()
})

test('parseMatch:', function (t) {
  const regs = nlp.parseMatch('#Noun+ (он|она)? кот')
  t.equal(regs.length, 3, here + 'three tokens')
  t.equal(regs[0].tag, 'Noun', here + 'tag')
  t.equal(regs[0].greedy, true, here + 'greedy')
  t.equal(regs[1].optional, true, here + 'optional')
  t.equal(regs[2].word, 'кот', here + 'word')
  // a parsed match can be re-used
  t.equal(nlp('вижу кота').match(nlp.parseMatch('вижу кота')).text(), 'вижу кота', here + 'use parsed match')
  t.end()
})

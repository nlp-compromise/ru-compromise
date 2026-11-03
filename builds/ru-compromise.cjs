(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ruCompromise = factory());
})(this, (function () { 'use strict';

  const methods$o = {
    one: {},
    two: {},
    three: {},
    four: {},
  };

  const model$6 = {
    one: {},
    two: {},
    three: {},
  };
  const compute$7 = {};
  const hooks = [];

  var tmpWrld = { methods: methods$o, model: model$6, compute: compute$7, hooks };

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input, options) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && Object.hasOwn(compute, input)) {
        compute[input](this, options);
      }
      // allow a list of methods
      else if (Array.isArray(input)) {
        input.forEach(name => {
          if (Object.hasOwn(world.compute, name)) {
            compute[name](this, options);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this, options);
      } else {
        console.warn('no compute:', input); // eslint-disable-line
      }
      return this
    },
  };

  // wrappers for loops in javascript arrays

  const forEach = function (cb) {
    const ptrs = this.fullPointer;
    ptrs.forEach((ptr, i) => {
      const view = this.update([ptr]);
      cb(view, i);
    });
    return this
  };

  const map = function (cb, empty) {
    const ptrs = this.fullPointer;
    const res = ptrs.map((ptr, i) => {
      const view = this.update([ptr]);
      const out = cb(view, i);
      // if we returned nothing, return a view
      if (out === undefined) {
        return this.none()
      }
      return out
    });
    if (res.length === 0) {
      return empty || this.update([])
    }
    // return an array of values, or View objects?
    // user can return either from their callback
    if (res[0] !== undefined) {
      // array of strings
      if (typeof res[0] === 'string') {
        return res
      }
      // array of objects
      if (typeof res[0] === 'object' && (res[0] === null || !res[0].isView)) {
        return res
      }
    }
    // return a View object
    let all = [];
    res.forEach(ptr => {
      all = all.concat(ptr.fullPointer);
    });
    return this.toView(all)
  };

  const filter = function (cb) {
    let ptrs = this.fullPointer;
    ptrs = ptrs.filter((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    });
    const res = this.update(ptrs);
    return res
  };

  const find = function (cb) {
    const ptrs = this.fullPointer;
    const found = ptrs.find((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    });
    return this.update([found])
  };

  const some = function (cb) {
    const ptrs = this.fullPointer;
    return ptrs.some((ptr, i) => {
      const view = this.update([ptr]);
      return cb(view, i)
    })
  };

  const random = function (n = 1) {
    let ptrs = this.fullPointer;
    let r = Math.floor(Math.random() * ptrs.length);
    //prevent it from going over the end
    if (r + n > this.length) {
      r = this.length - n;
      r = r < 0 ? 0 : r;
    }
    ptrs = ptrs.slice(r, r + n);
    return this.update(ptrs)
  };
  var loops = { forEach, map, filter, find, some, random };

  const utils = {
    /** */
    termList: function () {
      return this.methods.one.termList(this.docs)
    },
    /** return individual terms*/
    terms: function (n) {
      const m = this.match('.');
      // this is a bit faster than .match('.') 
      // let ptrs = []
      // this.docs.forEach((terms) => {
      //   terms.forEach((term) => {
      //     let [y, x] = term.index || []
      //     ptrs.push([y, x, x + 1])
      //   })
      // })
      // let m = this.update(ptrs)
      return typeof n === 'number' ? m.eq(n) : m
    },

    /** */
    groups: function (group) {
      if (group || group === 0) {
        return this.update(this._groups[group] || [])
      }
      // return an object of Views
      const res = {};
      Object.keys(this._groups).forEach(k => {
        res[k] = this.update(this._groups[k]);
      });
      // this._groups = null
      return res
    },
    /** */
    eq: function (n) {
      let ptr = this.pointer;
      if (!ptr) {
        ptr = this.docs.map((_doc, i) => [i]);
      }
      if (ptr[n]) {
        return this.update([ptr[n]])
      }
      return this.none()
    },
    /** */
    first: function () {
      return this.eq(0)
    },
    /** */
    last: function () {
      const n = this.fullPointer.length - 1;
      return this.eq(n)
    },

    /** grab term[0] for every match */
    firstTerms: function () {
      return this.match('^.')
    },

    /** grab the last term for every match  */
    lastTerms: function () {
      return this.match('.$')
    },

    /** */
    slice: function (min, max) {
      let pntrs = this.pointer || this.docs.map((_o, n) => [n]);
      pntrs = pntrs.slice(min, max);
      return this.update(pntrs)
    },

    /** return a view of the entire document */
    all: function () {
      return this.update().toView()
    },
    /**  */
    fullSentences: function () {
      const ptrs = this.fullPointer.map(a => [a[0]]); //lazy!
      return this.update(ptrs).toView()
    },
    /** return a view of no parts of the document */
    none: function () {
      return this.update([])
    },

    /** are these two views looking at the same words? */
    isDoc: function (b) {
      if (!b || !b.isView) {
        return false
      }
      const aPtr = this.fullPointer;
      const bPtr = b.fullPointer;
      if (!aPtr.length === bPtr.length) {
        return false
      }
      // ensure pointers are the same
      return aPtr.every((ptr, i) => {
        if (!bPtr[i]) {
          return false
        }
        // ensure [n, start, end] are all the same
        return ptr[0] === bPtr[i][0] && ptr[1] === bPtr[i][1] && ptr[2] === bPtr[i][2]
      })
    },

    /** how many seperate terms does the document have? */
    wordCount: function () {
      return this.docs.reduce((count, terms) => {
        count += terms.filter(t => t.text !== '').length;
        return count
      }, 0)
    },

    // is the pointer the full sentence?
    isFull: function () {
      const ptrs = this.pointer;
      if (!ptrs) {
        return true
      }
      // must start at beginning
      if (ptrs.length === 0 || ptrs[0][0] !== 0) {
        return false
      }
      let wantTerms = 0;
      let haveTerms = 0;
      this.document.forEach(terms => wantTerms += terms.length);
      this.docs.forEach(terms => haveTerms += terms.length);
      return wantTerms === haveTerms
      // for (let i = 0; i < ptrs.length; i += 1) {
      //   let [n, start, end] = ptrs[i]
      //   // it's not the start
      //   if (n !== i || start !== 0) {
      //     return false
      //   }
      //   // it's too short
      //   if (document[n].length > end) {
      //     return false
      //   }
      // }
      // return true
    },

    // return the nth elem of a doc
    getNth: function (n) {
      if (typeof n === 'number') {
        return this.eq(n)
      } else if (typeof n === 'string') {
        return this.if(n)
      }
      return this
    }

  };
  utils.group = utils.groups;
  utils.fullSentence = utils.fullSentences;
  utils.sentence = utils.fullSentences;
  utils.lastTerm = utils.lastTerms;
  utils.firstTerm = utils.firstTerms;

  const methods$n = { ...utils, ...fns$4, ...loops };

  // aliases
  methods$n.get = methods$n.eq;

  class View {
    constructor(document, pointer, groups = {}) {
      // invisible props
      const props = [
        ['document', document],
        ['world', tmpWrld],
        ['_groups', groups],
        ['_cache', null],
        ['viewType', 'View'],
      ];
      props.forEach(a => {
        Object.defineProperty(this, a[0], {
          value: a[1],
          writable: true,
        });
      });
      this.ptrs = pointer;
    }
    /* getters:  */
    get docs() {
      let docs = this.document;
      if (this.ptrs) {
        docs = tmpWrld.methods.one.getDoc(this.ptrs, this.document);
      }
      return docs
    }
    get pointer() {
      return this.ptrs
    }
    get methods() {
      return this.world.methods
    }
    get model() {
      return this.world.model
    }
    get hooks() {
      return this.world.hooks
    }
    get isView() {
      return true //this comes in handy sometimes
    }
    // is the view not-empty?
    get found() {
      return this.docs.length > 0
    }
    // how many matches we have
    get length() {
      return this.docs.length
    }
    // return a more-hackable pointer
    get fullPointer() {
      const { docs, ptrs, document } = this;
      // compute a proper pointer, from docs
      const pointers = ptrs || docs.map((_d, n) => [n]);
      // do we need to repair it, first?
      return pointers.map(a => {
        // eslint-disable-next-line prefer-const
        let [n, start, end, id, endId] = a;
        start ||= 0;
        end ||= (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n]?.[start]) {
          id ||= document[n][start].id;
          if (document[n][end - 1]) {
            endId ||= document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer?.length > 0) {
        // only keep cache if it's a full-sentence
        const cache = [];
        pointer.forEach((ptr, i) => {
          const [n, start, end] = ptr;
          if (ptr.length === 1) {
            cache[i] = this._cache[n];
          } else if (start === 0 && this.document[n].length === end) {
            cache[i] = this._cache[n];
          }
        });
        if (cache.length > 0) {
          m._cache = cache;
        }
      }
      m.world = this.world;
      return m
    }
    // create a new View, from this one
    toView(pointer) {
      return new View(this.document, pointer || this.pointer)
    }
    fromText(input) {
      const { methods } = this;
      //assume ./01-tokenize is installed
      const document = methods.one.tokenize.fromString(input, this.world);
      const doc = new View(document);
      doc.world = this.world;
      doc.compute(['normal', 'freeze', 'lexicon']);
      if (this.world.compute.preTagger) {
        doc.compute('preTagger');
      }
      doc.compute('unfreeze');
      return doc
    }
    clone() {
      // clone the whole document
      let document = this.document.slice(0); //node 17: structuredClone(document);
      document = document.map(terms => {
        return terms.map(term => {
          term = { ...term };
          term.tags = new Set(term.tags);
          return term
        })
      });
      // clone only sub-document ?
      const m = this.update(this.pointer);
      m.document = document;
      m._cache = this._cache; //clone this too?
      return m
    }
  }
  Object.assign(View.prototype, methods$n);

  var version$1 = '14.19.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isUnsafeKey = key => key === '__proto__' || key === 'constructor' || key === 'prototype';

  // recursive merge of objects
  function mergeDeep(model, plugin) {
    if (isObject$6(plugin)) {
      for (const key in plugin) {
        // prevent prototype pollution
        if (isUnsafeKey(key)) {
          continue
        }
        if (isObject$6(plugin[key])) {
          if (!model[key]) Object.assign(model, { [key]: {} });
          mergeDeep(model[key], plugin[key]); //recursion
        } else {
          Object.assign(model, { [key]: plugin[key] });
        }
      }
    }
    return model
  }
  // const merged = mergeDeep({ a: 1 }, { b: { c: { d: { e: 12345 } } } })
  // console.dir(merged, { depth: 5 })

  // vroom
  function mergeQuick(model, plugin) {
    for (const key in plugin) {
      if (isUnsafeKey(key)) continue
      model[key] ||= {};
      Object.assign(model[key], plugin[key]);
    }
    return model
  }

  const addIrregulars = function (model, conj) {
    const m = model.two.models || {};
    Object.keys(conj).forEach(k => {
      // verb forms
      if (conj[k].pastTense) {
        if (m.toPast) {
          m.toPast.ex[k] = conj[k].pastTense;
        }
        if (m.fromPast) {
          m.fromPast.ex[conj[k].pastTense] = k;
        }
      }
      if (conj[k].presentTense) {
        if (m.toPresent) {
          m.toPresent.ex[k] = conj[k].presentTense;
        }
        if (m.fromPresent) {
          m.fromPresent.ex[conj[k].presentTense] = k;
        }
      }
      if (conj[k].gerund) {
        if (m.toGerund) {
          m.toGerund.ex[k] = conj[k].gerund;
        }
        if (m.fromGerund) {
          m.fromGerund.ex[conj[k].gerund] = k;
        }
      }
      // adjective forms
      if (conj[k].comparative) {
        if (m.toComparative) {
          m.toComparative.ex[k] = conj[k].comparative;
        }
        if (m.fromComparative) {
          m.fromComparative.ex[conj[k].comparative] = k;
        }
      }
      if (conj[k].superlative) {
        if (m.toSuperlative) {
          m.toSuperlative.ex[k] = conj[k].superlative;
        }
        if (m.fromSuperlative) {
          m.fromSuperlative.ex[conj[k].superlative] = k;
        }
      }
    });
  };

  const extend = function (plugin, world, View, nlp) {
    // support array of plugins
    if (Array.isArray(plugin)) {
      plugin.forEach(p => extend(p, world, View, nlp));
      return
    }
    const { methods, model, compute, hooks } = world;
    if (plugin.methods) {
      mergeQuick(methods, plugin.methods);
    }
    if (plugin.model) {
      mergeDeep(model, plugin.model);
    }
    if (plugin.irregulars) {
      addIrregulars(model, plugin.irregulars);
    }
    // shallow-merge compute
    if (plugin.compute) {
      Object.assign(compute, plugin.compute);
    }
    // append new hooks
    if (hooks) {
      world.hooks = hooks.concat(plugin.hooks || []);
    }
    // assign new class methods
    if (plugin.api) {
      plugin.api(View);
    }
    if (plugin.lib) {
      Object.keys(plugin.lib).forEach(k => (nlp[k] = plugin.lib[k]));
    }
    if (plugin.tags) {
      nlp.addTags(plugin.tags);
    }
    if (plugin.words) {
      nlp.addWords(plugin.words);
    }
    if (plugin.frozen) {
      nlp.addWords(plugin.frozen, true);
    }
    if (plugin.mutate) {
      plugin.mutate(world, nlp);
    }
  };

  // Shared CLI colors and styles.
  const color = code => s => '\x1b[' + code + 'm' + s + '\x1b[0m';

  const green = color(32);
  const red = color(31);
  const blue = color(34);
  const magenta = color(35);
  const cyan = color(36);
  const yellow = color(33);
  const black = color(30);
  const white = color(37);
  const dim = color(2);
  const i$1 = color(3);
  const b = color(1);
  const ul = color(4);
  const grey = color(90);

  var cli$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    b: b,
    black: black,
    blue: blue,
    cyan: cyan,
    dim: dim,
    green: green,
    grey: grey,
    i: i$1,
    magenta: magenta,
    red: red,
    ul: ul,
    white: white,
    yellow: yellow
  });

  const env = globalThis.process?.env ?? globalThis.env ?? {};
  const debug$3 = { tags: Boolean(env.DEBUG_TAGS) };

  // Capture only the requested terms, and only while tracing.
  const before$1 = term => {
    if (debug$3.tags && (!debug$3.word || debug$3.word === (term.normal || term.text || term.implicit || '').toLowerCase())) {
      return [...term.tags]
    }
    return null
  };

  // Show actual changes, including conflict removals.
  const log = (term, previous, reason = '') => {
    if (!previous) {
      return
    }
    const added = [...term.tags].filter(tag => !previous.includes(tag));
    const removed = previous.filter(tag => !term.tags.has(tag));
    if (!added.length && !removed.length) {
      return
    }
    const text = term.text || term.implicit || '';
    const index = term.index?.join(':') || '?';
    const prefix = debug$3.prefix || '   ';
    if (debug$3.rule !== reason) {
      const headingPrefix = debug$3.prefix ? prefix.replace('│  ', '│ ') : '  ';
      console.log(`${headingPrefix}${dim(white((reason || 'tag change') + ':'))}`); // eslint-disable-line no-console
      debug$3.rule = reason;
    }
    const print = (tags, sign, color) => {
      if (!tags.length) {
        return
      }
      const word = color(`'${text}'`);
      const changes = tags.map(tag => color(`#${tag}`)).join(' ');
      console.log(`${prefix}${color(sign)} ${word} ${dim(index.padEnd(9))} ${changes}`); // eslint-disable-line no-console
    };
    print(removed, '−', red);
    print(added, '+', green);
  };

  debug$3.before = before$1;
  debug$3.log = log;

  // Install only while verbose matching is enabled; restore the original hot path.
  const matchDebug = (world, options) => {
    const one = world.methods.one;
    const match = one.match;
    const parse = one.parseMatch;
    const sources = new WeakMap();
    const word = options.word?.toLowerCase();
    const includesWord = terms =>
      !word || terms.some(term => (term.normal || term.text || term.implicit || '').toLowerCase() === word);

    const parseLogged = function (...args) {
      const regs = parse.apply(this, args);
      sources.set(regs, String(args[0]));
      return regs
    };
    const matchLogged = function (docs, todo, cache) {
      const result = match.call(this, docs, todo, cache);
      const pattern = todo.match || sources.get(todo.regs) || '[parsed pattern]';
      if (options.pattern !== undefined && pattern !== options.pattern) {
        return result
      }
      if (word && !docs.some(includesWord)) {
        return result
      }
      const matches = result.ptrs
        .map(([n, start, end]) => docs[n].slice(start, end))
        .filter(includesWord);
      if (word && result.ptrs.length && !matches.length) {
        return result
      }
      debug$3.rule = undefined;
      const status = result.ptrs.length ? green('✓') : red('✗');
      const spans = matches.map(terms => {
        const text = terms.map(term => term.text || term.implicit).join(' ');
        return `${green("'" + text + "'")} ${dim(terms[0]?.index?.join(':') || '?')}`
      }).join(', ');
      const rule = pattern.length > 80 ? pattern.slice(0, 79) + '…' : pattern;
      const words = spans ? spans + '  ' : ' ---         ';
      console.log(`${debug$3.prefix || '   '}${status} ${words}${dim(i$1(rule))}`); // eslint-disable-line no-console
      return result
    };
    one.parseMatch = parseLogged;
    one.match = matchLogged;
    return () => {
      // Do not overwrite a plugin's replacement installed during tracing.
      if (one.parseMatch === parseLogged) {
        one.parseMatch = parse;
      }
      if (one.match === matchLogged) {
        one.match = match;
      }
    }
  };

  const colorSpec = doc => {
    return doc.docs
      .map((terms, index) => {
        const plain = terms
          .map(t => t.pre + t.text + t.post)
          .join('')
          .trim();
        const text = dim("'" + plain + "'");
        const spec = doc.update([[index]]).out('spec');
        return text + grey(i$1(spec.slice(plain.length)))
      })
      .join('\n')
  };

  // Trace the actual pipeline once, including the initial tokenized document.
  const hooksDebug = headings => (doc, hooks) => {
    const width = Math.max('tokenize'.length, ...hooks.map(hook => hook.length));
    const snapshot = (hook, nested = false) => {
      const output = colorSpec(doc);
      output.split('\n').forEach((line, index, lines) => {
        if (nested) {
          const branch = index === lines.length - 1 ? ' ╰─' : '│ ';
          console.log(`  ${dim(branch)} ${line}`); // eslint-disable-line no-console
          return
        }
        const label = (index === 0 ? hook : '').padEnd(width);
        console.log(`  ${dim(label)}  ${line}`); // eslint-disable-line no-console
      });
    };
    snapshot('tokenize');
    hooks.forEach(hook => {
      const nested = headings;
      const prefix = debug$3.prefix;
      const rule = debug$3.rule;
      debug$3.rule = undefined;
      if (nested) {
        console.log(`  ${blue(b(ul(hook + ':')))}`); // eslint-disable-line no-console
        debug$3.prefix = dim('   │  ');
      }
      // Restore the log prefix even when a plugin hook throws.
      try {
        doc.compute(hook);
        snapshot(hook, nested);
      } finally {
        debug$3.prefix = prefix;
        debug$3.rule = rule;
      }
    });
  };

  let restoreMatch;

  /** log the decision-making to console */
  const verbose = function (set = true, options = {}) {
    restoreMatch?.();
    restoreMatch = undefined;
    if (set === 'match' || set === true) {
      restoreMatch = matchDebug(this._world, options);
    }
    const env = globalThis.process?.env ?? globalThis.env ?? {}; //use window, in browser
    debug$3.hooks = set === 'hooks' || set === true ? hooksDebug(set === true) : undefined;
    debug$3.word = options.word?.toLowerCase();
    debug$3.contractions = set === 'contractions' || set === true;
    debug$3.rule = undefined;
    debug$3.tags = set === 'tagger' || set === true;
    env.DEBUG_TAGS = debug$3.tags ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (Array.isArray(term.tags)) {
          term.tags = new Set(term.tags);
        }
        return term
      })
    })
  };

  // interpret an array-of-arrays
  const preTokenized = function (arr) {
    return arr.map((a) => {
      return a.map(str => {
        return {
          text: str,
          normal: str,//cleanup
          pre: '',
          post: ' ',
          tags: new Set()
        }
      })
    })
  };

  const inputs = function (input, View, world) {
    const { methods } = world;
    const doc = new View([]);
    doc.world = world;
    // support a number
    if (typeof input === 'number') {
      input = String(input);
    }
    // return empty doc
    if (!input) {
      return doc
    }
    // parse a string
    if (typeof input === 'string') {
      const document = methods.one.tokenize.fromString(input, world);
      return new View(document)
    }
    // handle compromise View
    if (isObject$5(input) && input.isView) {
      return new View(input.document, input.ptrs)
    }
    // handle json input
    if (Array.isArray(input)) {
      // pre-tokenized array-of-arrays 
      if (Array.isArray(input[0])) {
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = { ...tmpWrld };

  const nlp = function nlp(input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      if (debug$3.hooks) {
        debug$3.hooks(doc, world.hooks);
      } else {
        doc.compute(world.hooks);
      }
    }
    return doc
  };
  Object.defineProperty(nlp, '_world', {
    value: world,
    writable: true,
  });

  /** don't run the POS-tagger */
  nlp.tokenize = function (input, lex) {
    const { compute } = this._world;
    // add user-given words to lexicon
    if (lex) {
      nlp.addWords(lex);
    }
    // run the tokenizer
    const doc = inputs(input, View, world);
    // give contractions a shot, at least
    if (debug$3.hooks) {
      debug$3.hooks(doc, compute.contractions ? ['alias', 'normal', 'machine', 'contractions'] : []);
    } else if (compute.contractions) {
      doc.compute(['alias', 'normal', 'machine', 'contractions']); //run it if we've got it
    }
    return doc
  };

  /** extend compromise functionality */
  nlp.plugin = function (plugin) {
    extend(plugin, this._world, View, this);
    return this
  };
  nlp.extend = nlp.plugin;

  /** reach-into compromise internals */
  nlp.world = function () {
    return this._world
  };
  nlp.model = function () {
    return this._world.model
  };
  nlp.methods = function () {
    return this._world.methods
  };
  nlp.hooks = function () {
    return this._world.hooks
  };

  // log the decision-making to console
  nlp.verbose = verbose;
  // current library release version
  nlp.version = version$1;

  const createCache = function (document) {
    const cache = document.map(terms => {
      const items = new Set();
      terms.forEach(term => {
        // add words
        if (term.normal !== '') {
          items.add(term.normal);
        }
        // cache switch-status - '%Noun|Verb%'
        if (term.switch) {
          items.add(`%${term.switch}%`);
        }
        // cache implicit words, too
        if (term.implicit) {
          items.add(term.implicit);
        }
        if (term.machine) {
          items.add(term.machine);
        }
        if (term.root) {
          items.add(term.root);
        }
        // cache slashes words, etc
        if (term.alias) {
          term.alias.forEach(str => items.add(str));
        }
        term.tags.forEach(tag => {
          items.add('#' + tag);
        });
      });
      return items
    });
    return cache
  };

  var methods$m = {
    one: {
      cacheDoc: createCache,
    },
  };

  const methods$l = {
    /** */
    cache: function () {
      this._cache = this.methods.one.cacheDoc(this.document);
      return this
    },
    /** */
    uncache: function () {
      this._cache = null;
      return this
    },
  };
  const addAPI$3 = function (View) {
    Object.assign(View.prototype, methods$l);
  };

  var compute$6 = {
    cache: function (view) {
      view._cache = view.methods.one.cacheDoc(view.document);
    }
  };

  var cache$1 = {
    api: addAPI$3,
    compute: compute$6,
    methods: methods$m,
  };

  var caseFns = {
    /** */
    toLowerCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toLowerCase();
      });
      return this
    },
    /** */
    toUpperCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.toUpperCase();
      });
      return this
    },
    /** */
    toTitleCase: function () {
      this.termList().forEach(t => {
        t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
      });
      return this
    },
    /** */
    toCamelCase: function () {
      this.docs.forEach(terms => {
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, x => x.toUpperCase()); //support unicode?
          }
          if (i !== terms.length - 1) {
            t.post = '';
          }
        });
      });
      return this
    },
  };

  // case logic
  const isTitleCase$2 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase$1 = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase$1 = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // splice an array into an array
  const spliceArr = (parent, index, child) => {
    // tag them as dirty
    child.forEach(term => term.dirty = true);
    if (parent) {
      parent.splice(index, 0, ...child);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms.at(-1);
    if (lastTerm && !hasSpace.test(lastTerm.post) && !hasDash.test(lastTerm.post)) {
      lastTerm.post += ' ';
    }
  };

  // sentence-ending punctuation should move in append
  const movePunct = (source, end, needle) => {
    const juicy = /[-.?!,;:)–—'"]/g;
    const wasLast = source[end - 1];
    if (!wasLast) {
      return
    }
    const post = wasLast.post;
    if (juicy.test(post)) {
      const punct = post.match(juicy).join(''); //not perfect
      const last = needle.at(-1);
      last.post = punct + last.post;
      // remove it, from source
      wasLast.post = wasLast.post.replace(juicy, '');
    }
  };


  const moveTitleCase = function (home, start, needle) {
    const from = home[start];
    // should we bother?
    if (start !== 0 || !isTitleCase$2(from.text)) {
      return
    }
    // titlecase new first term
    needle[0].text = toTitleCase$1(needle[0].text);
    // should we un-titlecase the old word?
    const old = home[start];
    if (old.tags.has('ProperNoun') || old.tags.has('Acronym')) {
      return
    }
    if (isTitleCase$2(old.text) && old.text.length > 1) {
      old.text = toLowerCase$1(old.text);
    }
  };

  // put these words before the others
  const cleanPrepend = function (home, ptr, needle, document) {
    const [n, start, end] = ptr;
    // introduce spaces appropriately
    if (start === 0) {
      // at start - need space in insert
      endSpace(needle);
    } else if (end === document[n].length) {
      // at end - need space in home
      endSpace(needle);
    } else {
      // in middle - need space in home and insert
      endSpace(needle);
      endSpace([home[ptr[1]]]);
    }
    moveTitleCase(home, start, needle);
    // movePunct(home, end, needle)
    spliceArr(home, start, needle);
  };

  const cleanAppend = function (home, ptr, needle, document) {
    const [n, , end] = ptr;
    const total = (document[n] || []).length;
    if (end < total) {
      // are we in the middle?
      // add trailing space on self
      movePunct(home, end, needle);
      endSpace(needle);
    } else if (total === end) {
      // are we at the end?
      // add a space to predecessor
      endSpace(home);
      // very end, move period
      movePunct(home, end, needle);
      // is there another sentence after?
      if (document[n + 1]) {
        needle.at(-1).post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle.at(-1).id;
  };

  /*
  unique & ordered term ids, based on time & term index

  Base 36 (numbers+ascii)
    3 digit 4,600
    2 digit 1,200
    1 digit 36

    TTT|NNN|II|R

  TTT -> 46 terms since load
  NNN -> 46 thousand sentences (>1 inf-jest)
  II  -> 1,200 words in a sentence (nuts)
  R   -> 1-36 random number 

  novels: 
    avg 80,000 words
      15 words per sentence
    5,000 sentences

  Infinite Jest:
    36,247 sentences
    https://en.wikipedia.org/wiki/List_of_longest_novels

  collisions are more-likely after
      46 seconds have passed,
    and 
      after 46-thousand sentences

  */
  let index$1 = 0;

  const pad3 = (str) => {
    str = str.length < 3 ? '0' + str : str;
    return str.length < 3 ? '0' + str : str
  };

  const toId = function (term) {
    let [n, i] = term.index || [0, 0];
    index$1 += 1;

    //don't overflow index
    index$1 = index$1 > 46655 ? 0 : index$1;
    //don't overflow sentences
    n = n > 46655 ? 0 : n;
    // //don't overflow terms
    i = i > 1294 ? 0 : i;

    // 3 digits for time
    let id = pad3(index$1.toString(36));
    // 3 digit  for sentence index (46k)
    id += pad3(n.toString(36));

    // 1 digit for term index (36)
    let tx = i.toString(36);
    tx = tx.length < 2 ? '0' + tx : tx; //pad2
    id += tx;

    // 1 digit random number
    const r = parseInt(Math.random() * 36, 10);
    id += (r).toString(36);

    return term.normal + '|' + id.toUpperCase()
  };

  // setInterval(() => console.log(toId(4, 12)), 100)

  // are we inserting inside a contraction?
  // expand it first
  const expand$1 = function (m) {
    if (m.has('@hasContraction') && typeof m.contractions === 'function') {
      //&& m.after('^.').has('@hasContraction')
      const more = m.grow('@hasContraction');
      more.contractions().expand();
    }
  };

  // set new ids for each terms
  const addIds$2 = function (terms) {
    terms = terms.map(term => {
      term.id = toId(term);
      return term
    });
    return terms
  };

  const getTerms = function (input, world) {
    const { methods } = world;
    // create our terms from a string
    if (typeof input === 'string') {
      return methods.one.tokenize.fromString(input, world)[0] //assume one sentence
    }
    //allow a view object
    if (typeof input === 'object' && input.isView) {
      return input.clone().docs[0] || [] //assume one sentence
    }
    //allow an array of terms, too
    if (Array.isArray(input)) {
      return Array.isArray(input[0]) ? input[0] : input
    }
    return []
  };

  const insert = function (input, view, prepend) {
    const { document, world } = view;
    view.uncache();
    // insert words at end of each doc
    const ptrs = view.fullPointer;
    const selfPtrs = view.fullPointer;
    view.forEach((m, i) => {
      const ptr = m.fullPointer[0];
      const [n] = ptr;
      // add-in the words
      const home = document[n];
      let terms = getTerms(input, world);
      // are we inserting nothing?
      if (terms.length === 0) {
        return
      }
      terms = addIds$2(terms);
      if (prepend) {
        expand$1(view.update([ptr]).firstTerm());
        cleanPrepend(home, ptr, terms, document);
      } else {
        expand$1(view.update([ptr]).lastTerm());
        cleanAppend(home, ptr, terms, document);
      }
      // harden the pointer
      if (document[n]?.[ptr[1]]) {
        ptr[3] = document[n][ptr[1]].id;
      }
      // change self backwards by len
      selfPtrs[i] = ptr;
      // extend the pointer
      ptr[2] += terms.length;
      ptrs[i] = ptr;
    });
    const doc = view.toView(ptrs);
    // shift our self pointer, if necessary
    view.ptrs = selfPtrs;
    // try to tag them, too
    doc.compute(['id', 'index', 'freeze', 'lexicon']);
    if (doc.world.compute.preTagger) {
      doc.compute('preTagger');
    }
    doc.compute('unfreeze');
    return doc
  };

  const fns$3 = {
    insertAfter: function (input) {
      return insert(input, this, false)
    },
    insertBefore: function (input) {
      return insert(input, this, true)
    },
  };
  fns$3.append = fns$3.insertAfter;
  fns$3.prepend = fns$3.insertBefore;
  fns$3.insert = fns$3.insertAfter;

  const dollarStub = /\$[0-9a-z]+/g;
  const fns$2 = {};

  // case logic
  const isTitleCase$1 = (str) => /^\p{Lu}[\p{Ll}'’]/u.test(str) || /^\p{Lu}$/u.test(str);
  const toTitleCase = (str) => str.replace(/^\p{Ll}/u, x => x.toUpperCase());
  const toLowerCase = (str) => str.replace(/^\p{Lu}/u, x => x.toLowerCase());

  // doc.replace('foo', (m)=>{})
  const replaceByFn = function (main, fn, keep) {
    main.forEach(m => {
      const out = fn(m);
      m.replaceWith(out, keep);
    });
    return main
  };

  // support 'foo $0' replacements
  const subDollarSign = function (input, main) {
    if (typeof input !== 'string') {
      return input
    }
    const groups = main.groups();
    input = input.replace(dollarStub, a => {
      const num = a.replace(/\$/, '');
      if (Object.hasOwn(groups, num)) {
        return groups[num].text()
      }
      return a
    });
    return input
  };

  fns$2.replaceWith = function (input, keep = {}) {
    let ptrs = this.fullPointer;
    // support keep-all option
    if (keep === true) {
      keep = {
        tags: true,
        case: true,
        possessives: true,
      };
    }
    const main = this;
    this.uncache();
    if (typeof input === 'function') {
      return replaceByFn(main, input, keep)
    }
    const terms = main.docs[0];
    if (!terms) return main
    const isOriginalPossessive = keep.possessives && terms.at(-1).tags.has('Possessive');
    const isOriginalTitleCase = keep.case && isTitleCase$1(terms[0].text);
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    const original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    const originalPre = original.docs[0][0].pre;
    const originalPost = original.docs[0].at(-1).post;
    // slide this in
    if (typeof input === 'string') {
      input = this.fromText(input).compute('id');
    }
    main.insertAfter(input);
    // are we replacing part of a contraction?
    if (original.has('@hasContraction') && main.contractions) {
      const more = main.grow('@hasContraction+');
      more.contractions().expand();
    }
    // delete the original terms
    main.delete(original); //science.

    // keep "John's"
    if (isOriginalPossessive) {
      const tmp = main.docs[0];
      const term = tmp.at(-1);
      if (!term.tags.has('Possessive')) {
        term.text += "'s";
        term.normal += "'s";
        term.tags.add('Possessive');
      }
    }

    // try to keep some pre-punctuation
    if (originalPre && main.docs[0]) {
      main.docs[0][0].pre = originalPre;
    }
    // try to keep any post-punctuation
    if (originalPost && main.docs[0]) {
      const lastOne = main.docs[0].at(-1);
      if (!lastOne.post.trim()) {
        lastOne.post = originalPost;
      }
    }
    // what should we return?
    const m = main.toView(ptrs).compute(['index', 'freeze', 'lexicon']);
    if (m.world.compute.preTagger) {
      m.compute('preTagger');
    }
    m.compute('unfreeze');
    // replace any old tags
    if (keep.tags) {
      // truncate old tags to only touch new terms
      oldTags = oldTags.slice(0, input.wordCount());
      m.terms().forEach((term, i) => {
        term.tagSafe(oldTags[i]);
      });
    }

    if (!m.docs[0] || !m.docs[0][0]) return m

    // try to co-erce case, too
    if (keep.case) {
      const transformCase = isOriginalTitleCase ? toTitleCase : toLowerCase;
      m.docs[0][0].text = transformCase(m.docs[0][0].text);
    }
    return m
  };

  fns$2.replace = function (match, input, keep) {
    if (match && !input) {
      return this.replaceWith(match, keep)
    }
    const m = this.match(match);
    if (!m.found) {
      return this
    }
    this.soften();
    return m.replaceWith(input, keep)
  };

  // Remove only the first qualifying run, matching String.replace without /g.
  const removeRunBefore = (str, run, following) => {
    let i = 0;
    while (i < str.length) {
      if (!run.includes(str[i])) {
        i++;
        continue
      }
      const start = i;
      while (i < str.length && run.includes(str[i])) i++;
      if (i < str.length && following.includes(str[i])) {
        return str.slice(0, start) + str.slice(i)
      }
    }
    return str
  };

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = removeRunBefore(to.post, ' ', '.?!,;:');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = removeRunBefore(to.post, ',;:', '.?!');
    }
  };

  // remove terms from document json
  const pluckOut = function (document, nots) {
    nots.forEach(ptr => {
      const [n, start, end] = ptr;
      const len = end - start;
      if (!document[n]) {
        return // weird!
      }
      if (end === document[n].length && end > 1) {
        repairPunct(document[n], len);
      }
      document[n].splice(start, len); // replaces len terms at index start
    });
    // remove any now-empty sentences
    // (foreach + splice = 'mutable filter')
    for (let i = document.length - 1; i >= 0; i -= 1) {
      if (document[i].length === 0) {
        document.splice(i, 1);
        // remove any trailing whitespace before our removed sentence
        if (i === document.length && document[i - 1]) {
          const terms = document[i - 1];
          const lastTerm = terms.at(-1);
          if (lastTerm) {
            lastTerm.post = lastTerm.post.trimEnd();
          }
        }
        // repair any downstream indexes
        // for (let k = i; k < document.length; k += 1) {
        //   document[k].forEach(term => term.index[0] -= 1)
        // }
      }
    }
    return document
  };

  const fixPointers$1 = function (ptrs, gonePtrs) {
    ptrs = ptrs.map(ptr => {
      const [n] = ptr;
      if (!gonePtrs[n]) {
        return ptr
      }
      gonePtrs[n].forEach(no => {
        const len = no[2] - no[1];
        // does it effect our pointer?
        if (ptr[1] <= no[1] && ptr[2] >= no[2]) {
          ptr[2] -= len;
        }
      });
      return ptr
    });

    // decrement any pointers after a now-empty pointer
    ptrs.forEach((ptr, i) => {
      // is the pointer now empty?
      if (ptr[1] === 0 && ptr[2] == 0) {
        // go down subsequent pointers
        for (let n = i + 1; n < ptrs.length; n += 1) {
          ptrs[n][0] -= 1;
          if (ptrs[n][0] < 0) {
            ptrs[n][0] = 0;
          }
        }
      }
    });
    // remove any now-empty pointers
    ptrs = ptrs.filter(ptr => ptr[2] - ptr[1] > 0);

    // remove old hard-pointers
    ptrs = ptrs.map((ptr) => {
      ptr[3] = null;
      ptr[4] = null;
      return ptr
    });
    return ptrs
  };

  const methods$k = {
    /** */
    remove: function (reg) {
      const { indexN } = this.methods.one.pointer;
      this.uncache();
      // two modes:
      //  - a. remove self, from full parent
      let self = this.all();
      let not = this;
      //  - b. remove a match, from self
      if (reg) {
        self = this;
        not = this.match(reg);
      }
      const isFull = !self.ptrs;
      // is it part of a contraction?
      if (not.has('@hasContraction') && not.contractions) {
        const more = not.grow('@hasContraction');
        more.contractions().expand();
      }

      let ptrs = self.fullPointer;
      const nots = not.fullPointer.reverse();
      // remove them from the actual document)
      const document = pluckOut(this.document, nots);
      // repair our pointers
      const gonePtrs = indexN(nots);
      ptrs = fixPointers$1(ptrs, gonePtrs);
      // clean up our original inputs
      self.ptrs = ptrs;
      self.document = document;
      self.compute('index');
      // if we started zoomed-out, try to end zoomed-out
      if (isFull) {
        self.ptrs = undefined;
      }
      if (!reg) {
        this.ptrs = [];
        return self.none()
      }
      const res = self.toView(ptrs); //return new document
      return res
    },
  };

  // aliases
  methods$k.delete = methods$k.remove;

  const methods$j = {
    /** add this punctuation or whitespace before each match: */
    pre: function (str, concat) {
      if (str === undefined && this.found) {
        return this.docs[0][0].pre
      }
      this.docs.forEach(terms => {
        const term = terms[0];
        if (concat === true) {
          term.pre += str;
        } else {
          term.pre = str;
        }
      });
      return this
    },

    /** add this punctuation or whitespace after each match: */
    post: function (str, concat) {
      if (str === undefined) {
        const last = this.docs.at(-1);
        return last.at(-1).post
      }
      this.docs.forEach(terms => {
        const term = terms.at(-1);
        if (concat === true) {
          term.post += str;
        } else {
          term.post = str;
        }
      });
      return this
    },

    /** remove whitespace from start/end */
    trim: function () {
      if (!this.found) {
        return this
      }
      const docs = this.docs;
      const start = docs[0][0];
      start.pre = start.pre.trimStart();
      const last = docs.at(-1);
      const end = last.at(-1);
      end.post = end.post.trimEnd();
      return this
    },

    /** connect words with hyphen, and remove whitespace */
    hyphenate: function () {
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach((t, i) => {
          if (i !== 0) {
            t.pre = '';
          }
          if (terms[i + 1]) {
            t.post = '-';
          }
        });
      });
      return this
    },

    /** remove hyphens between words, and set whitespace */
    dehyphenate: function () {
      const hasHyphen = /[-–—]/;
      this.docs.forEach(terms => {
        //remove whitespace
        terms.forEach(t => {
          if (hasHyphen.test(t.post)) {
            t.post = ' ';
          }
        });
      });
      return this
    },

    /** add quotations around these matches */
    toQuotations: function (start, end) {
      start ||= `"`;
      end ||= `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms.at(-1);
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start ||= `(`;
      end ||= `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms.at(-1);
        last.post = end + last.post;
      });
      return this
    },
  };

  // aliases
  methods$j.deHyphenate = methods$j.dehyphenate;
  methods$j.toQuotation = methods$j.toQuotations;

  /** alphabetical order */
  const alpha = (a, b) => {
    if (a.normal < b.normal) {
      return -1
    }
    if (a.normal > b.normal) {
      return 1
    }
    return 0
  };

  /** count the # of characters of each match */
  const length = (a, b) => {
    const left = a.normal.trim().length;
    const right = b.normal.trim().length;
    if (left < right) {
      return 1
    }
    if (left > right) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const wordCount$1 = (a, b) => {
    if (a.words < b.words) {
      return 1
    }
    if (a.words > b.words) {
      return -1
    }
    return 0
  };

  /** count the # of terms in each match */
  const sequential = (a, b) => {
    if (a[0] < b[0]) {
      return 1
    }
    if (a[0] > b[0]) {
      return -1
    }
    return a[1] > b[1] ? 1 : -1
  };

  /** sort by # of duplicates in the document*/
  const byFreq = function (arr) {
    const counts = Object.create(null);
    arr.forEach(o => {
      counts[o.normal] ??= 0;
      counts[o.normal] += 1;
    });
    // sort by freq
    arr.sort((a, b) => {
      const left = counts[a.normal];
      const right = counts[b.normal];
      if (left < right) {
        return 1
      }
      if (left > right) {
        return -1
      }
      return 0
    });
    return arr
  };

  var methods$i = { alpha, length, wordCount: wordCount$1, sequential, byFreq };

  // aliases
  const seqNames = new Set(['index', 'sequence', 'seq', 'sequential', 'chron', 'chronological']);
  const freqNames = new Set(['freq', 'frequency', 'topk', 'repeats']);
  const alphaNames = new Set(['alpha', 'alphabetical']);

  // support function as parameter
  const customSort = function (view, fn) {
    let ptrs = view.fullPointer;
    ptrs = ptrs.sort((a, b) => {
      a = view.update([a]);
      b = view.update([b]);
      return fn(a, b)
    });
    view.ptrs = ptrs; //mutate original
    return view
  };

  /** re-arrange the order of the matches (in place) */
  const sort = function (input) {
    const { docs, pointer } = this;
    this.uncache();
    if (typeof input === 'function') {
      return customSort(this, input)
    }
    input ||= 'alpha';
    const ptrs = pointer || docs.map((_d, n) => [n]);
    let arr = docs.map((terms, n) => {
      return {
        index: n,
        words: terms.length,
        normal: terms.map(t => t.machine || t.normal || '').join(' '),
        pointer: ptrs[n],
      }
    });
    // 'chronological' sorting
    if (seqNames.has(input)) {
      input = 'sequential';
    }
    // alphabetical sorting
    if (alphaNames.has(input)) {
      input = 'alpha';
    }
    // sort by frequency
    if (freqNames.has(input)) {
      arr = methods$i.byFreq(arr);
      return this.update(arr.map(o => o.pointer))
    }
    // apply sort method on each phrase
    if (typeof methods$i[input] === 'function') {
      arr = arr.sort(methods$i[input]);
      return this.update(arr.map(o => o.pointer))
    }
    return this
  };

  /** reverse the order of the matches, but not the words or index */
  const reverse$1 = function () {
    let ptrs = this.pointer || this.docs.map((_d, n) => [n]);
    ptrs = [].concat(ptrs);
    ptrs = ptrs.reverse();
    if (this._cache) {
      this._cache = this._cache.reverse();
    }
    return this.update(ptrs)
  };

  /** remove any duplicate matches */
  const unique = function () {
    const already = new Set();
    const res = this.filter(m => {
      const txt = m.text('machine');
      if (already.has(txt)) {
        return false
      }
      already.add(txt);
      return true
    });
    // this.ptrs = res.ptrs //mutate original?
    return res//.compute('index')
  };

  var sort$1 = { unique, reverse: reverse$1, sort };

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs.at(-1);
      const last = end.at(-1);
      if (/ /.test(last.post) === false) {
        last.post += ' ';
      }
    }
    homeDocs = homeDocs.concat(inputDocs);
    return homeDocs
  };

  const combineViews = function (home, input) {
    // is it a view from the same document?
    if (home.document === input.document) {
      const ptrs = home.fullPointer.concat(input.fullPointer);
      return home.toView(ptrs).compute('index')
    }
    // update n of new pointer, to end of our pointer
    const ptrs = input.fullPointer;
    ptrs.forEach(a => {
      a[0] += home.document.length;
    });
    home.document = combineDocs(home.document, input.docs);
    return home.all()
  };

  var concat = {
    // add string as new match/sentence
    concat: function (input) {
      // parse and splice-in new terms
      if (typeof input === 'string') {
        const more = this.fromText(input);
        // easy concat
        if (!this.found || !this.ptrs) {
          this.document = this.document.concat(more.document);
        } else {
          // if we are in the middle, this is actually a splice operation
          const ptrs = this.fullPointer;
          const at = ptrs.at(-1)[0];
          this.document.splice(at, 0, ...more.document);
        }
        // put the docs
        return this.all().compute('index')
      }
      // plop some view objects together
      if (typeof input === 'object' && input.isView) {
        return combineViews(this, input)
      }
      // assume it's an array of terms
      if (Array.isArray(input)) {
        const docs = combineDocs(this.document, input);
        this.document = docs;
        return this.all()
      }
      return this
    },
  };

  // add indexes to pointers
  const harden = function () {
    this.ptrs = this.fullPointer;
    return this
  };
  // remove indexes from pointers
  const soften = function () {
    let ptr = this.ptrs;
    if (!ptr || ptr.length === 0) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$h = { ...caseFns, ...fns$3, ...fns$2, ...methods$k, ...methods$j, ...sort$1, ...concat, ...harden$1 };

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$h);
  };

  const compute$5 = {
    id: function (view) {
      const docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          const term = docs[n][i];
          term.id ||= toId(term);
        }
      }
    }
  };

  var change = {
    api: addAPI$2,
    compute: compute$5,
  };

  var contractions$2 = [
    // simple mappings
    { word: '@', out: ['at'] },
    { word: 'arent', out: ['are', 'not'] },
    { word: 'alot', out: ['a', 'lot'] },
    { word: 'brb', out: ['be', 'right', 'back'] },
    { word: 'cannot', out: ['can', 'not'] },
    { word: 'dun', out: ['do', 'not'] },
    { word: "can't", out: ['can', 'not'] },
    { word: "shan't", out: ['should', 'not'] },
    { word: "won't", out: ['will', 'not'] },
    { word: "that's", out: ['that', 'is'] },
    { word: "what's", out: ['what', 'is'] },
    { word: "let's", out: ['let', 'us'] },
    // { word: "there's", out: ['there', 'is'] },
    { word: 'dunno', out: ['do', 'not', 'know'] },
    { word: 'gonna', out: ['going', 'to'] },
    { word: 'gotta', out: ['have', 'got', 'to'] }, //hmm
    { word: 'gimme', out: ['give', 'me'] },
    { word: 'outta', out: ['out', 'of'] },
    { word: 'tryna', out: ['trying', 'to'] },
    { word: 'gtg', out: ['got', 'to', 'go'] },
    { word: 'im', out: ['i', 'am'] },
    { word: 'imma', out: ['I', 'will'] },
    { word: 'imo', out: ['in', 'my', 'opinion'] },
    { word: 'irl', out: ['in', 'real', 'life'] },
    { word: 'ive', out: ['i', 'have'] },
    { word: 'rn', out: ['right', 'now'] },
    { word: 'tbh', out: ['to', 'be', 'honest'] },
    { word: 'wanna', out: ['want', 'to'] },
    { word: `c'mere`, out: ['come', 'here'] },
    { word: `c'mon`, out: ['come', 'on'] },
    // shoulda, coulda
    { word: 'shoulda', out: ['should', 'have'] },
    { word: 'coulda', out: ['coulda', 'have'] },
    { word: 'woulda', out: ['woulda', 'have'] },
    { word: 'musta', out: ['must', 'have'] },

    { word: "tis", out: ['it', 'is'] },
    { word: "twas", out: ['it', 'was'] },
    { word: `y'know`, out: ['you', 'know'] },
    { word: "ne'er", out: ['never'] },
    { word: "o'er", out: ['over'] },
    // contraction-part mappings
    { after: 'll', out: ['will'] },
    { after: 've', out: ['have'] },
    { after: 're', out: ['are'] },
    { after: 'm', out: ['am'] },
    // french contractions
    { before: 'c', out: ['ce'] },
    { before: 'm', out: ['me'] },
    { before: 'n', out: ['ne'] },
    { before: 'qu', out: ['que'] },
    { before: 's', out: ['se'] },
    { before: 't', out: ['tu'] }, // t'aime

    // missing apostrophes
    { word: 'shouldnt', out: ['should', 'not'] },
    { word: 'couldnt', out: ['could', 'not'] },
    { word: 'wouldnt', out: ['would', 'not'] },
    { word: 'hasnt', out: ['has', 'not'] },
    { word: 'wasnt', out: ['was', 'not'] },
    { word: 'isnt', out: ['is', 'not'] },
    { word: 'cant', out: ['can', 'not'] },
    { word: 'dont', out: ['do', 'not'] },
    { word: 'wont', out: ['will', 'not'] },
    // apostrophe d
    { word: 'howd', out: ['how', 'did'] },
    { word: 'whatd', out: ['what', 'did'] },
    { word: 'whend', out: ['when', 'did'] },
    { word: 'whered', out: ['where', 'did'] },
  ];

  // number suffixes that are not units
  const t = true;
  var numberSuffixes = {
    'st': t,
    'nd': t,
    'rd': t,
    'th': t,
    'am': t,
    'pm': t,
    'max': t,
    '°': t,
    's': t, // 1990s
    'e': t, // 18e - french/spanish ordinal
    'er': t, //french 1er
    'ère': t, //''
    'ème': t, //french 2ème
  };

  var model$5 = {
    one: {
      contractions: contractions$2,
      numberSuffixes
    }
  };

  // Log decisions before splicing replaces the original term.
  const contractionDebug = (term, expansion) => {
    if (!debug$3.contractions || (debug$3.word && debug$3.word !== (term.normal || term.text).toLowerCase())) {
      return
    }
    debug$3.rule = undefined;
    const result = expansion ? '[' + expansion.map(word => yellow(`'${word}'`)).join(', ') + ']' : 'possessive (kept)';
    console.log(`${debug$3.prefix || '   '}${yellow(JSON.stringify(term.text))} →  ${result}`); // eslint-disable-line no-console
  };

  // put n new words where 1 word was
  const insertContraction = function (document, point, words) {
    const [n, w] = point;
    if (!words || words.length === 0) {
      return
    }
    words = words.map((word, i) => {
      word.implicit = word.text;
      word.machine = word.text;
      word.pre = '';
      word.post = '';
      word.text = '';
      word.normal = '';
      word.index = [n, w + i];
      return word
    });
    if (words[0]) {
      // move whitespace over
      words[0].pre = document[n][w].pre;
      words[words.length - 1].post = document[n][w].post;
      // add the text/normal to the first term
      words[0].text = document[n][w].text;
      words[0].normal = document[n][w].normal; // move tags too?
    }
    // do the splice
    document[n].splice(w, 1, ...words);
  };

  const hasContraction$1 = /'/;
  //look for a past-tense verb
  // const hasPastTense = (terms, i) => {
  //   let after = terms.slice(i + 1, i + 3)
  //   return after.some(t => t.tags.has('PastTense'))
  // }
  // he'd walked -> had
  // how'd -> did
  // he'd go -> would

  const alwaysDid = new Set([
    'what',
    'how',
    'when',
    'where',
    'why',
  ]);

  // after-words
  const useWould = new Set([
    'be',
    'go',
    'start',
    'think',
    'need',
  ]);

  const useHad = new Set([
    'been',
    'gone'
  ]);
  // they'd gone
  // they'd go


  // he'd been
  //    he had been
  //    he would been

  const _apostropheD = function (terms, i) {
    const before = terms[i].normal.split(hasContraction$1)[0];

    // what'd, how'd
    if (alwaysDid.has(before)) {
      return [before, 'did']
    }
    if (terms[i + 1]) {
      // they'd gone
      if (useHad.has(terms[i + 1].normal)) {
        return [before, 'had']
      }
      // they'd go
      if (useWould.has(terms[i + 1].normal)) {
        return [before, 'would']
      }
    }
    return null
    //   if (hasPastTense(terms, i) === true) {
    //     return [before, 'had']
    //   }
    //   // had/would/did
    //   return [before, 'would']
  };

  //ain't -> are/is not
  const apostropheT = function (terms, i) {
    if (terms[i].normal === "ain't" || terms[i].normal === 'aint') {
      return null //do this in ./two/
    }
    const before = terms[i].normal.replace(/n't/, '');
    return [before, 'not']
  };

  const hasContraction = /'/;
  const isFeminine = /(e|é|aison|sion|tion)$/;
  const isMasculine = /(age|isme|acle|ege|oire)$/;
  // l'amour
  const preL = (terms, i) => {
    // le/la
    const after = terms[i].normal.split(hasContraction)[1];
    // quick french gender disambig (rough)
    if (after && after.endsWith('e')) {
      return ['la', after]
    }
    return ['le', after]
  };

  // d'amerique
  const preD = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
    // quick guess for noun-agreement (rough)
    if (after && isFeminine.test(after) && !isMasculine.test(after)) {
      return ['du', after]
    } else if (after && after.endsWith('s')) {
      return ['des', after]
    }
    return ['de', after]
  };

  // j'aime
  const preJ = (terms, i) => {
    const after = terms[i].normal.split(hasContraction)[1];
    return ['je', after]
  };

  var french = {
    preJ,
    preL,
    preD,
  };

  const isRange = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i;
  const timeRange = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i;
  const phoneNum = /^[0-9]{3}-[0-9]{4}$/;

  const numberRange = function (terms, i) {
    const term = terms[i];
    let parts = term.text.match(isRange);
    if (parts !== null) {
      // 123-1234 is a phone number, not a number-range
      if (term.tags.has('PhoneNumber') === true || phoneNum.test(term.text)) {
        return null
      }
      return [parts[1], 'to', parts[2]]
    } else {
      parts = term.text.match(timeRange);
      if (parts !== null) {
        return [parts[1], 'to', parts[4]]
      }
    }
    return null
  };

  const numUnit = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/; //(must be lowercase)

  const numberUnit = function (terms, i, world) {
    const notUnit = world.model.one.numberSuffixes || {};
    const term = terms[i];
    const parts = term.text.match(numUnit);
    if (parts !== null) {
      // is it a recognized unit, like 'km'?
      const unit = parts[2].toLowerCase().trim();
      // don't split '3rd'
      if (Object.hasOwn(notUnit, unit)) {
        return null
      }
      return [parts[1], unit] //split it
    }
    return null
  };

  const byApostrophe = /'/;
  const numDash = /^[0-9][^-–—]*[-–—].*?[0-9]/;

  // run tagger on our new implicit terms
  const reTag = function (terms, view, start, len) {
    const tmp = view.update();
    tmp.document = [terms];
    // offer to re-tag neighbours, too
    let end = start + len;
    if (start > 0) {
      start -= 1;
    }
    if (terms[end]) {
      end += 1;
    }
    tmp.ptrs = [[0, start, end]];
  };

  const byEnd = {
    // ain't
    t: (terms, i) => apostropheT(terms, i),
    // how'd
    d: (terms, i) => _apostropheD(terms, i),
  };

  const byStart = {
    // j'aime
    j: (terms, i) => french.preJ(terms, i),
    // l'amour
    l: (terms, i) => french.preL(terms, i),
    // d'amerique
    d: (terms, i) => french.preD(terms, i),
  };

  // pull-apart known contractions from model
  const knownOnes = function (list, term, before, after) {
    for (let i = 0; i < list.length; i += 1) {
      const o = list[i];
      // look for word-word match (cannot-> [can, not])
      if (o.word === term.normal) {
        return o.out
      }
      // look for after-match ('re -> [_, are])
      else if (after !== null && after === o.after) {
        return [before].concat(o.out)
      }
      // look for before-match (l' -> [le, _])
      else if (before !== null && before === o.before && after && after.length > 2) {
        return o.out.concat(after)
        // return [o.out, after] //typeof o.out === 'string' ? [o.out, after] : o.out(terms, i)
      }
    }
    return null
  };

  const toDocs = function (words, view, term) {
    contractionDebug(term, words);
    const doc = view.fromText(words.join(' '));
    doc.compute(['id', 'alias']);
    return doc.docs[0]
  };

  // there's is usually [there, is]
  // but can be 'there has' for 'there has (..) been'
  const thereHas = function (terms, i) {
    for (let k = i + 1; k < 5; k += 1) {
      if (!terms[k]) {
        break
      }
      if (terms[k].normal === 'been') {
        return ['there', 'has']
      }
    }
    return ['there', 'is']
  };

  //really easy ones
  const contractions$1 = view => {
    const { world, document } = view;
    const { model, methods } = world;
    const list = model.one.contractions || [];
    // let units = new Set(model.one.units || [])
    // each sentence
    document.forEach((terms, n) => {
      // loop through terms backwards
      for (let i = terms.length - 1; i >= 0; i -= 1) {
        let before = null;
        let after = null;
        if (byApostrophe.test(terms[i].normal) === true) {
          const res = terms[i].normal.split(byApostrophe);
          before = res[0];
          after = res[1];
        }
        // any known-ones, like 'dunno'?
        let words = knownOnes(list, terms[i], before, after);
        // ['foo', 's']
        if (!words && Object.hasOwn(byEnd, after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && Object.hasOwn(byStart, before)) {
          words = byStart[before](terms, i);
        }
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view, terms[i]);
          insertContraction(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = toDocs(words, view, terms[i]);
            insertContraction(document, [n, i], words);
            methods.one.setTag(words, 'NumberRange', world); //add custom tag
            // is it a time-range, like '5-9pm'
            if (words[2] && words[2].tags.has('Time')) {
              methods.one.setTag([words[0]], 'Time', world, null, 'time-range');
            }
            reTag(document[n], view, i, words.length);
          }
          continue
        }
        // split-apart '4km'
        words = numberUnit(terms, i, world);
        if (words) {
          words = toDocs(words, view, terms[i]);
          insertContraction(document, [n, i], words);
          methods.one.setTag([words[1]], 'Unit', world, null, 'contraction-unit');
        }
      }
    });
  };

  var compute$4 = { contractions: contractions$1 };

  const plugin = {
    model: model$5,
    compute: compute$4,
    hooks: ['contractions'],
  };

  const freeze$1 = function (view) {
    const world = view.world;
    const { model, methods } = view.world;
    const setTag = methods.one.setTag;
    const { frozenLex } = model.one;
    const multi = model.one._multiCache || {};

    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        // basic lexicon lookup
        const t = terms[i];
        const word = t.machine || t.normal;

        // test a multi-word
        if (multi[word] !== undefined && terms[i + 1]) {
          const end = i + multi[word] - 1;
          for (let k = end; k > i; k -= 1) {
            const words = terms.slice(i, k + 1);
            const str = words.map(term => term.machine || term.normal).join(' ');
            // lookup frozen lexicon
            if (Object.hasOwn(frozenLex, str) === true) {
              setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
              words.forEach(term => (term.frozen = true));
              continue
            }
          }
        }
        // test single word
        if (frozenLex[word] !== undefined && Object.hasOwn(frozenLex, word)) {
          setTag([t], frozenLex[word], world, false, '1-freeze-lexicon');
          t.frozen = true;
          continue
        }
      }
    });
  };

  const unfreeze = function (view) {
    view.docs.forEach(ts => {
      ts.forEach(term => {
        delete term.frozen;
      });
    });
    return view
  };
  var compute$3 = { frozen: freeze$1, freeze: freeze$1, unfreeze };

  /* eslint-disable no-console */

  const debug$2 = function (view) {
    view.docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        let str = `  ${i$1(dim('│'))}  `;
        const txt = t.implicit || t.text || '-';
        if (t.frozen === true) {
          str += `${blue(txt)} ❄️`;
        } else {
          str += i$1(dim(txt));
        }
        console.log(str);
      });
    });
  };

  var freeze = {
    // add .compute('freeze')
    compute: compute$3,

    mutate: world => {
      const methods = world.methods.one;
      // add @isFrozen method
      methods.termMethods.isFrozen = term => term.frozen === true;
      // adds `.debug('frozen')`
      methods.debug.freeze = debug$2;
      methods.debug.frozen = debug$2;
    },

    api: function (View) {
      // set all terms to reject any desctructive tags
      View.prototype.freeze = function () {
        this.docs.forEach(ts => {
          ts.forEach(term => {
            term.frozen = true;
          });
        });
        return this
      };
      // reset all terms to allow  any desctructive tags
      View.prototype.unfreeze = function () {
        this.compute('unfreeze');
      };
      // return all frozen terms
      View.prototype.isFrozen = function () {
        return this.match('@isFrozen+')
      };
    },
    // run it in init
    hooks: ['freeze'],
  };

  // scan-ahead to match multiple-word terms - 'jack rabbit'
  const multiWord = function (terms, start_i, world) {
    const { model, methods } = world;
    const setTag = methods.one.setTag;
    const multi = model.one._multiCache || {};
    const { lexicon } = model.one || {};
    const t = terms[start_i];
    const word = t.machine || t.normal;

    // found a word to scan-ahead on
    if (multi[word] !== undefined && terms[start_i + 1]) {
      const end = start_i + multi[word] - 1;
      for (let i = end; i > start_i; i -= 1) {
        const words = terms.slice(start_i, i + 1);
        if (words.length <= 1) {
          return false
        }
        const str = words.map(term => term.machine || term.normal).join(' ');
        // lookup regular lexicon
        if (Object.hasOwn(lexicon, str) === true) {
          const tag = lexicon[str];
          // 'is off-white' is not the phrasal verb 'is off'.
          if (tag && tag.includes('PhrasalVerb') && words[words.length - 1].post === '-') {
            continue
          }
          setTag(words, tag, world, false, '1-multi-lexicon');
          // special case for phrasal-verbs - 2nd word is a #Particle
          if (tag && tag.length === 2 && (tag[0] === 'PhrasalVerb' || tag[1] === 'PhrasalVerb')) {
            setTag([words[1]], 'Particle', world, false, '1-phrasal-particle');
          }
          return true
        }
      }
      return false
    }
    return null
  };

  const prefix$1 = /^(under|over|mis|re|un|dis|semi|pre|post)-?/;
  // anti|non|extra|inter|intra|over
  const allowPrefix = new Set(['Verb', 'Infinitive', 'PastTense', 'Gerund', 'PresentTense', 'Adjective', 'Participle']);

  // tag any words in our lexicon
  const checkLexicon = function (terms, i, world) {
    const { model, methods } = world;
    // const fastTag = methods.one.fastTag
    const setTag = methods.one.setTag;
    const { lexicon } = model.one;

    // basic lexicon lookup
    const t = terms[i];
    const word = t.machine || t.normal;
    // normal lexicon lookup
    if (lexicon[word] !== undefined && Object.hasOwn(lexicon, word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // '#gojetsgo' can be in the lexicon with its hash
    if (t.machine && Object.hasOwn(lexicon, t.normal)) {
      setTag([t], lexicon[t.normal], world, false, '1-lexicon-normal');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => Object.hasOwn(lexicon, str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$1.test(word) === true) {
      const stem = word.replace(prefix$1, '');
      if (Object.hasOwn(lexicon, stem) && stem.length > 3) {
        // only allow prefixes for verbs/adjectives
        if (allowPrefix.has(lexicon[stem])) {
          // console.log('->', word, stem, lexicon[stem])
          setTag([t], lexicon[stem], world, false, '1-lexicon-prefix');
          return true
        }
      }
    }
    return null
  };

  // tag any words in our lexicon - even if it hasn't been filled-up yet
  // rest of pre-tagger is in ./two/preTagger
  const lexicon$4 = function (view) {
    const world = view.world;
    // loop through our terms
    view.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        if (terms[i].tags.size === 0) {
          let found = null;
          found ||= multiWord(terms, i, world);
          // lookup known words
          found ||= checkLexicon(terms, i, world);
        }
      }
    });
  };

  var compute$2 = {
    lexicon: lexicon$4,
  };

  // derive clever things from our lexicon key-value pairs
  const expand = function (words) {
    // const { methods, model } = world
    const lex = {};
    // console.log('start:', Object.keys(lex).length)
    const _multi = {};
    // go through each word in this key-value obj:
    Object.keys(words).forEach(word => {
      const tag = words[word];
      // normalize lexicon a little bit
      word = word.toLowerCase().trim();
      word = word.replace(/'s\b/, '');
      // cache multi-word terms
      const split = word.split(/ /);
      if (split.length > 1) {
        // prefer longer ones
        if (_multi[split[0]] === undefined || split.length > _multi[split[0]]) {
          _multi[split[0]] = split.length;
        }
      }
      lex[word] ||= tag;
    });
    // cleanup
    delete lex[''];
    delete lex[null];
    delete lex[' '];
    return { lex, _multi }
  };

  var methods$g = {
    one: {
      expandLexicon: expand,
    }
  };

  /** insert new words/phrases into the lexicon */
  const addWords$1 = function (words, isFrozen = false) {
    const world = this.world();
    const { methods, model } = world;
    if (!words) {
      return
    }
    // normalize tag vals
    Object.keys(words).forEach(k => {
      if (typeof words[k] === 'string' && words[k].startsWith('#')) {
        words[k] = words[k].replace(/^#/, '');
      }
    });
    // these words go into a seperate lexicon
    if (isFrozen === true) {
      const { lex, _multi } = methods.one.expandLexicon(words, world);
      Object.assign(model.one._multiCache, _multi);
      Object.assign(model.one.frozenLex, lex);
      return
    }
    // add some words to our lexicon
    if (methods.two.expandLexicon) {
      // do fancy ./two version
      const { lex, _multi } = methods.two.expandLexicon(words, world);
      Object.assign(model.one.lexicon, lex);
      Object.assign(model.one._multiCache, _multi);
    }
    // do basic ./one version
    const { lex, _multi } = methods.one.expandLexicon(words, world);
    Object.assign(model.one.lexicon, lex);
    Object.assign(model.one._multiCache, _multi);
  };

  var lib$5 = { addWords: addWords$1 };

  const model$4 = {
    one: {
      lexicon: {}, //setup blank lexicon
      _multiCache: {},
      frozenLex: {}, //2nd lexicon
    },
  };

  var lexicon$3 = {
    model: model$4,
    methods: methods$g,
    compute: compute$2,
    lib: lib$5,
    hooks: ['lexicon'],
  };

  // edited by Spencer Kelly
  // credit to https://github.com/BrunoRB/ahocorasick by Bruno Roberto Búrigo.

  const tokenize$1 = function (phrase, world) {
    const { methods, model } = world;
    const terms = methods.one.tokenize.splitTerms(phrase, model).map(t => methods.one.tokenize.splitWhitespace(t, model));
    return terms.map(term => term.text.toLowerCase())
  };

  // turn an array or object into a compressed aho-corasick structure
  const buildTrie = function (phrases, world) {

    // const tokenize=methods.one.
    const goNext = [{}];
    const endAs = [null];
    const failTo = [0];

    const xs = [];
    let n = 0;
    phrases.forEach(function (phrase) {
      let curr = 0;
      // let wordsB = phrase.split(/ /g).filter(w => w)
      const words = tokenize$1(phrase, world);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (goNext[curr] && Object.hasOwn(goNext[curr], word)) {
          curr = goNext[curr][word];
        } else {
          n++;
          goNext[curr][word] = n;
          goNext[n] = {};
          curr = n;
          endAs[n] = null;
        }
      }
      endAs[curr] = [words.length];
    });
    // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
    for (const word in goNext[0]) {
      n = goNext[0][word];
      failTo[n] = 0;
      xs.push(n);
    }

    while (xs.length > 0) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !Object.hasOwn(goNext[n], word)) {
          n = failTo[n];
        }
        if (Object.hasOwn(goNext, n)) {
          const fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] ||= [];
            endAs[s] = endAs[s].concat(endAs[fs]);
          }
        } else {
          failTo[s] = 0;
        }
      }
    }
    return { goNext, endAs, failTo }
  };

  // console.log(buildTrie(['smart and cool', 'smart and nice']))

  // follow our trie structure
  const scanWords = function (terms, trie, opts) {
    let n = 0;
    const results = [];
    for (let i = 0; i < terms.length; i++) {
      const word = terms[i][opts.form] || terms[i].normal;
      // main match-logic loop:
      while (n > 0 && (trie.goNext[n] === undefined || !Object.hasOwn(trie.goNext[n], word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!Object.hasOwn(trie.goNext[n], word)) {
        continue
      }
      n = trie.goNext[n][word];
      if (trie.endAs[n]) {
        const arr = trie.endAs[n];
        for (let o = 0; o < arr.length; o++) {
          const len = arr[o];
          const term = terms[i - len + 1];
          const [no, start] = term.index;
          results.push([no, start, start + len, term.id]);
        }
      }
    }
    return results
  };

  const cacheMiss = function (words, cache) {
    for (let i = 0; i < words.length; i += 1) {
      if (cache.has(words[i]) === true) {
        return false
      }
    }
    return true
  };

  const scan = function (view, trie, opts) {
    let results = [];
    opts.form ||= 'normal';
    const docs = view.docs;
    if (!trie.goNext || !trie.goNext[0]) {
      console.error('Compromise invalid lookup trie');//eslint-disable-line
      return view.none()
    }
    const firstWords = Object.keys(trie.goNext[0]);
    // do each phrase
    for (let i = 0; i < docs.length; i++) {
      // can we skip the phrase, all together?
      if (view._cache && view._cache[i] && cacheMiss(firstWords, view._cache[i]) === true) {
        continue
      }
      const terms = docs[i];
      const found = scanWords(terms, trie, opts);
      if (found.length > 0) {
        results = results.concat(found);
      }
    }
    return view.update(results)
  };

  const isObject$4 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  function api$5 (View) {

    /** find all matches in this document */
    View.prototype.lookup = function (input, opts = {}) {
      if (!input) {
        return this.none()
      }
      if (typeof input === 'string') {
        input = [input];
      }
      const trie = isObject$4(input) ? input : buildTrie(input, this.world);
      let res = scan(this, trie, opts);
      res = res.settle();
      return res
    };
  }

  // chop-off tail of redundant vals at end of array
  const truncate = (list, val) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] !== val) {
        list = list.slice(0, i + 1);
        return list
      }
    }
    return list
  };

  // prune trie a bit
  const compress = function (trie) {
    trie.goNext = trie.goNext.map(o => {
      if (Object.keys(o).length === 0) {
        return undefined
      }
      return o
    });
    // chop-off tail of undefined vals in goNext array
    trie.goNext = truncate(trie.goNext, undefined);
    // chop-off tail of zeros in failTo array
    trie.failTo = truncate(trie.failTo, 0);
    // chop-off tail of nulls in endAs array
    trie.endAs = truncate(trie.endAs, null);
    return trie
  };

  /** pre-compile a list of matches to lookup */
  const lib$4 = {
    /** turn an array or object into a compressed trie*/
    buildTrie: function (input) {
      const trie = buildTrie(input, this.world());
      return compress(trie)
    }
  };
  // add alias
  lib$4.compile = lib$4.buildTrie;

  var lookup = {
    api: api$5,
    lib: lib$4
  };

  const relPointer = function (ptrs, parent) {
    if (!parent) {
      return ptrs
    }
    ptrs.forEach(ptr => {
      const n = ptr[0];
      if (parent[n]) {
        ptr[0] = parent[n][0]; //n
        ptr[1] += parent[n][1]; //start
        ptr[2] += parent[n][1]; //end
      }
    });
    return ptrs
  };

  // make match-result relative to whole document
  const fixPointers = function (res, parent) {
    let { ptrs } = res;
    const { byGroup } = res;
    ptrs = relPointer(ptrs, parent);
    Object.keys(byGroup).forEach(k => {
      byGroup[k] = relPointer(byGroup[k], parent);
    });
    return { ptrs, byGroup }
  };

  // turn any matchable input intp a list of matches
  const parseRegs = function (regs, opts, world) {
    const one = world.methods.one;
    if (typeof regs === 'number') {
      regs = String(regs);
    }
    // support param as string
    if (typeof regs === 'string') {
      regs = one.killUnicode(regs, world);
      regs = one.parseMatch(regs, opts, world);
    }
    return regs
  };

  const isObject$3 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // did they pass-in a compromise object?
  const isView = val => val && isObject$3(val) && val.isView === true;

  const isNet = val => val && isObject$3(val) && val.isNet === true;

  const match$1 = function (regs, group, opts) {
    const one = this.methods.one;
    // support param as view object
    if (isView(regs)) {
      return this.intersection(regs)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.settle()
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const matchOne = function (regs, group, opts) {
    const one = this.methods.one;
    // support at view as a param
    if (isView(regs)) {
      return this.intersection(regs).eq(0)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false, matchOne: true }).view
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const res = one.match(this.docs, todo, this._cache);
    const { ptrs, byGroup } = fixPointers(res, this.fullPointer);
    const view = this.toView(ptrs);
    view._groups = byGroup;
    return view
  };

  const has = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      const ptrs = this.intersection(regs).fullPointer;
      return ptrs.length > 0
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      return this.sweep(regs, { tagger: false }).view.found
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    const ptrs = one.match(this.docs, todo, this._cache).ptrs;
    return ptrs.length > 0
  };

  // 'if'
  const ifFn = function (regs, group, opts) {
    const one = this.methods.one;
    // support view as input
    if (isView(regs)) {
      return this.filter(m => m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.if(m) //recurse with result
    }
    regs = parseRegs(regs, opts, this.world);
    const todo = { regs, group, justOne: true };
    let ptrs = this.fullPointer;
    const cache = this._cache || [];
    ptrs = ptrs.filter((ptr, i) => {
      const m = this.update([ptr]);
      const res = one.match(m.docs, todo, cache[i]).ptrs;
      return res.length > 0
    });
    const view = this.update(ptrs);
    // try and reconstruct the cache
    if (this._cache) {
      view._cache = ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  const ifNo = function (regs, group, opts) {
    const { methods } = this;
    const one = methods.one;
    // support a view object as input
    if (isView(regs)) {
      return this.filter(m => !m.intersection(regs).found)
    }
    // support a compiled set of matches
    if (isNet(regs)) {
      const m = this.sweep(regs, { tagger: false }).view.settle();
      return this.ifNo(m)
    }
    // otherwise parse the match string
    regs = parseRegs(regs, opts, this.world);
    const cache = this._cache || [];
    const view = this.filter((m, i) => {
      const todo = { regs, group, justOne: true };
      const ptrs = one.match(m.docs, todo, cache[i]).ptrs;
      return ptrs.length === 0
    });
    // try to reconstruct the cache
    if (this._cache) {
      view._cache = view.ptrs.map(ptr => cache[ptr[0]]);
    }
    return view
  };

  var match$2 = { matchOne, match: match$1, has, if: ifFn, ifNo };

  const before = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const pre = [];
    const byN = indexN(this.fullPointer);
    Object.keys(byN).forEach(k => {
      // check only the earliest match in the sentence
      const first = byN[k].sort((a, b) => (a[1] > b[1] ? 1 : -1))[0];
      if (first[1] > 0) {
        pre.push([first[0], 0, first[1]]);
      }
    });
    const preWords = this.toView(pre);
    if (!regs) {
      return preWords
    }
    return preWords.match(regs, group, opts)
  };

  const after = function (regs, group, opts) {
    const { indexN } = this.methods.one.pointer;
    const post = [];
    const byN = indexN(this.fullPointer);
    const document = this.document;
    Object.keys(byN).forEach(k => {
      // check only the latest match in the sentence
      const last = byN[k].sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
      const [n, , end] = last;
      if (end < document[n].length) {
        post.push([n, end, document[n].length]);
      }
    });
    const postWords = this.toView(post);
    if (!regs) {
      return postWords
    }
    return postWords.match(regs, group, opts)
  };

  const growLeft = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[regs.length - 1].end = true; // ensure matches are beside us ←
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.before(regs, group);
      if (more.found) {
        const terms = more.terms();
        ptrs[n][1] -= terms.length;
        ptrs[n][3] = terms.docs[0][0].id;
      }
    });
    return this.update(ptrs)
  };

  const growRight = function (regs, group, opts) {
    if (typeof regs === 'string') {
      regs = this.world.methods.one.parseMatch(regs, opts, this.world);
    }
    regs[0].start = true; // ensure matches are beside us →
    const ptrs = this.fullPointer;
    this.forEach((m, n) => {
      const more = m.after(regs, group);
      if (more.found) {
        const terms = more.terms();
        ptrs[n][2] += terms.length;
        ptrs[n][4] = null; //remove end-id
      }
    });
    return this.update(ptrs)
  };

  const grow = function (regs, group, opts) {
    return this.growRight(regs, group, opts).growLeft(regs, group, opts)
  };

  var lookaround = { before, after, growLeft, growRight, grow };

  const combine = function (left, right) {
    return [left[0], left[1], right[2]]
  };

  const getDoc$2 = (reg, view, group) => {
    if (typeof reg === 'string' || Array.isArray(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
    if (view.document[n]?.[start]) {
      ptr[3] ||= view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] ||= view.document[n][end - 1].id;
      }
    }
    return ptr
  };

  const methods$f = {};
  // [before], [match], [after]
  methods$f.splitOn = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      res.push(o.match);
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before], [match after]
  methods$f.splitBefore = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    // repair matches to favor [match, after]
    // - instead of [before, match]
    for (let i = 0; i < all.length; i += 1) {
      // move a before to a preceding after
      if (!all[i].after && all[i + 1]?.before) {
        // ensure it's from the same original sentence
        if (all[i].match && all[i].match[0] === all[i + 1].before[0]) {
          all[i].after = all[i + 1].before;
          delete all[i + 1].before;
        }
      }
    }

    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      res.push(o.before);
      // a, [x, b]
      if (o.match && o.after) {
        res.push(combine(o.match, o.after));
      } else {
        // a, [x], b
        res.push(o.match);
      }
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };

  // [before match], [after]
  methods$f.splitAfter = function (m, group) {
    const { splitAll } = this.methods.one.pointer;
    const splits = getDoc$2(m, this, group).fullPointer;
    const all = splitAll(this.fullPointer, splits);
    let res = [];
    all.forEach(o => {
      res.push(o.passthrough);
      if (o.before && o.match) {
        res.push(combine(o.before, o.match));
      } else {
        res.push(o.before);
        res.push(o.match);
      }
      res.push(o.after);
    });
    res = res.filter(p => p);
    res = res.map(p => addIds$1(p, this));
    return this.update(res)
  };
  methods$f.split = methods$f.splitAfter;

  // check if two pointers are perfectly consecutive
  const isNeighbour = function (ptrL, ptrR) {
    // validate
    if (!ptrL || !ptrR) {
      return false
    }
    // same sentence
    if (ptrL[0] !== ptrR[0]) {
      return false
    }
    // ensure R starts where L ends
    return ptrL[2] === ptrR[1]
  };

  // join two neighbouring words, if they both match
  const mergeIf = function (doc, lMatch, rMatch) {
    const world = doc.world;
    const parseMatch = world.methods.one.parseMatch;
    lMatch ||= '.$'; //defaults
    rMatch ||= '^.';
    const leftMatch = parseMatch(lMatch, {}, world);
    const rightMatch = parseMatch(rMatch, {}, world);
    // ensure end-requirement to left-match, start-requiremnts to right match
    leftMatch[leftMatch.length - 1].end = true;
    rightMatch[0].start = true;
    // let's get going.
    const ptrs = doc.fullPointer;
    const res = [ptrs[0]];
    for (let i = 1; i < ptrs.length; i += 1) {
      const ptrL = res[res.length - 1];
      const ptrR = ptrs[i];
      const left = doc.update([ptrL]);
      const right = doc.update([ptrR]);
      // should we marge left+right?
      if (isNeighbour(ptrL, ptrR) && left.has(leftMatch) && right.has(rightMatch)) {
        // merge right ptr into existing result
        res[res.length - 1] = [ptrL[0], ptrL[1], ptrR[2], ptrL[3], ptrR[4]];
      } else {
        res.push(ptrR);
      }
    }
    // return new pointers
    return doc.update(res)
  };

  const methods$e = {
    //  merge only if conditions are met
    joinIf: function (lMatch, rMatch) {
      return mergeIf(this, lMatch, rMatch)
    },
    // merge all neighbouring matches
    join: function () {
      return mergeIf(this)
    },
  };

  const methods$d = { ...match$2, ...lookaround, ...methods$f, ...methods$e };
  // aliases
  methods$d.lookBehind = methods$d.before;
  methods$d.lookBefore = methods$d.before;

  methods$d.lookAhead = methods$d.after;
  methods$d.lookAfter = methods$d.after;

  methods$d.notIf = methods$d.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$d);
  };

  // Split parenthesized match blocks without retrying long rejected prefixes or
  // bodies. Preserve the original grammar, including its greedy capture header.
  const prefix = new Set('!~[^');
  const suffix = new Set('?]+*$~');
  const whitespace$1 = /\s/;

  const splitGroups = str => {
    if (!str.includes('(') || !str.includes(')')) return [str]
    const length = str.length;
    const afterSuffix = new Uint32Array(length + 1);
    const bodyEnd = new Uint32Array(length);
    const captureEnd = new Uint32Array(length);
    afterSuffix[length] = length;
    let close = -1;
    let capture = 0;
    for (let i = length - 1; i >= 0; i--) {
      afterSuffix[i] = suffix.has(str[i]) ? afterSuffix[i + 1] : i;
      if (str[i] === ')') close = i;
      if (str[i] === '(' && close >= i + 3 && str[close - 1] !== '\\') {
        const end = afterSuffix[close + 1];
        if (end === length || whitespace$1.test(str[end])) bodyEnd[i] = end;
      }
      // The optional <...> header cannot cross another '<', and prefers the
      // rightmost '>' which is followed by a valid parenthesized block.
      if (str[i] === '<') {
        captureEnd[i] = capture;
        capture = 0;
      } else if (str[i] === '>' && !capture && bodyEnd[i + 1]) {
        capture = bodyEnd[i + 1];
      }
    }
    const parts = [];
    let previous = 0;
    let i = 0;
    while (i < length) {
      const start = i;
      while (i < length && prefix.has(str[i])) i++;
      const end = str[i] === '<' ? captureEnd[i] : bodyEnd[i];
      if (end) {
        parts.push(str.slice(previous, start), str.slice(start, end));
        // The old delimiter consumes one following whitespace character.
        i = end < length ? end + 1 : end;
        previous = i;
      } else if (i === start) {
        i++;
      }
    }
    parts.push(str.slice(previous));
    return parts
  };

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
  // okay
  const byWord = / /g;

  const isBlock = str => {
    return /^[![^]*(<[^<]*>)?\(/.test(str) && /\)[?\]+*$~]*$/.test(str)
  };
  const isReg = str => {
    return /^[![^]*(<[^<]*>)?\//.test(str) && /\/[?\]+*$~]*$/.test(str)
  };

  const cleanUp = function (arr) {
    arr = arr.map(str => str.trim());
    arr = arr.filter(str => str);
    return arr
  };

  const parseBlocks = function (txt) {
    // parse by /regex/ first
    const arr = txt.split(bySlashes);
    let res = [];
    // parse by (blocks), next
    arr.forEach(str => {
      if (isReg(str)) {
        res.push(str);
        return
      }
      res = res.concat(splitGroups(str));
    });
    res = cleanUp(res);
    // split by spaces, now
    let final = [];
    res.forEach(str => {
      if (isBlock(str)) {
        final.push(str);
      } else if (isReg(str)) {
        final.push(str);
      } else {
        final = final.concat(str.split(byWord));
      }
    });
    final = cleanUp(final);
    return final
  };

  const hasMinMax = /\{([0-9]+)?(, *[0-9]*)?\}/;
  const andSign = /&&/;
  // const hasDash = /\p{Letter}[-–—]\p{Letter}/u
  const captureName = /^<\s*([^\s>]+)\s*>/;
  /* break-down a match expression into this:
  {
    word:'',
    tag:'',
    regex:'',

    start:false,
    end:false,
    negative:false,
    anything:false,
    greedy:false,
    optional:false,

    named:'',
    choices:[],
  }
  */
  const titleCase = str => str.charAt(0).toUpperCase() + str.substring(1);
  const end = (str) => str.charAt(str.length - 1);
  const start = (str) => str.charAt(0);
  const stripStart = (str) => str.substring(1);
  const stripEnd = (str) => str.substring(0, str.length - 1);

  const stripBoth = function (str) {
    str = stripStart(str);
    str = stripEnd(str);
    return str
  };
  //
  const parseToken = function (w, opts, aliases) {
    const obj = {};
    //collect any flags (do it twice)
    for (let i = 0; i < 2; i += 1) {
      //end-flag
      if (end(w) === '$') {
        obj.end = true;
        w = stripEnd(w);
      }
      //front-flag
      if (start(w) === '^') {
        obj.start = true;
        w = stripStart(w);
      }
      if (end(w) === '?') {
        obj.optional = true;
        w = stripEnd(w);
      }
      //capture group (this one can span multiple-terms)
      if (start(w) === '[' || end(w) === ']') {
        obj.group = null;
        if (start(w) === '[') {
          obj.groupStart = true;
        }
        if (end(w) === ']') {
          obj.groupEnd = true;
        }
        w = w.replace(/^\[/, '');
        w = w.replace(/\]$/, '');
        // Use capture group name
        if (start(w) === '<') {
          const res = captureName.exec(w);
          if (!res) {
            throw new SyntaxError('Invalid named capture: expected [<name> ...]')
          }
          if (res.length >= 2) {
            obj.group = res[1];
            w = w.replace(res[0], '');
          }
        }
      }
      //back-flags
      if (end(w) === '+') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (w !== '*' && end(w) === '*' && w !== '\\*') {
        obj.greedy = true;
        w = stripEnd(w);
      }
      if (start(w) === '!') {
        obj.negative = true;
        // obj.optional = true
        w = stripStart(w);
      }
      //soft-match
      if (start(w) === '~' && end(w) === '~' && w.length > 2) {
        w = stripBoth(w);
        obj.fuzzy = true;
        obj.min = opts.fuzzy ?? 0.85;
        if (/\(/.test(w) === false) {
          obj.word = w;
          return obj
        }
      }

      //regex
      if (start(w) === '/' && end(w) === '/') {
        w = stripBoth(w);
        if (opts.caseSensitive) {
          obj.use = 'text';
        }
        obj.regex = new RegExp(w); //potential vuln - security/detect-non-literal-regexp
        return obj
      }

      // support foo{1,9}
      if (hasMinMax.test(w) === true) {
        w = w.replace(hasMinMax, (_a, b, c) => {
          if (c === undefined) {
            // '{3}'	Exactly three times
            obj.min = Number(b);
            obj.max = Number(b);
          } else {
            c = c.replace(/, */, '');
            if (b === undefined) {
              // '{,9}' implied zero min
              obj.min = 0;
              obj.max = Number(c);
            } else {
              // '{2,4}' Two to four times
              obj.min = Number(b);
              // '{3,}' Three or more times
              obj.max = Number(c || 999);
            }
          }
          // use same method as '+'
          obj.greedy = true;
          // 0 as min means the same as '?'
          if (!obj.min) {
            obj.optional = true;
          }
          return ''
        });
      }

      //wrapped-flags
      if (start(w) === '(' && end(w) === ')') {
        // support (one && two)
        if (andSign.test(w)) {
          obj.choices = w.split(andSign);
          obj.operator = 'and';
        } else {
          obj.choices = w.split('|');
          obj.operator = 'or';
        }
        //remove '(' and ')'
        obj.choices[0] = stripStart(obj.choices[0]);
        const last = obj.choices.length - 1;
        obj.choices[last] = stripEnd(obj.choices[last]);
        // clean up the results
        obj.choices = obj.choices.map(s => s.trim());
        obj.choices = obj.choices.filter(s => s);
        //recursion alert!
        obj.choices = obj.choices.map(str => {
          return str.split(/ /g).map(s => parseToken(s, opts, aliases))
        });
        w = '';
      }

      //root/sense overloaded
      if (start(w) === '{' && end(w) === '}') {
        w = stripBoth(w);
        // obj.sense = w
        obj.root = w;
        if (/\//.test(w)) {
          const split = obj.root.split(/\//);
          obj.root = split[0];
          obj.pos = split[1];
          if (obj.pos === 'adj') {
            obj.pos = 'Adjective';
          }
          // titlecase
          obj.pos = obj.pos.charAt(0).toUpperCase() + obj.pos.substr(1).toLowerCase();
          // add sense-number too
          if (split[2] !== undefined) {
            obj.sense = split[2];
          }
        }
        return obj
      }
      //chunks
      if (start(w) === '<' && end(w) === '>') {
        w = stripBoth(w);
        obj.chunk = titleCase(w);
        obj.greedy = true;
        return obj
      }
      if (start(w) === '%' && end(w) === '%') {
        w = stripBoth(w);
        obj.switch = w;
        return obj
      }
    }
    //do the actual token content
    if (start(w) === '#') {
      const name = stripStart(w);
      obj.tag = aliases?.[name];
      if (!obj.tag) {
        obj.tag = titleCase(name);
        obj.tag = aliases?.[obj.tag] || obj.tag;
      }
      return obj
    }
    //dynamic function on a term object
    if (start(w) === '@') {
      obj.method = stripStart(w);
      return obj
    }
    if (w === '.') {
      obj.anything = true;
      return obj
    }
    //support alone-astrix
    if (w === '*') {
      obj.anything = true;
      obj.greedy = true;
      obj.optional = true;
      return obj
    }
    if (w) {
      //somehow handle encoded-chars?
      w = w.replace('\\*', '*');
      w = w.replace('\\.', '.');
      if (opts.caseSensitive) {
        obj.use = 'text';
      } else {
        w = w.toLowerCase();
      }
      obj.word = w;
    }
    return obj
  };

  // Text recognition, rather than full email/URL validation. Share these rules with
  // the tagger so hyphens in recognized addresses survive tokenization.
  const email = /^[\w.!#$%&'*+/=?^`{|}~-]+@(?:[\w-]+\.)+[a-z]{2,}$/i;
  const explicitUrl = /^(?:https?:(?:\/\/)?|www\.)(?:[a-z0-9-]+\.)+[a-z]{2,}(?::[0-9]+)?(?:[/?#]\S*)?$/i;
  const bareUrl = /^(?:[a-z0-9-]+\.)+(?:com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)(?::[0-9]+)?(?:[/?#]\S*)?$/i;

  const isWebToken = function (str) {
    if (!str.includes('.')) {
      return false
    }
    let start = 0;
    let end = str.length;
    while (start < end && /[\s("'“‘<]/.test(str[start])) start++;
    while (end > start && /[\s).,!?:;"'”’>]/.test(str[end - 1])) end--;
    const text = str.slice(start, end);
    return email.test(text) || explicitUrl.test(text) || bareUrl.test(text)
  };

  const hasHyphen$1 = function (str, model) {
    const parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    if (isWebToken(str)) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
    //dont split 're-do'
    if (Object.hasOwn(prefixes, parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (Object.hasOwn(suffixes, parts[1])) {
      return false
    }
    //letter-number 'aug-20'
    const reg = /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i;
    if (reg.test(str) === true) {
      return true
    }
    //number-letter '20-aug'
    const reg2 = /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i;
    if (reg2.test(str) === true) {
      return true
    }
    return false
  };

  const splitHyphens$1 = function (word) {
    const arr = [];
    //support multiple-hyphenated-terms
    const hyphens = word.split(/[-–—]/);
    let whichDash = '-';
    const found = word.match(/[-–—]/);
    if (found && found[0]) {
      whichDash = found;
    }
    for (let o = 0; o < hyphens.length; o++) {
      if (o === hyphens.length - 1) {
        arr.push(hyphens[o]);
      } else {
        arr.push(hyphens[o] + whichDash);
      }
    }
    return arr
  };

  // match 're-do' -> ['re','do']
  // split them the same way the tokenizer does - 'x-ray' stays one word
  const splitHyphens = function (regs, world) {
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasHyphen$1(reg.word, world.model)) {
        let words = reg.word.split(/[-–—]/g);
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = { ...reg };
          obj.word = w;
          regs.splice(i, 0, obj);
        });
      }
    }
    return regs
  };

  // add all conjugations of this verb
  const addVerbs = function (token, world) {
    const { all } = world.methods.two.transform.verb || {};
    const str = token.root;
    if (!all) {
      return []
    }
    return all(str, world.model)
  };

  // add all inflections of this noun
  const addNoun = function (token, world) {
    const { all } = world.methods.two.transform.noun || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // add all inflections of this adjective
  const addAdjective = function (token, world) {
    const { all } = world.methods.two.transform.adjective || {};
    if (!all) {
      return [token.root]
    }
    return all(token.root, world.model)
  };

  // turn '{walk}' into 'walking', 'walked', etc
  const inflectRoot = function (regs, world) {
    // do we have compromise/two?
    regs = regs.map(token => {
      // a reg to convert '{foo}'
      if (token.root) {
        // check if compromise/two is loaded
        if (world.methods.two && world.methods.two.transform) {
          let choices = [];
          // have explicitly set from POS - '{sweet/adjective}'
          if (token.pos) {
            if (token.pos === 'Verb') {
              choices = choices.concat(addVerbs(token, world));
            } else if (token.pos === 'Noun') {
              choices = choices.concat(addNoun(token, world));
            } else if (token.pos === 'Adjective') {
              choices = choices.concat(addAdjective(token, world));
            }
          } else {
            // do verb/noun/adj by default
            choices = choices.concat(addVerbs(token, world));
            choices = choices.concat(addNoun(token, world));
            choices = choices.concat(addAdjective(token, world));
          }
          choices = choices.filter(str => str);
          if (choices.length > 0) {
            token.operator = 'or';
            token.fastOr = new Set(choices);
          }
        } else {
          // if no compromise/two, drop down into 'machine' lookup
          token.machine = token.root;
          delete token.id;
          delete token.root;
        }
      }
      return token
    });

    return regs
  };

  // name any [unnamed] capture-groups with a number
  const nameGroups = function (regs) {
    let index = 0;
    let inGroup = null;
    //'fill in' capture groups between start-end
    for (let i = 0; i < regs.length; i++) {
      const token = regs[i];
      if (token.groupStart === true) {
        inGroup = token.group;
        if (inGroup === null) {
          inGroup = String(index);
          index += 1;
        }
      }
      if (inGroup !== null) {
        token.group = inGroup;
      }
      if (token.groupEnd === true) {
        inGroup = null;
      }
    }
    return regs
  };

  // optimize an 'or' lookup, when the (a|b|c) list is simple or multi-word
  const doFastOrMode = function (tokens) {
    return tokens.map(token => {
      if (token.choices !== undefined) {
        // make sure it's an OR
        if (token.operator !== 'or') {
          return token
        }
        if (token.fuzzy === true) {
          return token
        }
        // are they all straight-up words? then optimize them.
        const shouldPack = token.choices.every(block => {
          if (block.length !== 1) {
            return false
          }
          const reg = block[0];
          // ~fuzzy~ words need more care
          if (reg.fuzzy === true) {
            return false
          }
          // ^ and $ get lost in fastOr
          if (reg.start || reg.end) {
            return false
          }
          if (reg.word !== undefined && reg.negative !== true && reg.optional !== true && reg.method !== true) {
            return true //reg is simple-enough
          }
          return false
        });
        if (shouldPack === true) {
          token.fastOr = new Set();
          token.choices.forEach(block => {
            token.fastOr.add(block[0].word);
          });
          delete token.choices;
        }
      }
      return token
    })
  };

  // support ~(a|b|c)~
  const fuzzyOr = function (regs) {
    return regs.map(reg => {
      if (reg.fuzzy && reg.choices) {
        // pass fuzzy-data to each OR choice
        reg.choices.forEach(r => {
          if (r.length === 1 && r[0].word) {
            r[0].fuzzy = true;
            r[0].min = reg.min;
          }
        });
      }
      return reg
    })
  };

  const postProcess = function (regs) {
    // ensure all capture groups names are filled between start and end
    regs = nameGroups(regs);
    // convert 'choices' format to 'fastOr' format
    regs = doFastOrMode(regs);
    // support ~(foo|bar)~
    regs = fuzzyOr(regs);
    return regs
  };

  /** parse a match-syntax string into json */
  const syntax = function (input, opts, world) {
    // fail-fast
    if (input === null || input === undefined || input === '') {
      return []
    }
    opts ||= {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts, world.model.one.tagAliases));
    // '~re-do~'
    tokens = splitHyphens(tokens, world);
    // '{walk}'
    tokens = inflectRoot(tokens, world);
    //clean up anything weird
    tokens = postProcess(tokens);
    // console.log(tokens)
    return tokens
  };

  const anyIntersection = function (setA, setB) {
    for (const elem of setB) {
      if (setA.has(elem)) {
        return true
      }
    }
    return false
  };
  // check words/tags against our cache
  const failFast = function (regs, cache) {
    for (let i = 0; i < regs.length; i += 1) {
      const reg = regs[i];
      if (reg.optional === true || reg.negative === true || reg.fuzzy === true) {
        continue
      }
      // is the word missing from the cache?
      if (reg.word !== undefined && cache.has(reg.word) === false) {
        return true
      }
      // is the tag missing?
      if (reg.tag !== undefined && cache.has('#' + reg.tag) === false) {
        return true
      }
      // are all of the fast-or words missing?
      if (reg.fastOr !== undefined && anyIntersection(reg.fastOr, cache) === false) {
        return true
      }
    }
    return false
  };

  // fuzzy-match (damerau-levenshtein)
  // Based on  tad-lispy /node-damerau-levenshtein
  // https://github.com/tad-lispy/node-damerau-levenshtein/blob/master/index.js
  // count steps (insertions, deletions, substitutions, or transpositions)
  const editDistance = function (strA, strB) {
    const aLength = strA.length,
      bLength = strB.length;
    // fail-fast
    if (aLength === 0) {
      return bLength
    }
    if (bLength === 0) {
      return aLength
    }
    // If the limit is not defined it will be calculate from this and that args.
    const limit = (bLength > aLength ? bLength : aLength) + 1;
    if (Math.abs(aLength - bLength) > (limit || 100)) {
      return limit || 100
    }
    // init the array
    const matrix = [];
    for (let i = 0; i < limit; i++) {
      matrix[i] = [i];
      matrix[i].length = limit;
    }
    for (let i = 0; i < limit; i++) {
      matrix[0][i] = i;
    }
    // Calculate matrix.
    let j, a_index, b_index, cost, min, t;
    for (let i = 1; i <= aLength; ++i) {
      a_index = strA[i - 1];
      for (j = 1; j <= bLength; ++j) {
        // Check the jagged distance total so far
        if (i === j && matrix[i][j] > 4) {
          return aLength
        }
        b_index = strB[j - 1];
        cost = a_index === b_index ? 0 : 1; // Step 5
        // Calculate the minimum (much faster than Math.min(...)).
        min = matrix[i - 1][j] + 1; // Deletion.
        if ((t = matrix[i][j - 1] + 1) < min) min = t; // Insertion.
        if ((t = matrix[i - 1][j - 1] + cost) < min) min = t; // Substitution.
        // Update matrix.
        const shouldUpdate =
          i > 1 && j > 1 && a_index === strB[j - 2] && strA[i - 2] === b_index && (t = matrix[i - 2][j - 2] + cost) < min;
        if (shouldUpdate) {
          matrix[i][j] = t;
        } else {
          matrix[i][j] = min;
        }
      }
    }
    // return number of steps
    return matrix[aLength][bLength]
  };
  // score similarity by from 0-1 (steps/length)
  const fuzzyMatch = function (strA, strB, minLength = 3) {
    if (strA === strB) {
      return 1
    }
    //don't even bother on tiny strings
    if (strA.length < minLength || strB.length < minLength) {
      return 0
    }
    const steps = editDistance(strA, strB);
    const length = Math.max(strA.length, strB.length);
    const relative = length === 0 ? 0 : steps / length;
    const similarity = 1 - relative;
    return similarity
  };

  // these methods are called with '@hasComma' in the match syntax
  // various unicode quotation-mark formats
  const startQuote =
    /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/;

  const endQuote = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/;

  const hasHyphen = /^[-–—]$/;
  const hasDash$1 = / [-–—]{1,3} /;

  /** search the term's 'post' punctuation  */
  const hasPost = (term, punct) => term.post.indexOf(punct) !== -1;
  /** search the term's 'pre' punctuation  */
  // const hasPre = (term, punct) => term.pre.indexOf(punct) !== -1

  const methods$c = {
    /** does it have a quotation symbol?  */
    hasQuote: term => startQuote.test(term.pre) || endQuote.test(term.post),
    /** does it have a comma?  */
    hasComma: term => hasPost(term, ','),
    /** does it end in a period? */
    hasPeriod: term => hasPost(term, '.') === true && hasPost(term, '...') === false,
    /** does it end in an exclamation */
    hasExclamation: term => hasPost(term, '!'),
    /** does it end with a question mark? */
    hasQuestionMark: term => hasPost(term, '?') || hasPost(term, '¿'),
    /** is there a ... at the end? */
    hasEllipses: term => hasPost(term, '..') || hasPost(term, '…'),
    /** is there a semicolon after term word? */
    hasSemicolon: term => hasPost(term, ';'),
    /** is there a colon after term word? */
    hasColon: term => hasPost(term, ':'),
    /** is there a slash '/' in term word? */
    hasSlash: term => /\//.test(term.text),
    /** a hyphen connects two words like-term */
    hasHyphen: term => hasHyphen.test(term.post) || hasHyphen.test(term.pre),
    /** a dash separates words - like that */
    hasDash: term => hasDash$1.test(term.post) || hasDash$1.test(term.pre),
    /** is it multiple words combinded */
    hasContraction: term => Boolean(term.implicit),
    /** is it an acronym */
    isAcronym: term => term.tags.has('Acronym'),
    /** does it have any tags */
    isKnown: term => term.tags.size > 0,
    /** uppercase first letter, then a lowercase */
    isTitleCase: term => /^\p{Lu}[a-z'\u00C0-\u00FF]/u.test(term.text),
    /** uppercase all letters */
    isUpperCase: term => /^\p{Lu}+$/u.test(term.text),
  };
  // aliases
  methods$c.hasQuotation = methods$c.hasQuote;

  //declare it up here
  let wrapMatch = function () { };
  /** ignore optional/greedy logic, straight-up term match*/
  const doesMatch$1 = function (term, reg, index, length) {
    // support '.'
    if (reg.anything === true) {
      return true
    }
    // support '^' (in parentheses)
    if (reg.start === true && index !== 0) {
      return false
    }
    // support '$' (in parentheses)
    if (reg.end === true && index !== length - 1) {
      return false
    }
    // match an id
    if (reg.id !== undefined && reg.id === term.id) {
      return true
    }
    //support a text match
    if (reg.word !== undefined) {
      // check case-sensitivity, etc
      if (reg.use) {
        return reg.word === term[reg.use]
      }
      //match contractions, machine-form
      if (term.machine !== null && term.machine === reg.word) {
        return true
      }
      // support ~ fuzzy match
      if (reg.fuzzy === true) {
        if (reg.word === term.root) {
          return true
        }
        const score = fuzzyMatch(reg.word, term.normal);
        if (score >= reg.min) {
          return true
        }
      }
      // match slashes and things
      if (term.alias && term.alias.some(str => str === reg.word)) {
        return true
      }
      //match either .normal or .text
      return reg.word === term.text || reg.word === term.normal
    }
    //support #Tag
    if (reg.tag !== undefined) {
      return term.tags.has(reg.tag) === true
    }
    //support @method
    if (reg.method !== undefined) {
      if (typeof methods$c[reg.method] === 'function' && methods$c[reg.method](term) === true) {
        return true
      }
      return false
    }
    //support whitespace/punctuation
    if (reg.pre !== undefined) {
      return term.pre && term.pre.includes(reg.pre)
    }
    if (reg.post !== undefined) {
      return term.post && term.post.includes(reg.post)
    }
    //support /reg/
    if (reg.regex !== undefined) {
      let str = term.normal;
      if (reg.use) {
        str = term[reg.use];
      }
      if (reg.regex.global || reg.regex.sticky) {
        const lastIndex = reg.regex.lastIndex;
        try {
          reg.regex.lastIndex = 0;
          return reg.regex.test(str)
        } finally {
          reg.regex.lastIndex = lastIndex;
        }
      }
      return reg.regex.test(str)
    }
    //support <chunk>
    if (reg.chunk !== undefined) {
      return term.chunk === reg.chunk
    }
    //support %Noun|Verb%
    if (reg.switch !== undefined) {
      return term.switch === reg.switch
    }
    //support {machine}
    if (reg.machine !== undefined) {
      return term.normal === reg.machine || term.machine === reg.machine || term.root === reg.machine
    }
    //support {word/sense}
    if (reg.sense !== undefined) {
      return term.sense === reg.sense
    }
    // support optimized (one|two)
    if (reg.fastOr !== undefined) {
      // {work/verb} must be a verb
      if (reg.pos && !term.tags.has(reg.pos)) {
        return null
      }
      const str = term.root || term.implicit || term.machine || term.normal;
      return reg.fastOr.has(str) || reg.fastOr.has(term.text)
    }
    //support slower (one|two)
    if (reg.choices !== undefined) {
      // try to support && operator
      if (reg.operator === 'and') {
        // must match them all
        return reg.choices.every(r => wrapMatch(term, r, index, length))
      }
      // or must match one
      return reg.choices.some(r => wrapMatch(term, r, index, length))
    }
    return false
  };
  // wrap result for !negative match logic
  wrapMatch = function (t, reg, index, length) {
    const result = doesMatch$1(t, reg, index, length);
    if (reg.negative === true) {
      return !result
    }
    return result
  };

  // for greedy checking, we no longer care about the reg.start
  // value, and leaving it can cause failures for anchored greedy
  // matches.  ditto for end-greedy matches: we need an earlier non-
  // ending match to succceed until we get to the actual end.
  const getGreedy = function (state, endReg) {
    const reg = { ...state.regs[state.r], start: false, end: false };
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      // the number of terms we've matched, if we stop here
      const count = state.t - start + 1;
      //stop for next-reg match - unless we're still under our min
      if (endReg && wrapMatch(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        if (reg.min === undefined || count >= reg.min) {
          return state.t
        }
      }
      // is it max-length now?
      if (reg.max !== undefined && count === reg.max) {
        return state.t
      }
      //stop here
      if (wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length) === false) {
        // is it too short?
        if (reg.min !== undefined && count < reg.min) {
          return null
        }
        return state.t
      }
    }
    // we ran out of terms - did we reach our min?
    if (reg.min !== undefined && state.t - start + 1 < reg.min) {
      return null
    }
    return state.t
  };

  const greedyTo = function (state, nextReg) {
    let t = state.t;
    //if there's no next one, just go off the end!
    if (!nextReg) {
      return state.terms.length
    }
    //otherwise, we're looking for the next one
    for (; t < state.terms.length; t += 1) {
      if (wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length) === true) {
        // console.log(`greedyTo ${state.terms[t].normal}`)
        return t
      }
    }
    //guess it doesn't exist, then.
    return null
  };

  const isEndGreedy = function (reg, state) {
    if (reg.end === true && reg.greedy === true) {
      if (state.start_i + state.t < state.phrase_length - 1) {
        const tmpReg = { ...reg, end: false };
        if (wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$1 = function (state, term_index) {
    // Most attempts fail without capturing anything.
    if (!state.groups) {
      state.groups = {};
    }
    if (state.groups[state.inGroup]) {
      return state.groups[state.inGroup]
    }
    state.groups[state.inGroup] = {
      start: term_index,
      length: 0,
    };
    return state.groups[state.inGroup]
  };

  //support 'unspecific greedy' .* properly
  // its logic is 'greedy until', where it's looking for the next token
  // '.+ foo' means we check for 'foo', indefinetly
  const doAstrix = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipto = greedyTo(state, regs[state.r + 1]);
    //maybe we couldn't find it
    if (skipto === null || skipto === state.offset) {
      return null
    }
    // ensure it's long enough
    if (reg.min !== undefined && skipto - state.t < reg.min) {
      return null
    }
    // reduce it back, if it's too long
    if (reg.max !== undefined && skipto - state.t > reg.max) {
      state.t = state.t + reg.max;
      return true
    }
    // set the group result
    if (state.hasGroup === true) {
      const g = getGroup$1(state, state.t);
      // accumulate onto any tokens already captured before the wildcard,
      // so '[one .* after]' keeps its leading (and trailing) tokens
      g.length += skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };

  // try to match a list of tokens, starting at state.t + skipN
  // returns the number of terms it consumed, or 0 for no-match
  const tryChoice = function (state, regs, skipN) {
    let len = 0;
    for (let w = 0; w < regs.length; w += 1) {
      const cr = regs[w];
      const t = state.t + skipN + len;
      if (state.terms[t] === undefined) {
        return 0
      }
      if (wrapMatch(state.terms[t], cr, state.start_i + t, state.phrase_length) !== true) {
        return 0
      }
      len += 1;
      // this can be greedy - '(foo+ bar)'
      if (cr.greedy === true) {
        // like getGreedy, anchors should not apply to the repeated terms
        const gr = { ...cr, start: false, end: false };
        for (let i = t + 1; i < state.terms.length; i += 1) {
          if (wrapMatch(state.terms[i], gr, state.start_i + i, state.phrase_length) !== true) {
            break
          }
          len += 1;
        }
      }
    }
    return len
  };

  // match the first choice that works - '(a b|c)'
  const tryChoices = function (state, skipN) {
    const block = state.regs[state.r];
    for (let c = 0; c < block.choices.length; c += 1) {
      const regs = block.choices[c];
      if (!Array.isArray(regs)) {
        return 0
      }
      const len = tryChoice(state, regs, skipN);
      if (len > 0) {
        return len
      }
    }
    return 0
  };

  const doOrBlock = function (state) {
    const block = state.regs[state.r];
    let skipN = tryChoices(state, 0);
    if (skipN === 0) {
      return 0
    }
    // greedy or-block - keep matching choices - '(a b|c)+'
    if (block.greedy === true) {
      let more = tryChoices(state, skipN);
      while (more > 0) {
        skipN += more;
        more = tryChoices(state, skipN);
      }
    }
    return skipN
  };

  const doAndBlock = function (state) {
    let longest = 0;
    // all blocks must match, and we return the greediest match
    const reg = state.regs[state.r];
    const allDidMatch = reg.choices.every(block => {
      //  for multi-word blocks, all must match
      const allWords = block.every((cr, w_index) => {
        const tryTerm = state.t + w_index;
        if (state.terms[tryTerm] === undefined) {
          return false
        }
        return wrapMatch(state.terms[tryTerm], cr, state.start_i + tryTerm, state.phrase_length)
      });
      if (allWords === true && block.length > longest) {
        longest = block.length;
      }
      return allWords
    });
    if (allDidMatch === true) {
      // console.log(`doAndBlock ${state.terms[state.t].normal}`)
      return longest
    }
    return false
  };

  const orBlock = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const skipNum = doOrBlock(state);
    // did we find a match?
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      // tuck in as named-group
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-or|`)
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  // '(foo && #Noun)' - require all matches on the term
  const andBlock = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    const skipNum = doAndBlock(state);
    if (skipNum) {
      // handle 'not' logic
      if (reg.negative === true) {
        return null // die
      }
      if (state.hasGroup === true) {
        const g = getGroup$1(state, state.t);
        g.length += skipNum;
      }
      // ensure we're at the end
      if (reg.end === true) {
        const end = state.phrase_length;
        if (state.t + state.start_i + skipNum !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-and|`)
      return true
    }
    // we didn't find it - for a negative-block, that's good news
    if (reg.negative === true) {
      // a '!(a && b)?' can pass-through without consuming anything
      if (!reg.optional) {
        state.t += 1;
      }
      return true
    }
    if (!reg.optional) {
      return null //die
    }
    return true
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = wrapMatch(state.terms[t], reg, state.start_i + t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = wrapMatch(state.terms[t], nextReg, state.start_i + t, state.phrase_length);
        if (found) {
          break
        }
      }
      skip += 1;
      // is it max-length now?
      if (reg.max !== undefined && skip === reg.max) {
        break
      }
    }
    if (skip === 0) {
      return false //dead
    }
    // did we satisfy min for !foo{min,max}
    if (reg.min && reg.min > skip) {
      return false//dead
    }
    state.t += skip;
    // state.r += 1
    return true
  };

  // '!foo' should match anything that isn't 'foo'
  // if it matches, return false
  const doNegative = function (state) {
    const { regs } = state;
    const reg = regs[state.r];

    // match *anything* but this term
    const tmpReg = { ...reg };
    tmpReg.negative = false; // try removing it

    // found it? if so, we die here
    const found = wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length);
    if (found) {
      return false//bye
    }
    // should we skip the term too?
    if (reg.optional) {
      // "before after" - "before !foo? after"
      // does the next reg match the this term?
      const nextReg = regs[state.r + 1];
      if (nextReg) {
        const fNext = wrapMatch(state.terms[state.t], nextReg, state.start_i + state.t, state.phrase_length);
        if (fNext) {
          state.r += 1;
        } else if (nextReg.optional && regs[state.r + 2]) {
          // ugh. ok,
          // support "!foo? extra? need"
          // but don't scan ahead more than that.
          const fNext2 = wrapMatch(state.terms[state.t], regs[state.r + 2], state.start_i + state.t, state.phrase_length);
          if (fNext2) {
            state.r += 2;
          }
        }
      }
    }
    // negative greedy - !foo+  - super hard!
    if (reg.greedy) {
      return negGreedy(state, tmpReg, regs[state.r + 1])
    }
    state.t += 1;
    return true
  };

  // 'foo? foo' matches are tricky.
  const foundOptional = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const term = state.terms[state.t];
    // does the next reg match it too?
    const nextRegMatched = wrapMatch(term, regs[state.r + 1], state.start_i + state.t, state.phrase_length);
    if (reg.negative || nextRegMatched) {
      // but does the next reg match the next term??
      // only skip if it doesn't
      const nextTerm = state.terms[state.t + 1];
      if (!nextTerm || !wrapMatch(nextTerm, regs[state.r + 1], state.start_i + state.t + 1, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    const reg = regs[state.r];
    // foo{2,4} min-lengths are enforced inside getGreedy
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // 'foo+$' - if also an end-anchor, ensure we really reached the end
    if (reg.end === true && state.start_i + state.t !== phrase_length) {
      return null //greedy didn't reach the end
    }
    return true
  };

  // for: ['we', 'have']
  // a match for "we have" should work as normal
  // but matching "we've" should skip over implict terms
  const contractionSkip = function (state) {
    const term = state.terms[state.t];
    const reg = state.regs[state.r];
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      const nextTerm = state.terms[state.t + 1];
      // ensure next word is implicit
      if (!nextTerm.implicit) {
        return
      }
      // we matched "we've" - skip-over [we, have]
      if (reg.word === term.normal) {
        state.t += 1;
      }
      // also skip for @hasContraction
      if (reg.method === 'hasContraction') {
        state.t += 1;
      }
    }
  };

  // '[foo]' should also be logged as a group
  const setGroup = function (state, startAt) {
    const reg = state.regs[state.r];
    // Get or create capture group
    const g = getGroup$1(state, startAt);
    // Update group - add greedy or increment length
    if (state.t - state.offset > 1 && reg.greedy) {
      g.length += state.t - startAt;
    } else {
      g.length++;
    }
  };

  // when a reg matches a term
  const simpleMatch = function (state) {
    const { regs } = state;
    const reg = regs[state.r];
    const term = state.terms[state.t];
    const startAt = state.t;
    // if it's a negative optional match... :0
    if (reg.optional && regs[state.r + 1] && reg.negative) {
      return true
    }
    // okay, it was a match, but if it's optional too,
    // we should check the next reg too, to skip it?
    if (reg.optional && regs[state.r + 1]) {
      foundOptional(state);
    }
    // Contraction skip:
    // did we match the first part of a contraction?
    if (term.implicit && state.terms[state.t + 1]) {
      contractionSkip(state);
    }
    //advance to the next term!
    state.t += 1;
    //check any ending '$' flags
    //if this isn't the last term, refuse the match
    if (reg.end === true && state.t !== state.terms.length && reg.greedy !== true) {
      return null //die
    }
    // keep 'foo+' going...
    if (reg.greedy === true) {
      const alive = greedyMatch(state);
      if (!alive) {
        return null
      }
    }
    // log '[foo]' as a group
    if (state.hasGroup === true) {
      setGroup(state, startAt);
    }
    return true
  };

  // i formally apologize for how complicated this is.

  /** 
   * try a sequence of match tokens ('regs') 
   * on a sequence of terms, 
   * starting at this certain term.
   */
  const tryHere = function (terms, regs, start_i, phrase_length, offset = 0) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
    if (offset >= terms.length || regs.length === 0) {
      return null
    }
    // Use the original terms with a cursor instead of copying the remaining
    // sentence at every starting position. origin maps array indices to match
    // pointers; offset marks the beginning of this attempt within the array.
    const origin = start_i - offset;
    const state = {
      t: offset,
      offset: offset,
      terms: terms,
      r: 0,
      regs: regs,
      groups: null,
      start_i: origin,
      phrase_length: phrase_length,
      inGroup: null,
    };

    // we must satisfy every token in 'regs'
    // if we get to the end, we have a match.
    for (; state.r < regs.length; state.r += 1) {
      const reg = regs[state.r];
      // Check if this reg has a named capture group
      state.hasGroup = Boolean(reg.group);
      // Reuse previous capture group if same
      if (state.hasGroup === true) {
        state.inGroup = reg.group;
      } else {
        state.inGroup = null;
      }
      //have we run-out of terms?
      if (!state.terms[state.t]) {
        //are all remaining regs optional or negative?
        const alive = regs.slice(state.r).some(remain => !remain.optional);
        if (alive === false) {
          break //done!
        }
        return null // die
      }
      // support 'unspecific greedy' .* properly
      if (reg.anything === true && reg.greedy === true) {
        const alive = doAstrix(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-OR - multi-word OR (a|b|foo bar)
      if (reg.choices !== undefined && reg.operator === 'or') {
        const alive = orBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // slow-AND - multi-word AND (#Noun && foo) blocks
      if (reg.choices !== undefined && reg.operator === 'and') {
        const alive = andBlock(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support '.' as any-single
      if (reg.anything === true) {
        // '!.' negative anything should insta-fail
        if (reg.negative && reg.anything) {
          return null
        }
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // support 'foo*$' until the end
      if (isEndGreedy(reg, state) === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, it doesn't match - but maybe it wasn't *supposed* to?
      if (reg.negative) {
        // we want *anything* but this term
        const alive = doNegative(state);
        if (!alive) {
          return null
        }
        continue
      }
      // ok, finally test the term-reg
      const hasMatch = wrapMatch(state.terms[state.t], reg, state.start_i + state.t, state.phrase_length);
      if (hasMatch === true) {
        const alive = simpleMatch(state);
        if (!alive) {
          return null
        }
        continue
      }
      //ok who cares, keep going
      if (reg.optional === true) {
        continue
      }

      // finally, we die
      return null
    }
    //return our results, as pointers
    const pntr = [null, start_i, state.t + origin];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    if (state.groups) {
      Object.keys(state.groups).forEach(k => {
        const o = state.groups[k];
        const start = origin + o.start;
        groups[k] = [null, start, start + o.length];
      });
    }
    return { pointer: pntr, groups: groups }
  };

  // support returning a subset of a match
  // like 'foo [bar] baz' -> bar
  const getGroup = function (res, group) {
    const ptrs = [];
    const byGroup = {};
    if (res.length === 0) {
      return { ptrs, byGroup }
    }
    if (typeof group === 'number') {
      group = String(group);
    }
    if (group) {
      res.forEach(r => {
        if (r.groups[group]) {
          ptrs.push(r.groups[group]);
        }
      });
    } else {
      res.forEach(r => {
        ptrs.push(r.pointer);
        Object.keys(r.groups).forEach(k => {
          byGroup[k] ||= [];
          byGroup[k].push(r.groups[k]);
        });
      });
    }
    return { ptrs, byGroup }
  };

  const notIf = function (results, not, docs) {
    results = results.filter(res => {
      const [n, start, end] = res.pointer;
      const terms = docs[n].slice(start, end);
      for (let i = 0; i < terms.length; i += 1) {
        const found = tryHere(terms, not, i, terms.length, i);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  // Compiled sweeps cache this check; editable public patterns are rechecked.
  const isFixed = regs => regs.every(reg => !reg.optional && !reg.greedy &&
    !reg.negative && !reg.choices && !reg.anything &&
    (reg.word !== undefined || reg.tag !== undefined || reg.switch !== undefined || reg.fastOr !== undefined));

  const fromFixed = (terms, regs, start, length, offset = 0) => {
    if (offset + regs.length > terms.length) {
      return null
    }
    for (let r = 0; r < regs.length; r += 1) {
      const term = terms[offset + r];
      // A literal contraction can consume more than one term.
      if (term.implicit) {
        return tryHere(terms, regs, start, length, offset)
      }
      if (wrapMatch(term, regs[r], start + r, length) !== true) {
        return null
      }
    }
    // Failed attempts never need capture state.
    const groups = {};
    for (let r = 0; r < regs.length; r += 1) {
      const name = regs[r].group;
      if (name) {
        if (!groups[name]) {
          groups[name] = [null, start + r, start + r];
        }
        groups[name][2] += 1;
      }
    }
    return { pointer: [null, start, start + regs.length], groups }
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n, attempt) {
    let res = attempt(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache ||= [];
    const { regs, group, justOne, checkFirst } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }
    const attempt = (todo.fixed ?? isFixed(regs)) ? fromFixed : tryHere;

    // Compiled rules carry this value; public parsed patterns can still be edited
    // by callers, so calculate their minimum without caching on the token array.
    let minLength = todo.minLength;
    if (minLength === undefined) {
      minLength = 0;
      for (let i = 0; i < regs.length; i += 1) {
        const reg = regs[i];
        if (reg.optional !== true && reg.negative !== true) {
          minLength += 1;
        }
      }
    }
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n, attempt);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        // ensure it's long-enough
        if (terms.length - i < minLength) {
          break
        }
        // Compiled sweep rules can reject a start before allocating match state.
        if (checkFirst && !wrapMatch(terms[i], regs[0], i, terms.length)) {
          continue
        }
        let res = attempt(terms, regs, i, terms.length, i);
        // did we find a result?
        if (res) {
          // res = addSentence(res, index[0])
          res = addSentence(res, n);
          results.push(res);
          // should we stop here?
          if (justOne === true) {
            break docs
          }
          // skip ahead, over these results
          const end = res.pointer[2];
          if (Math.abs(end - 1) > i) {
            i = Math.abs(end - 1);
          }
        }
      }
    }
    // ensure any end-results ($) match until the last term
    if (regs[regs.length - 1].end === true) {
      results = results.filter(res => {
        const n = res.pointer[0];
        return docs[n].length === res.pointer[2]
      });
    }
    if (todo.notIf) {
      results = notIf(results, todo.notIf, docs);
    }
    // grab the requested group
    results = getGroup(results, group);
    // add ids to pointers
    results.ptrs.forEach(ptr => {
      const [n, start, end] = ptr;
      ptr[3] = docs[n][start].id;//start-id
      ptr[4] = docs[n][end - 1].id;//end-id
    });
    return results
  };

  const methods$b = {
    one: {
      termMethods: methods$c,
      parseMatch: syntax,
      match: runMatch$1,
    },
  };

  var lib$3 = {
    /** pre-parse any match statements */
    parseMatch: function (str, opts) {
      const world = this.world();
      const killUnicode = world.methods.one.killUnicode;
      if (killUnicode) {
        str = killUnicode(str, world);
      }
      return world.methods.one.parseMatch(str, opts, world)
    }
  };

  var match = {
    api: matchAPI,
    methods: methods$b,
    lib: lib$3,
  };

  const isClass = /^\../;
  const isId = /^#./;

  const escapeXml = str => {
    str = str.replaceAll('&', '&amp;');
    str = str.replaceAll('<', '&lt;');
    str = str.replaceAll('>', '&gt;');
    str = str.replaceAll('"', '&quot;');
    str = str.replaceAll("'", '&apos;');
    return str
  };

  // interpret .class, #id, tagName
  const toTag = function (k) {
    let start = '';
    let end = '</span>';
    k = escapeXml(k);
    if (isClass.test(k)) {
      start = `<span class="${k.replace(/^\./, '')}"`;
    } else if (isId.test(k)) {
      start = `<span id="${k.replace(/^#/, '')}"`;
    } else {
      start = `<${k}`;
      end = `</${k}>`;
    }
    start += '>';
    return { start, end }
  };

  const getIndex = function (doc, obj) {
    const starts = {};
    const ends = {};
    Object.keys(obj).forEach(k => {
      let res = obj[k];
      const tag = toTag(k);
      if (typeof res === 'string') {
        res = doc.match(res);
      }
      res.docs.forEach(terms => {
        // don't highlight implicit terms
        if (terms.every(t => t.implicit)) {
          return
        }
        const a = terms[0].id;
        starts[a] ||= [];
        starts[a].push(tag.start);
        const b = terms.at(-1).id;
        ends[b] ||= [];
        ends[b].push(tag.end);
      });
    });
    return { starts, ends }
  };

  const html = function (obj) {
    // index ids to highlight
    const { starts, ends } = getIndex(this, obj);
    // create the text output
    let out = '';
    this.docs.forEach(terms => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (Object.hasOwn(starts, t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '';
        out += t.text || '';
        if (Object.hasOwn(ends, t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  // Walk the trailing punctuation run once, rather than retrying at every offset.
  const endPunctuation = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]/;
  const trimEnd = str => {
    let end = str.length;
    while (end > 0 && endPunctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach(t => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
        pre = pre.replace(/[,،]/g, '');
        pre = pre.replace(trimStart, '');
        // replace a hyphen with a space
        if (isHyphen.test(post)) {
          post = ' ';
        }
        post = post.replace(punctToKill, '');
        // cleanup exclamations
        post = post.replace(/\?!+/, '?');
        post = post.replace(/!+/, '!');
        post = post.replace(/\?+/, '?');
        // kill elipses
        post = post.replace(/[,،…]|\.{2,}/g, '');
        // kill abbreviation periods
        if (t.tags.has('Abbreviation')) {
          post = post.replace(/\./, '');
        }
      }
      if (opts.whitespace === 'some') {
        pre = pre.replace(/\s/, ''); //remove pre-whitespace
        post = post.replace(/\s+/, ' '); //replace post-whitespace with a space
      }
      if (!opts.keepPunct) {
        pre = pre.replace(trimStart, '');
        if (post === '-') {
          post = ' ';
        } else {
          post = trimEnd(post);
        }
      }
      // grab the correct word format
      let word = t[opts.form || 'text'] || t.normal || '';
      if (opts.form === 'implicit') {
        word = t.implicit || t.text;
      }
      if (opts.form === 'root' && t.implicit) {
        word = t.root || t.implicit || t.normal;
      }
      // add an implicit space, for contractions
      if ((opts.form === 'machine' || opts.form === 'implicit' || opts.form === 'root') && t.implicit) {
        if (!post || !hasSpace.test(post)) {
          post += ' ';
        }
      }
      txt += pre + word + post;
    });
    if (keepSpace === false) {
      txt = txt.trim();
    }
    if (opts.lowerCase === true) {
      txt = txt.toLowerCase();
    }
    return txt
  };

  const textFromDoc = function (docs, opts) {
    let text = '';
    if (!docs || !docs[0] || !docs[0][0]) {
      return text
    }
    for (let i = 0; i < docs.length; i += 1) {
      // middle
      text += textFromTerms(docs[i], opts, true);
    }
    if (!opts.keepSpace) {
      text = text.trim();
    }
    if (opts.keepEndPunct === false) {
      // don't remove ':)' etc
      if (!docs[0][0].tags.has('Emoticon')) {
        text = text.replace(trimStart, '');
      }
      // remove ending periods
      const last = docs.at(-1);
      if (!last.at(-1).tags.has('Emoticon')) {
        text = trimEnd(text);
        // removing a spaced dash leaves its space behind
        if (!opts.keepSpace) {
          text = text.trimEnd();
        }
      }
      // kill end quotations
      if (text.endsWith(`'`) && !text.endsWith(`s'`)) {
        text = text.replace(/'/, '');
      }
    }
    if (opts.cleanWhitespace === true) {
      text = text.trim();
    }
    return text
  };

  const fmts$1 = {
    text: {
      form: 'text',
    },
    normal: {
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'normal',
    },
    machine: {
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'none',
      unicode: 'some',
      form: 'machine',
    },
    root: {
      keepSpace: false,
      whitespace: 'some',
      punctuation: 'some',
      case: 'some',
      unicode: 'some',
      form: 'root',
    },
    implicit: {
      form: 'implicit',
    }
  };
  fmts$1.clean = fmts$1.normal;
  fmts$1.reduced = fmts$1.root;

  /* eslint-disable no-bitwise, no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i = 0;
  for (; i < 64; i++) {
    k[i] = 0 | (Math.sin((i + 1) % Math.PI) * 4294967296);
  }

  const md5 = function (s) {
    let b,
      c,
      d,
      j = decodeURI(encodeURI(s)) + '\x80',
      a = j.length;

    const h = [(b = 0x67452301), (c = 0xefcdab89), ~b, ~c],
      words = [];

    s = (--a / 4 + 2) | 15;

    words[--s] = a * 8;

    for (; ~a; ) {
      words[a >> 2] |= j.charCodeAt(a) << (8 * a--);
    }

    for (i = j = 0; i < s; i += 16) {
      a = h;

      for (
        ;
        j < 64;
        a = [
          (d = a[3]),
          b +
            (((d =
              a[0] +
              [(b & c) | (~b & d), (d & b) | (~d & c), b ^ c ^ d, c ^ (b | ~d)][(a = j >> 4)] +
              k[j] +
              ~~words[i | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
              (a = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + (j++ % 4)])) |
              (d >>> -a)),
          b,
          c,
        ]
      ) {
        b = a[1] | 0;
        c = a[2];
      }
      for (j = 4; j; ) h[--j] += a[j];
    }

    for (s = ''; j < 32; ) {
      s += ((h[j >> 3] >> ((1 ^ j++) * 4)) & 15).toString(16);
    }

    return s
  };
  // console.log(md5('food-safety'))

  const defaults$1 = {
    text: true,
    terms: true,
  };

  const opts = { case: 'none', unicode: 'some', form: 'machine', punctuation: 'some' };

  const merge = function (a, b) {
    return { ...a, ...b }
  };

  const fns$1 = {
    text: terms => textFromTerms(terms, { keepPunct: true }, false),
    normal: terms => textFromTerms(terms, merge(fmts$1.normal, { keepPunct: true }), false),
    implicit: terms => textFromTerms(terms, merge(fmts$1.implicit, { keepPunct: true }), false),

    machine: terms => textFromTerms(terms, opts, false),
    root: terms => textFromTerms(terms, merge(opts, { form: 'root' }), false),

    hash: terms => md5(textFromTerms(terms, { keepPunct: true }, false)),

    offset: terms => {
      const len = fns$1.text(terms).length;
      return {
        index: terms[0].offset.index,
        start: terms[0].offset.start,
        length: len,
      }
    },
    terms: terms => {
      return terms.map(t => ({ ...t, tags: [...t.tags] }))
    },
    confidence: (_terms, view, i) => view.eq(i).confidence(),
    syllables: (_terms, view, i) => view.eq(i).syllables(),
    sentence: (_terms, view, i) => view.eq(i).fullSentence().text(),
    dirty: terms => terms.some(t => t.dirty === true),
  };
  fns$1.sentences = fns$1.sentence;
  fns$1.clean = fns$1.normal;
  fns$1.reduced = fns$1.root;

  const toJSON = function (view, option) {
    option ||= {};
    if (typeof option === 'string') {
      option = {};
    }
    option = { ...defaults$1, ...option };
    // run any necessary upfront steps
    if (option.offset) {
      view.compute('offset');
    }
    return view.docs.map((terms, i) => {
      const res = {};
      Object.keys(option).forEach(k => {
        if (option[k] && fns$1[k]) {
          res[k] = fns$1[k](terms, view, i);
        }
      });
      return res
    })
  };

  const methods$a = {
    /** return data */
    json: function (n) {
      const res = toJSON(this, n);
      if (typeof n === 'number') {
        return res[n]
      }
      return res
    },
  };
  methods$a.data = methods$a.json;

  const isClientSide = () => typeof window !== 'undefined' && window.document;

  // Output the requested format, or the platform's default console view.
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    if (!fmt || !Object.hasOwn(debugMethods, fmt)) {
      fmt = isClientSide() ? 'clientSide' : 'tags';
    }
    debugMethods[fmt](this);
    return this
  };

  const toText$1 = function (term) {
    const pre = term.pre || '';
    const post = term.post || '';
    return pre + term.text + post
  };

  const findStarts = function (doc, obj) {
    const starts = {};
    Object.keys(obj).forEach(reg => {
      const m = doc.match(reg);
      m.fullPointer.forEach(a => {
        starts[a[3]] = { fn: obj[reg], end: a[2] };
      });
    });
    return starts
  };

  const wrap = function (doc, obj) {
    // index ids to highlight
    const starts = findStarts(doc, obj);
    let text = '';
    doc.docs.forEach((terms, n) => {
      for (let i = 0; i < terms.length; i += 1) {
        const t = terms[i];
        // do a span tag
        if (Object.hasOwn(starts, t.id)) {
          const { fn, end } = starts[t.id];
          const m = doc.update([[n, i, end]]);
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText$1(t);
        }
      }
    });
    return text
  };

  // the 'spec' output format - a clean sentence + an ordered list of top-level tags
  // designed to round-trip between compromise and LLMs (see docs/spec-format.md)

  // roots that describe a token's shape, not its part-of-speech - never picked over a real POS
  const attributeTags = new Set(['Hyphenated', 'Prefix', 'SlashedTerm']);

  // walk a tag up to its top-level (root) ancestor
  const rootOf = function (tag, tagSet) {
    const entry = tagSet[tag];
    if (!entry || !entry.parents || entry.parents.length === 0) {
      return tag
    }
    for (let i = 0; i < entry.parents.length; i += 1) {
      const p = entry.parents[i];
      if (tagSet[p] && (!tagSet[p].parents || tagSet[p].parents.length === 0)) {
        return p
      }
    }
    return entry.parents.at(-1)
  };

  // reduce a term's tag-set to a single top-level tag (or '-' when untagged)
  const slotForTerm = function (term, tagSet) {
    const tags = Array.from(term.tags || []);
    if (tags.length === 0) {
      return '-'
    }
    const primary = tags.find(t => !attributeTags.has(rootOf(t, tagSet))) || tags[0];
    return rootOf(primary, tagSet)
  };

  const makeAliases = function (tagSet, registered) {
    const aliases = Object.create(null);
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      // A leading null explicitly keeps the canonical name.
      const preferred = entry.aliases === undefined ? entry.alias : entry.aliases[0];
      if (preferred && registered[preferred] === tag) {
        aliases[tag] = preferred;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet, world.model.one.tagAliases);
    return doc.docs.map(terms => {
      const text = terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();
      const tags = terms.map(t => {
        const tag = slotForTerm(t, tagSet);
        return aliases[tag] || tag
      }).join(',');
      return `${text} {${tags}}`
    }).join('\n')
  };

  const isObject$2 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  // sort by frequency
  const topk = function (arr) {
    const counts = new Map();
    arr.forEach(word => {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
    const res = Array.from(counts, ([normal, count]) => ({ normal, count }));
    return res.sort((a, b) => b.count - a.count)
  };

  /** some named output formats */
  const out$1 = function (method) {
    // support custom outputs
    if (isObject$2(method)) {
      return wrap(this, method)
    }
    // text out formats
    if (method === 'text') {
      return this.text()
    }
    if (method === 'normal') {
      return this.text('normal')
    }
    if (method === 'root') {
      return this.text('root')
    }
    if (method === 'machine' || method === 'reduced') {
      return this.text('machine')
    }
    if (method === 'hash' || method === 'md5') {
      return md5(this.text())
    }
    // tagged-sentence format for LLMs (see docs/spec-format.md)
    if (method === 'spec') {
      return toSpec(this, this.world)
    }
    // json data formats
    if (method === 'json') {
      return this.json()
    }
    if (method === 'offset' || method === 'offsets') {
      this.compute('offset');
      return this.json({ offset: true })
    }
    if (method === 'array') {
      const arr = this.docs.map(terms => {
        return terms
          .reduce((str, t) => {
            return str + t.pre + t.text + t.post
          }, '')
          .trim()
      });
      return arr.filter(str => str)
    }
    // return terms sorted by frequency
    if (method === 'freq' || method === 'frequency' || method === 'topk') {
      return topk(this.json({ normal: true }).map(o => o.normal))
    }

    // some handy ad-hoc outputs
    if (method === 'terms') {
      return this.docs.flatMap(terms => terms.map(t => t.text).filter(Boolean))
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
    }
    if (method === 'best-tag') {
      this.compute('tagRank');
      return this.docs
        .map(ts => {
          return ts.map(t => (t.tagRank?.[0] ? `#${t.tagRank[0]}` : '')).join(' ')
        })
        .join('\n')
    }
    if (method === 'debug') {
      return this.debug() //allow
    }
    return this.text()
  };

  const methods$9 = {
    /** */
    debug: debug$1,
    /** */
    out: out$1,
    /** */
    wrap: function (obj) {
      return wrap(this, obj)
    },
  };

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };
  // a dash between two words, like '2025-05-11 - they'
  const spacedDash = /^\s+[-—]\s+$/;

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && Object.hasOwn(fmts$1, fmt)) {
        opts = { ...fmts$1[fmt] };
      } else if (fmt && isObject$1(fmt)) {
        opts = { ...fmt }; //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        const lastTerm = this.docs.at(-1)?.at(-1);
        if (ptr?.[1] || spacedDash.test(lastTerm?.post)) {
          opts.keepEndPunct = false;
        } else {
          opts.keepEndPunct = true;
        }
      }
      // set defaults
      if (opts.keepPunct === undefined) {
        opts.keepPunct = true;
      }
      if (opts.keepSpace === undefined) {
        opts.keepSpace = true;
      }
      return textFromDoc(this.docs, opts)
    },
  };

  const methods$8 = { ...methods$9, ...text, ...methods$a, ...html$1 };

  const addAPI$1 = function (View) {
    Object.assign(View.prototype, methods$8);
  };

  /* eslint-disable no-console */
  const logClientSide = function (view) {
    console.log('%c -=-=- ', 'background-color:#6699cc;');
    view.forEach(m => {
      console.groupCollapsed(m.text());
      const terms = m.docs[0];
      const out = terms.map(t => {
        let text = t.text || '-';
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        const tags = '[' + Array.from(t.tags).join(', ') + ']';
        return { text, tags }
      });
      console.table(out, ['text', 'tags']);
      console.groupEnd();
    });
  };

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!Object.hasOwn(model.one.tagSet, tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli$1[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(blue('\n  ╭─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${dim(i$1('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = blue('  │ ') + i$1(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const colors$1 = { Noun: blue, Verb: green, Adjective: yellow, Pivot: red };

  const showChunks = view => {
    console.log('');
    view.docs.forEach(terms => {
      const out = terms.map(term => {
        const text = term.implicit || term.normal;
        if (Object.hasOwn(colors$1, term.chunk)) {
          return colors$1[term.chunk](text)
        }
        return text
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const spliceIn = (txt, offset, index) => {
    const start = offset.start + index * 9; // Each highlight adds nine ANSI characters.
    const end = start + offset.length;
    return txt.substring(0, start) + blue(txt.substring(start, end)) + txt.substring(end)
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    const bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] ||= [];
      bySentence[ptr[0]].push(ptr);
    });
    Object.keys(bySentence).forEach(k => {
      const full = doc.update([[Number(k)]]);
      let txt = full.text();
      const matches = doc.update(bySentence[k]);
      const json = matches.json({ offset: true });
      json.forEach((obj, i) => {
        txt = spliceIn(txt, obj.offset, i);
      });
      console.log(txt);
    });
    console.log('\n');
  };

  const debug = {
    tags: showTags,
    clientSide: logClientSide,
    chunks: showChunks,
    highlight: showHighlight,
  };

  // Diagnostics describe the original parse, before the returned View is mutated.
  const specFailures = (doc, slots, patterns, aliases) => {
    const terms = doc.docs.flat();
    const failures = [];
    if (terms.length !== slots.length) {
      failures.push({
        code: 'length', expected: slots.length, actual: terms.length,
        message: `expected ${slots.length} terms, got ${terms.length}`,
      });
    }
    doc.compute('tagRank');
    slots.forEach((slot, i) => {
      const term = terms[i];
      const actual = term ? Array.from(term.tags) : [];
      const detail = { term: i + 1, word: term?.implicit || term?.text || '', expected: slot, actual };
      if (patterns[i] === null) {
        failures.push({ ...detail, code: 'syntax', message: `term ${i + 1}: invalid slot ${slot.join('|')}` });
        return
      }
      if (!term) {
        return // covered by the length error
      }
      const problems = [];
      slot.forEach(value => {
        if (value === '.') {
          return
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        if (negative && present) {
          problems.push(`unexpected #${tag}`);
        } else if (!negative && !present) {
          problems.push(`missing #${tag}`);
        }
      });
      if (problems.length > 0) {
        const best = term.tagRank?.[0] || actual.at(-1) || 'Untagged';
        failures.push({
          ...detail, code: 'tags',
          message: `term ${i + 1} '${detail.word}': #${best}, ${problems.join(', ')}`,
        });
      }
    });
    if (failures.length === 0) {
      failures.push({ code: 'match', message: 'tags align, but the sentence pattern did not match' });
    }
    return failures
  };

  const logSpec = (doc, slots, failures, aliases) => {
    const terms = doc.docs.flat();
    const wrong = new Set(failures.filter(failure => failure.term).map(failure => failure.term - 1));
    const invalid = new Set(failures.filter(failure => failure.code === 'syntax').map(failure => failure.term - 1));
    const unmatched = failures.some(failure => failure.code === 'match');
    let visible = 0;
    terms.forEach((term, i) => {
      if (term.text) {
        visible = i;
      }
      // Implicit terms share their visible contraction or number-range token.
      if (wrong.has(i) || i >= slots.length || unmatched) {
        wrong.add(visible);
      }
    });
    const text = terms.map((term, i) => {
      const word = wrong.has(i) && term.text ? red(term.text) : term.text;
      return term.pre + word + term.post
    }).join('').trim();
    const tags = slots.map((slot, i) => {
      const term = terms[i];
      if (!term || invalid.has(i) || unmatched) {
        return red(slot.join('|'))
      }
      return slot.map(value => {
        if (value === '.') {
          return value
        }
        const negative = value.startsWith('!');
        const tag = value.replace(/^!?#?/, '');
        const present = term.tags.has(aliases[tag] || tag);
        return present === negative ? red(value) : value
      }).join('|')
    }).join(',');
    const block = slots.length === 0 ? red('{}') : `{${tags}}`;
    return `${text} ${block}`
  };

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only
  const comment = /\}[ \t]*#.*$/; // an optional '# comment' after the last {tags} block


  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace); // eslint-disable-line prefer-const
    if (tags === undefined) {
      return { text: text.replace(/\s#.*$/, '').trimEnd(), tags: null } // no {tags} block on this line
    }
    tags = tags.replace(comment, '}'); // drop the comment - only ever one, always last
    tags = tags.split(',').map(tag => tag.trim());
    const lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    if (tags.length === 1 && tags[0].length === 1 && tags[0][0] === '') {
      tags = []; // empty '{}'; retain empty slots in nonempty lists
    }
    return { text, tags }
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    // Slots accept tags and '.', never match-syntax quantifiers or groups.
    if (tags.some(slot => slot.some(tag => tag !== '.' && !/^!?#?[a-z][a-z0-9]*$/i.test(tag)))) {
      return null
    }
    return tags.map(arr => {
      arr = arr.map(str => {
        if (str === '.') {
          return '.'
        }
        const negative = str.startsWith('!');
        const tag = str.replace(/^!?#?/, '');
        const prefix = negative ? '!#' : '#';
        return prefix + (aliases[tag] || tag)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // Apply only positive constraints; negatives remain assertions.
  const applyTags = (doc, slots, aliases) => {
    const terms = doc.terms();
    // Tokenization can supply structural tags; literal slots replace them.
    doc.docs.flat().forEach(term => term.tags.clear());
    slots?.forEach((slot, i) => {
      const tags = slot.filter(tag => tag !== '.' && !tag.startsWith('!')).map(tag => {
        tag = tag.replace(/^#/, '');
        return aliases[tag] || tag
      });
      terms.eq(i).tag(tags, 'fromSpec');
    });
  };

  const fromSpec = function (spec, { tags: tagMode = 'ignore', failures: failureMode = 'ignore', verbose = false } = {}) {
    if (!['ignore', 'use'].includes(tagMode) || !['ignore', 'throw', 'retain', 'log'].includes(failureMode)) {
      throw new Error('Invalid fromSpec options')
    }
    const aliases = this.world().model.one.tagAliases;
    const result = this('');
    result.failures = [];
    spec.split('\n').forEach((line, index) => {
      if (!line.trim() || /^\s*#/.test(line)) {
        return
      }
      const { text, tags } = parseLine(line);
      const doc = tagMode === 'use' ? this.tokenize(text) : this(text);
      let failures = [];
      if (tags !== null && (tagMode === 'use' || failureMode !== 'ignore')) {
        const count = doc.docs.reduce((sum, terms) => sum + terms.length, 0);
        const patterns = tags.map(slot => toMatchString([slot], aliases));
        const pattern = toMatchString(tags, aliases);
        // Assigning slots is unsafe when the shape or syntax is invalid.
        const canApply = count === tags.length && pattern !== null;
        if (tagMode === 'use' && !canApply && failureMode !== 'log') {
          const invalid = specFailures(doc, tags, patterns, aliases);
          throw new Error(`${text.trim()} - ${invalid.map(failure => failure.message).join('; ')}`)
        }
        if (tagMode === 'use') {
          applyTags(doc, canApply ? tags : null, aliases);
        }
        if (failureMode !== 'ignore' && (count !== tags.length || pattern === null || !doc.has(pattern))) {
          failures = specFailures(doc, tags, patterns, aliases)
            .map(failure => ({ line: index + 1, text: text.trim(), ...failure }));
          result.failures.push(...failures);
        }
      } else if (tagMode === 'use') {
        applyTags(doc, null, aliases);
      }
      const detail = failures.map(failure => failure.message).join('; ');
      if (failureMode === 'log' && failures.length > 0) {
        console.error(logSpec(doc, tags, failures, aliases)); //eslint-disable-line no-console
      } else if (verbose) {
        const block = tags === null ? '' : ` {${tags.map(slot => slot.join('|')).join(',')}}`;
        if (failures.length > 0) {
          console.log(`${red('✗')} ${text}${dim(block)} - ${red(detail)}`); //eslint-disable-line no-console
        } else {
          console.log(`${green('✓')} ${green(dim(text))}${dim(block)}`); //eslint-disable-line no-console
        }
      }
      if (failures.length > 0 && failureMode === 'throw') {
        throw new Error(`${text.trim()} - ${detail}`)
      }
      if (failureMode === 'retain' && tags !== null && failures.length === 0) {
        return
      }
      // Preserve the parsed terms and assigned tags, without running hooks twice.
      if (doc.found) {
        const previous = result.document.at(-1)?.at(-1);
        if (previous) {
          previous.post += '\n';
        }
        result.document.push(...doc.docs);
      }
    });
    return result
  };

  // Keep the legacy logging and throwing arguments on the compatibility wrapper.
  const testSpec = function (spec, verbose = true, throwError = false) {
    const result = this.fromSpec(spec, { tags: 'ignore', failures: 'retain', verbose });
    if (throwError && result.failures.length > 0) {
      const failure = result.failures[0];
      throw new Error(`${failure.text} - ${failure.message}`)
    }
    return result
  };

  var output = {
    lib: {
      fromSpec,
      testSpec,
    },
    api: addAPI$1,
    methods: {
      one: {
        hash: md5,
        debug,
      },
    },
  };

  // do the pointers intersect?
  const doesOverlap = function (a, b) {
    if (a[0] !== b[0]) {
      return false
    }
    const [, startA, endA] = a;
    const [, startB, endB] = b;
    // [a,a,a,-,-,-,]
    // [-,-,b,b,b,-,]
    if (startA <= startB && endA > startB) {
      return true
    }
    // [-,-,-,a,a,-,]
    // [-,-,b,b,b,-,]
    if (startB <= startA && endB > startA) {
      return true
    }
    return false
  };

  // get widest min/max
  const getExtent = function (ptrs) {
    let min = ptrs[0][1];
    let max = ptrs[0][2];
    ptrs.forEach(ptr => {
      if (ptr[1] < min) {
        min = ptr[1];
      }
      if (ptr[2] > max) {
        max = ptr[2];
      }
    });
    return [ptrs[0][0], min, max]
  };

  // collect pointers by sentence number
  const indexN = function (ptrs) {
    const byN = {};
    ptrs.forEach(ref => {
      byN[ref[0]] ||= [];
      byN[ref[0]].push(ref);
    });
    return byN
  };

  // remove exact duplicates
  const uniquePtrs = function (arr) {
    const obj = {};
    for (let i = 0; i < arr.length; i += 1) {
      obj[arr[i].join(',')] = arr[i];
    }
    return Object.values(obj)
  };

  // a before b
  // console.log(doesOverlap([0, 0, 4], [0, 2, 5]))
  // // b before a
  // console.log(doesOverlap([0, 3, 4], [0, 1, 5]))
  // // disjoint
  // console.log(doesOverlap([0, 0, 3], [0, 4, 5]))
  // neighbours
  // console.log(doesOverlap([0, 1, 3], [0, 3, 5]))
  // console.log(doesOverlap([0, 3, 5], [0, 1, 3]))

  // console.log(
  //   getExtent([
  //     [0, 3, 4],
  //     [0, 4, 5],
  //     [0, 1, 2],
  //   ])
  // )

  // split a pointer, by match pointer
  const pivotBy = function (full, m) {
    const [n, start] = full;
    const mStart = m[1];
    const mEnd = m[2];
    const res = {};
    // is there space before the match?
    if (start < mStart) {
      const end = mStart < full[2] ? mStart : full[2]; // find closest end-point
      res.before = [n, start, end]; //before segment
    }
    res.match = m;
    // is there space after the match?
    if (full[2] > mEnd) {
      res.after = [n, mEnd, full[2]]; //after segment
    }
    return res
  };

  const doesMatch = function (full, m) {
    return full[1] <= m[1] && m[2] <= full[2]
  };

  const splitAll = function (full, m) {
    const byN = indexN(m);
    const res = [];
    full.forEach(ptr => {
      const [n] = ptr;
      let matches = byN[n] || [];
      matches = matches.filter(p => doesMatch(ptr, p));
      if (matches.length === 0) {
        res.push({ passthrough: ptr });
        return
      }
      // ensure matches are in-order
      matches = matches.sort((a, b) => a[1] - b[1]);
      // start splitting our left-to-right
      let carry = ptr;
      matches.forEach((p, i) => {
        const found = pivotBy(carry, p);
        // last one
        if (!matches[i + 1]) {
          res.push(found);
        } else {
          res.push({ before: found.before, match: found.match });
          if (found.after) {
            carry = found.after;
          }
        }
      });
    });
    return res
  };

  const max$1 = 20;

  // sweep-around looking for our start term uuid
  const blindSweep = function (id, doc, n) {
    for (let i = 0; i < max$1; i += 1) {
      // look up a sentence
      if (doc[n - i]) {
        const index = doc[n - i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n - i, index]
        }
      }
      // look down a sentence
      if (doc[n + i]) {
        const index = doc[n + i].findIndex(term => term.id === id);
        if (index !== -1) {
          return [n + i, index]
        }
      }
    }
    return null
  };

  const repairEnding = function (ptr, document) {
    const [n, start, , , endId] = ptr;
    const terms = document[n];
    // look for end-id
    const newEnd = terms.findIndex(t => t.id === endId);
    if (newEnd === -1) {
      // if end-term wasn't found, so go all the way to the end
      ptr[2] = document[n].length;
      ptr[4] = terms.length > 0 ? terms[terms.length - 1].id : null;
    } else {
      ptr[2] = newEnd; // repair ending pointer
    }
    return document[n].slice(start, ptr[2] + 1)
  };

  /** return a subset of the document, from a pointer */
  const getDoc$1 = function (ptrs, document) {
    let doc = [];
    ptrs.forEach((ptr, i) => {
      if (!ptr) {
        return
      }
      // eslint-disable-next-line prefer-const
      let [n, start, end, id, endId] = ptr;
      let terms = document[n] || [];
      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = terms.length;
      }
      if (id && (!terms[start] || terms[start].id !== id)) {
        // console.log('  repairing pointer...')
        const wild = blindSweep(id, document, n);
        if (wild !== null) {
          const len = end - start;
          terms = document[wild[0]].slice(wild[1], wild[1] + len);
          // actually change the pointer
          const startId = terms[0] ? terms[0].id : null;
          ptrs[i] = [wild[0], wild[1], wild[1] + len, startId];
        }
      } else {
        terms = terms.slice(start, end);
      }
      if (terms.length === 0) {
        return
      }
      if (start === end) {
        return
      }
      // test end-id, if it exists
      if (endId && terms[terms.length - 1].id !== endId) {
        terms = repairEnding(ptr, document);
      }
      // otherwise, looks good!
      doc.push(terms);
    });
    doc = doc.filter(a => a.length > 0);
    return doc
  };

  // flat list of terms from nested document
  const termList = function (docs) {
    const arr = [];
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        arr.push(docs[i][t]);
      }
    }
    return arr
  };

  var methods$7 = {
    one: {
      termList,
      getDoc: getDoc$1,
      pointer: {
        indexN,
        splitAll,
      }
    },
  };

  // a union is a + b, minus duplicates
  const getUnion = function (a, b) {
    const both = a.concat(b);
    const byN = indexN(both);
    let res = [];
    both.forEach(ptr => {
      const [n] = ptr;
      if (byN[n].length === 1) {
        // we're alone on this sentence, so we're good
        res.push(ptr);
        return
      }
      // there may be overlaps
      const hmm = byN[n].filter(m => doesOverlap(ptr, m));
      hmm.push(ptr);
      const range = getExtent(hmm);
      res.push(range);
    });
    res = uniquePtrs(res);
    return res
  };

  // two disjoint
  // console.log(getUnion([[1, 3, 4]], [[0, 1, 2]]))
  // two disjoint
  // console.log(getUnion([[0, 3, 4]], [[0, 1, 2]]))
  // overlap-plus
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 6]]))
  // overlap
  // console.log(getUnion([[0, 1, 4]], [[0, 2, 3]]))
  // neighbours
  // console.log(getUnion([[0, 1, 3]], [[0, 3, 5]]))

  const subtract = function (refs, not) {
    const res = [];
    const found = splitAll(refs, not);
    found.forEach(o => {
      if (o.passthrough) {
        res.push(o.passthrough);
      }
      if (o.before) {
        res.push(o.before);
      }
      if (o.after) {
        res.push(o.after);
      }
    });
    return res
  };

  // console.log(subtract([[0, 0, 2]], [[0, 0, 1]]))
  // console.log(subtract([[0, 0, 2]], [[0, 1, 2]]))

  // [a,a,a,a,-,-,]
  // [-,-,b,b,b,-,]
  // [-,-,x,x,-,-,]
  const intersection = function (a, b) {
    // find the latest-start
    const start = a[1] < b[1] ? b[1] : a[1];
    // find the earliest-end
    const end = a[2] > b[2] ? b[2] : a[2];
    // does it form a valid pointer?
    if (start < end) {
      return [a[0], start, end]
    }
    return null
  };

  const getIntersection = function (a, b) {
    const byN = indexN(b);
    const res = [];
    a.forEach(ptr => {
      let hmm = byN[ptr[0]] || [];
      hmm = hmm.filter(p => doesOverlap(ptr, p));
      // no sentence-pairs, so no intersection
      if (hmm.length === 0) {
        return
      }
      hmm.forEach(h => {
        const overlap = intersection(ptr, h);
        if (overlap) {
          res.push(overlap);
        }
      });
    });
    return res
  };

  // console.log(getIntersection([[0, 1, 3]], [[0, 2, 4]]))

  const getDoc = (m, view) => {
    if (typeof m === 'string' || Array.isArray(m)) {
      return view.match(m)
    }
    if (!m) {
      return view.none()
    }
    // support pre-parsed reg object
    return m
  };

  // 'harden' our json pointers, again
  const addIds = function (ptrs, docs) {
    return ptrs.map(ptr => {
      const [n, start] = ptr;
      if (docs[n] && docs[n][start]) {
        ptr[3] = docs[n][start].id;
      }
      return ptr
    })
  };

  const methods$6 = {};

  // all parts, minus duplicates
  methods$6.union = function (m) {
    m = getDoc(m, this);
    let ptrs = getUnion(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.and = methods$6.union;

  // only parts they both have
  methods$6.intersection = function (m) {
    m = getDoc(m, this);
    let ptrs = getIntersection(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // only parts of a that b does not have
  methods$6.not = function (m) {
    m = getDoc(m, this);
    let ptrs = subtract(this.fullPointer, m.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };
  methods$6.difference = methods$6.not;

  // get opposite of a match
  methods$6.complement = function () {
    const doc = this.all();
    let ptrs = subtract(doc.fullPointer, this.fullPointer);
    ptrs = addIds(ptrs, this.document);
    return this.toView(ptrs)
  };

  // remove overlaps
  methods$6.settle = function () {
    let ptrs = this.fullPointer;
    ptrs.forEach(ptr => {
      ptrs = getUnion(ptrs, [ptr]);
    });
    ptrs = addIds(ptrs, this.document);
    return this.update(ptrs)
  };

  const addAPI = function (View) {
    // add set/intersection/union
    Object.assign(View.prototype, methods$6);
  };

  var pointers = {
    methods: methods$7,
    api: addAPI,
  };

  var lib$2 = {
    // compile a list of matches into a match-net
    buildNet: function (matches) {
      const methods = this.methods();
      const net = methods.one.buildNet(matches, this.world());
      net.isNet = true;
      return net
    }
  };

  const api$4 = function (View) {

    /** speedy match a sequence of matches */
    View.prototype.sweep = function (net, opts = {}) {
      const { world, docs } = this;
      const { methods } = world;
      let found = methods.one.bulkMatch(docs, net, this.methods, opts);

      // apply any changes
      if (opts.tagger !== false) {
        methods.one.bulkTagger(found, docs, this.world);
      }
      // fix the pointers
      // collect all found results into a View
      found = found.map(o => {
        const ptr = o.pointer;
        const term = docs[ptr[0]][ptr[1]];
        const len = ptr[2] - ptr[1];
        if (term.index) {
          o.pointer = [
            term.index[0],
            term.index[1],
            ptr[1] + len
          ];
        }
        return o
      });
      const ptrs = found.map(o => o.pointer);
      // cleanup results a bit
      found = found.map(obj => {
        obj.view = this.update([obj.pointer]);
        delete obj.regs;
        delete obj.needs;
        delete obj.pointer;
        delete obj._expanded;
        return obj
      });
      return {
        view: this.update(ptrs),
        found
      }
    };

  };

  // Resolve actions and index hints once, alongside the match expression.
  const resolveAliases = (rule, aliases) => {
    const tag = value => {
      if (Array.isArray(value)) {
        return value.map(tag)
      }
      if (typeof value !== 'string') {
        return value
      }
      return value.trim().split(/ +/).map(name => {
        name = name.replace(/^#/, '');
        return aliases[name] || name
      }).join(' ')
    };
    const hook = value => {
      if (typeof value === 'string' && value.startsWith('#')) {
        return '#' + tag(value)
      }
      return value
    };
    if (rule.tag !== undefined) {
      rule.tag = tag(rule.tag);
    }
    if (rule.unTag !== undefined) {
      rule.unTag = tag(rule.unTag);
    }
    if (rule.hook !== undefined) {
      rule.hook = hook(rule.hook);
    }
    if (rule.ifNo !== undefined) {
      rule.ifNo = [rule.ifNo].flat().map(hook);
    }
  };

  // Only precheck required, single-term tokens without special matching steps.
  const canCheck = reg => Boolean(reg && !reg.optional && !reg.negative && !reg.greedy &&
    !reg.choices && !reg.anything && !reg.regex && !reg.method);

  const getBoundary = (reg, boundary) => {
    if (!canCheck(reg) || !reg[boundary]) {
      return null
    }
    return reg
  };

  // extract the clear needs for an individual match token
  const getTokenNeeds = function (reg) {
    // negatives can't be cached
    if (reg.optional === true || reg.negative === true) {
      return null
    }
    if (reg.tag) {
      return '#' + reg.tag
    }
    if (reg.word) {
      return reg.word
    }
    if (reg.switch) {
      return `%${reg.switch}%`
    }
    return null
  };

  // Only allow hooks that every successful match must contain. In particular,
  // a word inside an optional or negative AND block is not a required hook.
  const hasRequiredHook = function (regs, hook) {
    return regs.some(reg => {
      if (reg.optional || reg.negative) {
        return false
      }
      if (getTokenNeeds(reg) === hook) {
        return true
      }
      return reg.operator === 'and' && reg.choices &&
        reg.choices.some(side => hasRequiredHook(side, hook))
    })
  };

  const getNeeds = function (regs) {
    const needs = [];
    regs.forEach(reg => {
      needs.push(getTokenNeeds(reg));
      // support AND (foo && tag)
      if (reg.operator === 'and' && reg.choices) {
        reg.choices.forEach(oneSide => {
          oneSide.forEach(r => {
            needs.push(getTokenNeeds(r));
          });
        });
      }
    });
    return needs.filter(str => str)
  };

  const getWants = function (regs) {
    const wants = [];
    let count = 0;
    regs.forEach(reg => {
      if (reg.operator === 'or' && !reg.optional && !reg.negative) {
        // add fast-or terms
        if (reg.fastOr) {
          Array.from(reg.fastOr).forEach(w => {
            wants.push(w);
          });
        }
        // add slow-or
        if (reg.choices) {
          reg.choices.forEach(rs => {
            rs.forEach(r => {
              const n = getTokenNeeds(r);
              if (n) {
                wants.push(n);
              }
            });
          });
        }
        count += 1;
      }
    });
    return { wants, count }
  };

  const parse$1 = function (matches, world) {
    const parseMatch = world.methods.one.parseMatch;
    matches.forEach(obj => {
      resolveAliases(obj, world.model.one.tagAliases);
      obj.regs = parseMatch(obj.match, {}, world);
      obj.fixed = isFixed(obj.regs);
      obj.checkFirst = canCheck(obj.regs[0]);
      obj.startTerm = getBoundary(obj.regs[0], 'start');
      obj.endTerm = getBoundary(obj.regs[obj.regs.length - 1], 'end');
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      if (obj.hook !== undefined) {
        if (typeof obj.hook !== 'string' || !obj.needs.includes(obj.hook) || !hasRequiredHook(obj.regs, obj.hook)) {
          throw new Error(`Invalid hook "${obj.hook}" for match "${obj.match}": use a required word, #Tag, or %Switch%.`)
        }
      }
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
      // The matcher excludes negative tokens from its own minimum. Cache that
      // separately rather than changing the sweep's existing length filter.
      obj.minLength = obj.regs.filter(o => o.optional !== true && o.negative !== true).length;
    });
    return matches
  };

  // Choose one necessary hook per rule. A missing required hook guarantees that
  // the rule cannot match, so broader hooks need not enqueue it as well.
  const buildIndex = function (matches, hooks, hookOrder) {
    const index = Object.create(null);
    const seen = new Set();
    const lastRank = Object.keys(hooks).length;
    matches.forEach((rule, order) => {
      if (seen.has(rule)) {
        return
      }
      seen.add(rule);
      let anchor = null;
      let rank = lastRank;
      for (let i = 0; i < rule.needs.length; i += 1) {
        const key = rule.needs[i];
        // Prefer the hook shared by the fewest rules in this network.
        if (anchor === null || hooks[key].length < hooks[anchor].length) {
          anchor = key;
        }
        rank = Math.min(rank, hookOrder[key]);
      }
      // Explicit hooks have already been checked against required match tokens.
      if (rule.hook !== undefined) {
        anchor = rule.hook;
      }
      // Historically, any earlier matching alternative could determine where
      // this rule ran. Retain that ordering even when using a required anchor.
      const earlier = [...new Set(rule.wants)]
        .filter(key => hookOrder[key] < rank)
        .sort((a, b) => hookOrder[a] - hookOrder[b]);
      const keys = anchor === null ? [...new Set(rule.wants)] : [anchor];
      // The bucket already proves its anchor; check each remaining need once.
      const needs = [...new Set(rule.needs)].filter(key => key !== anchor);
      const entry = { rule, order, rank, earlier, needs, single: keys.length === 1 };
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        index[key] ||= [];
        index[key].push(entry);
      }
    });
    return index
  };

  // do some indexing on the list of matches
  const buildNet = function (matches, world) {
    // turn match-syntax into json
    matches = parse$1(matches, world);

    // collect by wants and needs
    const hooks = {};
    matches.forEach(obj => {
      // add needs
      obj.needs.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
      // add wants
      obj.wants.forEach(str => {
        hooks[str] = Array.isArray(hooks[str]) ? hooks[str] : [];
        hooks[str].push(obj);
      });
    });
    // Record enumeration order, including numeric keys, so input-driven lookup
    // can preserve the order in which tag actions have always been applied.
    const hookOrder = Object.create(null);
    Object.keys(hooks).forEach((k, i) => {
      hookOrder[k] = i;
      // remove duplicates
      const already = new Set();
      hooks[k] = hooks[k].filter(obj => {
        if (already.has(obj)) {
          return false
        }
        already.add(obj);
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      hookOrder,
      index: buildIndex(matches, hooks, hookOrder),
      always
    }
  };

  // Reject impossible candidates before allocating and sorting their entries.
  const canMatch = (obj, haves, terms, needs = obj.needs) => {
    const termCount = terms.length;
    if (!(termCount >= obj.minWords)) {
      return false
    }
    for (let j = 0; j < needs.length; j += 1) {
      if (!haves.has(needs[j])) {
        return false
      }
    }
    if (obj.ifNo !== undefined) {
      for (let j = 0; j < obj.ifNo.length; j += 1) {
        if (haves.has(obj.ifNo[j])) {
          return false
        }
      }
    }
    if (obj.wants.length > 0) {
      let count = 0;
      for (let j = 0; j < obj.wants.length; j += 1) {
        if (haves.has(obj.wants[j])) {
          count += 1;
          if (count >= obj.minWant) {
            break
          }
        }
      }
      if (!(count >= obj.minWant)) {
        return false
      }
    }
    // Required anchors must match the sentence boundary, not just occur in it.
    if (termCount && obj.startTerm && !wrapMatch(terms[0], obj.startTerm, 0, termCount)) {
      return false
    }
    if (termCount && obj.endTerm && !wrapMatch(terms[termCount - 1], obj.endTerm, termCount - 1, termCount)) {
      return false
    }
    return true
  };

  // Required anchors narrow the candidate list. Sort surviving entries by their
  // original first matching hook, then their position within that hook's bucket.
  const getIndexed = function (set, index, hookOrder, terms) {
    const found = [];
    const seen = new Set();
    set.forEach(key => {
      const bucket = index[key];
      if (!Array.isArray(bucket)) {
        return
      }
      for (let i = 0; i < bucket.length; i += 1) {
        const entry = bucket[i];
        // Single-bucket entries cannot be encountered twice. Older nets fall back.
        if (entry.single !== true) {
          if (seen.has(entry)) {
            continue
          }
          seen.add(entry);
        }
        if (!canMatch(entry.rule, set, terms, entry.needs)) {
          continue
        }
        let rank = entry.rank;
        for (let j = 0; j < entry.earlier.length; j += 1) {
          const earlier = entry.earlier[j];
          if (set.has(earlier)) {
            rank = hookOrder[earlier];
            break
          }
        }
        if (rank === entry.rank) {
          found.push(entry);
        } else {
          found.push({ rule: entry.rule, rank, order: entry.order });
        }
      }
    });
    found.sort((a, b) => a.rank - b.rank || a.order - b.order);
    return found.map(entry => entry.rule)
  };

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, net, document) {
    const { hooks, index, always } = net;
    let { hookOrder } = net;
    // Older compiled nets may not include the precomputed hook order.
    if (!hookOrder) {
      hookOrder = Object.create(null);
      Object.keys(hooks).forEach((k, i) => { hookOrder[k] = i; });
    }
    const lists = docCaches.map((set, n) => {
      if (index) {
        return getIndexed(set, index, hookOrder, document[n])
      }
      const keys = [];
      set.forEach(k => {
        if (typeof hookOrder[k] === 'number') {
          keys.push(k);
        }
      });
      keys.sort((a, b) => hookOrder[a] - hookOrder[b]);
      // Append each rule once, without concatenating and then filtering buckets.
      const maybe = [];
      const already = new Set();
      for (let i = 0; i < keys.length; i += 1) {
        const bucket = hooks[keys[i]];
        for (let j = 0; j < bucket.length; j += 1) {
          const m = bucket[j];
          if (!already.has(m)) {
            already.add(m);
            if (canMatch(m, set, document[n])) {
              maybe.push(m);
            }
          }
        }
      }
      return maybe
    });
    // Apply the same exclusions to unindexed rules, preserving their final position.
    lists.forEach((list, n) => {
      for (let i = 0; i < always.length; i += 1) {
        if (canMatch(always[i], docCaches[n], document[n])) {
          list.push(always[i]);
        }
      }
    });
    return lists
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      const sentence = [document[n]];
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match(sentence, m);
        // found something.
        if (res.ptrs.length > 0) {
          res.ptrs.forEach(ptr => {
            ptr[0] = n; // fix the sentence pointer
            // check ifNo
            // if (m.ifNo !== undefined) {
            //   let terms = document[n].slice(ptr[1], ptr[2])
            //   for (let k = 0; k < m.ifNo.length; k += 1) {
            //     const no = m.ifNo[k]
            //     // quick-check cache
            //     if (docCache[n].has(no)) {
            //       if (no.startsWith('#')) {
            //         let tag = no.replace(/^#/, '')
            //         if (terms.find(t => t.tags.has(tag))) {
            //           console.log('+' + tag)
            //           return
            //         }
            //       } else if (terms.find(t => t.normal === no || t.tags.has(no))) {
            //         console.log('+' + no)
            //         return
            //       }
            //     }
            //   }
            // }
            const todo = { ...m, pointer: ptr };
            if (m.unTag !== undefined) {
              todo.unTag = m.unTag;
            }
            results.push(todo);
          });
          //ok cool, can we stop early?
          if (opts.matchOne === true) {
            return [results[0]]
          }
        }
      }
    }
    return results
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // filter candidates before sorting them into execution order
    const maybeList = getHooks(docCache, net, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  const sets = new WeakMap();
  const empty = new Set();

  // Normalization replaces these arrays when plugins rebuild the tag graph.
  const getTagSet = (tags) => {
    if (!tags || tags.length === 0) {
      return empty
    }
    let set = sets.get(tags);
    if (!set) {
      set = new Set(tags);
      sets.set(tags, set);
    }
    return set
  };

  // is this tag consistent with the tags they already have?
  const canBe$1 = function (terms, tag, model) {
    const tagSet = model.one.tagSet;
    if (!Object.hasOwn(tagSet, tag)) {
      return true
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      for (const existing of term.tags) {
        if (conflicts.has(existing)) {
          return false //found a tag conflict - bail!
        }
      }
    }
    return true
  };

  const tagger$1 = function (list, document, world) {
    const { model, methods } = world;
    const { getDoc, setTag, unTag } = methods.one;
    const looksPlural = methods.two.looksPlural;
    if (list.length === 0) {
      return list
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
      let validated;
      // handle 'safe' tag
      if (todo.safe === true) {
        // check for conflicting tags
        if (canBe$1(terms, todo.tag, model) === false) {
          return
        }
        // dont tag half of a hyphenated word
        if (terms[terms.length - 1].post === '-') {
          return
        }
        // Only an exact single tag was checked by canBe; arrays and shorthand
        // still need their individual checks in setTag.
        if (typeof todo.tag === 'string' && Object.hasOwn(model.one.tagSet, todo.tag)) {
          validated = model.one.tagSet[todo.tag];
        }
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`, validated);
        // quick and dirty plural tagger 😕
        if (todo.tag === 'Noun' && looksPlural) {
          const term = terms[terms.length - 1];
          if (looksPlural(term.text)) {
            setTag([term], 'Plural', world, todo.safe, 'quick-plural');
          } else {
            setTag([term], 'Singular', world, todo.safe, 'quick-singular');
          }
        }
        // allow freezing this match, too
        if (todo.freeze === true) {
          terms.forEach(term => (term.frozen = true));
        }
      }
      if (todo.unTag !== undefined) {
        unTag(terms, todo.unTag, model.one.tagSet, reason);
      }
      // allow setting chunks, too
      if (todo.chunk) {
        terms.forEach(t => (t.chunk = todo.chunk));
      }
    })
  };

  var methods$5 = {
    buildNet,
    bulkMatch: sweep$1,
    bulkTagger: tagger$1
  };

  var sweep = {
    lib: lib$2,
    api: api$4,
    methods: {
      one: methods$5,
    }
  };

  const isMulti = / /;

  const addChunk = function (term, tag) {
    if (tag === 'Noun') {
      term.chunk = tag;
    }
    if (tag === 'Verb') {
      term.chunk = tag;
    }
  };

  // eslint-disable-next-line max-params
  const tagTerm = function (term, tag, tagSet, isSafe, validated, reason) {
    // does it already have this tag?
    if (term.tags.has(tag) === true) {
      return null
    }
    // allow this shorthand in multiple-tag strings
    if (tag === '.') {
      return null
    }
    // don't overwrite any tags, if term is frozen
    if (term.frozen === true) {
      isSafe = true;
    }
    const previous = debug$3.tags ? debug$3.before(term) : null;
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known !== validated && known.not && known.not.length > 0) {
        const conflicts = getTagSet(known.not);
        for (const existing of term.tags) {
          if (conflicts.has(existing)) {
            // Safe and frozen terms cannot lose conflicting tags.
            if (isSafe === true) {
              return null
            }
            term.tags.delete(existing);
          }
        }
      }
      // add parent tags
      if (known.parents && known.parents.length > 0) {
        for (let o = 0; o < known.parents.length; o += 1) {
          term.tags.add(known.parents[o]);
          addChunk(term, known.parents[o]);
        }
      }
    }
    // finally, add our tag
    term.tags.add(tag);
    // now it's dirty?
    term.dirty = true;
    // add a chunk too, if it's easy
    addChunk(term, tag);
    if (previous) {
      debug$3.log(term, previous, reason);
    }
    return true
  };

  // support '#Noun . #Adjective' syntax
  // eslint-disable-next-line max-params
  const multiTag = function (terms, tagString, tagSet, aliases, isSafe, reason) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tag = aliases?.[tag] || tag;
        tagTerm(term, tag, tagSet, isSafe, undefined, reason);
      }
    });
  };

  // add a tag to all these terms
  // Whole-match validation is separate from per-term safety.
  // eslint-disable-next-line max-params
  const setTag = function (terms, tag, world = {}, isSafe, reason, validated) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    if (Array.isArray(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe, reason));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, world.model.one.tagAliases, isSafe, reason);
      return
    }
    tag = tag.replace(/^#/, '');
    tag = world.model.one.tagAliases?.[tag] || tag;
    // let set = false
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe, validated, reason);
    }
  };

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet, reason = 'untag') {
    tag = tag.trim().replace(/^#/, '');
    const children = getTagSet(tagSet[tag]?.children);
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      const previous = debug$3.tags ? debug$3.before(term) : null;
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        if (previous) {
          debug$3.log(term, previous, reason);
        }
        continue
      }
      // removing #Verb should also remove #PastTense
      if (children.size > 0) {
        for (const existing of term.tags) {
          if (children.has(existing)) {
            term.tags.delete(existing);
          }
        }
      }
      term.tags.delete(tag);
      if (previous) {
        debug$3.log(term, previous, reason);
      }
    }
  };

  // quick check if this tag will require any untagging
  const canBe = function (term, tag, tagSet) {
    if (!Object.hasOwn(tagSet, tag)) {
      return true // everything can be an unknown tag
    }
    const conflicts = getTagSet(tagSet[tag].not);
    if (conflicts.size === 0) {
      return true
    }
    for (const existing of term.tags) {
      if (conflicts.has(existing)) {
        return false
      }
    }
    return true
  };

  const validate$1 = function (node) {
    node.children = node.children || [];
    node._cache = node._cache || {};
    node.props = node.props || {};
    node._cache.parents = node._cache.parents || [];
    return node
  };

  // Iterative DFS keeps deep inputs safe and distinguishes shared nodes from cycles.
  const checkCycles = roots => {
    const states = new Map();
    const stack = roots.map(node => [node, false]);
    for (; stack.length > 0;) {
      const [node, done] = stack.pop();
      if (done) {
        states.set(node, 2);
      } else if (states.get(node) === 1) {
        throw new Error('[Grad] - cyclic input')
      } else if (!states.has(node)) {
        states.set(node, 1);
        stack.push([node, true]);
        for (const child of node.children || []) {
          stack.push([child, false]);
        }
      }
    }
    return states.keys()
  };

  // turn parent-index rows into nested json
  const fromArray = function (rows) {
    const index = new Map();
    // addTags allocates these rows for this graph, so initialize them in place.
    rows.forEach(node => {
      validate$1(node);
      index.set(node.id, node);
    });
    const root = validate$1({});
    rows.forEach(node => {
      if (node.parent) {
        if (index.has(node.parent)) {
          const parent = index.get(node.parent);
          delete node.parent; //no-longer needed
          parent.children.push(node);
        } else {
          console.warn(`[Grad] - missing node '${node.parent}'`); // eslint-disable-line no-console
        }
        return
      }
      // no parent, add it to root
      root.children.push(node);
    });
    checkCycles(rows);
    return root
  };

  // [a, a1, b, b1]
  // Visitor-only callers can skip collecting nodes.
  const byDepth = (root, fn, collect = true) => {
    const list = collect ? [] : null;
    const queue = [root];
    for (; queue.length > 0;) {
      // get first
      const node = queue.pop();
      if (collect) {
        list.push(node);
      }
      // add kids to queue
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i -= 1) {
          const child = node.children[i];
          if (fn) {
            fn(node, child);
          }
          queue.push(child);
        }
      }
    }
    return list
  };

  // Fresh graph nodes already have empty caches; fill ancestors in root-to-parent order.
  const cacheParents = root => {
    byDepth(root, (parent, child) => {
      if (parent.id) {
        child._cache.parents = parent._cache.parents.concat([parent.id]);
      }
    }, false);
  };

  // addTags supplies only exclusions, additional parents, and these scalar flags.
  const inherit = (props, parent) => {
    if (parent.not) {
      props.not = new Set([...props.not, ...parent.not]);
    }
    if (Array.isArray(parent.also) && (props.also === undefined || Array.isArray(props.also))) {
      props.also = parent.also.concat(props.also || []);
    } else if (props.also === undefined) {
      props.also = parent.also;
    }
    if (props.is === undefined) {
      props.is = parent.is;
    }
    if (props.novel === undefined) {
      props.novel = parent.novel;
    }
    return props
  };

  const fillDown = root => {
    byDepth(root, (parent, child) => {
      child.props = inherit(child.props, parent.props);
    }, false);
  };

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

  const reset = '\x1b[0m';
  //cheaper than requiring chalk
  const cli = {
    // green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    // blue: str => '\x1b[34m' + str + reset,
    // magenta: str => '\x1b[35m' + str + reset,
    // cyan: str => '\x1b[36m' + str + reset,
    // yellow: str => '\x1b[33m' + str + reset,
    // black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
  };

  const indent = '    ';

  const toText = function (json, color) {
    let arrow = '-> ';
    if (color) {
      arrow = cli.dim('→ ');
    }
    let txt = '';
    const rows = byDepth(json);
    rows.forEach((node, i) => {
      let label = node.id || '';
      if (color) {
        label = cli.red(label);
      }
      if (i === 0 && !node.id) {
        return //skip empty root
      }
      const depth = node._cache.parents.length;
      txt += indent.repeat(depth) + arrow + label + '\n';
    });
    return txt
  };

  const toArray$1 = function (json) {
    // The tag formatter only reads these graph-owned nodes.
    const nodes = byDepth(json);
    // should we show the root?
    const root = nodes[0];
    if (root && !root.id && Object.keys(root.props).length === 0) {
      nodes.shift();
    }
    return nodes
  };

  // Keep this dispatch intact: an array-only version regresses V8 benchmarks.
  const fmts = {
    text: toText,
    txt: toText,
    array: toArray$1,
    flat: toArray$1,
  };

  const out = function (root, label) {
    // return internal json
    if (label === 'nested' || label === 'json') {
      return root
    }
    if (label === 'debug') {
      console.log(toText(root, true)); // eslint-disable-line no-console
      return null
    }
    if (fmts.hasOwnProperty(label)) {
      return fmts[label](root)
    }
    return root
  };

  // The tag-inheritance subset of grad-school;
  // https://github.com/spencermountain/grad-school

  class Graph {
    constructor(json) {
      Object.defineProperty(this, 'json', {
        enumerable: false,
        value: json,
        writable: true,
      });
    }
    cache() {
      cacheParents(this.json);
      return this
    }
    fillDown() {
      fillDown(this.json);
      return this
    }
    out(fmt) {
      // fillDown changes properties, so the cached graph relationships still hold.
      return out(this.json, fmt)
    }
  }

  const graph = rows => new Graph(fromArray(rows));

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Connector: 'cyan',
    Determiner: 'cyan',
    Hyphenated: 'cyan',
    Adverb: 'cyan',
  };

  const getColor = function (node) {
    if (Object.hasOwn(colors, node.id)) {
      return colors[node.id]
    }
    if (Object.hasOwn(colors, node.is)) {
      return colors[node.is]
    }
    const found = node._cache.parents.find(c => colors[c]);
    return colors[found]
  };

  // convert tags to our final format
  const fmt = function (nodes) {
    const res = {};
    nodes.forEach(node => {
      const { not, also, is, novel } = node.props;
      let parents = node._cache.parents;
      if (also) {
        parents = parents.concat(also);
      }
      res[node.id] = {
        is,
        not,
        novel,
        also,
        parents,
        children: [],
        color: getColor(node),
        // Retain the preferred output name for legacy model consumers.
        alias: node.aliases === undefined ? node.alias : node.aliases[0],
        aliases: node.aliases,
      };
    });
    // `also` is another inheritance edge. Resolve its ancestors before building
    // reverse edges, so removing any parent also removes all dependent tags.
    const resolved = new Set();
    const resolving = new Set();
    const resolveParents = function (tag) {
      if (resolved.has(tag)) {
        return res[tag].parents
      }
      if (resolving.has(tag)) {
        throw new Error(`compromise: cyclic tag inheritance at '${tag}'`)
      }
      resolving.add(tag);
      const parents = new Set();
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          resolveParents(parent).forEach(ancestor => parents.add(ancestor));
        }
        parents.add(parent);
      });
      res[tag].parents = Array.from(parents);
      resolving.delete(tag);
      resolved.add(tag);
      return res[tag].parents
    };
    Object.keys(res).forEach(tag => resolveParents(tag));
    Object.keys(res).forEach(tag => {
      res[tag].parents.forEach(parent => {
        if (res[parent]) {
          res[parent].children.push(tag);
        }
      });
    });

    // Inherit exclusions through every parent, then exclude all descendants of
    // each conflicting tag. Read a snapshot to keep this independent of order.
    const exclusions = {};
    Object.keys(res).forEach(tag => { exclusions[tag] = res[tag].not; });
    Object.keys(res).forEach(k => {
      const nots = new Set(exclusions[k]);
      res[k].parents.forEach(parent => {
        for (const not of exclusions[parent] || []) {
          nots.add(not);
        }
      });
      Array.from(nots).forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
      getTagSet(res[k].not);
      getTagSet(res[k].children);
      // Keep accepting custom definitions, but flag impossible combinations once
      // per tag, after both inheritance and reciprocal exclusions are resolved.
      const conflicts = [k, ...res[k].parents].filter(tag => nots.has(tag));
      if (conflicts.length > 0) {
        const names = conflicts.map(tag => `#${tag}`).join(', ');
        console.warn(`compromise: contradictory tag '#${k}' requires and excludes: ${names}`); // eslint-disable-line no-console
      }
    });
    return res
  };

  // Compile once per registration. Real tag names always take precedence.
  const compileAliases = (tags, normalize) => {
    const aliases = Object.create(null);
    Object.keys(tags).forEach(tag => { aliases[tag] = tag; });
    Object.keys(tags).forEach(tag => {
      const entry = tags[tag];
      const names = entry.aliases === undefined ? [entry.alias] : [entry.aliases].flat();
      names.forEach(name => {
        if (name === null || name === undefined) {
          return
        }
        if (typeof name !== 'string' || !/^[\p{L}_][\p{L}\p{M}\p{N}_-]*$/u.test(name)) {
          throw new Error(`compromise: invalid alias for '#${tag}'`)
        }
        // Match strings undergo Unicode normalization before parsing.
        const spellings = normalize ? [name, normalize(name)] : [name];
        spellings.forEach(spelling => {
          if (Object.hasOwn(tags, spelling)) {
            if (spelling !== name && spelling !== tag) {
              throw new Error(`compromise: tag alias '${name}' normalizes to '#${spelling}'`)
            }
            return
          }
          if (aliases[spelling] && aliases[spelling] !== tag) {
            throw new Error(`compromise: duplicate tag alias '${spelling}'`)
          }
          aliases[spelling] = tag;
        });
      });
    });
    return aliases
  };

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input.slice()
  };

  const addImplied = function (tags) {
    const aliases = compileAliases(tags);
    const resolve = tag => aliases[tag] || tag;
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      if (typeof tags[k].is === 'string') {
        tags[k].is = resolve(tags[k].is);
      }
      if (tags[k].also) {
        tags[k].also = toArr(tags[k].also).map(resolve);
      }
      if (tags[k].not) {
        tags[k].not = toArr(tags[k].not).map(resolve);
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!Object.hasOwn(tags, tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // Additional parents need entries too, including parents introduced by plugins.
      toArr(tags[k].also).forEach(parent => {
        if (!Object.hasOwn(tags, parent)) {
          tags[parent] = {};
        }
      });
      // add any implicit 'not' tags
      toArr(tags[k].not).forEach(excluded => {
        if (!Object.hasOwn(tags, excluded)) {
          tags[excluded] = {};
        }
      });
    });
    return tags
  };


  const validate = function (tags, already) {
    // Reciprocal links must reach previously registered tags too. Copy entries
    // before normalization so the existing compiled model remains untouched.
    tags = Object.fromEntries(Object.keys({ ...already, ...tags }).map(tag => [tag, { ...already[tag], ...tags[tag] }]));
    tags = addImplied(tags);

    // property validation
    Object.keys(tags).forEach(k => {
      if (tags[k].aliases !== undefined) {
        tags[k].aliases = toArr(tags[k].aliases);
      }
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
      if (tags[k].also) {
        tags[k].also = toArr(tags[k].also);
      }
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not && !tags[no].not.includes(k)) {
          tags[no].not.push(k);
        }
      });
    });
    return tags
  };

  // 'fill-down' parent logic inference
  const compute$1 = function (allTags) {
    // setup graph-lib format
    const flatList = Object.keys(allTags).map(k => {
      const o = allTags[k];
      const props = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
      return { id: k, parent: o.is, props, children: [], alias: o.alias, aliases: o.aliases?.slice() }
    });
    const graph$1 = graph(flatList).cache().fillDown();
    return graph$1.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = { ...tags[k] };
      tags[k].novel = true;
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // Normalization owns its definitions, including when callers reuse a tagset.
    tags = Object.fromEntries(Object.entries(tags).map(([tag, definition]) => [tag, { ...definition }]));
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate(tags, already);

    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$1(tags);
    // convert it to our final format
    const res = fmt(nodes);
    return res
  };

  var methods$4 = {
    one: {
      setTag,
      unTag,
      addTags: addTags$1,
      canBe,
    },
  };

  /* eslint no-console: 0 */

  const fns = {
    /** add a given tag, to all these terms */
    tag: function (input, reason = '', isSafe) {
      if (!this.found || !input) {
        return this
      }
      const terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, world } = this;
      // logger
      if (verbose === true) {
        console.log(' +  ', input, reason || '');
      }
      if (Array.isArray(input)) {
        input.forEach(tag => methods.one.setTag(terms, tag, world, isSafe, reason));
      } else {
        methods.one.setTag(terms, input, world, isSafe, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** add a given tag, only if it is consistent */
    tagSafe: function (input, reason = '') {
      return this.tag(input, reason, true)
    },

    /** remove a given tag from all these terms */
    unTag: function (input, reason) {
      if (!this.found || !input) {
        return this
      }
      const terms = this.termList();
      if (terms.length === 0) {
        return this
      }
      const { methods, verbose, model } = this;
      // logger
      if (verbose === true) {
        console.log(' -  ', input, reason || '');
      }
      const tagSet = model.one.tagSet;
      const resolve = tag => {
        tag = tag.trim().replace(/^#/, '');
        return model.one.tagAliases[tag] || tag
      };
      if (Array.isArray(input)) {
        input.forEach(tag => methods.one.unTag(terms, resolve(tag), tagSet, reason));
      } else {
        methods.one.unTag(terms, resolve(input), tagSet, reason);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      tag = tag.replace(/^#/, '');
      tag = this.model.one.tagAliases[tag] || tag;
      const tagSet = this.model.one.tagSet;
      const canBe = this.methods.one.canBe;
      const nope = [];
      this.document.forEach((terms, n) => {
        terms.forEach((term, i) => {
          if (!canBe(term, tag, tagSet)) {
            nope.push([n, i, i + 1]);
          }
        });
      });
      const noDoc = this.update(nope);
      return this.difference(noDoc)
    },
  };

  const tagAPI = function (View) {
    Object.assign(View.prototype, fns);
  };

  // wire-up more pos-tags to our model
  const addTags = function (tags) {
    const world = this.world();
    const { model, methods } = world;
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
    const aliases = compileAliases(res, name => methods.one.killUnicode(name, world));
    model.one.tagSet = res;
    model.one.tagAliases = aliases;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !Object.hasOwn(tagSet, b)) {
        return 1
      }
      if (boringTags.has(b) || !Object.hasOwn(tagSet, a)) {
        return -1
      }
      let kids = tagSet[a].children || [];
      const aKids = kids.length;
      kids = tagSet[b].children || [];
      const bKids = kids.length;
      return aKids - bKids
    });
    return tags
  };

  const tagRank = function (view) {
    const { document, world } = view;
    const tagSet = world.model.one.tagSet;
    document.forEach(terms => {
      terms.forEach(term => {
        const tags = Array.from(term.tags);
        term.tagRank = sortByKids(tags, tagSet);
      });
    });
  };

  var tag = {
    model: {
      one: { tagSet: {}, tagAliases: Object.create(null) }
    },
    compute: {
      tagRank
    },
    methods: methods$4,
    api: tagAPI,
    lib: lib$1
  };

  // Scan punctuation runs once. Searching for an unanchored run followed by
  // whitespace repeatedly rescans long runs that have no following whitespace.
  const stops = new Set('.!?\u203D\u2E18\u203C\u2047\u2048\u2049\u0964\u0965\u061F\u06D4\u0589\u1362\u1367\u104B\u17D4\u3002');
  const cjkStops = new Set('。！？｡');
  const openers$1 = new Set('「『（【〔《〈“');
  const closers = new Set('」』）】〕》〉”');
  const whitespace = /\s/;
  const splitsOnly = /^[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。]+\s$/;
  const splitsOnlyCjk = /^(?:[.!?‽⸘‼\u2047-\u2049।॥؟۔։።፧။។。！？｡]+\s|[。！？｡]+[」』）】〕》〉”]*)$/;
  const newLine = /((?:\r?\n|\r)+)/;

  const basicSplit = function (text) {
    const all = [];
    const isCjk = /[。！？｡]/.test(text);
    const activeStops = isCjk ? new Set([...stops, ...cjkStops]) : stops;
    for (const line of text.split(newLine)) {
      let start = 0;
      const arr = [];
      const emit = (from, end) => {
        arr.push(line.slice(start, from), line.slice(from, end));
        start = end;
      };
      let i = 0;
      while (i < line.length) {
        if (!activeStops.has(line[i])) {
          i++;
          continue
        }
        const runStart = i;
        while (i < line.length && activeStops.has(line[i])) i++;
        if (i < line.length && whitespace.test(line[i])) {
          emit(runStart, i + 1);
          i++;
          continue
        }
        if (!isCjk) continue
        // A CJK stop ends a sentence without whitespace. Following closing quotes
        // only end it when followed by whitespace, another opener, or end of text.
        let j = runStart;
        while (j < i) {
          if (!cjkStops.has(line[j])) {
            j++;
            continue
          }
          const from = j;
          while (j < i && cjkStops.has(line[j])) j++;
          let end = j;
          while (end < line.length && closers.has(line[end])) end++;
          if (end === j || end === line.length || whitespace.test(line[end]) || openers$1.has(line[end])) {
            emit(from, end);
            if (end > i) i = end;
          }
        }
      }
      arr.push(line.slice(start));
      // Preserve the existing merge behavior, including punctuation-only pieces.
      for (let k = 0; k < arr.length; k++) {
        const next = arr[k + 1];
        if (next && (isCjk ? splitsOnlyCjk : splitsOnly).test(next)) {
          arr[k] += next;
          arr[k + 1] = '';
        }
        if (arr[k]) all.push(arr[k]);
      }
    }
    return all
  };

  // a letter, number, or symbol/emoji in any script - otherwise it's only punctuation
  const hasLetter$1 = /[\p{L}\p{N}\p{So}]/u;
  const hasSomething$1 = /\S/;

  const notEmpty = function (splits) {
    const chunks = [];
    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      if (s === undefined || s === '') {
        continue
      }
      //this is meaningful whitespace
      if (hasSomething$1.test(s) === false || hasLetter$1.test(s) === false) {
        //add it to the last one
        if (chunks[chunks.length - 1]) {
          chunks[chunks.length - 1] += s;
          continue
        } else if (splits[i + 1]) {
          //add it to the next one
          splits[i + 1] = s + splits[i + 1];
          continue
        }
      }
      //else, only whitespace, no terms, no sentence
      chunks.push(s);
    }
    return chunks
  };

  const hasNewline = function (c) {
    return Boolean(/\n$/.test(c))
  };

  //loop through these chunks, and join the non-sentence chunks back together..
  const smartMerge = function (chunks, world) {
    const isSentence = world.methods.one.tokenize.isSentence;
    const abbrevs = world.model.one.abbreviations || new Set();

    const sentences = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      //should this chunk be combined with the next one?
      if (chunks[i + 1] && !isSentence(c, abbrevs) && !hasNewline(c)) {
        chunks[i + 1] = c + (chunks[i + 1] || '');
      } else if (c && c.length > 0) {
        //this chunk is a proper sentence..
        sentences.push(c);
        chunks[i] = '';
      }
    }
    return sentences
  };

  /* eslint-disable regexp/no-dupe-characters-character-class */

  // merge embedded quotes into 1 sentence
  // like - 'he said "no!" and left.'
  const MAX_QUOTE = 280;// ¯\_(ツ)_/¯

  // don't support single-quotes for multi-sentences
  const pairs = {
    '\u0022': '\u0022', // 'StraightDoubleQuotes'
    '\uFF02': '\uFF02', // 'StraightDoubleQuotesWide'
    // '\u0027': '\u0027', // 'StraightSingleQuotes'
    '\u201C': '\u201D', // 'CommaDoubleQuotes'
    // '\u2018': '\u2019', // 'CommaSingleQuotes'
    '\u201F': '\u201D', // 'CurlyDoubleQuotesReversed'
    // '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
    '\u201E': '\u201D', // 'LowCurlyDoubleQuotes'
    '\u2E42': '\u201D', // 'LowCurlyDoubleQuotesReversed'
    '\u201A': '\u2019', // 'LowCurlySingleQuotes'
    '\u00AB': '\u00BB', // 'AngleDoubleQuotes'
    '\u2039': '\u203A', // 'AngleSingleQuotes'
    '\u2035': '\u2032', // 'PrimeSingleQuotes'
    '\u2036': '\u2033', // 'PrimeDoubleQuotes'
    '\u2037': '\u2034', // 'PrimeTripleQuotes'
    '\u301D': '\u301E', // 'PrimeDoubleQuotes'
    // '\u0060': '\u00B4', // 'PrimeSingleQuotes'
    '\u301F': '\u301E', // 'LowPrimeDoubleQuotesReversed'
    '\u300C': '\u300D', // 'CornerBrackets' 「」
    '\u300E': '\u300F', // 'WhiteCornerBrackets' 『』
  };
  const openQuote = RegExp('[' + Object.keys(pairs).join('') + ']', 'g');
  const closeQuote = RegExp('[' + Object.values(pairs).join('') + ']', 'g');

  const closesQuote = function (str) {
    if (!str) {
      return false
    }
    const m = str.match(closeQuote);
    if (m !== null && m.length === 1) {
      return true
    }
    return false
  };

  // allow micro-sentences when inside a quotation, like:
  // the doc said "no sir. i will not beg" and walked away.
  const quoteMerge = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      // do we have an open-quote and not a closed one?
      const m = split.match(openQuote);
      if (m !== null && m.length === 1) {
        // is the quote already closed in this chunk? - '“Yes!” said Tom. “No!” said Ann.'
        const closed = split.match(closeQuote);
        if (closed !== null && closed[0] !== m[0]) {
          arr.push(split);
          continue
        }

        // look at the next sentence for a closing quote,
        if (closesQuote(splits[i + 1]) && splits[i + 1].length < MAX_QUOTE) {
          splits[i] += splits[i + 1];// merge them
          arr.push(splits[i]);
          splits[i + 1] = '';
          i += 1;
          continue
        }
        // look at n+2 for a closing quote,
        if (closesQuote(splits[i + 2])) {
          const toAdd = splits[i + 1] + splits[i + 2];// merge them all
          //make sure it's not too-long
          if (toAdd.length < MAX_QUOTE) {
            splits[i] += toAdd;
            arr.push(splits[i]);
            splits[i + 1] = '';
            splits[i + 2] = '';
            i += 2;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };

  const MAX_LEN = 250;// ¯\_(ツ)_/¯

  // support unicode variants?
  // https://stackoverflow.com/questions/13535172/list-of-all-unicodes-open-close-brackets
  const hasOpen = /[(\uFF08]/g;
  const hasClosed = /[)\uFF09]/g;
  const mergeParens = function (splits) {
    const arr = [];
    for (let i = 0; i < splits.length; i += 1) {
      const split = splits[i];
      const m = split.match(hasOpen);
      if (m !== null && m.length === 1) {
        // look at next sentence, for closing parenthesis
        if (splits[i + 1] && splits[i + 1].length < MAX_LEN) {
          const m2 = splits[i + 1].match(hasClosed);
          if (m2 !== null && m.length === 1 && !hasOpen.test(splits[i + 1])) {
            // merge in 2nd sentence
            splits[i] += splits[i + 1];
            arr.push(splits[i]);
            splits[i + 1] = '';
            i += 1;
            continue
          }
        }
      }
      arr.push(splits[i]);
    }
    return arr
  };

  //(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
  // Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
  //regs-
  const hasSomething = /\S/;
  const startWhitespace = /^\s+/;

  const splitSentences = function (text, world) {
    text ||= '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return []
    }
    // First do a greedy-split..
    const splits = basicSplit(text);
    // Filter-out the crap ones
    let sentences = notEmpty(splits);
    //detection of non-sentence chunks:
    sentences = smartMerge(sentences, world);
    // allow 'he said "no sir." and left.'
    sentences = quoteMerge(sentences);
    // allow 'i thought (no way!) and left.'
    sentences = mergeParens(sentences);
    //if we never got a sentence, return the given text
    if (sentences.length === 0) {
      return [text]
    }
    //move whitespace to the ends of sentences, when possible
    //['hello',' world'] -> ['hello ','world']
    for (let i = 1; i < sentences.length; i += 1) {
      const ws = sentences[i].match(startWhitespace);
      if (ws !== null) {
        sentences[i - 1] += ws[0];
        sentences[i] = sentences[i].replace(startWhitespace, '');
      }
    }
    return sentences
  };

  // combine '2 - 5' like '2-5' is
  // 2-4: 2, 4
  const combineRanges = function (arr) {
    const startRange = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/;
    const endRange = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
    for (let i = 0; i < arr.length - 1; i += 1) {
      if (arr[i + 1] && startRange.test(arr[i]) && endRange.test(arr[i + 1])) {
        arr[i] = arr[i] + arr[i + 1];
        arr[i + 1] = null;
      }
    }
    return arr
  };

  const isSlash = /\p{L} ?\/ ?\p{L}+$/u;

  // 'he / she' should be one word
  const combineSlashes = function (arr) {
    for (let i = 1; i < arr.length - 1; i++) {
      if (isSlash.test(arr[i])) {
        arr[i - 1] += arr[i] + arr[i + 1];
        arr[i] = null;
        arr[i + 1] = null;
      }
    }
    return arr
  };

  const wordlike = /\S/;
  const isBoundary = /^[!?.]+$/;
  const naiiveSplit = /(\S+)/;

  let notWord = [
    '.',
    '?',
    '!',
    ':',
    ';',
    '-',
    '–',
    '—',
    '--',
    '...',
    '(',
    ')',
    '[',
    ']',
    '"',
    "'",
    '`',
    '«',
    '»',
    '*',
    '•',
  ];
  notWord = notWord.reduce((h, c) => {
    h[c] = true;
    return h
  }, {});

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str ||= '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (Array.isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen$1(words[i], model) === true) {
        arr = arr.concat(splitHyphens$1(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      const word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) === true && Object.hasOwn(notWord, word) === false && isBoundary.test(word) === false) {
        //put whitespace on end of previous term, if possible
        if (result.length > 0) {
          result[result.length - 1] += carry;
          result.push(word);
        } else {
          //otherwise, but whitespace before
          result.push(carry + word);
        }
        carry = '';
      } else {
        carry += word;
      }
    }
    //handle last one
    if (carry) {
      if (result.length === 0) {
        result[0] = '';
      }
      result[result.length - 1] += carry; //put it on the end
    }
    // combine 'one / two'
    result = combineSlashes(result);
    result = combineRanges(result);
    // remove empty results
    result = result.filter(s => s);
    return result
  };

  //all punctuation marks, from https://en.wikipedia.org/wiki/Punctuation

  //we have slightly different rules for start/end - like #hashtags.
  const isLetter = /\p{Letter}/u;
  const isNumber = /[\p{Number}\p{Currency_Symbol}]/u;
  const hasAcronym = /^[a-z]\.([a-z]\.)+/i;
  const chillin = /[sn]['’]$/;
  const isFullNumber = /^[(+\-]?\d+(th|st|nd|rd)?[)+\-]?$/;
  const openers = { ')': '(', ']': '[', '}': '{' };

  // does this closing bracket close one inside the word, like 'foo(bar)'
  const closesInside = function (chars, start, end) {
    const close = chars[end - 1];
    let depth = 0;
    for (let i = start; i < end - 1; i += 1) {
      if (chars[i] === openers[close]) {
        depth += 1;
      } else if (chars[i] === close) {
        depth -= 1;
      }
    }
    return depth > 0
  };

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    const original = str;
    let pre = '';
    let post = '';
    const chars = Array.from(str);
    let start = 0;
    let end = chars.length;

    // punctuation-only words, like '<3'
    if (Object.hasOwn(emoticons, str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // Locate the first retained code point without shifting the array.
    while (start < end) {
      const c = chars[start];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        break//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(str.trim())) {
        break//done
      }
      // '97 - year short-form
      if (c === "'" && c.length === 3 && isNumber.test(chars[start + 1])) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // punctuation
      start++;
    }

    // Locate the last retained code point.
    while (end > start) {
      const c = chars[end - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        break//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original) === true) {
        break//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original) === true) {
        break//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(str.trim())) {
        break//done
      }
      if (Object.hasOwn(openers, c) && closesInside(chars, start, end)) {
        break//keep it
      }
      // punctuation
      end--;
    }
    pre = chars.slice(0, start).join('');
    post = chars.slice(end).join('');
    str = chars.slice(start, end).join('');
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      let last = original.length;
      while (last > 0 && original[last - 1] === ' ') last--;
      post = original.slice(last);
      str = original.slice(0, last);
      pre = '';
    }
    return { str, pre, post }
  };

  const parseTerm = (txt, model) => {
    // cleanup any punctuation as whitespace
    const { str, pre, post } = normalizePunctuation(txt, model);
    const parsed = {
      text: str,
      pre: pre,
      post: post,
      tags: new Set(),
    };
    return parsed
  };

  // 'Björk' to 'Bjork'.
  const killUnicode$1 = function (str, world) {
    const unicode = world.model.one.unicode || {};
    str ||= '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  // Inspect the trailing run once, including when punctuation occurs internally.
  const trimPunctuation = (str, punctuation) => {
    let end = str.length;
    while (end > 0 && punctuation.test(str[end - 1])) end--;
    return str.slice(0, end)
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str ||= '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
    //punctuation
    str = trimPunctuation(str, /[,;.!?]/);
    //coerce Unicode ellipses
    str = str.replaceAll('…', '...');
    //en-dash
    str = str.replaceAll('–', '-');
    //strip leading & trailing grammatical punctuation
    if (/^[:;]/.test(str) === false) {
      str = trimPunctuation(str, /[",.!:;?)]/);
      str = str.replace(/^['"(]+/g, '');
    }
    // remove zero-width characters
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
    //do this again..
    str = str.trim();
    //oh shucks,
    if (str === '') {
      str = original;
    }
    //no-commas in numbers
    str = str.replace(/([0-9]),([0-9])/g, '$1$2');
    return str
  };

  // do acronyms need to be ASCII?  ... kind of?
  const periodAcronym$1 = /^([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /^[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /^([a-z]\.)+[a-z]\.?$/;

  const isAcronym$2 = function (str) {
    //like N.D.A
    if (periodAcronym$1.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym$1.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym$1.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym$1.test(str) === true) {
      return true
    }
    return false
  };

  const doAcronym = function (str) {
    if (isAcronym$2(str)) {
      str = str.replace(/\./g, '');
    }
    return str
  };

  const normalize = function (term, world) {
    const killUnicode = world.methods.one.killUnicode;
    // console.log(world.methods.one)
    let str = term.text || '';
    str = clean(str);
    //(very) rough ASCII transliteration -  bjŏrk -> bjork
    str = killUnicode(str, world);
    str = doAcronym(str);
    term.normal = str;
  };

  // turn a string input into a 'document' json format
  const parse = function (input, world) {
    const { methods, model } = world;
    const { splitSentences, splitTerms, splitWhitespace } = methods.one.tokenize;
    input ||= '';
    // split into sentences
    const sentences = splitSentences(input, world);
    // split into word objects
    input = sentences.map((txt) => {
      let terms = splitTerms(txt, model);
      // split into [pre-text-post]
      terms = terms.map(t => splitWhitespace(t, model));
      // add normalized term format, always
      terms.forEach((t) => {
        normalize(t, world);
      });
      return terms
    });
    return input
  };

  const isAcronym$1 = /[ .][A-Z]\.? *$/i; //asci - 'n.s.a.'
  const hasEllipse = /(?:\u2026|\.{2}) *$/; // '...'
  const hasLetter = /\p{L}/u;
  const hasPeriod = /\. *$/;
  const leadInit = /^[A-Z]\. $/; // "W. Kensington"

  /** does this look like a sentence? */
  const isSentence = function (str, abbrevs) {
    // must have a letter
    if (hasLetter.test(str) === false) {
      return false
    }
    // check for 'F.B.I.'
    if (isAcronym$1.test(str) === true) {
      return false
    }
    // check for leading initial - "W. Kensington"
    if (str.length === 3 && leadInit.test(str)) {
      return false
    }
    //check for '...'
    if (hasEllipse.test(str) === true) {
      return false
    }
    const txt = str.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, '');
    const words = txt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    // check for 'Mr.' (and not mr?)
    if (Object.hasOwn(abbrevs, lastWord) === true && hasPeriod.test(str) === true) {
      return false
    }
    // //check for jeopardy!
    // if (blacklist.hasOwnProperty(lastWord)) {
    //   return false
    // }
    return true
  };

  var methods$3 = {
    one: {
      killUnicode: killUnicode$1,
      tokenize: {
        splitSentences,
        isSentence,
        splitTerms: splitWords,
        splitWhitespace: parseTerm,
        fromString: parse,
      },
    },
  };

  const aliases = {
    '&': 'and',
    '@': 'at',
    '%': 'percent',
    'plz': 'please',
    'bein': 'being',
  };

  var misc$2 = [
    'approx',
    'apt',
    'bc',
    'cyn',
    'eg',
    'esp',
    'est',
    'etc',
    'ex',
    'exp',
    'prob', //probably
    'pron', // Pronunciation
    'gal', //gallon
    'min',
    'pseud',
    'fig', //figure
    'jd',
    'lat', //latitude
    'lng', //longitude
    'vol', //volume
    'fm', //not am
    'def', //definition
    'misc',
    'plz', //please
    'ea', //each
    'ps',
    'sec', //second
    'pt',
    'pref', //preface
    'pl', //plural
    'pp', //pages
    'qt', //quarter
    'fr', //french
    'sq',
    'nee', //given name at birth
    'ss', //ship, or sections
    'tel',
    'temp',
    'vet',
    'ver', //version
    'fem', //feminine
    'masc', //masculine
    'eng', //engineering/english
    'adj', //adjective
    'vb', //verb
    'rb', //adverb
    'inf', //infinitive
    'situ', // in situ
    'vivo',
    'vitro',
    'wr', //world record
  ];

  var honorifics = [
    'adj',
    'adm',
    'adv',
    'asst',
    'atty',
    'bldg',
    'brig',
    'capt',
    'cmdr',
    'comdr',
    'cpl',
    'det',
    'dr',
    'esq',
    'gen',
    'gov',
    'hon',
    'jr',
    'llb',
    'lt',
    'maj',
    'messrs',
    'mlle',
    'mme',
    'mr',
    'mrs',
    'ms',
    'mstr',
    'phd',
    'prof',
    'pvt',
    'rep',
    'reps',
    'res',
    'rev',
    'sen',
    'sens',
    'sfc',
    'sgt',
    'sir',
    'sr',
    'supt',
    'surg'
    //miss
    //misses
  ];

  var months = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];

  var nouns$2 = [
    'ad',
    'al',
    'arc',
    'ba',
    'bl',
    'ca',
    'cca',
    'col',
    'corp',
    'ft',
    'fy',
    'ie',
    'lit',
    'ma',
    'md',
    'pd',
    'tce',
  ];

  var organizations = ['dept', 'univ', 'assn', 'bros', 'inc', 'ltd', 'co'];

  var places = [
    'rd',
    'st',
    'dist',
    'mt',
    'ave',
    'blvd',
    'cl',
    // 'ct',
    'cres',
    'hwy',
    //states
    'ariz',
    'cal',
    'calif',
    'colo',
    'conn',
    'fla',
    'fl',
    'ga',
    'ida',
    'ia',
    'kan',
    'kans',

    'minn',
    'neb',
    'nebr',
    'okla',
    'penna',
    'penn',
    'pa',
    'dak',
    'tenn',
    'tex',
    'ut',
    'vt',
    'va',
    'wis',
    'wisc',
    'wy',
    'wyo',
    'usafa',
    'alta',
    'ont',
    'que',
    'sask',
  ];

  // units that are abbreviations too
  var units = [
    'dl',
    'ml',
    'gal',
    // 'ft', //ambiguous
    'qt',
    'pt',
    'tbl',
    'tsp',
    'tbsp',
    'km',
    'dm', //decimeter
    'cm',
    'mm',
    'mi',
    'td',
    'hr', //hour
    'hrs', //hour
    'kg',
    'hg',
    'dg', //decigram
    'cg', //centigram
    'mg', //milligram
    'µg', //microgram
    'lb', //pound
    'oz', //ounce
    'sq ft',
    'hz', //hertz
    'mps', //meters per second
    'mph',
    'kmph', //kilometers per hour
    'kb', //kilobyte
    'mb', //megabyte
    // 'gb', //ambig
    'tb', //terabyte
    'lx', //lux
    'lm', //lumen
    // 'pa', //ambig
    'fl oz', //
    'yb',
  ];

  // add our abbreviation list to our lexicon
  const list = [
    [misc$2],
    [units, 'Unit'],
    [nouns$2, 'Noun'],
    [honorifics, 'Honorific'],
    [months, 'Month'],
    [organizations, 'Organization'],
    [places, 'Place'],
  ];
  // create key-val for sentence-tokenizer
  const abbreviations = {};
  // add them to a future lexicon
  const lexicon$2 = {};

  list.forEach(a => {
    a[0].forEach(w => {
      // sentence abbrevs
      abbreviations[w] = true;
      // future-lexicon
      lexicon$2[w] = 'Abbreviation';
      if (a[1] !== undefined) {
        lexicon$2[w] = [lexicon$2[w], a[1]];
      }
    });
  });

  // dashed prefixes that are not independent words
  //  'mid-century', 'pre-history'
  var prefixes = [
    'anti',
    'bi',
    'co',
    'contra',
    'de',
    'extra',
    'infra',
    'inter',
    'intra',
    'macro',
    'micro',
    'mis',
    'mono',
    'multi',
    'peri',
    'pre',
    'pro',
    'proto',
    'pseudo',
    're',
    'sub',
    'supra',
    'trans',
    'tri',
    'un',
    'out', //out-lived
    'ex',//ex-wife

    // 'counter',
    // 'mid',
    // 'out',
    // 'non',
    // 'over',
    // 'post',
    // 'semi',
    // 'super', //'super-cool'
    // 'ultra', //'ulta-cool'
    // 'under',
    // 'whole',
  ].reduce((h, str) => {
    h[str] = true;
    return h
  }, {});

  // dashed suffixes that are not independent words
  //  'flower-like', 'president-elect'
  var suffixes = {
    'like': true,
    'ish': true,
    'less': true,
    'able': true,
    'elect': true,
    'type': true,
    'designate': true,
    // 'fold':true,
  };

  //a hugely-ignorant, and widely subjective transliteration of latin, cryllic, greek unicode characters to english ascii.
  //approximate visual (not semantic or phonetic) relationship between unicode and ascii characters
  //http://en.wikipedia.org/wiki/List_of_Unicode_characters
  //https://docs.google.com/spreadsheet/ccc?key=0Ah46z755j7cVdFRDM1A2YVpwa1ZYWlpJM2pQZ003M0E
  const compact = {
    '!': '¡',
    '?': '¿Ɂ',
    '"': '“”"❝❞',
    "'": '‘‛❛❜’',
    '-': '—–',
    a: 'ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ',
    b: 'ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ',
    c: '¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ',
    d: 'ÐĎďĐđƉƊȡƋƌ',
    e: 'ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗễ',
    f: 'ƑƒϜϝӺӻҒғſ',
    g: 'ĜĝĞğĠġĢģƓǤǥǦǧǴǵ',
    h: 'ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ',
    I: 'ÌÍÎÏ',
    i: 'ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇіїi̇',
    j: 'ĴĵǰȷɈɉϳЈј',
    k: 'ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ',
    l: 'ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ',
    m: 'ΜϺϻМмӍӎ',
    n: 'ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ',
    o: 'ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ',
    p: 'ƤΡρϷϸϼРрҎҏÞ',
    q: 'Ɋɋ',
    r: 'ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ',
    s: 'ŚśŜŝŞşŠšƧƨȘșȿЅѕ',
    t: 'ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт',
    u: 'ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ',
    v: 'νѴѵѶѷ',
    w: 'ŴŵƜωώϖϢϣШЩшщѡѿ',
    x: '×ΧχϗϰХхҲҳӼӽӾӿ',
    y: 'ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ',
    z: 'ŹźŻżŽžƵƶȤȥɀΖ',
  };
  //decompress data into two hashes
  const unicode = {};
  Object.keys(compact).forEach(function (k) {
    compact[k].split('').forEach(function (s) {
      unicode[s] = k;
    });
  });
  // fullwidth ascii - 'Ｈｅｌｌｏ ２０２４' to 'Hello 2024'
  for (let i = 0x21; i <= 0x7E; i += 1) {
    unicode[String.fromCharCode(i + 0xFEE0)] = String.fromCharCode(i);
  }

  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7Bpunctuation%7D

  // punctuation to keep at start of word
  const prePunctuation = {
    '#': true, //#hastag
    '@': true, //@atmention
    '_': true,//underscore
    '°': true,
    // '+': true,//+4
    // '\\-',//-4  (escape)
    // '.',//.4
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  // punctuation to keep at end of word
  const postPunctuation = {
    '%': true,//88%
    '_': true,//underscore
    '°': true,//degrees, italian ordinal
    // '\'',// sometimes
    // zero-width chars
    '\u200B': true,
    '\u200C': true,
    '\u200D': true,
    '\uFEFF': true
  };

  const emoticons = {
    '<3': true,
    '</3': true,
    '<\\3': true,
    ':^P': true,
    ':^p': true,
    ':^O': true,
    ':^3': true,
  };

  var model$3 = {
    one: {
      aliases,
      abbreviations,
      prefixes,
      suffixes,
      prePunctuation,
      postPunctuation,
      lexicon: lexicon$2, //give this one forward
      unicode,
      emoticons
    },
  };

  const hasSlash = /\//;
  const hasDomain = /[a-z]\.[a-z]/i;
  const isMath = /[0-9]/;
  // const hasSlash = /[a-z\u00C0-\u00FF] ?\/ ?[a-z\u00C0-\u00FF]/
  // const hasApostrophe = /['’]s$/

  const addAliases = function (term, world) {
    const str = term.normal || term.text || term.machine;
    const aliases = world.model.one.aliases;
    // lookup known aliases like '&'
    if (Object.hasOwn(aliases, str)) {
      term.alias ||= [];
      term.alias.push(aliases[str]);
    }
    // support slashes as aliases
    if (hasSlash.test(str) && !hasDomain.test(str) && !isMath.test(str)) {
      const arr = str.split(hasSlash);
      // don't split urls and things
      if (arr.length <= 3) {
        arr.forEach(word => {
          word = word.trim();
          if (word !== '') {
            term.alias ||= [];
            term.alias.push(word);
          }
        });
      }
    }
    // aliases for apostrophe-s
    // if (hasApostrophe.test(str)) {
    //   let main = str.replace(hasApostrophe, '').trim()
    //   term.alias = term.alias || []
    //   term.alias.push(main)
    // }
    return term
  };

  const hasDash = /^\p{Letter}+-\p{Letter}+$/u;
  // 'machine' is a normalized form that looses human-readability
  const doMachine = function (term) {
    let str = term.implicit || term.normal || term.text;
    // remove apostrophes
    str = str.replace(/['’]s$/, '');
    str = str.replace(/s['’]$/, 's');
    //lookin'->looking (make it easier for conjugation)
    str = str.replace(/([aeiou][ktrp])in'$/, '$1ing');
    //turn re-enactment to reenactment
    if (hasDash.test(str)) {
      str = str.replace(/-/g, '');
    }
    //#tags, @mentions
    str = str.replace(/^[#@]/, '');
    if (str !== term.normal) {
      term.machine = str;
    }
  };

  // sort words by frequency
  const freq = function (view) {
    const docs = view.docs;
    const counts = Object.create(null);
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        counts[word] ??= 0;
        counts[word] += 1;
      }
    }
    // add counts on each term
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        term.freq = counts[word];
      }
    }
  };

  // get all character startings in doc
  const offset = function (view) {
    let elapsed = 0;
    let index = 0;
    const docs = view.document; //start from the actual-top
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        term.offset = {
          index: index,
          start: elapsed + term.pre.length,
          length: term.text.length,
        };
        elapsed += term.pre.length + term.text.length + term.post.length;
        index += 1;
      }
    }
  };

  // cheat- add the document's pointer to the terms
  const index = function (view) {
    // console.log('reindex')
    const document = view.document;
    for (let n = 0; n < document.length; n += 1) {
      for (let i = 0; i < document[n].length; i += 1) {
        document[n][i].index = [n, i];
      }
    }
    // let ptrs = b.fullPointer
    // console.log(ptrs)
    // for (let i = 0; i < docs.length; i += 1) {
    //   const [n, start] = ptrs[i]
    //   for (let t = 0; t < docs[i].length; t += 1) {
    //     let term = docs[i][t]
    //     term.index = [n, start + t]
    //   }
    // }
  };

  const wordCount = function (view) {
    let n = 0;
    const docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        if (docs[i][t].normal === '') {
          continue //skip implicit words
        }
        n += 1;
        docs[i][t].wordCount = n;
      }
    }
  };

  // cheat-method for a quick loop
  const termLoop = function (view, fn) {
    const docs = view.docs;
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        fn(docs[i][t], view.world);
      }
    }
  };

  const methods$2 = {
    alias: (view) => termLoop(view, addAliases),
    machine: (view) => termLoop(view, doMachine),
    normal: (view) => termLoop(view, normalize),
    freq,
    offset,
    index,
    wordCount,
  };

  var tokenize = {
    compute: methods$2,
    methods: methods$3,
    model: model$3,
    hooks: ['alias', 'machine', 'index', 'id'],
  };

  // const plugin = function (world) {
  //   let { methods, model, parsers } = world
  //   Object.assign({}, methods, _methods)
  //   Object.assign(model, _model)
  //   methods.one.tokenize.fromString = tokenize
  //   parsers.push('normal')
  //   parsers.push('alias')
  //   parsers.push('machine')
  //   // extend View class
  //   // addMethods(View)
  // }
  // export default plugin

  // lookup last word in the type-ahead prefixes
  const typeahead$1 = function (view) {
    const prefixes = view.model.one.typeahead;
    const docs = view.docs;
    if (docs.length === 0 || Object.keys(prefixes).length === 0) {
      return
    }
    const lastTerm = docs.at(-1)?.at(-1);
    // if we've already put whitespace, end.
    if (!lastTerm || lastTerm.post) {
      return
    }
    // if we found something
    if (Object.hasOwn(prefixes, lastTerm.normal)) {
      const found = prefixes[lastTerm.normal];
      // add full-word as an implicit result
      lastTerm.implicit = found;
      lastTerm.machine = found;
      lastTerm.typeahead = true;
      // tag it, as our assumed term
      if (view.compute.preTagger) {
        view.last().unTag('*').compute(['lexicon', 'preTagger']);
      }
    }
  };

  var compute = { typeahead: typeahead$1 };

  // assume any discovered prefixes
  const autoFill = function () {
    const docs = this.docs;
    if (docs.length === 0) {
      return this
    }
    const term = docs.at(-1)?.at(-1);
    if (term?.typeahead === true && term.machine) {
      term.text = term.machine;
      term.normal = term.machine;
    }
    return this
  };

  const api$3 = function (View) {
    View.prototype.autoFill = autoFill;
  };

  // generate all the possible prefixes up-front
  const getPrefixes = function (arr, opts, world) {
    let index = {};
    const collisions = [];
    const existing = world.prefixes || {};
    arr.forEach((str) => {
      str = str.toLowerCase().trim();
      let max = str.length;
      if (opts.max && max > opts.max) {
        max = opts.max;
      }
      for (let size = opts.min; size < max; size += 1) {
        const prefix = str.substring(0, size);
        // ensure prefix is not a word
        if (opts.safe && Object.hasOwn(world.model.one.lexicon, prefix)) {
          continue
        }
        // does it already exist?
        if (Object.hasOwn(existing, prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (Object.hasOwn(index, prefix) === true) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = { ...existing, ...index };
    // remove ambiguous-prefixes
    collisions.forEach((str) => {
      delete index[str];
    });
    return index
  };

  const isObject = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const defaults = {
    safe: true,
    min: 3,
  };

  const prepare = function (words = [], opts = {}) {
    const model = this.model();
    opts = { ...defaults, ...opts };
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (Object.hasOwn(model.one.typeahead, str)) {
        delete model.one.typeahead[str];
        return
      }
      model.one.typeahead[str] = prefixes[str];
    });
    return this
  };

  var lib = {
    typeahead: prepare
  };

  const model$2 = {
    one: {
      typeahead: {} //set a blank key-val
    }
  };
  var typeahead = {
    model: model$2,
    api: api$3,
    lib,
    compute,
    hooks: ['typeahead']
  };

  // order here matters
  nlp.extend(change); //0kb
  nlp.extend(output); //0kb
  nlp.extend(match); //10kb
  nlp.extend(pointers); //2kb
  nlp.extend(tag); //2kb
  nlp.plugin(plugin); //~6kb
  nlp.extend(tokenize); //7kb
  nlp.extend(freeze); //
  nlp.plugin(cache$1); //~1kb
  nlp.extend(lookup); //7kb
  nlp.extend(typeahead); //1kb
  nlp.extend(lexicon$3); //1kb
  nlp.extend(sweep); //1kb

  // generated in ./lib/lexicon
  var lexData = {
    "Conjunction": "true¦:!1:#:от;аIбHеEиCкакBм8о2ум#1ыбHьт0ятох;ох,се #;оп,эH;би4г#то,кандо,н3т0;аз,дуб,ч0;! 0;кAум#D;!волс,неми;!л;еч0#и1ёчи1;!и0;рп;! к4;!л0;ежен,и,се;дг,ж0;к0#;ат;#ч;!д1к0;оп;!гок",
    "Preposition": "true¦!1:#$%&():ре,ст,од,за,из,ле;бQвLдK&,(IкHмEнаAо9п3раMс0у,че#з;!в1квозь,о0пу$я,#L;!гласно;ерх,ыше;е#дOо2р0;и,о0;!т7;!дL&Fми8с0;),#д0;и,$вом;!бIколо,тI;!в$#чу,дHкануне,п1сч0;ет,ёт;е#кор,%обие,рот0;ив;еж1и0;мо;!ду;!о,роме;!-0о;&,п%;ля,о;!бл(и,доль,ме$о,н2о1пе#0р%е,с)д;ди;!з),круг,п#ки;е,утр0;и,ь;ез1л0;аг%аря,(;!о",
    "Adverb": "true¦:!1:#$%&()*+./<=>?@[]^_`~:ре,оп,ем,тс,ад,ар,ел,аз,ен,он,еч,ур,ин,ач,ту,ок,ан,нд,ед,бо,од;а0Mг=дв,д0Iе06з>в,и02йо00мUо8#миTс?й7@т,у4х#вв,ц.[],ь1юь0я^ог7ёще;неK&/л$,ч/;дуб>-(гHн<о,#пет,с_з,т0;уч0япо;!-ь@ч;дюсв,з1меом-$,х#в0;],в;)с,иY;ес;вJгGкFламHмяEн6р5т1х0шорох;ит,олп;-1с0;?,оB;(0_г,как,ум<$;г5ук;[с,&ыб;),в(.,д6жомзSне4#ми7тюлосба,ч2ьл0;е0овA;дто,тив&й_;.0ы`;[;`0лд%,ш#E;со;з$,=т;рп;г*,дер,*(,зиRморг;л1/м0;!.;~;а0*S;рпR;ат,е3о0ё^;дяр,кшилс,р1т0;*,$;<U@;^,с0т+;вос;м0нсR;из,~;д+с,кс1т0;а&к,чM;йилгна-Lс=-L;нв;дAж7н6/#вE&%в,ш2щ0;`0е;ов;чул,ь0;л1н0;),%;(,об;й)к,ло6;зBи1у0;!х;лб;гGзA;+2е0ё0;#0;пв;];вDд6л?аEм4р0;<в1тв+0;!*с1;!+0;$;~,ьс0;ев;г2у0юс1;к3т0;!то;е2о0;к0ни;>;св;)пс,е1о0;нс;лс",
    "Pronoun": "true¦:!1:#$%:св,но,ин;а$,еLиHйFмB$,о5саKум9х4ы3ьдуб%-7ю2я1ё0;еL#;!беLнем;еJоD#;в,м,т;еEиH;г3$,т0;-0к7ч6э;от0;к,ч;е0ок4;!н,#,ч2;а8е0иAок,ён;к1н,#,ч0;%;!%;е6о0;бо6нм;м0$;а1е0и3;#;в,н;бе1е0нм,#;!н;с,т",
    "FemaleNoun": "true¦:!1:#$%&(:ре,ом,рг,ем,ол;ь0;в04д01жYзWлMнFпеE#вд,сDт4ч1шNщ0;ев,$Q;е1о0;д,н;п,р;а6ес,ин,#5с0ямап;а2еч,о0#ш;вон,дар,к,пе5р0;аBокс;л0порп,рAч;бо,в;втеч,мс;во0м,чH;рк;о,ыр;тс,ц;а5е1з0одал;ак,елоб,иж;л2п0рис,со,т;е0у0;тс;!ез;д,кт,%;а5е2о1с0ып;ым;б,р,с;!б&,т0щ;&,с0;оп;д2т1ч0;еп;ед,с;!&;ам,я0;вс,%;е1о0ё1;л,р;д($;а1е0у%;м,#чо;ртет,ш(,щ(п;о0убо;бюл,кр1р0;б,к;ец,$",
    "AnimateNoun": "true¦!1:#$%&()*+-./<=>?@[]^_`~:ен,ст,ка,ер,ра,на,ри,ел,ни,ль,ок,ин,ар,са,кт,ит,ве,па,ца,от,ва,да;а29б21в1Rг1Kд1Gе1Eж18з16и12к0Pл0Lм0D)ча.-к,о07пVрSсHтFуBфAх7ц4ч1шофUщ#/,эле?*к,ю0яще0Qёж;ноша,*$;е0@а1W;ло[к,мпиLр0;вь,е]H;а0ыплV;пля,р0;и^,ь;о0удож-к;зя0мяк;<,й%;&м&,_ог10;л@%,т%,ч0;#и1@+ь0;!-^;к,^;е0игр,о`*щ,у*$,юлWётя;лJтя;в8е7л6о4порт1Lт0уд9ын;=1р0уд#т4;аус,ои1E;ик,у0;ха;ба%,`,кол,л~т,сед0;!%;он;крет=ь,$(;<0ящ#-к;ья;абFе0ыбак;б6~1Gжисс0;&,ёр;а8е6и5о3р0тиVч+а,ёс;е1о0;г(мми$,~вCфессор;зидеG$упнV;вZдруга,ку]0Yпугай,рос0эт;#/,ён/;л_,нгв<,>0W;в0реводчRс,т3;ец,иN;н~,],р7с0;>жир,т0;ух;безья),вJл4р+,с3т2фиц1х0;_нL;&,иа5;ец;+,ёл;#ь;а6е4и-$р,о3у0ышь;ж1зы%0([й,ха;нт;!чиW;)х,рж;д0ханB;[4се$(;.ч9ма,ть;е1и>,о0яг0Lётч8;сь,ша1;бе0оп=д,тч6;дь;абан,#гуру,нязь,о5р2у0;*0;^;о0ы>;кодил,л0;ик;з5лле4м3нь,ро1смо)вт,т0ш%;!#8ён8;`,л0;е`,ь;=;га;а,+,ёл;гр2н0;дюк,ж#0;&;/;аяц,[0ебLмея;рь;#3и2у0;к,р0;авO)ли$;(ф;а,щи0;);ж,н0;_;е1иреTо0руг,ядя;?Yчь;в0дO.ф5путW;очOушO;е5ид,о0усь;лубь,*л3с0;по0ть;д0жа;<;ла;н&ал,рой;&блюд,ну8о2(1ыд0;(;г,ч;ди3лк,р0;!о0;б0);ей;те0;.;к,ч7;а2+6изне1о0рDык;бр,г;см#;б2нк1р0;ан,сук;ир;уш0;%;вт6дв/5и4?2нг1рх@е0;?5;+;&,*0ёр;>;$;ат;ор",
    "MaleNoun": "true¦:!1:#$%&():ап,ру,ок,ат,от,ов;аTеRорве,у$гнек,ь0ядяд;булPвреч,дNлCн6р2суг,т0;о0сOуп,яз;гон,кол;а1е0%я;вз,гал;в0днелEноф,тня,хус;куб,оO;е1о0;го,к;во$,д,л2м1п,р0;#,%;ак,ер;о,ют;&ипсCб9ва$ж,е4и3к&кепс,мерк,о1у0;криц,н,р;н,п(,р0;#,тнB;бом(ва,тс;сик,т2ф0;(р0троп;ак;а0ичу;сип,тич;масна,ур;е0жод,з)г;бел,вдем;ог;зн#миш,ф0;%;гу1д)е),кшудед,ни0п#,шоню;чжум,шр&с;лс",
    "NeuterNoun": "true¦:е8и7о1уг6эола,ю0;н3ьвретни;ак7едив,ид4ни3пед,р1т0;оф,ьлап;т0юб;ем;к,наип;ар;рюж,скат;леж,мюзер,нш0рюп,ссош,ф0;ак",
    "MaleName": "true¦!1:#$%&()*+-./<=>?@[]^_`~:ор,ан,им,ис,ст,ин,ар,ри,ил,та,ол,оф,ла,ле,ат,ик,ен,ян,ел,он,ак,ас;0:2C;1:2D;2:29;3:24;spencer,а1Wбо1Uв1Eг18д12е0Vжд3з)ов0и0Oк0Gл0Cм06н01оZпTрQсGтCурб3ф5х4;*0Mр&$ф;адд1е8и5о4р/,ёд#;ка,ма,т0;л4рс;?,и4;м2пп;до4л@с,окт&т;с1т;*~,и5р4;иф2<%;м4т,х2;<1ур;аBвятоAе8-7о6п5т4;$Tеп3;[сер,и+д2;з2фр2;а,ьвесD;ва(ь],мён,р4;аф%,г1;п/к,с0Y;в4му-;ва,^0;азумн@,о4усл3;д4м3(J;и2ос0T;а7=т2о6ро5ё4;тр;в,коп0т15х#;л@*п,рфир0.п;в^,&0н4рф16фнут0хом0;крYте>йм2;>г,н4;&%,уфр0;аз*,е(#,@4;$6и5о4;д%,лYн;.,ф#;др,#;а6е>1Bи5(4;&0E;на,рос0Dтр<3ха-;г&т+3к5моEр4тв1;к,тын;*,с%;авре15е5огг),ук4;а,ий,ь];в,_4;ид,т0;апAи8л%е7о5у4;зьма,п+];н4рн0A;дрO_,($т);нт;м,р4;!-л;ит2;`и9в3г7зот,лья,нноке0Tр6с5у4;да,ли3;а`,идY;`л0)1;н4#ь;?0;нф;в7гTм^ь],р5ф4;%,рем;ем1м/4<1;ай;г5док%,с4;ей,.ф0;[0раф;$8е6митр0о4;брыня,н4р<1;?;м4нT;ид,ьQ;аJи9;а7е4>б,#д1+г#0;лRннV#г0р4;~Wм$4;!н;в+4=кти2;-;аD[Bи8=4сев/од,ячес7;д4с;и4>н;мир,с4;=в;к4сс*и2.л0;еXт4;#;еди4иамR;кт;в-а,дI>6р5с4;-0;=м,с_<0ф/ом1;нтMр4;ий,ь4;];гд3р4;&;вKгаIкGлCн9р5ф$4;~0;&т*х,к6с5т4хипп;ем0ур,ём;[0;ад0;?/0др1@и.,т_5ф4;%;!);екс6ь4;берт,ви3;$;$др,ей;`0)д4;);пит,ф2;_;д1ксе4;нт0;ий;ей",
    "City": "true¦!1:#$%&()*+./<=>?@[]^_`~:ро,ан,ов,ин,ла,ка,ск,он,ос,ар,ер,ко,нг,ра,ст,го,ль,та,то,са,ха;0:37;1:30;2:2W;3:2U;а2Yб2Fв25г21д1Uе1Sжук%29з(_у@,и1Qйо1Oк16л11м0Tн0Gо0Dп08р07сQтNуLфKхGцFчAш7щёл=3э5южно-`~л2я4;к1Q>+,#с(в];л4>е]с,р-рияд;ект#@аZи@а;а5энь4;чжэ1ян;нх8хты;е5и4унц&,энду;)Y^;бокс/ы,ляб2нн5р4;еп%ец,кес0;ай;з&а1&дао;а4имки,ошим&,ью@+;б/0Kйд/2Mн5р4`вюрт;б&,тум;ты-м$с13ч1M;и(де]фия,оша1укуо);л4ссур11фа,~1;$-удэ,ьян0F;а5в<ь,ег<$,о4у(,юме1яньцзи1;бо2Kкио,]ятти,м0#н_;г$#г,мб%;аGеAи9мол1Vочи,т7у5ы4;з04ктыв)р;р4ч1D;ат,гут;а4<ли^мак;вр9мбул,рый о*ол;а1мфе#пo9>а0G;в5р4ул;гиев п.ад,пух%;а@5<4;одв2*;опо4;];(ват,м14н5?4;н0т%;-паулу,кт-пет<0Rтья4;[;амен*ое,еут%,ио-де-ж$ей#,.т%-на-д+у,убцUыб2яза1;/иж,е5одо20#=пь24*%,у4ятиг07;на,шк&о;к&,нза,р5т#4;за07павл%*-)мчат11;воу?1Wмь;бн2д&цо3ктябрь0Zм0р4`);е4*,ёл;н0Hх%о-зуе3;аEеBижн8о4ью-йорк;в4г2ри1Rябрь0;о4ый уре>ой;кузнOмо*I#сс03сибир0че4шахт2;бокс1Qр)с0;е5ий 4;н0U^гил;в/тEк6;в&номыс0фте4;к4югA;ам0;б<ежные челны,[я,з4]чик,нкYход);?1;а9ехи=,и7о*ва,у4ытищи;мбаи,р4;м4ом;$0;асс,~йл4;%0;гни_гGдрид,й4ниT~ч)T;ами,=п;а7и5о4у$да,юб<цы;нд+,с-$джелес;ма,п4;ецк;г.,хор;аFеEиBоA?сно7у4ызыл;а( лум5р4;г$,*;пур;г5д4яр0;/;ор0;вр6ломна,мсомо]*-на-амуре,пей0#лёв,@#ма;нша`,р5сло4;вод0;%;ме#3рчь;за1ир,л8м6?5сп4;ий0;чи;ен*-у?]Rыш4;&;&&Cуга,ькут^;х$нес8ш)р-о4;(;в$о3ж0Mрк4;ут0;впа_рия,)т<&4ссентуW;бург;а7е6жа)р^,з<ж2имит#в5о4у>уа1;л[прудBмодедо3;г?д;ли,рбент;к5л4р-эс-`(м;(с,я1;);вада(х6+к+г,#з5у$ч4;жоу;ный;/а;аш&гтCеликий нBиднA(ди9о4;л4#неж;[6ж5ог4;да;*ий;грUд+0;в.тM)в)з;ое;%гE;+;аDе7ий0(г%ещ6о[Qр5уэн.-айр4;ес;ат0ян0;ен0;л6р4;д0езни4;ки;г5у-ориз+4;ти;о#д;гдF(A>7р4^й0;на5село4;на;ул;ал5к4;ок;ор;=3ши~;во;бакHлD>Cр9@?~1тл$7хмед5ч2;&0;аб4;ад;^;нь;зам5мавир,х$ге4;]0;ас;/0;екс$др6ьметь4;ев0;*;ия;$",
    "Ordinal": "true¦:й0;итерт,о4ы0;вреп,т0;ревтеч,я0;в0п,с0;ед;мь0ротв,тсеш;дес,сов",
    "Cardinal": "true¦!1:#$:ся,цат;восVдKмиллиIоDпятBс7т2четыр0шестA;е0нYёх;!с4х;р1ы#ч0;!а,и,у;ех,и0ёх;!дNнTс0;та;ем2орок1т0;а,о;!а;и,нOьM;и0нNьL;!де#E;б3д0;ин1н0;а,и,о;!нI;а,е;ард0он0;!а,ов;в4е0;вя0#т8;носто,т0;и,нBь0;!с9;а2е0ух;!н8с0;ти;!д0;$0;и,ь;ем0ьми;н2ь0;!де#т,с0;от;ад$ь",
    "Country": "true¦!1:#$%&*+./<=>?@[]^_`~:ан,ра,ка,ри,ин,ер,ая ,ва,ар,я республи,ор,ик,ск,ен,ал,ма,ла,на,да;0:3G;1:36;а2Yб2Jв2Bг1Vд1Rегипет,з1Oи1Hйем[,к16л12м0Qн0Gо0Eп08р03сMтGуFфCх>/т0ц[т$льноаф&к#1TчAш8э5южн3я2;^й1п0J;.2ый суд#;аф17кX;к/3&трея,с2фиоп0;/т*и,т0F;д>,то&]ьн06;ве2&-л#% (р#ее цейлон);йц2Hц0;ад,е2иG;рног>0х0;<+2Kеде$тивные штаты м?ронезии,и3олкл[д2Kр#ц2;ия,узс%я поли1B;джи,липпKнля1M;г#~,збе7к$*а,оллис и футу`,руX;а5ибет,о4&ни~д и тобаго,у2;/лу,нGр2;км2Kц0;го,ке_у,нга;джи2ил#д (р#ее сиам),нз2V;ки2F;аG/зил[д,е8и7лов6о3у2ша,ь+$-леоне;д#,&`м;ед*ённ3ломон09^2;ли;ое к>олевство,ые штаты аме&ки;ак0[0;нгапур,р0;в+н6йшель23н2рб0;егUт-2;в*с[т и гр[ад3китс и нев2люс0;ис;*ы;.2ые ^&#@ие;к2^кL;>E;ль/д>,моа,н-2удовс%я <T;^&но,томе и п&нсипи;е4осси3у2;#~,мын0;йс%я феде$ц0я;спубли% ко2юньон;нго,р7сово;а3еIо2уэрто-&Q;льша,ртуг0A;ки1Q_у,`^,пуа — нов3$2;г/й;.гв*2;ея;бъед*ённые а$б@ие эми$ты (оаэ),м#,стро/ к2;айм#,у1;а9еп8и6о2;в.2рвег0;зе_0I%л2;ед2;он0;г+2%$гуа;!ия;];миб0у2;ру;а5екси1о2ьян^;замб?,лд3н2;гол0тс+$т;ав0;в&8~гас%р,йотта,%о,л5р2;ок3т*и1ш]л2;овы11;ко;а3и,ь2;дивы,та;ви,йз0;кий,т1E;а4есото,и2юксембург;б+0в2т/,хт[шт0S;#,ия;ос,тв0;аA[0и7ндр,о3у2;ба,вейт;лумб0м>0Oс2т-д'ивуV;о3та-2;&1;во;пр (остров),р3тай2;!с%=% (тайв#ь);гиз0ибаW;бо-в+де,зах0Lм2`~,тO;боджа,+ун;з$иль,нд6>д0Yр4с3т2;]0;_Hп0W;а2_G;к,н (п+сV;ия,о2;нез0;а2имбабве;мб0падн.саха$;ет;#0емок$тичес%=% кон4жибуJом*и%2;!н2;с%=1;го;аEв9+м0Kиб$лт8о6р2уI;е2уз0;н2ц0;а~,_2;нд0;н2суд<ство п]ес03;ду$с,конг;<;а5и2;#а,нея2;!-бис2;ау;делупа,тем]а;б3и2йаWмб0`;ти;он;а8е6ирг*@ие остро/4осточный тим3ьетн2;ам;>;! (вел?об&т#2;ия);л?об&тZн2;гр0есуэU;нуату,т?# (святой престол);аBе9ир8о5р4у2;р2тW;к*а-фасо,унди;азил0уней;л2сния и г+цеговиHтс/H;г2ив0;<0;^;л2н*,рмуд5;из,>усс0ьг0;гам3нг_деш,рбадос,хр2;ейн;@ие2; остро2;/;встрJз+байджIлGме&%Eн7омынь,р3фг#и2;стH;г[3м2уба;[0;ти2;`;г6д>5т2;<кти1игуа и б<бу2;~;%;$;илья,о2;_;!н@ое сам2;оа;б2жир;#0;#;]0ия;ия",
    "Infinitive": "true¦:!1:#$%&()*+-.<=>?@[]^_`~:ыв,то,оп,аз,ер,бо,тс,ан,ар,рп,од,зи,ре,рт,ок,де,со,си,ро,пс,от;0:TQ;1:TE;2:SY;3:TO;4:TR;5:T8;6:TM;7:S3;8:TH;9:RA;A:TL;B:RJ;C:T2;D:SS;E:S0;витинифни,итTDь6HясF;и*евзTKьF;тGчF;елву,я4I;а2Oе2Jи0Gо_б,с0Eун07ы05яF;акс2е03зв,лSнIоHрF;етGYимс,оF;вти0тв1;б,*C;аLв-Eд1емKиJл%IолкHсFь6R;!еJJяF;ъ9#;+,с;^,#;в=,[17.,чд1;!),=,и0%,с;з,лк,рF;т18хоF;[0с;аOбNвJеHмGпFуN1;ецв,у0R;е5R@+зо,я16;дFс1;(по,з2$,#;аGиFтCRя1O;ду,тIW;б=,л3H.1T*F;[0оPVу;ал41юлв;в,ду,`8;д+3мс7;му,рF;!к41%;былу,гр3QиKкJ>Hс@,хGчо,ятF;!&,%,$;емсу,<5;),вF;!з2%,$;и2Zло*,т2X;вд3Lк;ап1еFялк3;+,су;б1Eв15д0Wж0Tз0Rл0Mм0Kн0Aо07п04рYсTтLчGшFщ)C;д1U(MUил,рEHурNTь1R;ел3иHн@7оGуFюлкв;!+,),л1Vм3#;м3тOU;лFнOV;еву,$;аJеIи1HоHр%MYсGуF;рк3чо,що;оDуп23;бNWхо;вс7м$,р*в;вхс,к3рF;),вFке0;е0з8;аIоF#1;нGрF;б,пB;!=,оRK$;лгCркI8;б3еJим86оFумхMF;вFсс3тв1;огGтF;!и0ос;!<;мBтам;+,еGо_т3уF;ковC;цв;к%сGр*F;!%,у;ебQSу;-MеKиIлMFмоHолкGсF;!и0яъ9;+,%,с;п5су;в=,гол5[Fчд1;оP3ъ9;ж,мFцо;=,и0с;тFхN7;]рO8;(*,@+з80яF;.#;!аIдAеGз2ису,ме3YоFс,ып;ву,м3;веш3дFм],с1цLP;!(по,з2$,#;в3Iду,`8;-1SиFов3ург1;л1Qнс;лоK7олGурF;+9к;!%HNс;аMебу,оHрGуFя1H;бз8?3т1I;есJKог;бGVвGгOHр,хF;+,),и0сIJ;!зGи0оFс;д,.MN;-,ио0;лсBсH1;аJз2иIоGтAIяF;!оD;на*F$гO9;!о,у;ду,$QP;б=,л15рG*F;![0у;н3пF;+,с,$;!з2ишо,<GюF;лв;!+1;дHми,ндив,рF$х7;еп2P$мсF;!в,%;!з2иFо,ялго;),вLY;б31в1Cг16д0Yж0Qз0Oк0Kл0Jм0Gн0Eп0Cр05с01тVхTчOшJщF;-G)M2(п5иFо0ущо;хс8;),вFке0;!е0з8;аIGдIеHил,рC5улс04ыGьF;нему;в1лс3;мв,рKF;уху;аIеHилNRм3нJFуFюлкEF;),лF;з2%,с;м$,р*в;кс2н;емсFыд5;+,у;аJеIиGсFып3яI8;авх3оM5с2;пK8чF;!сD6;м,чC;вс3к;аGипFорб;!а6д1;к,пF;о,с;аFOбJдIиF]9;бFди0п1T;а6з2оF#;д,с;!и0%;!а6оF#;д,з2с;укFLысF;о0с2;г,=0иF;м%CTчB;иFуд7;жи0нF;&,д1иP8с;едEсCысс;б-ак9Rелву,иHсупGытF;+,%с;оLFс;лк$;акFявс;!о5OсF8$;-LиJлоI2>дIуGяF;_LS;рг1тF;]0;!&,з8и0ос,у;),лFнс,.;би0;с,$,#;!аLд1еKжGз1GиFо0с,у,юлбB;жоL2к;алсBеHоGуF;бз8н,с9;бEKвEJги0д,р;бу;+,р4;г<,п1;алJивдIом<,рHуGяF;.B;пJ3рEP;евд1~в;!(4оD;[0%EZ;а0Yе0Wз0Vи0AоWрUыF;воRдPзMмуLрJ^пIтF;авGичF>в$;сс2;хс;&,д1;в,дBе0зв,кFо0с,$,#;&,с,$;!д5;аF$,явс;кFн;о4QсEA$,у;аFялго;г<,лкс;зFн];-9ила(;!е0оF#;в,дBзв,.,с,$;бRв*QдPзLкитка0лKнJрFс(еG4теG1;иF<з3;зGмрHIналп,р*иг(5тF;неи_,ьG9;аб,илаиHS;в(Cив1лI4];аж3ец3;-9ирHьл%F;!сF;и,ов;етк-ах,оIG;-IVнем@(;вуч,довJF;еN8юл7;аXбWвз2гят5жTкла*,лQнеPпBрNчJшF;аGемв,уF;лL0р9;нF.B;=,<;аGиFнак5~JR;леву,нJS;кс2_F;),вCO;авог<,тамсF;в,с2;м9цо;авGв+а*Fем],з2ису,с,уH0;о,у;о0с;асG>дFурL0;&,з8и0у;и0у,#;з2<;кFр*у;%су,с2;+,о$;дFнмC>мB;!зL8о;дHнG*F;оJ4с2;=0;!д1(4зFо0с,у;-,ос;ел@3иFылу;шо;^тLYтLчF;еFир*LPом2S;жFZлHрGсDFтF;!о0^,#;бCZеб35;!вF;!зKUи0ов,$,у;а7Tе6Xз6Vи1Lо1Jс1Dу0Kы0IяF;а0Gес3зв,и0Fл00мHHнOо*MрF;аду,)до,[нв,еIи37оF*5що1ын;вFк31тв1;д#,тF;е32ос,с2;вFм=,т3ч<у;&,оFу;д,.,т36;!+,),[0оF$;вHVп,с;аO),дNемMзя3WиKл3PоIсH$,ч3KьF;лоF;ву;!я3I;в,гFлк$,п,р;&,оLI#;в3O[3N.A3чF;д1и0ос;!&,),зKAи0%,с,$;з3U%JEу3T;з,н,рF;*3WхоE;аRбQвKеIмHоGпе31^ч43уг,шF;акAымз2;вз1му;е3X_фо,у=;дFр*E9;е46з2$,у,#;аGе5Iиду,онFт5Cя5A;)6Uх5F;б5Pд1л5NрG*F;&,в,[0о5Iс2#;дз1пF;+,%,^,$,у;ал],(т5Rр5O;вFду;!хс8;лв3сA;л,тDX;бD9вFQлп,м3н,рF;!кCA;д3нF;ам9биг3вик,г03з02иZкUоTпSрPсNтMус7хKчак,ыJюIяF;лгGм%у,тF;!а6в,оD#;&,зв;лп;в,*5;аF<7Tур,ы`в,яHU;м,п;ем,^вс;&,елб,иF;в8Cтв;еFын;вFд;!&,д1(4з2%;!ирхо,@,>ч7;?7тGF;емBиIлHми0>G^р,тFыEPьлем;&,ов;вс,чIJ;~F6ёщ;л7CнAHрк;вдB0кF;!оF#;п,.о;еч^,>м7ырб,ь39;аш,иGоF>вAT;рдзв,с;м,*<;аIеF;!оAHсHYчFъс;оFс,у;пHA.;лк,пFркFY;!+,вG3%,у,#;ломE_F;б,пCU;б4Eв3Vд3CелкEж34з2Wл2Hм2Cн1Nо1Jп1Eр0Rс0HтVчLшGщF;ат#,)5T;!еHил,р65с,уFчулу,#,ь5Y;д7нв,рFсADт3;!+,з2;`,рFту;!гFUз2;+зNг6IеLиJн@IоHуFю68;+F),=,и0л1м7р6A#;!/ьтичу;ксHTм,тGD;!&,о0L;лFнGD;еGEз2$;лFпGE_вFK;!акEF%;!+6Wо9;аTеQищ5оOрNсHуGч1яF;вс1пик4C;мс,рк6Bш3що;аJеHич0BмGоFуп84;гу,.F9;!о$;вFм55ркIP;+,=,%о;н],р#;ечDY%E4;лгоD_F;вс,ку;вGм5VрFс1;п5*в;с4O$;вхKкJлпIрF;),вGк50тF;!^,у;е0з8$G6;!&,о,у,#;!%,с;!&,д1(4о,с;аLевKоFукA0#4Z;нIрF;бGом,пF;!оAHсFD;!с,$,#;!а6в,(4зIWи0<,с,$,у,#;!зF6%;г3лгGркF;!уGG#;!з51и0;аYбXдVеQз<%5иPоHуFщо1;жед,кF;!&,%;вIкH`Fтв1;!оF;!п;%,су;д#,огHтF;!еFос,с2;лв<у;!&,и0оDу;шс2;вGмFтам,ч<у;!=,с;!&,оFу;д,п,.,тF;с<у;еFоFD;нв;<о,уз7;вBQдFжDEц;!оFу;галб3п;!еHоGуF#;к,*5Z;в,кCMтCS;ркF;&,и0у;вGNк%сHр*G*F;!<у;!+,в,с2у,#;еб,у;-00вF9дWеTзQиMлKм%JоHсяGчFш0S;~у;%,ъ9#;вз3кF1лк$,рF;ох,у;!а6и0св;%F;а6<,^,#;вH[GчF;!д1и0о2T;ос,ъEY;),=;аGяF;рг5;к,рд3;ж,мGцF;!оEQ;&,=,и0с,$;зGуF;?5;-F;пу;!%,*GхF;!оE;орE5у;еIоH_GуFыдBQ;=;кBOфо;к+з3н@эE;щи0;!аQдо0еLзKиJоHсFур;!ичFымBG;&,(4#;вFму,п,с3;з1у;п,су;!о9;дGр*F*;&,#;!еFз2%,$,у,#;.F;о3Yс2;вFду,жCFз,н;!&,%,с,хF;!%,с8;-Lинс,оIургHьF;лоF;кс;!а6%;вGмрFрг;~7;!в,(4и0$,у,#;&,)5Zз8%,$,#;!-дз2(4л<оDGоIуF#;лсGрF;+9д,кFE;!&,),%;веG4д,лGмEHнму,рFт5H;<,п;а6в,[0зEQи0оFс,$,у,#;д,п6W;аVеSзеRоK>втJуFярB;бGн61сF*о;!),о;!зFо0;-,ов;!д1у;б61вJг63рHхF;!а6),в,д1(4и0оG2сF$,у,#;!иAове0;!б,оF;г5п;!а6в,д1(4зFZи0оFс,$,у,#;д,кур,.BQ;!ъс;б5VлсGрF;в3епо,пуCS;!о0$,#;лFргBс1;+,г60;аOеNз2иду,оIтHяF;&,о0ъF#;),[0;сещу];лIнG$гF;!д1=,и0;аD2)0UхF;<в;!су9у;шудо8;бMдLлKрI*F;!&,в,[0оFс2#;!дENпFс;!овB4;дз1пF;!+,%,^,$;гз8;!з2%;=,и0<;!аMд1(IзDMи0оHрGс,уF#,юл3;!р;@];п,.,сCP;еп,тF;%F;!уF;!олз;з,лсFн,ргE4;о,с2;елFырг;!&,в,%,#;в08д00лVмTнSпPрK^в7тF;елIоG>в,сF;елб,ивс;пFх7;!св;!зв,и0оDу,#;а4Uг,еHзCог85$мсF;!оFс2уBM;!п,.;м26п7тF;!%,с,#;!-х,ик,>тGсF;!уDS;!(4;ем(еб7с-к3;(гAи,с3уF;!с,ш;ажHеGоF]рзв3;б7дD9;в,цу;!оF;п,с;аKиHо,уGялгF;!з2оD#;гAх3;),вFс;!+енF[0у;!з8;з,лвFн;!&,о;ажр7еFорBI;р,шед3;бигDBв4Mг46д3Iж2Xз2Oк2Bл27м20н1Vп1Pр1Gс19т0Uх0Pци0Nч06шRщF;аM)LеIиHоGуFявс1;мс,що;гу,лг1.9J;чо,щ5;)3вGмF.5с1;в9M(4з2%,#;+,=,%о,];),ос;н],рF;),вGкF;е0ос;!е0з8$AL;аQеOил,рMуJчуIыGьF;немуCU;вFд3лс97;е0%;лу;к3лсGнв,рF;+,з2;!д1%,#;евF;&,ос;в,мFр7Pту;!з2%,с;лгFрку;зFи0;-,ово0;аRгPеNиLломKнJ_т,уHюF;лкF;&,в,д1^,$,#;),взA=,и0кс,л1рF*3;в,%;ев,@E;!&,о0;лARнFрк;в>н,ду?Cйашо.1;в$,мFр*в;а6%,$;ел9яF;мс;кHнF;!зF;+Xо84;!%,#;лFр$;кс8;аIеHыFюн3;дFлс;в,зв,с,$,#;!а6(4и0оCLу,ъ1U#;м,`2;аSеQиLлоб6ZоJпIсFуп7чем,ып76я4Y;!аFв,[0(4ил,<BK$,у;з,н,рF;+,з8#;ешA~;б-Fлг,м_бAхох;!&,),з2о0с,$,#;),пIчF;!оFс4X;пF.;![0;!+,с8;лFмд1рC1;!зв,и0о0п5у,#;вх,к,чеп6M;а`,ечKиHоFук3я?1;рбFс2C;!&,з2;вGпF;!а6д1о8Zс,#;&,%;!%,с2;бLв7QгJж7QиGоFс3;!г9K;бGмFп5т8M;&,у;а6д1(4зA8ос,$,у,#;иFы7Z;!о0#;!а6(4=,оFу,#;д1з2с,$;ищ3оJ>ч6BсAуGысF;!&,о0у;кG*F;!+,в,и0%,$,у,#;%,#;к,лх3;гIзHиFо*A;жу3м%Fп,чB;а6и0св,у;!и0оAJу;!&,оAY#;иHй1олGудF;!&,),(4и0оD;!зв,%,с;жHнF;а6),д%8Tи.F%,с,$,#;![0с8;а6и0%,с;еGсFысF;и0%,#;дFж3;!(4з8оDс;аQеNин0WлM>LсIыGьлF;ем;ви0ми0тF;&,в;ат17и3упFы8P;!&,оFс2K$,у,#;!д,.;вс;~,ёщ;лвGмBс1PтF;о0^,#;з96и0ов,$,у;кс3лп7?в6E;аKеH>м5яF;),вF;!а6з2и0с;лGрFч^;!+,з2%,$,#;&,в,#;кFм5N;а6и0о1YсF$,у;!д1(4с2#;аUеQзеOиNло3KоJ>дIс,уFярB;рF*о;гFко;а6%;!&,д1ос,с,у,#;),во0нHп,рGтF;чину;!гу,д,<4P;му;),нс,.;а6(4и0о9Qу,ъF#;в,д1с;бHлF>по;!дF;+и0%;!=,и0оDс,у,#;ву,з,н,рFс;&,)GдFз8%,$,#;з2%;=,оF$;в,с;!аZв1FеXжLзJиIоHс,$,ыGюлбF;+,ос;в,р;лог,п91.;жо,к3.;-,и,оF;п8Oс;!аPеNоK>втJуF;бHнGсF;),о,с2;и0#;з8о0;д1у;бGвFгу,д1р1;о.C;ов];бF.у6D;%,у;ж,ргB;)3в3оFр8N;дBп;г0Yз,л4CпGрF;*3;!+,в51%,#;аRеNзыMиKл50оJ>HуFы5A;п3NрF;!#;вFд;д1$;м1?1O;вдFж6Pм,*<;!(4о0#;рб;бHрF;бFе9;ене0;!=,и0о0с,у,#;лFш;[0=,и0%F;![0с2;а7Rе7Gз7Eи4Vо0Tр0RыF;б0Pв0Fд07з00ледZмXнWп>чVрQсLтF;аHиFс5уп5ып^;`8чF;о0сс2у;б-GвхFл2I;&,д1(4о;&,),з2о0с,$,#;аHечс2ипGукF;(4;&,д1о5Gс,#;рбFс#;&,з2с,$,#;гHе0з4MкF%,с,$,#;а6и0%,сF$5Xу;!-,в;иFыз2;о0#;&,^;ам9у;алзв,удF;&,),(4и0о0;(4з8о0;аHи0$,#,яF;),вF;а6з2и0с;кFн;а6и0оGсF$,у;д1(4с2#;!д,п;аIвHев1зап6WикGялгF;&,з44оD#;орP#;-O;гHлкF;а6в,<,сF$,у,#;!-;$,у;еов5оF;зKкHн]30ра20сF*(а,х-*5;аF(да;з,лгC;аGилбуF;по;пу,та;-2KиF;лFн2E;а(,и)м;!&,е0и0<;!е0оF#;зв,п,с,$;б3Eвт2Qг_т,д2Fз24к1Xл1Wн1QрOсKтFх-*7;еIкидAрHсF;аб,еF;ра,т0T;а*,илф;вос3;!аH(Fир1NологA;да,еF;тни7;лгC;а1EиFовE;в18га17д16з0Wицосса,ко0Vл0Nм0Iн09п08р01сZтIф-г~0RцFшрам;ифиGовоF;.E;ссалк,тнеди;аUеTиSкад13нN@йоб,рHсеGук^д,ьF;лусн0P;вни,т;еIоF;пGсF;!с2;ми,скэ;вн@,зF;ед;аYеGомF;!(15с;и_,мFцка;м0EуF;гра,кY;ми,цA;мо.мX.рO;д,*н@;киф7нFук06;+иф,епм@;гKеJонги,тFукн@;нецнSсF;иг(7нFюллиA;меFомедA;до0;нег,по;етни;@Eукко;алпM(т0NиJоF;ицкGмFрб7;раг;елл@,нF;ас,уф;бмGд_@,мF;<;@E;!&,с;алкеIмG_фFюз(;!(,ниAс;-гFус;о.7;дAр;(р@,оKсн-т,уF;г(,криц,мGнна,пинF;ам;иGрF;офE;*;=,?нF;@A;лб,ш;аб,иGонF;го0;вKлаHнGтаF;ви0;ори,>дом;иGнF;аAгис;це`;!итF;ка;ивкил,нагапо0олпа,рабмоб;(Q;иG>F;зPн;тGхF;ра;ка,ом;чоF;!з2;вJдз-пIемиHим,лF]0C;овF;!зв;!+;!$;(;аж3ец3ис+Y;аKиHл~Gрап2DсF;ир,~;!^;лGтF;ирк,ка0;!буп3T;п0Aта;-OиGьлF;%W;лJнHрF;етк-ах3OоF;тва;агF;_;аGибF;ом;(,кол,рап;)3L;-NеJивZнGохс-Fу_9;!=;амGеF;м@(3ра,те0;@;вGлсFсеб;!+,е0%,с2K;&,%F;^;!);~;>ж3сF;ачу,)с%с3вYдоUеRйедOмиNнеш>восMрKтFьлетедивс34;евIусHяF;и.огаFпе3Z;лб;и0$;и0$C;ац,дF;об;!у;&3;!з8оF;вFми&в,п,с3;и$0;шGщусF;!ос;[0етуп;вG`F;ог;@F;ур;-дз,учF;![0(4;чу;е33оF>в7;.3;а1Qб1Oвз2г1Kж17к0Zл0Mн0Fп#,р06х02чOшFщ-#;аIеFулс13#;взGмF;з2с;-,в;н#,рF;куи0пF;оGсF;!(4с2;!д;аMепLиHламо0нак1Z~GуF;рк#,#;<(сC;леHнF;-F;го;ву23;се9;кJлпIрF;оFту;вFку;&,д1(4з2%,с;о,#;с,#;аHыпGяF;?F;св;`2;аJдаIтамсFук5;оGс2уF;[0;!.;бд1;вGпF;];&,огF;&,з2и0о0у;вKеG@F;&у;мHцоF;!<F;ен;),з2;-с;аPбасNвG(*Fису,%,с;&,с2;аFолсу9;лу,наHрG$гF;д1=;<зQ;*F;оFс8у;!и0;%F;^0;вFз,н;&,с;!аксLлатK>чJсF;атHиGыF;з2$;тв;#;д1#;$;в,#;аPеNлаMоK>дJуF#;лсHрF;+9;);&,);&,д1с,у,#;д,мF.;а*2;до;лсFр4;$,#;лB_г5ху;+;-GятF;а6в,о0$,#;дFт5;зв;а6д1(4зFи0оDс,у,#;-,и;вJк%Iр*H*F;+,оF$;ду;+,в,с2у,#;су;ду,сF;и0о,у;!+,и0оF#;п,$;дMж3лJмуз-д1ов7`уYрGцнатEчон7шуб;!с;зоFог,*5;д1с;!&;до0оFп;б5дF;ое0;аFо;з,лвFн;&,о;дLлп,нзH*F;а6в,[0(4<F$,у;!ен;и0оFу;пGсF;!о;!о,с2;!&,(IзHи0оFс,$,#;пF.;!е0;-,и,ос;еп,п;%,с;йNсF;аLеGяF;?;вHнF;оD$;п,.;!з2и0оFс;д,.;`;+,и0оF;),з2с;-;ди,з02йXсF;аTеHюлбCяF;?3;ос;вKлп5мд1нHрF;)F;!=,и0;!а6в,(4зFи0%,с,$,у;ио0;&;!а6в,д1(4зGи0оFс,$,у,ц,#;д,п,.;-,иоFов;.F;!с8;%;`,рF;!+,з8#;ов;а6(4и0оFу,#;),в,д3зFп,.,с,$;ве0иA;!о0;з,н;евGл%3;!%;!в,(4и0%,$,у,#;.;еп;ни",
    "Month": "true¦а4дека3ию2ма1ноя3ок0сен0феврал5январ5;тя2;е,й,рт4я;л2н2;бр1;вгуст1прел0;е,ь,я;!а,е",
    "WeekDay": "true¦в4п1с0четверг6;ред1уббот1;онедель3ятниц0;а0у;!м;оскресень2тор0;ник0;!ам;е,ям",
    "FemaleName": "true¦:!1:#$%&()*+-./<=>:ал,га,ле,ар,ор,им,ла,на,ки,ил,ев,ен,ми,ип;аCя0;#$,ег#еп,и1оз,ь0;вокс&п,*тан,рад,фаZ;!д8код7л6н3пм#7р1с0фос;атса+,иNк&п6;ам,е0от-в;-FлR;$,е1ис(ф3о0;)ре,рвB;г1ск;#0.,ю;ве;в#к,.;в#с(08г06д03за,-01л00мYнAр5с2т0фрBц.);#з,/азиTи0;лу,рагр9;и0с<и;&,л0р#,фY;а,исF;а3д+скFи1одо0;еф;к,=д#в,фа0;лг;врAм4;аKеJи7н4я1ёрт0;ам;!ь0;лу,т0;ат;а1и0он;!п;!ж,ои,сус;аф,гер,л7н6ппир5р3т0;в1нел0се%ц;ав;е*;а0бят9етаке,и;к,м;$;!отC;а2вап,егBо0ука;п,р0т>0;ак;!г;%;д,ж<с,л1с0;ко;сур,т/с;и0=р;тс>е,ф&ес;еж1)дюл,кёф,*,усру;%ж0н(/;+;а1<г(,иа0;низ,ри;>=1л,р;ни,ь0;ло;),я",
    "LastName": "true¦!1:#$%&()*+-.<=>?@[]^_`~:ов,ин,ев,ак,ен,ан,ст,ар,ко,ик,ер,ол,ор,ел,нк,ск,он,ал,ом,ук,ме;0:MK;1:ME;2:MF;3:LO;4:L2;5:JA;6:L6;7:M9;8:LE;9:JS;A:IJ;B:M4;C:LH;D:LX;E:L7;F:HI;larin,аL8бISвHRгGNдFUеFEжF3зEKиE5кBKлAHм94н8Pо85п6Oр60с3Zт31у2Lф24х1Qц1Gч0Wш05щWэQюHёG;жиC3лк1;бк1г0дLмаKнJрIсуп0фK3ха7CшG;&0кG;ивы1#;ас0(2$,к0л0на2ь2;ге,%ич,к1;т0ш2;аHиG;н,цкE;ч5шк1;йбожLWк?ь,лJмD9нHп$г<,рGсс(,туш;д?и,и*0;гGт1;?ьг+дт,#D;емба2ьG;к1мпт;авNеHуGёBW;к1р0;гJдр8-ч3Fпк1рбHтG;$1к1;аG$а;к0тых;еKXл0=G;%,их1я2;еKVл2;аZвеYеVиPкуOлык0мNпMуG;бFBв9й6кKлHрGх0;уп0ш^1ыг1;ьGёв;гGдеш0ц;а,$;#,ш1;&,.9;аAS?5;рDт;б9гKк9н6рJхIшG;кGл0#;)0$,о;#,р4;$0к0м4ок0;а2$;в?5лHп#9рG;е~D1*0;аг1еп0_0яп1;д0рн.;бKкмHQляп1поJрH*1тGшл0;^0ун0;ап0оGш1;в,н0;в9шн3;^1уG;н1р0;аWеMиKк9мых0уG;бBг8Dд0жKFкре2мHIпGрк1ч4;аH#,рG;&0$,#;л0х1;грHEж3ла2*FчG;.0к4;бOкNлMм<ис,нд2п0DрGснDLх0;вFеKкаJнG;&0е6Q.0оHух1ыGяв6;х,ш5;бр#1в,мырд1;с0ш1;нч3п4;_ей,п4;м5JуJ;от5Iык1;аHд0з0йкGлый,па2рк0;а,#6;да2;аNвLеKиIуHыG;г4зHE;к4л`идзе;гл<,мм<м),=кAрGци4;$6к7Qю5H;йтл1л.Aрт?2х)1P;етGил0X;а2к0н0;пл1рG;ег>одц2ицын,ёв;аMво*Aигир,лLм?ьн0оJрIуG;дGрт1;#ек0як0;ам0ебт0_0ущ5;в93лIAмGрьк0хл8O;к2Dо65;ебAKоп5E;бKлIмидK3нHрG;ит7лам0мац;ип0ц2;ип0тG;ур1;аG(6;л0р0;аUеQиMл9QоJрHуGыны0ёдD2;к1рм4;)G=0;-,ц2;к1мGнвиз1роп7;еCиG;н,ч5;лGрс0;ат0еCиGьчеC;м7пG;#,п0;дGнJ7тис0;$,оGул0чеC;сGт0;е2#;де2нG;$,ыг1;вBгRд_,лPмOнNрLсHтёс0хGшFU;#,т_6;аI(-,ил0#,пERтG;иGюжDL;мB7н0;т0ч5;аGб)Aи54ус0;к0лец;г<н,кAтFX;)0[E;)0и50ьяG;н8ш1;лH=G;%,ьн3;иG#;цкEчES;а04в+дAе00иVкач7LоQрKсыыHAуGыEPюшнFё3K;м9UпIрGхачCA;б1гG#;(2;ицын,=2;аJеIиф7оHуGынд1;с0тн2ф4х1;фI6цкE;ди&AтьF;вGпезн3;к1н3;кJлHп>DBрG;оп0ш1;б4к74м74о-н6*оG;бр0й,-ж2;+2мEZ;моIтIUхG;в9SоG;мC2н9Kход;фе2шG;(-,к1;лDLмн3плIрGтFY;еGёш1;б0х0шк0щHY;#,яш1;бEPлаMмаL@0рJтGуш2;аGт+;рGур0;$68#;ас0кAнG;#е40;рк1х1;лGн0;их1;а13в9е0Tи0Mк0Jл0Iм0Dн0Bо04п02тRуIча*ли03ыGьI7ём1;со2тн3чG;к1ёв;бNв>MдлеCкLлт4нгатKпр58рJсIтKхGчк8;аGих,>G8;н0рн3;лFн1;.0к0н1;ул1;ач5$,лет1;$,к1#;бот1от1;аNеKрG;еGог4;к9лG;к0ьG;н3ц0;бл5жCYпG;аGн0;нC5ш1;л1рGтн.;.0оGц2;в7Uдуб5G;)0<6BраG;вц2;бLкKлGм0н1п0р35;дDоG;вь5дHмG;ах1$,]0;н3с8L;=0;аCW=%FKч&;а6XеG;гир5тк0;аг1еJирнIоG;лGтр0;$,янGD;ит6#;тB8х0шной;ав6епын1обожB7учAA;во2V>оHряб1уG;м1рD;богDхEZ;вD9гаLдA0з9BлIмHтн3янG;$,-,#H5;&1]0;а2иHьG;ве*р0н0;в4н;%,л0ч5;вNдLлKмJнIрGчE2;ге2ебрG#,пи7ябк$а,ёг1;#,як0;отрEEьк1;<3ян1ён0;езн5ив4;е1IоG;в,к#а;<Gо2W;$0ный,#,юх1;бRвOгаде2дNз7ит0й,лLмJнн3пHрн9FфGхBянAE;иGCр7;^5оGрAW;г0жн3;+1оGс7;йл0х1;аг1им0-,т4ьG;к0н3;#6ык0;ас1вHеCиGк1р70;@0ч2;атFG$;а0Uит0;аZеUж9CоOуLыIюр7GяG;бGх1;к8#,ц2;баHжGк0нд1чеC;)0.0к0#;к0лк1;баFEдHмя0Nн0сGчк1;а04н&,с76;ав1$,н3#;б>AгJдIжк0зH-ссAм4*#Gщ1;!ц2;)0#6;зян-,$,чFA;ач5оG;в,з1;вяJзнHм1Oп1тюнс6YшетG;ил0н3;иG#;к0чF4;г1к1;б$7CвCVзIмаз4сGтк1Fф3;к9пG[DIт>гу2;оп0ут1;$,ува2;а0Pе0Gи0Cл0AоVрQуIш(ичн3ы9OьGятос1;еха,янG;ых;гMдLзаKтIшG;кGной;+5$;иGят1;л8н;к0н0;$,о30;ач5$;азD0еJиIоG;ниG[уA2т5Wх86;н,ч2;был0в9гож1мBDходь-;ображABсьнF;гTдSж+6зднFкрAлLм?KнJпIртн0сох0тG;ап0ёG;мк1;#,ыр1;.B_Mч3;#,ьн3;иLнKоIтHуGяк0;н1ш1;)0>&;вц2теG;нц2;+5;в4щ`;а,шив9;од1ребн0;аGемяAMисе0C;кс1т7;в#BмBUроIчуHщаG;льн3;г1шк1;г0жк0;вц0лN@1рI*0тGчк1;рGух0;(-,#,ух1;в&,еHмG#,филь2;$0як0;вHжог1*>G;]1;^0<з2ё0S;%1ёв1;вл55люл1нKп4рJсHтA0улк1х_0шG;$,к0;тGх1;<н&,ух;ам7ши3H;+1$,кGфANькив;$,#,рD;бWве9LгSз4AкE8лRм?ьниQнPпOрNсGшуVщ# ;иKм9MоJтG;аHр#G;еCW[E;л74пюк;к1лодк1;нGп8U;!#,ц2;б&айте,л0;ок1;ег1ипчD7;цкE;(2ьхA;аIиH>оBHуG;рц0;%ич;рк0;нHоGразцо́ва;л8Rр1;из0;аTеPиLоHурG;и2маг_C0;вHздр3Hр1сG;ач5к0#;и2LоG;кш7с?6J;замBDкG;иHоGул1;ла2н0;т1ф68ш1;вз67жд4крHмцGн16пе1*3Gтреб-,ча2;%,#;ас0еG;*ьD4;бDзBс7ум40ч9;а0Dе07иTоOуIышHяG;гк0сн3тл2`1;?0к1;рJхG;аH$,оG;рт0;~тш1н0;аGог0;вь5т0;жа2исе2крив6лч4рIсGх0;^5$,кGяк0;^5в1;двBW(0оGяк0;з0шк1;гSлPнOрMс9тLхHшG;$,н5ут1;аGе2;йл0лG;ицGёв;$,ын;$,роф4ьк1;н4SоG[E;в,н0х1;а2е2$,к1ькA;оHюGёх1;к0т1;в,р7Tс4H;ун0;дKлIнHркуGсяц,х)3Rщ<F;л0ш2;ш.#/м(ьш3щ3;еG.0ьн3;д1х0щ`;вед9Rн3;гTйсSкPлMмLнKрIслHтве2хмуд0шG;+1ир;&,#;$Gк8тюш2ь1;!$,к1;$,т4Zяк1;$,]0ык1;ах0иHк1ыGюг1;х1ш2;к0н8;+0л83сG;имGуд0;#,уB6;&;<,_AA;а0Bе04и00оPуMыLьв0юJяHёG;вк1;гуш5Iд0люB1м1пG;$,ун0;бимGт6K;#,ц2;зл0тк1;бHжк0кG;ашAX$,#,ь2D;аш2;бNвз06г$9MктMмKпHсGщ7Z;%9Mкут1O;атGух0;$,киG;на;оGт2;вц2нос0;%,и7;аG#;н8AчG;%6ёв;д1л0м7п8сHхG;ач5;ицын,#,тG;рDун0;бедKв4Bд#с-й,лух,н1]JпIрм]т0сHт0ш2щG;(-,ёв;к0ничE;с,ёх1;ид0#,ти2;%,$Gь;[Eц2;врLгJз+2нц0пHри7*#ка,чG;$0к0;а2иGо7Fт2ун0;дус,н;ош1рGут0;)6;(24#;а1Dв1CеAAи18л14няз2о0BрTуG;бRва2дOзMим0клLлIпц0рH*0тG;еп0.0уз0як0;&1бDг4д1еп1ицын,о63пDта9Xч1;аHиG;б1к7L;г1к0;ач5%,$;нец0уб0ьG;к1миS;аш0рG;$,яG;вц2ш0;л4ы9N;аSиPоп4BуIыHюG;к0чк0;л0м0с0;гLк0пJтGч68;иHоG;в,й;к0н;иGн0;н,ч;!л0;вGд;к0оG;в,ух0;вч`,%83мн.,сG;ав1ноHоG;тк1;в,пG;ёр0;б07в04жу03з01лXмWнUпTрMсIт0чеCшG;еGк1;л2чк1;+Iк0оHтGяк;$,_Bю90;м0р7Q;%,$;аблL(2жKнIоGтн2ч57яв8;в1л5тG;а2е2к8;еGил0;в,%;&0%;$,ёв;е97с0ц2;дG%,$,н3#9*)т8HьFяш0;ра0Rур0юр1;+0з1иссB=0;есIлHоGу4Cьц0;бк0мн3н3Kс0;<0;н3#;аGл7Bыр2;к0рь;р0х0;^Gр0ш0O;еGёв;в6н-;з],як0;еHимGок0;#,уш1ц0;бле2пG;&,$;лессо,при8TрHсG;?2лух1;е2илGк1Rс4ь8R;л0#;ас0;бл6Tв<1д01заZлWмTндSпQрMсJтIч6CшG;+1ирGн3уба;$,[E;а2<$о45$;атый,ьG;янG;(-,#;аIба7Nг1еHи2наух0ры2ташGч45яв1;#,ёв;в,тн3;ва2ндаш0ул8;ица,раGу*1;л0н0;$6;(Gк1;%,кZсG;ких;аGг4$1уг1яг1;г1шнG;.59;к58нGрез0;ц2ьк0;н3ур1цын;браг79вSгPжOзMлJноземц2паIсHшOщегG;?0л0;а2мLт_1;ть2;ьHюG;х1ш17;$,кун,юш1яс0;мGюм0;айл0;ут1;натGош1умн0;кGь2;#ич;аGк1ле%а,=г1ч74;к1н24ш8;аOвNеф11иLлоб1оJуHыGюг4ём1;к8р7L;бG%,йк0;+2к0#;лGн0р1т0;$,от0;мGнч6W;$,к0нF;<2яг1;б=отный,вLг>о58д>Kйц2кр0Jп>ожJруб1сIхаG;%,рG;#,ч6Rь1;лав6;ец;н0ожный;раGьял0;жGз1;$,нG;#,ый;аOв3д4еKиI=д1уGён0;к46рGт0;авл5#;гGдк0к1л8р0;л0ун0;гл0лезIрH*G;ок0;д2н35;к1н0;б1рG;к0ых1;вTгSдем6ж0лPм?6RнNрJсHфGшY;им0рем0;а6XиG;к0п0;е2MмHоGх0ш0ём1;фе2х1;&0ил0=Gуш1;oв,а2;г^G$;ыч2;аг1еш2иHьG;ц8ч1;зBсе2;>0;док5MсGтушеC;е2тигне2;а05в>н3еZмитри2оSрOуHых#ичный,южеCятл0ёG;гт2м1;бJдIлHнаGр0;%6;ьц2;$,-,н.;$HоGрA;в,л42;$,к1;агHесвян1йга,угGяг1ём0;)1#;_Gун0;ир0;брKлJмIроH*оG;в9%6;фе2х8;аш5н1;г>40ж3;оGын1;люб0н33;гтяр5д0жн5лKмIниHрG;ж4Jн0;к1с0;(Gид0;ок,ть2;#,ян1;выдHйне-,цG;иш1юк;к1#;а0Bе0Aил5л07оUрKуG;б4л1н1рHсGщ1;+0%,$,лFьк0;кAьG;%,ян0;аOеNиJ_0уGязн0;зHшG;)1;д2$6;бHгоGн1ш1;рь2;)0к0оG;в,ед0;б(щ3к0шнoв;д6@1ф0ч5;вяд4AлMнчBрG;бJеHносGох0шк0юн0;та2;в,л0мG;ык1;ач5унG;к0#;оIуG;бGмбA;%,к1#,ц0;вGдя2лоб0;!аG$,к1;н0ха;аHеб0$1оGух0;ба;г=2зк0;@1рас3W;вриLгKзм4лIрGч2;)1иG;н,ф4F;д1иа[Bк1ыг1ёG;рк1;+1=1;к0лG;еC#;а06еXиTоKыIьялG;ицG;ын;рыGсот6;па2;дNлLроJ[HтF;як0;обойн3ресG;(6;бь5нG;$,к0#,ц0;.0к0оGьв0D;д1сеCш1;#Dян0;ноHтвNхр0ц1шнёG;ва;грGкур0;ад0;деMн1HрIс?24тG;оGр0;чк1;еHшG;$1;нич,щG;аг1;нGрн3;е2$;в08г1(Oли2рLсHхG;руш2;иHнеG;в,ц0;лGн;%6ь2;еHт4у2Wф=оG;~2;нн3;га;а1Eе0Rи0Pл0GоUрSуIыG;к0лGчк0;$к1;гаOдMзLк8лJн1рHтGх^о;ус0ыл1;д`Aк0м&1#,ц0ый,як0;#6;гGыг1;&0;$6#;аGн3ыл1;%,н0;%,йч`,к0;аGежн2усLызг9;в3г1нт0;бYгRдр0йQкPлLнд+KрGчBяр0;е2зIисюк,оHтнGц0;.;вк0д1;ил0;%,ч`;дIоHт]ог0ьшG;&0#;тн3;ыр2;!+5;к0ц0;аKд4оGр0ун;лHмG;аз0=0;еп0юбG;#,[E;тыр5ч5;ёв;к0рG;!иG#;к,н6;аKиIоGум;кGх1;!#;знGн0;юк;г]IжHнтGт0;<;(0;рав0;лGрюк0;);б01зUлNнMрJсHхтG;<2;п9с7фамильнW;^0;еGия,ш0;жнGз1;ой;ед.т0;%LиKоHяG;%,к0;в,глP~*нHрGус0чк1;ус0;#,ых;к0н6;ич;б>LобрKрH`лаG;дн3;оG`0;днG;ый;аз0;од0;н2ч`;бTгр0жSзQлаOрI[8тG;ищ2рG;утд0J;аIб=1$0к0сHышG;%,н3;`0;нGтын6;#G;![E;б4киGнд1ш0;н,р2;аG$;н0р0;)0(0;аHиGк1ур1ык1;к0ч2;%,н1;б12в0Wг0Rд&с1зBк0Nл0Hм0GнYпXрPсLфJхHюG;ши2щегл0;мGрем0C;ед0;)асG]1;к1ь2;лаHпид0с7таG;@0фь2х0;н0х4;)0;ефь2замасц2и*Lс(ь2тKх)геHшG;ав1;ль6;[E;ий;ам7емь2ём0;аG#;рх0;^к0тек+ь;аUдрPиMкудLнJоIреп,тGущеC;&0ип8]0J;$,#;с0х1шк1;еC.0;@0;$0;кHсGш1;им0;)0$;еIоGюх1;н3п0;.0;%,юG;шк1;нь2сG;(G;-;^и2?1$2;еIиGлилу2огр1ёх1;%,*рD;ат0;%,ксGн1х1;)Gе2;др0;$фе2сGул0;&0(чGён0;`;+0;аIеHлиG;улл1;йк1;п0ф7;]0;дI<Gил0;$,ьG;ян0;е2]1;$;%;&ум0дIрамG;#G;!ич;ул0;#"
  };

  /* eslint-disable no-empty */
  const BASE = 36;
  const seq = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const cache = seq.split('').reduce(function (h, c, i) {
    h[c] = i;
    return h
  }, {});

  // 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
  const toAlphaCode = function (n) {
    if (seq[n] !== undefined) {
      return seq[n]
    }
    let places = 1;
    let range = BASE;
    let s = '';
    for (; n >= range; n -= range, places++, range *= BASE) {}
    for (; places > 0; places--) {
      const d = n % BASE;
      s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
      n = (n - d) / BASE;
    }
    return s
  };

  const fromAlphaCode = function (s) {
    if (cache[s] !== undefined) {
      return cache[s]
    }
    let n = 0;
    let places = 1;
    let range = BASE;
    let pow = 1;
    for (; places < s.length; n += range, places++, range *= BASE) {}
    for (let i = s.length - 1; i >= 0; i--, pow *= BASE) {
      let d = s.charCodeAt(i) - 48;
      if (d > 10) {
        d -= 7;
      }
      n += d * pow;
    }
    return n
  };

  var encoding = {
    toAlphaCode,
    fromAlphaCode
  };

  const symbols = function (t) {
    const reSymbol = /^([0-9A-Z]+):([0-9A-Z]+)$/;
    for (let i = 0; i < t.nodes.length; i++) {
      if (!t.nodes[i].includes(':')) {
        break
      }
      const m = reSymbol.exec(t.nodes[i]);
      if (!m || m[0].length !== t.nodes[i].length || encoding.fromAlphaCode(m[1]) !== i) {
        throw new SyntaxError('Invalid efrt packed data: symbol definition')
      }
      t.syms.push(encoding.fromAlphaCode(m[2]));
    }
    t.symCount = t.syms.length;
    t.nodes = t.nodes.slice(t.symCount);
    if (t.nodes.length === 0 || t.syms.some((index) => !Number.isSafeInteger(index) || index >= t.nodes.length)) {
      throw new SyntaxError('Invalid efrt packed data: symbol target')
    }
  };

  const unescapeLabel = function (text) {
    return text.replace(/\\([\s\S]|$)/g, (match, char) => {
      if (char === '\\') {
        return '\\'
      }
      if (char >= 'a' && char <= 'j') {
        return String(char.charCodeAt(0) - 97)
      }
      throw new SyntaxError('Invalid efrt packed data: label escape')
    })
  };

  const dictionary = function (trie) {
    if (!trie.nodes[0].startsWith('!1:')) {
      return
    }
    const header = trie.nodes.shift().split(':');
    const tokens = Array.from(header[1]);
    const fragments = (header[2] || '').split(',');
    if (header.length !== 3 || tokens.length === 0 || tokens.length !== fragments.length ||
      new Set(tokens).size !== tokens.length || trie.nodes.length === 0 ||
      tokens.some((token) => token.length !== 1 || token.charCodeAt(0) < 33 ||
        token.charCodeAt(0) > 126 || /[A-Za-z0-9,;!:|]/.test(token) ||
        (trie.versioned && token === '\\')) ||
      fragments.some((text) => !text || /[A-Z0-9,;!:|¦]/.test(text))) {
      throw new SyntaxError('Invalid efrt packed data: fragment dictionary')
    }
    trie.dictionary = Object.create(null);
    for (let i = 0; i < tokens.length; i++) {
      trie.dictionary[tokens[i]] = trie.versioned ? unescapeLabel(fragments[i]) : fragments[i];
    }
  };

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    const target = dnode < trie.symCount ? trie.syms[dnode] : index + dnode + 1 - trie.symCount;
    // The encoder emits nodes in topological order. Every edge must point
    // forward, which also rules out cycles before expansion starts.
    if (!Number.isSafeInteger(target) || target <= index || target >= trie.nodes.length) {
      throw new SyntaxError('Invalid efrt packed data: node reference')
    }
    return target
  };

  const parseNodes = function (trie) {
    return trie.nodes.map((node, index) => {
      if (node === '' && trie.nodes.length !== 1) {
        throw new SyntaxError('Invalid efrt packed data: empty node')
      }
      const terminal = node[0] === '!';
      const body = terminal ? node.slice(1) : node;
      const edges = [];
      // Match only at the current offset. Searching later positions would
      // repeatedly rescan a long malformed fragment before rejecting it.
      const token = /([^A-Z0-9,;!:|¦]+)([A-Z0-9]+|,|$)/y;
      for (let offset = 0; offset < body.length; offset = token.lastIndex) {
        const match = token.exec(body);
        if (!match || match.index !== offset || (match[2] === ',' && token.lastIndex === body.length)) {
          throw new SyntaxError('Invalid efrt packed data: node syntax')
        }
        const ref = match[2];
        const label = trie.versioned ? unescapeLabel(match[1]) : match[1];
        const text = trie.dictionary ? Array.from(label,
          (char) => trie.dictionary[char] || char).join('') : label;
        edges.push({
          text,
          target: ref === '' || ref === ',' ? -1 : indexFromRef(trie, ref, index)
        });
      }
      return { terminal, edges }
    })
  };

  const toArray = function (trie) {
    const nodes = parseNodes(trie);
    const all = [];
    const stack = [{ index: 0, pref: '', edge: -1 }];
    for (; stack.length > 0;) {
      const frame = stack[stack.length - 1];
      const node = nodes[frame.index];
      if (frame.edge === -1) {
        if (node.terminal) {
          all.push(frame.pref);
        }
        frame.edge = 0;
      }
      if (frame.edge === node.edges.length) {
        stack.pop();
        continue
      }
      const edge = node.edges[frame.edge++];
      const word = frame.pref + edge.text;
      if (edge.target === -1) {
        all.push(word);
      } else {
        stack.push({ index: edge.target, pref: word, edge: -1 });
      }
    }
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$1 = function (str, versioned = false) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0,
      versioned
    };
    dictionary(trie);
    //process symbols, if they have them
    if (str.match(':')) {
      symbols(trie);
    }
    return toArray(trie)
  };

  const unpack = function (str) {
    if (str === '' || str === null || str === undefined) {
      return {}
    }
    if (typeof str !== 'string') {
      throw new TypeError('efrt unpack expects a string')
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      if (arr.length !== 2 || Object.prototype.hasOwnProperty.call(h, arr[0])) {
        throw new SyntaxError('Invalid efrt packed data: category separator or duplicate category')
      }
      h[arr[0]] = arr[1];
      return h
    }, Object.create(null));
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      let data = obj[cat];
      const versioned = data.startsWith('!2;');
      if (versioned) {
        data = data.slice(3);
        if (!data || data === ':') {
          throw new SyntaxError('Invalid efrt packed data: missing versioned trie')
        }
      }
      const reversed = data[0] === ':';
      const arr = unpack$1(reversed ? data.slice(1) : data, versioned);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = reversed ? Array.from(arr[i]).reverse().join('') : arr[i];
        if (Object.prototype.hasOwnProperty.call(all, k)) {
          if (Array.isArray(all[k]) === false) {
            if (all[k] !== cat) {
              all[k] = [all[k], cat];
            }
          } else if (!all[k].includes(cat)) {
            all[k].push(cat);
          }
        } else {
          Object.defineProperty(all, k, {
            value: cat,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
    });
    return all
  };

  // the four parts of a model, in the order they are packed
  const sections = ['fwd', 'both', 'rev', 'ex'];

  // characters with a meaning in the packed format - words containing these cannot be learned
  const reserved = /[~|:,{}0-9]/;

  const decodeVal = function (key, str) {
    const m = str.match(/^[0-9]+/);
    const n = m ? Number(m[0]) : 0;
    const tail = m ? str.slice(m[0].length) : str;
    return key.slice(0, key.length - n) + tail
  };

  // apply a model to one word:
  //   1. whole-word exceptions
  //   2. the longest suffix with a rule (a rule may match the entire word)
  //   3. the '' rule, if any, as a fallback (a plain append)
  //   4. otherwise, the word is returned unchanged
  const convert = function (str = '', model = {}) {
    const { ex = {}, fwd = {}, both = {} } = model;
    if (Object.hasOwn(ex, str)) {
      return ex[str]
    }
    for (let len = str.length; len >= 0; len -= 1) {
      const suff = str.slice(str.length - len);
      const stem = str.slice(0, str.length - len);
      if (Object.hasOwn(fwd, suff)) {
        return stem + fwd[suff]
      }
      if (Object.hasOwn(both, suff)) {
        return stem + both[suff]
      }
    }
    return str
  };

  const flipObj = function (obj = {}) {
    return Object.fromEntries(Object.entries(obj).map(([key, val]) => [val, key]))
  };

  // swap the direction of a model
  const reverse = function (model = {}) {
    return {
      reversed: true,
      // these two work both ways
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // and the one-way rules trade places
      fwd: model.rev || {},
      rev: model.fwd || {},
    }
  };

  const invalid = function () {
    throw new Error('suffix-thumb: invalid packed model')
  };

  // suffix-trie → list of keys
  const unpackKeys = function (str, suff = '', out = []) {
    let i = 0;
    do {
      let chain = '';
      while (i < str.length && str[i] !== ',' && str[i] !== '{') {
        chain += str[i];
        i += 1;
      }
      if (reserved.test(chain)) {
        invalid();
      }
      if (str[i] === '{') {
        // find the matching brace
        let depth = 1;
        let j = i + 1;
        while (depth > 0 && j < str.length) {
          if (str[j] === '{') {
            depth += 1;
          } else if (str[j] === '}') {
            depth -= 1;
          }
          j += 1;
        }
        if (depth !== 0 || (j < str.length && str[j] !== ',')) {
          invalid();
        }
        unpackKeys(str.slice(i + 1, j - 1), chain + suff, out);
        i = j;
      } else {
        out.push(chain + suff);
      }
      i += 1; // step over the comma
    } while (i <= str.length)
    return out
  };

  const unpackSection = function (str = '') {
    const obj = Object.create(null);
    if (!str) {
      return { ...obj }
    }
    str.split('|').forEach(group => {
      const i = group.indexOf(':');
      const val = group.slice(0, i);
      const count = val.match(/^[0-9]+/);
      if (i < 0 || !count || reserved.test(val.slice(count[0].length))) {
        invalid();
      }
      unpackKeys(group.slice(i + 1)).forEach(k => {
        if (Number(count[0]) > k.length) {
          invalid();
        }
        obj[k] = decodeVal(k, val);
      });
    });
    return { ...obj }
  };

  // one string → model
  const uncompress = function (str = '') {
    if (typeof str !== 'string' || str[0] === '{') {
      throw new Error('suffix-thumb: uncompress expects a packed string. Models made before v6 must be learned again.')
    }
    const parts = str.split('~');
    // Preserve the empty/default input shorthand for an empty model.
    if (str !== '' && parts.length !== sections.length) {
      invalid();
    }
    const model = {};
    sections.forEach((s, i) => {
      model[s] = unpackSection(parts[i]);
    });
    return model
  };

  // generated in ./lib/models
  var model$1 = {
    "presentTense": {
      "first": "2ю:ть{,а{лав,гр,ир,гор,выш,рак},е{пот,лад,худ,сп},раня}|2ву:ть{лы,жи{про,до,е,ы}}|4жу:ть{аза,яза,зи,де}|3у:ть{а{он,дожд,жажд,рч,рж},жи,щи}|4чу:ть{хота,ака,ти,трати,те}|4шу:ть{еса,аха,си,се}|4ю:авать|2м:дать{за,ре,о,т,ри,з,вы,с}|6беру:обрать|4еру:собрать|3ью:ить{б,ып,нал,зал,ыш}|4щу:итить|11у:ить/научить|5щу:стеть|3лю:еть{ем,п}|5ру:ереть|3ю:ть{оре,оя,ая,ея,о}|3иму:бнять|5елю:олоть|2у:зть,нести|2гу:речь|4усь:тись|3ту:цвести|6овусь:зваться|4юсь:ороваться|6юсь:аваться|6чусь:ться{мета,ти}|5усь:ться{ржа,жи,щи}|6жусь:ться{за,зи}|5люсь:ться{ба,и}|5юсь:ться{оя,ои,ре,о}|5ьюсь:апиться|6шусь:ситься~9:цепляться|4сь:уться|5нусь:ться{нача,яс}|4нусь:ться{де,оста}|6ймусь:заняться|5мусь:рижаться|6мусь:риняться|6озьмусь:зяться|5усь:ться{чи,ши,а{мч,рв,лыш,дожд}}|6чусь:ятаться|8зовусь:озваться|6жусь:ться{ди,иде,яде}|7щусь:ститься|6щусь:титься{ра,щу,и}|6шусь:исаться|5дусь:тись{вес,ий},асться|4дусь:йтись|6ядусь:сесться|7русь:ереться|6ерусь:раться{д,б}|8берусь:зобраться|8бопрусь:опереться|4кусь:чься|4гусь:ячься|4юсь:ться{,да{ж,ю,и,а}}|5юсь:ться{ли,ни,ри,ея}|4люсь:иться{ям,рояв}|5оюсь:ыться|5еюсь:бриться|6онюсь:гнаться|7уюсь:оваться|6обьюсь:збиться|6овьюсь:звиться|6ольюсь:литься{з,с}|2у:ти|2гу:чь|4гу:бежать|3гу:жечь|4ожгу:сжечь|3у:ть{а{лг,сос,леж,дрож,ч{ву,ту,ри,л},опад,рв,ыш,р},чи,ши,реве}|2:нуть|2ну:ть{ста,тря,аде,оде}|3ну:жать{по,за}|4ожну:сжать|7ёрзну:ерзнуть|4омну:мять|4жу:дить,орезать|4чу:тать{мо,я,п}|3ду:ти{ий,вес,юс},асть|2ду:йти|4ду:ехать|4яду:сесть|3уду:быть|4ову:звать|6зову:тозвать|4йму:нять{по,а}|4му:ринять|4озьму:зять|3му:жать{на,ри}|4шу:писать|4еру:брать|6отру:стереть|5щу:ть{сти,ска{и,ы}}|4щу:тить{пре,се,осве,погло,ра,щу,му,вя}|1у:расти|4ту:честь|5очту:счесть|3ту:ести|2ку:ечь|3ю:ть{и,тре,аболе,веле}|2ю:ать{раст,ист,лод,позд}|3даю:опасть|8ёркиваю:еркивать|6ёргаю:дергать|3лю:ть{и{б{ю,тре,ла,ра,ру,р,со},п,в,м},спа,ипа,шуме}|5шлю:слать|3ою:ыть|4оню:гнать|4обью:бить{з,с,д}|3ью:полить|4ошью:сшить|4овью:звить|5ую:вать{о,е{ц,ч,ж,ш}}|5юю:евать{о,пл,ор}|3м:сть|5мся:сться|4мся:даться~4быть:есть|2ться:тянусь|5яться:имусь|4титься:чусь{ру,е,р,бо,хо,а}|3иться:сь{у{леч,ж{ло,кру,ару,л},бщ,лиш},землю,трою,кою}|5ваться:азовусь|4зиться:жусь{пово,ра,ли,ни,гру}|4заться:жусь{ка,вя}|3аться:держусь|4ситься:шусь{а,ы,о}|3тись:сусь|3ваться:аюсь{ост,д}|4иться:юсь{л{в,п,м,б},ь}|4аться:еблюсь|3яться:оюсь{б,т}|3ться:еюсь{им,н}|3оться:борюсь|3еться:трюсь|3ечь:ягу|2ать:начну|1ать:у{стон,держ,торч,д}|2ять:мну|2зать:жу{ка,ма,вя}|2зить:жу{ра,ни,о{гр,ув,вв,м},гру,ь}|2дить:гражу,слежу|1ить:у{ж{дра,о{л,дор,трев,н,ам,т},л,ру,лу},ч{ко,але,оре,пе,на},бщ,ащ},ю{кле,о{дост,тр,к,св,дв}}|2деть:жу{и,гу,ля}|2тить:у{ч{о,е,шу,кру,а,р,пя},щищ}|2теть:чу{хо,ле,вер}|2тать:охочу|2кать:оскачу|2ть:ву|3ять:иму|2сеть:вишу|2сить:шу{о,а,вы,ве,ку}|2хать:ашу{м,п}|2сать:чешу|4обрать:беру{аз,д,т}|2ереть:ру{м,т,п}|2стеть:лещу,вищу|2стить:чищу,ыращу|1ть:лезу,ызу,ю{а,е,поду,я},ам|1еть:горю|1оть:орю{б,асп}|1вать:аю{зн,ст,д{за,ре,о,т,ри,з,вы,с}}|1ять:сею,тою|2еть:ю{л{рп,кип,ап,рем},по}|3олоть:мелю|2ить:ью|4лить:олью~4есть:быть|2ю:знать,дуть|2у:идти|2ву:жить|4ю:давать|2м:дать|3ну:начать,мять|3у:ждать,мочить|3ью:ить{п,л,ш}|3ою:петь{,с}|3иму:снять|11у:учить/научить|4жу:резать|3ягу:лечь|3ю:ть{ая{л,т,раст},поро}|5ьюсь:иться{б,доб,л}|5имусь:сняться|4олью:слить|6чусь:метаться",
      "second": "1ёшь:ь|2вёшь:ть{лы,жи{про,до,е}}|3ешь:ть{ну{дох{ы,с},ик,ык,ычерк,ип},она,ая,ея,о}|4жешь:зать{а,оре,я}|4чешь:хотать|2ешь:ть{а{раст,ист,лав,позд,гр,ир,гор,реж,выш,рак},е{пот,лад,худ,сп},раня}|3ёшь:дождать|2шь:ть{да{за,ре,ро,по,т,ри,з,вы,с},и{,б{ю,со,ру,тре,ла,ра,р}}}|6берёшь:обрать|4ерёшь:собрать|3ьёшь:ить{б,нал,зал}|10шь:ть/научить|3ишь:ть{е{т,д,ор,с},оя}|5рёшь:ереть|3имешь:бнять|3шь:сть|4ёшься:тись|2ёшь:нести|3тёшь:цвести|3ёшься:ься|6овёшься:зваться|4ешься:аться{оров,д{ж,ю,и,а}}|5ьёшься:апиться|5ишься:реться|5ешься:оться|5шься:сться~9:цепляться|2ешь:ть,ывезти|2жешь:очь|8ёркиваешь:еркивать|6ёргаешь:дергать|3даешь:опасть|4чешь:ть{оте,а{мот,ят,пт,ак}}|1ешь:ытечь,ырасти|4шешь:ать{пис,ес,ах}|2дешь:ыйти|4дешь:ехать|3дешь:ывести,ыпасть|4ядешь:сесть|3удешь:быть|3ешь:ть{жажда,ырва,соса,ну}|3ьешь:ить{ып,ыш,ыб}|3оешь:ыть|4мешь:ринять|5уешь:вать{о,це,че,ше}|4ерешь:ыбрать|5решь:ытереть|2нешь:ть{ста,тря,аде,оде}|7ёрзнешь:ерзнуть|5щешь:скать{и,ы}|4овешь:ызвать|2вешь:ыжить|5юешь:евать{о,ор}|5елешь:олоть|5шлешь:ыслать|3лешь:ипать|2ёшь:ти,ызть|3ёшь:ть{ну{р,ч,ох,мах,ях,ас,к,в,аг,сог,миг,ьз,п,ет},опада,рва,ра,реве}|3нёшь:жать{по,за}|4ожнёшь:сжать|4омнёшь:мять|3дёшь:ти{ий,вес,юс},асть|2дёшь:йти|4овёшь:звать|6зовёшь:тозвать|4ймёшь:нять{по,а}|4озьмёшь:зять|3мёшь:жать{на,ри}|4ёшь:авать|4ерёшь:брать|6отрёшь:стереть|4обьёшь:бить{з,с,д}|3ьёшь:полить|4ошьёшь:сшить|4овьёшь:звить|1ёшь:расти|4тёшь:честь|5очтёшь:счесть|3тёшь:ести|5шлёшь:слать|5уёшь:жевать|3жёшь:жечь|4ожжёшь:сжечь|2жёшь:ичь,речь|4жёшь:лгать|5юёшь:плевать|3ишь:ть{е{тр,п,шум,ем,абол,вел},а{еж,дрож,рж,ч{ву,ту,ри,л,р},сп,ыш}}|4онишь:гнать|5ёшься:ться{у,рва,дожда,ея}|5нёшься:ться{нача,яс}|6ймёшься:заняться|5мёшься:рижаться|6озьмёшься:зяться|8зовёшься:озваться|6ёшься:аваться|5дёшься:тись{вес,ий},асться|4дёшься:йтись|7рёшься:ереться|6ерёшься:раться{д,б}|8берёшься:зобраться|8бопрёшься:опереться|6обьёшься:збиться|6овьёшься:звиться|6ольёшься:литься{з,с}|4жёшься:ячься|7уёшься:сноваться|4ешься:ться|4нешься:ться{де,оста}|5ешься:ться{ну{и,я,г},дея,ырва}|5оешься:ыться|5еешься:бриться|7уешься:оваться|6ерешься:ыбраться|6жешься:заться|6шешься:исаться|6чешься:таться{я,ме}|5лешься:баться|6ядешься:сесться|6мешься:риняться|4шься:ться{и,да}|5ишься:ться{мча,ржа,лыша,иде,яде,оя}|6онишься:гнаться~4быть:есть|2ть:шь{,и{досто,уп,еп,оп,щем}}|4зать:жешь|5ечь:ляжешь|4тать:охочешь|3ять:сеешь,тоишь|2сть:ешь{по,до,ъ}|5ять:имешь|3ть:подуешь|3оть:решь|3ать:шь{стоне,осё,дё}|4ять:нёшь|4ать:начнёшь|4ть:вёшь|6обрать:берёшь{аз,д,т}|4ереть:рёшь{м,т,п}|4ить:ьёшь|6лить:ольёшь|4еть:оёшь|3ь:чёшь|4овать:уёшь|3еть:ишь{гор,ид,гуд,ляд,т{ле,вис,лес,вер},ис}|7ваться:азовёшься|5ься:чёшься|5тись:сёшься|6иться:ьёшься|5оться:решься|7яться:имешься|4ться:оишься{к,р}|5еться:тришься~4есть:быть|2ёшь:идти|2вёшь:жить|2шь:дать|3нёшь:начать,мять|3ёшь:ать{жд,сос}|3ьёшь:ить{п,л,ш}|3шь:есть|3оёшь:петь{,с}|3имешь:снять|10шь:учить/научить|4жешь:резать|3яжешь:лечь|3ешь:аять{л,т,раст}|5ьёшься:иться{б,доб,л}|2ешь:дуть|5уёшь:овать{осн,с}|5шься:наесться|5имешься:сняться|4ольёшь:слить",
      "third": "1ёт:ь|2вёт:ть{лы,жи{про,до,е}}|3ет:ть{ну{дох{ы,с},ик,ык,ычерк,ип},она,ая,ея,о}|4жет:зать{а,оре,я}|4чет:хотать|2ет:ть{а{раст,ист,лав,лод,позд,гр,ир,гор,реж,выш,рак},е{пот,лад,худ,сп},раня}|3ёт:дождать|2ст:дать{за,ре,о,т,ри,з,вы,с}|6берёт:обрать|4ерёт:собрать|3ьёт:ить{б,нал,зал}|1:бить{ю,со,ру,тре,ла,ра,р}|9:ь/научить|3ит:ть{е{т,д,ор,с},оя}|5рёт:ереть|3имет:бнять|4ётся:тись|2ёт:нести|3тёт:цвести|3ётся:ься|6овётся:зваться|4ется:аться{оров,д{ж,ю,и,а}}|5ьётся:апиться|5ится:реться|5ется:оться~2ет:ть,ывезти|2жет:очь|8ёркивает:еркивать|6ёргает:дергать|3дает:опасть|4чет:ть{оте,а{мот,ят,пт,ак}}|1ет:ытечь,ырасти|4шет:ать{пис,ес,ах}|2дет:ыйти|4дет:ехать|3дет:ывести,ыпасть|4ядет:сесть|3удет:быть|3ет:ть{жажда,ырва,соса,ну}|3ьет:ить{ып,ыш,ыб}|3оет:ыть|4мет:ринять|5ует:вать{о,це,че,ше}|4ерет:ыбрать|5рет:ытереть|2нет:ть{ста,тря,аде,оде}|7ёрзнет:ерзнуть|5щет:скать{и,ы}|4овет:ызвать|2вет:ыжить|5юет:евать{о,ор}|5елет:олоть|5шлет:ыслать|3лет:ипать|2ёт:ти,ызть|3ёт:ть{ну{р,ч,ох,мах,ях,ас,к,в,аг,сог,миг,ьз,п,ет},опада,рва,ра,реве}|3нёт:жать{по,за}|4ожнёт:сжать|4омнёт:мять|3дёт:ти{ий,вес,юс},асть|2дёт:йти|4овёт:звать|6зовёт:тозвать|4ймёт:нять{по,а}|4озьмёт:зять|3мёт:жать{на,ри}|4ёт:авать|4ерёт:брать|6отрёт:стереть|4обьёт:бить{з,с,д}|3ьёт:полить|4ошьёт:сшить|4овьёт:звить|1ёт:расти|4тёт:честь|5очтёт:счесть|3тёт:ести|5шлёт:слать|5уёт:жевать|3жёт:жечь|4ожжёт:сжечь|2жёт:ичь,речь|4жёт:лгать|5юёт:плевать|1:ить,сть|3ит:ть{е{тр,п,шум,ем,абол,вел},а{еж,дрож,рж,ч{ву,ту,ри,л,р},сп,ыш}}|4онит:гнать|5ётся:ться{у,рва,дожда,ея}|5нётся:ться{нача,яс}|6ймётся:заняться|5мётся:рижаться|6озьмётся:зяться|8зовётся:озваться|6ётся:аваться|5дётся:тись{вес,ий},асться|4дётся:йтись|7рётся:ереться|6ерётся:раться{д,б}|8берётся:зобраться|8бопрётся:опереться|6обьётся:збиться|6овьётся:звиться|6ольётся:литься{з,с}|4жётся:ячься|7уётся:сноваться|4ется:ться|4нется:ться{де,оста}|5ется:ться{ну{и,я,г},дея,ырва}|5оется:ыться|5еется:бриться|7уется:оваться|6ерется:ыбраться|6жется:заться|6шется:исаться|6чется:таться{я,ме}|5лется:баться|6ядется:сесться|6мется:риняться|3ся:ться{и,с}|5ится:ться{мча,ржа,лыша,иде,яде,оя}|6онится:гнаться|4стся:даться~4быть:есть|3зать:жет|4ечь:ляжет|3тать:охочет|2ять:сеет,тоит|4ять:имет|2ть:подует,аст|2оть:рет|2ать:стонет,осёт,дёт|3ять:нёт|3ать:начнёт|3ть:вёт|5обрать:берёт{аз,д,т}|3ереть:рёт{м,т,п}|3ить:ьёт|5лить:ольёт|3еть:оёт|2ь:чёт|3овать:уёт|2еть:ит{гор,ид,гуд,ляд,т{ле,вис,лес,вер},ис}|0ь:ит{досто,уп,еп,оп,щем}|6ваться:азовётся|4ься:чётся|4тись:сётся|5иться:ьётся|4оться:рется|6яться:имется|2ься:оится{к,р}|4еться:трится~4есть:быть|2ёт:идти|2вёт:жить|2ст:дать|3нёт:начать,мять|3ёт:ать{жд,сос}|3ьёт:ить{п,л,ш}|3оёт:петь{,с}|3имет:снять|9:учить/научить|4жет:резать|3яжет:лечь|3ет:аять{л,т,раст}|5ьётся:иться{б,доб,л}|2ет:дуть|5уёт:овать{осн,с}|5имется:сняться|4ольёт:слить",
      "firstPlural": "1ём:ь|2вём:ть{лы,жи{про,до,е}}|3ем:ть{ну{дох{ы,с},ик,ык,ычерк,ип},она,ая,ея,о}|4жем:зать{а,оре,я}|2ем:ть{а{раст,ист,лав,лод,позд,гр,ир,гор,реж,выш,рак},е{пот,лад,худ,сп},раня}|3ём:дождать|2дим:дать{за,ре,о,т,ри,з,вы,с}|6берём:обрать|4ерём:собрать|3ьём:ить{б,нал,зал}|2м:бить{ю,со,ру,тре,ла,ра,р}|10м:ть/научить|3им:ть{е{т,д,ор,с},оя}|5рём:ереть|3имем:бнять|3дим:сть|4ёмся:тись|2ём:нести|3тём:цвести|3ёмся:ься|6овёмся:зваться|4емся:аться{оров,д{ж,ю,и,а}}|5ьёмся:апиться|5имся:реться|5емся:оться|5димся:сться~9:цепляться|2ем:ть,ывезти|2жем:очь|8ёркиваем:еркивать|6ёргаем:дергать|3даем:опасть|4шем:ать{пис,ес,ах}|2дем:ыйти|4дем:ехать|3дем:ывести,ыпасть|4ядем:сесть|3удем:быть|3ем:ть{жажда,ырва,соса,ну}|3ьем:ить{ып,ыш,ыб}|3оем:ыть|4мем:ринять|5уем:вать{о,це,че,ше}|4ерем:ыбрать|5рем:ытереть|2нем:ть{ста,тря,аде,оде}|7ёрзнем:ерзнуть|5щем:скать{и,ы}|4овем:ызвать|2вем:ыжить|4чем:ать{ак,т{я,п,мо,хо}}|1ем:ытечь,ырасти|5юем:евать{о,ор}|5елем:олоть|5шлем:ыслать|3лем:ипать|2ём:ти,ызть|3ём:ть{ну{р,ч,ох,мах,ях,ас,к,в,аг,сог,миг,ьз,п,ет},опада,рва,ра,реве}|3нём:жать{по,за}|4ожнём:сжать|4омнём:мять|3дём:ти{ий,вес,юс},асть|2дём:йти|4овём:звать|6зовём:тозвать|4ймём:нять{по,а}|4озьмём:зять|3мём:жать{на,ри}|4ём:авать|4ерём:брать|6отрём:стереть|4обьём:бить{з,с,д}|3ьём:полить|4ошьём:сшить|4овьём:звить|1ём:расти|4тём:честь|5очтём:счесть|3тём:ести|5шлём:слать|5уём:жевать|3жём:жечь|4ожжём:сжечь|2жём:ичь,речь|4жём:лгать|5юём:плевать|2м:ить|3им:ть{е{тр,п,шум,ем,абол,вел},а{еж,дрож,рж,ч{ву,ту,ри,л,р},сп,ыш}}|4оним:гнать|5ёмся:ться{у,рва,дожда,ея}|5нёмся:ться{нача,яс}|6ймёмся:заняться|5мёмся:рижаться|6озьмёмся:зяться|8зовёмся:озваться|6ёмся:аваться|5дёмся:тись{вес,ий},асться|4дёмся:йтись|7рёмся:ереться|6ерёмся:раться{д,б}|8берёмся:зобраться|8бопрёмся:опереться|6обьёмся:збиться|6овьёмся:звиться|6ольёмся:литься{з,с}|4жёмся:ячься|7уёмся:сноваться|4емся:ться|4немся:ться{де,оста}|5емся:ться{ну{и,я,г},дея,ырва}|5оемся:ыться|5еемся:бриться|7уемся:оваться|6еремся:ыбраться|6жемся:заться|6шемся:исаться|6чемся:таться{я,ме}|5лемся:баться|6ядемся:сесться|6мемся:риняться|4мся:иться|5имся:ться{мча,ржа,лыша,иде,яде,оя}|4димся:даться|6онимся:гнаться~4быть:есть|3зать:жем|4ечь:ляжем|2ять:сеем,тоим|4ять:имем|2ть:подуем|2оть:рем|2ать:стонем,осём,дём|3ять:нём|3ать:начнём|3ть:вём,дадим|5обрать:берём{аз,д,т}|3ереть:рём{м,т,п}|3ить:ьём|5лить:ольём|3еть:оём|2ь:чём|3овать:уём|2еть:им{гор,т{хо,ле,вис,лес,вер},ид,гуд,ляд,ис}|3сть:едим{о,ъ}|1ть:им{досто,уп,еп,оп,щем}|6ваться:азовёмся|4ься:чёмся|4тись:сёмся|5иться:ьёмся|4оться:ремся|6яться:имемся|5сться:аедимся|3ться:оимся{к,р}|4еться:тримся~4есть:быть|2ём:идти|2вём:жить|2дим:дать|3нём:начать,мять|3ём:ать{жд,сос}|3ьём:ить{п,л,ш}|3дим:есть|3оём:петь{,с}|3имем:снять|10м:учить/научить|4жем:резать|3яжем:лечь|3ем:аять{л,т,раст}|5ьёмся:иться{б,доб,л}|2ем:дуть|5уём:овать{осн,с}|5имемся:сняться|4ольём:слить",
      "secondPlural": "1ёте:ь|2вёте:ть{лы,жи{про,до,е}}|3ете:ть{ну{дох{ы,с},ик,ык,ычерк,ип},она,ая,ея,о}|4жете:зать{а,оре,я}|2ете:ть{а{раст,ист,лав,лод,позд,гр,ир,гор,реж,выш,рак},е{пот,лад,худ,сп},раня}|3ёте:дождать|2дите:дать{за,ре,о,т,ри,з,вы,с}|6берёте:обрать|4ерёте:собрать|3ьёте:ить{б,нал,зал}|1е:бить{ю,со,ру,тре,ла,ра,р}|9е:ь/научить|3ите:ть{е{т,д,ор,с},оя}|5рёте:ереть|3имете:бнять|3дите:сть|4ётесь:тись|2ёте:нести|3тёте:цвести|3ётесь:ься|6овётесь:зваться|4етесь:аться{оров,д{ж,ю,и,а}}|5ьётесь:апиться|5итесь:реться|5етесь:оться|5дитесь:сться~9:цепляться|5ётесь:ться{у,рва,дожда,ея}|5нётесь:ться{нача,яс}|6ймётесь:заняться|5мётесь:рижаться|6озьмётесь:зяться|8зовётесь:озваться|6ётесь:аваться|5дётесь:тись{вес,ий},асться|4дётесь:йтись|7рётесь:ереться|6ерётесь:раться{д,б}|8берётесь:зобраться|8бопрётесь:опереться|6обьётесь:збиться|6овьётесь:звиться|6ольётесь:литься{з,с}|4жётесь:ячься|7уётесь:сноваться|4етесь:ться|4нетесь:ться{де,оста}|5етесь:ться{ну{и,я,г},дея,ырва}|5оетесь:ыться|5еетесь:бриться|7уетесь:оваться|6еретесь:ыбраться|6жетесь:заться|6шетесь:исаться|6четесь:таться{я,ме}|5летесь:баться|6ядетесь:сесться|6метесь:риняться|3есь:иться|5итесь:ться{мча,ржа,лыша,иде,яде,оя}|4дитесь:даться|6онитесь:гнаться|2ете:ть,ывезти|2жете:очь|8ёркиваете:еркивать|6ёргаете:дергать|3даете:опасть|4шете:ать{пис,ес,ах}|2дете:ыйти|4дете:ехать|3дете:ывести,ыпасть|4ядете:сесть|3удете:быть|3ете:ть{жажда,ырва,соса,ну}|3ьете:ить{ып,ыш,ыб}|3оете:ыть|4мете:ринять|5уете:вать{о,це,че,ше}|4ерете:ыбрать|5рете:ытереть|2нете:ть{ста,тря,аде,оде}|7ёрзнете:ерзнуть|5щете:скать{и,ы}|4овете:ызвать|2вете:ыжить|4чете:ать{ак,т{я,п,мо,хо}}|1ете:ытечь,ырасти|5юете:евать{о,ор}|5елете:олоть|5шлете:ыслать|3лете:ипать|2ёте:ти,ызть|3ёте:ть{ну{р,ч,ох,мах,ях,ас,к,в,аг,сог,миг,ьз,п,ет},опада,рва,ра,реве}|3нёте:жать{по,за}|4ожнёте:сжать|4омнёте:мять|3дёте:ти{ий,вес,юс},асть|2дёте:йти|4овёте:звать|6зовёте:тозвать|4ймёте:нять{по,а}|4озьмёте:зять|3мёте:жать{на,ри}|4ёте:авать|4ерёте:брать|6отрёте:стереть|4обьёте:бить{з,с,д}|3ьёте:полить|4ошьёте:сшить|4овьёте:звить|1ёте:расти|4тёте:честь|5очтёте:счесть|3тёте:ести|5шлёте:слать|5уёте:жевать|3жёте:жечь|4ожжёте:сжечь|2жёте:ичь,речь|4жёте:лгать|5юёте:плевать|1е:ить|3ите:ть{е{тр,п,шум,ем,абол,вел},а{еж,дрож,рж,ч{ву,ту,ри,л,р},сп,ыш}}|4оните:гнать~4быть:есть|7ваться:азовётесь|5ься:чётесь|5тись:сётесь|6иться:ьётесь|5оться:ретесь|7яться:иметесь|6сться:аедитесь|3ься:оитесь{к,р}|5еться:тритесь|4зать:жете|5ечь:ляжете|3ять:сеете,тоите|5ять:имете|3ть:подуете|3оть:рете|3ать:те{стоне,осё,дё}|4ять:нёте|4ать:начнёте|4ть:вёте,дадите|6обрать:берёте{аз,д,т}|4ереть:рёте{м,т,п}|4ить:ьёте|6лить:ольёте|4еть:оёте|3ь:чёте|4овать:уёте|3еть:ите{гор,т{хо,ле,вис,лес,вер},ид,гуд,ляд,ис}|4сть:едите{о,ъ}|1ь:ите{досто,уп,еп,оп,щем}~4есть:быть|2ёте:идти|2вёте:жить|2дите:дать|3нёте:начать,мять|3ёте:ать{жд,сос}|3ьёте:ить{п,л,ш}|3дите:есть|3оёте:петь{,с}|3имете:снять|9е:учить/научить|4жете:резать|3яжете:лечь|3ете:аять{л,т,раст}|5ьётесь:иться{б,доб,л}|2ете:дуть|5уёте:овать{осн,с}|5иметесь:сняться|4ольёте:слить",
      "thirdPlural": "2вут:ть{лы,жи{про,до,е,ы}}|4жут:зать{а,оре,я}|3ут:ать{он,дожд,жажд}|4ют:авать|2ют:ть{а{лав,гр,ир,гор,рак},е{пот,лад,худ,сп},раня}|2дут:дать{за,ре,о,т,ри,з,вы,с}|6берут:обрать|4ерут:собрать|3ьют:ить{б,ып,нал,зал,ыш}|3ят:ть{би{ю,со,ру,тре,ла,ра,р},е{т,ем,д,ор,п,с}}|11ат:ить/научить|5рут:ереть|3имут:бнять|1:оять|3ют:ть{ая,ея,о}|3дят:сть|2ут:зть,нести|2гут:речь|3тут:цвести|3ся:ться{у,оя}|6овутся:зваться|4ются:ороваться|6ются:аваться|5ьются:апиться|5ятся:реться|5ются:оться|5дятся:сться~2ут:ти|2гут:чь|4гут:бежать|3гут:жечь|4ожгут:сжечь|3ут:ть{а{лг,сос,опад,рв,р},реве}|1:ть{ну,а{леж,дрож,рж,ч{ву,ту,ри,л,р},лыш,дыш}}|2нут:ть{ста,тря,аде,оде}|3нут:жать{по,за}|4ожнут:сжать|7ёрзнут:ерзнуть|4омнут:мять|3дут:ти{ий,вес,юс},асть|2дут:йти|4дут:ехать|4ядут:сесть|3удут:быть|4овут:звать|6зовут:тозвать|4ймут:нять{по,а}|4мут:ринять|4озьмут:зять|3мут:жать{на,ри}|4шут:ать{пис,ес,ах}|4ерут:брать|6отрут:стереть|5щут:скать{и,ы}|1ут:расти|4тут:честь|5очтут:счесть|3тут:ести|4чут:ать{ак,т{я,п,мо,хо}}|2кут:ечь|3ят:ть{и,е{тр,шум,абол,вел},спа}|4онят:гнать|2ют:ть{,а{раст,ист,лод,позд}}|3дают:опасть|8ёркивают:еркивать|6ёргают:дергать|4обьют:бить{з,с,д}|3ьют:полить|4ошьют:сшить|4овьют:звить|3оют:ыть|5уют:вать{о,е{ц,ч,ж,ш}}|5шлют:слать|5елют:олоть|3лют:ипать|5юют:евать{о,пл,ор}|3ат:ить{ж,ч,ш,щ}|4утся:тись|5нутся:ться{нача,яс}|4нутся:ться{де,оста}|6ймутся:заняться|5мутся:рижаться|6мутся:риняться|6озьмутся:зяться|8зовутся:озваться|5утся:аться{рв,дожд}|5дутся:тись{вес,ий},асться|4дутся:даться,йтись|6ядутся:сесться|6жутся:заться|7рутся:ереться|6ерутся:раться{д,б}|8берутся:зобраться|8бопрутся:опереться|4кутся:чься|6шутся:исаться|6чутся:таться{я,ме}|4гутся:ячься|4ются:ться{,да{ж,ю,и,а}}|5оются:ыться|5ются:еяться|5еются:бриться|7уются:оваться|6обьются:збиться|6овьются:звиться|6ольются:литься{з,с}|5лются:баться|5ятся:ться{и,иде,яде}|6онятся:гнаться|5атся:иться{ч,ж,ш,щ}|3ся:аться{мч,рж,лыш}~4быть:есть|4ечь:ягут|3ать:начнут|2ать:стонут,дут|3ять:мнут|3зать:жут|3ть:дадут,вут|4ять:имут|5обрать:берут{аз,д,т}|3ереть:рут{м,т,п}|2ть:лезут,ызут,подуют|2еть:ят{гор,т{хо,ле,вис,лес,вер},ид,гуд,ляд,ис,рп,ип,ап,рем}|3сть:едят{о,ъ}|0ь:тоят|2ить:достоят|2вать:ают{зн,ст,д{за,ре,о,т,ри,з,вы,с}}|2ять:сеют|3ить:ьют|5лить:ольют|3еть:поют|2оть:рют|2ься:тся{ну,тяну,боя,тоя}|6яться:имутся|6ваться:азовутся|4ваться:аются{ост,д}|4ться:еются{им,н}|4оться:рются|5иться:ьются|5сться:аедятся|4еться:трятся~4есть:быть|2ют:знать,дуть|2ут:идти|2вут:жить|4ют:давать|2дут:дать|3нут:начать,мять|3ут:ждать|3ьют:ить{п,л,ш}|3дят:есть|3оют:петь{,с}|3имут:снять|11ат:учить/научить|4жут:резать|3ягут:лечь|3ют:аять{л,т,раст}|5ьются:иться{б,доб,л}|5имутся:сняться|4ольют:слить"
    },
    "pastTense": {
      "masc": "3:ытереть|3л:сть|2:зть|4шёл:идти|5лся:сться~2:ти,ывезти|2л:ть|3шел:ыйти|3л:сти{ыве,ю}|4ёл:ести,честь{ро,с}|3шёл:йти|2г:чь|3ёг:ечь|4:нуть{тиг,ык,ник,ез,б}|4ёс:нести|4ос:расти|4ся:тись|4лся:ться|6ёлся:естись|5шёлся:йтись|4гся:чься|5ёгся:ечься|6ёсся:нестись|5ся:ереться|3:ереть|5ёр:тереть|3ёк:ечь{т,с}|2к:ытечь|4ёз:езти~1сть:л{а{кл,кр,п{вы,по,в,а}},е{с,о,ъ,ч}}|1ть:висел|3сться:лся{опа,кля,се,ае}|0ть:лез,ыз~4шёл:идти|3л:сть{е,па,упа}",
      "fem": "3ла:ытереть,сть,ести|4лась:тись|2ла:ти,нести|4шла:идти|5лась:сться~2ла:ть|2гла:чь|3гла:жечь|4ожгла:сжечь|4ла:ть{ну{тиг,ык,ник,ез,б},рочес}|4осла:расти|3шла:йти|3ла:ереть,юсти|5ёрла:тереть|5очла:счесть|2кла:ечь{т,с}|4лась:ться|5лась:вестись,ереться|4глась:чься|5шлась:йтись~2ти:ла{с,вез,лз}|2сть:ла{а{кл,кр,п{вы,по,в,а}},е{с,о,ъ,ч}}|2сти:ела{дм,бр,в,пл}|2ть:ла{висе,шеве,жаве,лез}|4сться:лась{опа,кля,се,ае}|4тись:слась~4шла:идти|3ла:сть{е,па,упа}|2ла:реветь",
      "neut": "3ло:ытереть,сть,ести|4лось:тись|2ло:ти,нести|4шло:идти|5лось:сться~2ло:ть|2гло:чь|3гло:жечь|4ожгло:сжечь|4ло:ть{ну{тиг,ык,ник,ез,б},рочес}|4осло:расти|3шло:йти|3ло:ереть,юсти|5ёрло:тереть|5очло:счесть|2кло:ечь{т,с}|4лось:ться|5лось:вестись,ереться|4глось:чься|5шлось:йтись~2ти:ло{с,вез,лз}|2сть:ло{а{кл,кр,п{вы,по,в,а}},е{с,о,ъ,ч}}|2сти:ело{дм,бр,в,пл}|2ть:ло{висе,шеве,жаве,лез}|4сться:лось{опа,кля,се,ае}|4тись:слось~4шло:идти|3ло:сть{е,па,упа}|2ло:реветь",
      "plural": "3ли:ытереть,сть,ести|4лись:тись|2ли:ти,нести|4шли:идти|5лись:сться~2ли:ть|2гли:чь|3гли:жечь|4ожгли:сжечь|4ли:ть{ну{тиг,ык,ник,ез,б},рочес}|4осли:расти|3шли:йти|3ли:ереть,юсти|5ёрли:тереть|5очли:счесть|2кли:ечь{т,с}|4лись:ться|5лись:вестись,ереться|4глись:чься|5шлись:йтись~2ти:ли{с,вез,лз}|2сть:ли{а{кл,кр,п{вы,по,в,а}},е{с,о,ъ,ч}}|2сти:ели{дм,бр,в,пл}|2ть:ли{висе,шеве,жаве,лез}|4сться:лись{опа,кля,се,ае}|4тись:слись~4шли:идти|3ли:сть{е,па,упа}|2ли:реветь"
    },
    "imperative": {
      "second": "3и:ть{а{он,дожд,жажд,р},е{тр,ор,уд,т},о}|2й:ть{а{раст,ист,гр,ир,гор},ладе,худе,поте,раня}|4ши:есать|6бери:обрать|4ери:собрать|4зжай:ехать|3ь:ть{и{р{по,ско,уда,жа,ве,жу,и},ож,аруж,соб,лаб,раб,кон,оран,инуд,лад,т{тве,тре,ме,тра},с{бро,ра,е,ы},ч{а,е,ели,ни},ав,тов,слов,ом,жал,вол,сил},се}|2:ить{лож,орож,б{ю,ру,тре,р},олеч,дав}|2ви:жить{ро,до,е,ы}|3й:ть{ои,еи,оя,ая,ея}|10:ть/научить|3ей:ить{ып,сш,ыш}|5ри:ереть|3ими:бнять|5ели:олоть|2ги:речь|4ись:тись|2и:ти|3ти:ести|5йся:ться{оя,ои}|13-:сопроводиться|4сь:иться{вет,юб}|5ейся:литься{з,с}|6овись:зваться|4йся:ороваться|4нься:остаться|6жись:заться|5ись:ться{ре,у,о}|7рись:ереться|5дись:асться~3удь:быть|4ядь:сесть|3ь:ть{иде,теши,руши,изи,лыша,ыпа,ну{и,ы,ро,ю,у}}|4сь:иться|6ймись:заняться|5мись:рижаться|6мись:риняться|6озьмись:зяться|6чись:метаться|5ись:ться{а{мч,рв,дожд,рж},яде}|8зовись:озваться|5нись:ться{нача,яс}|6онись:гнаться|5дись:вестись|4дись:йтись|6шись:исаться|5лись:баться|6ерись:раться{д,б}|8берись:зобраться|8бопрись:опереться|4кись:чься|4гись:ячься|3шь:сть|4чь:ать{лак,ят}|2нь:ть{ста,де,тря}|4жь:зать{ре,ма}|2ь:зть|2:ить|2ги:чь|4ги:бежать|3ги:жечь|4ожги:сжечь|3и:ть{а{лг,леж,дрож,рж,опад,рв,дыш,сос,ч{ву,ту,ри,л,р},сп},е{сид,яд,рев,шум,ем,п,абол,вел},ну}|4жи:зать{а,ыре,я}|6отри:стереть|4ери:брать|2ди:йти|3ди:асть,сти{ве,ю}|4ови:звать|6зови:тозвать|2ви:лыть|4йми:нять{по,а}|4ми:ринять|4озьми:зять|3ми:жать{на,ри}|4ши:ать{пис,ах}|4омни:мять|4они:гнать|3ни:жать{по,за}|4ожни:сжать|7ёрзни:ерзнуть|2и:нести,ызть|4чи:ать{мот,хот,пт,как}|3ти:цвести|0:расти|4ти:честь|5очти:счесть|5щи:скать{и,ы}|5шли:слать|3ли:ипать|2ки:ечь|2й:ть,спеть|8ёркивай:еркивать|3дай:опасть|6ёргай:дергать|3ей:ить{пол,нал,зал,б,зв}|3ой:ыть|5уй:вать{о,е{ц,ч,ж,ш}}|5юй:евать{о,пл,ор}|5ься:ться{и{ав,тов,тив,ет,от,из,ич,точ,ом,ил,вол,цел,ыс,брос,рас,сор,ур,уш,аруж},ину,иде,ыпа}|4нься:деться|6нься:аваться|6чься:ятаться|6ядься:сесться|5шься:сться|4йся:ться|5ойся:ыться|5йся:еяться|5ейся:иться{бр,б,зв,ап}|7уйся:оваться|9-:переехать|8:появляться~1ить:ь,й{кле,о{дост,тр,к,св,дв}}|5яться:имись|5ваться:азовись|1еть:авись,и{гор,мотр,гуд,ис,т{хо,ле,лес,ис,вер}}|3уться:нись{ч,р,тя,г,к}|4сться:падись|4заться:жись{а,я}|2ться:ись{лиш,лас,ос}|3оться:борись|4ереться:прись|3еться:трись|3тись:сись|0ть:и{раж,град,сад,ряд,щем,н{оч,пом,о,яс,л,и,е,ра,ав,аз,д},уп,еп,оп}|1оть:ори{б,п}|2ереть:ри{т,м,п}|4обрать:бери{аз,д,т}|1ать:и{вр,жр,ср,жд,стон}|1ти:и{ид,пас,яс,ез,лз}|2ть:живи|3ять:ими|2сать:чеши|2ать:начни|2ять:мни|1уть:тони|2сти:ети{бр,пл,м}|3олоть:мели|4хать:езжай{у,о}|2ить:пей,шей|1ять:сей,той|2еть:пой|1ть:подуй|4ться:достанься|3иться:ойся{тр,к}|3яться:бойся|3ться:ейся{им,н}|4иться:лейся|2ечь:яг~2ви:жить|3ни:начать,мять|3и:ть{жда,ора,висе}|3ей:ить{п,л,сл,ш}|3ой:петь{,с}|3ими:снять|10:учить/научить|2:ить{стро,леч,моч}|3яг:лечь|3й:аять{л,т,раст}|3ь:ранить|2й:дуть|5ейся:литься|5имись:сняться",
      "secondPlural": "3ите:ть{а{он,дожд,жажд,р},е{тр,ор,уд,т},о}|2йте:ть{а{раст,ист,гр,ир,гор},ладе,худе,поте,раня}|4шите:есать|6берите:обрать|4ерите:собрать|4зжайте:ехать|3ьте:ить{р{по,ско,уда,жа,ве,жу,и},ож,аруж,соб,лаб,раб,кон,оран,инуд,лад,т{тве,тре,ме,тра},ч{а,е,ели,ни},ав,тов,слов,ом,жал,вол,сил}|1е:ить{лож,орож,б{ю,ру,тре,р},олеч,дав}|2вите:жить{ро,до,е,ы}|3йте:ть{ои,еи,оя,ая,ея}|9е:ь/научить|3ейте:ить{ып,сш,ыш}|5рите:ереть|3имите:бнять|5елите:олоть|2гите:речь|4итесь:тись|2ите:ти|3тите:ести|5йтесь:ться{оя,ои}|13-:сопроводиться|3есь:иться{вет,юб}|5ейтесь:литься{з,с}|6овитесь:зваться|4йтесь:ороваться|4ньтесь:остаться|6житесь:заться|5итесь:ться{ре,у,о}|7ритесь:ереться|5дитесь:асться~3удьте:быть|4ядьте:сесть|3ьте:ть{иде,се,и{теш,руш,с{бро,е,ы,ра},из},лыша,ыпа,ну{и,ы,ро,ю,у}}|3шьте:сть|4чьте:ать{лак,ят}|2ньте:ть{ста,де,тря}|4жьте:зать{ре,ма}|2ьте:зть|1е:ить|2гите:чь|4гите:бежать|3гите:жечь|4ожгите:сжечь|3ите:ть{а{лг,леж,дрож,рж,опад,рв,дыш,сос,ч{ву,ту,ри,л,р},сп},е{сид,яд,рев,шум,ем,п,абол,вел},ну}|4жите:зать{а,я}|6отрите:стереть|4ерите:брать|2дите:йти|3дите:асть,сти{ве,ю}|4овите:звать|6зовите:тозвать|2вите:лыть|4ймите:нять{по,а}|4мите:ринять|4озьмите:зять|3мите:жать{на,ри}|4шите:ать{пис,ах}|4омните:мять|4оните:гнать|3ните:жать{по,за}|4ожните:сжать|7ёрзните:ерзнуть|2ите:нести,ызть|4чите:ать{мот,хот,пт,как}|3тите:цвести|0те:расти|4тите:честь|5очтите:счесть|5щите:скать{и,ы}|5шлите:слать|3лите:ипать|2ките:ечь|2йте:ть,спеть|8ёркивайте:еркивать|3дайте:опасть|6ёргайте:дергать|3ейте:ить{пол,нал,зал,б,зв}|3ойте:ыть|5уйте:вать{о,е{ц,ч,ж,ш}}|5юйте:евать{о,пл,ор}|3есь:иться|6ймитесь:заняться|5митесь:рижаться|6митесь:риняться|6озьмитесь:зяться|6читесь:метаться|5итесь:ться{а{мч,рв,дожд,рж},яде}|8зовитесь:озваться|5нитесь:ться{нача,яс}|6онитесь:гнаться|5дитесь:вестись|4дитесь:йтись|6шитесь:исаться|5литесь:баться|6еритесь:раться{д,б}|8беритесь:зобраться|8бопритесь:опереться|4китесь:чься|4гитесь:ячься|5ьтесь:ться{и{ав,тов,тив,ет,от,из,ич,точ,ом,ил,вол,цел,ыс,брос,рас,сор,ур,уш,аруж},ину,иде,ыпа}|4ньтесь:деться|6ньтесь:аваться|6чьтесь:ятаться|6ядьтесь:сесться|5шьтесь:сться|4йтесь:ться|5ойтесь:ыться|5йтесь:еяться|5ейтесь:иться{бр,б,зв,ап}|7уйтесь:оваться|9-:переехать|8:появляться~3ить:те{ь,й{кле,о{дост,тр,к,св,дв}}}|1ь:ите{раж,град,сад,ряд,щем,н{оч,пом,о,яс,л,и,е,ра,ав,аз,д},уп,еп,оп}|3еть:ите{гор,мотр,гуд,ис,т{хо,ле,лес,ис,вер}}|3оть:орите{б,п}|4ереть:рите{т,м,п}|6обрать:берите{аз,д,т}|3ать:ите{вр,жр,ср,жд,стон}|3ти:ите{ид,пас,яс,ез,лз}|4ть:живите|5ять:имите|4сать:чешите|4ать:начните|4ять:мните|3уть:тоните|4сти:етите{бр,пл,м}|5олоть:мелите|6хать:езжайте{у,о}|4ить:ейте{п,ш}|3ять:йте{се,то}|4еть:пойте|3ть:подуйте|4ечь:ягте|7яться:имитесь|7ваться:азовитесь|5уться:нитесь{ч,р,тя,г,к}|6сться:падитесь|6заться:житесь{а,я}|3ься:итесь{лиш,лас,ос}|5оться:боритесь|6ереться:притесь|5еться:тритесь|5тись:ситесь|6ться:достаньтесь|5иться:ойтесь{тр,к}|5яться:бойтесь|5ться:ейтесь{им,н}|6иться:лейтесь~2вите:жить|3ните:начать,мять|3ите:ть{жда,ора,висе}|3ейте:ить{п,л,сл,ш}|3ойте:петь{,с}|3имите:снять|9е:учить/научить|1е:ить{стро,леч,моч}|3ягте:лечь|3йте:аять{л,т,раст}|3ьте:ранить|2йте:дуть|5ейтесь:литься|5имитесь:сняться"
    },
    "gerund": {
      "gerund": "2я:ть{,има,лота,рака,поте},ти|2:ть{дыша,оя,ая,ея}|6:опадать|3а:чить|3я:ть{те,се,о}|3в:пасть|3ёгши:ечь{ж,р}|8ся:прийтись|3дя:ийти,ести|9я:справиться|5ясь:ться{и{тив,д,ур,ер,ост,хот,оз,жен,хран,ем,тнос,л{д,де,мо,ы}},о}|8я:ться{сходи,тава}|13-:сопроводиться|4вшись:ться{ди{иго,ер,е},а{зн,ач,сконч,мч,риж,рж,ыруг,подвиг,ыкуп,лыш,уш,р,д,дожд,т{осва,счи,апи,опы,я,охвас},ис,з,сдел,б},ня{оме,бме,остес,срав}}|5ась:кружиться|4сь:одержаться|4ясь:ться{а{ир,жд,юд,ид},я{л,н,ор,ир}}|10ся:попадаться|5вшись:сться|9-:напрячься~3удучи:быть|2гши:чь|4осши:асти|4ёсши:нести|2кши:ытечь|3ёкши:ечь|2ши:езть,оползти|4ши:пнуть|3в:сть|2в:ть{а{аз,дел,пис,рочит,бот,апечат,ех,м,лыш,сп,дожд,рад,овед,ов{арис,аинтерес,оцел,знасил,ожал,ир{аплан,афикс,оанализ,сформ},астрах,опублик,лн},лч,туч,окач,аплак,апуг,строг},и{уп,озвон,вин,аплат,ват,спорт,остав,уч,нч,скалеч,олюб,д{збу,ъез,са,го,охо},облагодар,оговор,овес,ынос,онос,рел,мож},е{ахот,увид,яд,тр,ор,абол,пожал,ел,сум,аберемен},я{з,отер,омен,овли,посто},ну}|3дав:опасть|3я:ть{и,е{ид,гуд,рев,шум,ем,вел,п},соса}|4еря:брать|8ёркивая:еркивать|6ёргая:дергать|3тя:цвести|4тя:честь|2дя:йти|3дя:асть|4овя:звать|2вя:лыть|3оя:ыть|4оня:гнать|5уя:вать{о,е{ц,ч,ж,ш}}|5еля:олоть|5юя:евать{о,пл,ор}|11а:ить/научить|3а:ить{ж,ш}|2:ать{рж,леж,дрож,вуч,рич,рч}|4жа:язать|4ча:ать{ак,ят,от,пт}|5ща:искать|4ясь:ться{а,ме,не},ястись|4дясь:йтись|6онясь:гнаться|7уясь:оваться|4сь:бояться|6чась:метаться|4шись:тись|4вшись:ться{,ва{з,о{р{о,ри,оконсульти,сформи},зволн,сн,отреб,алюб,ожал,оцел,аинтерес,осовет,оспольз,аз,брад},р}}|5ёкшись:ечься|8:появляться~4ечь:ёгши|1еть:я{гор,тр,т{о,ле,вис,лес,вер},яд,ис}|1оть:боря|1ть:я{а,е,я,лез,ыз}|1ить:я{кле,глад,ко,дел,оп},нача,еча|0ть:сея,тоя,туча,лча,ыша|2йти:ридя|2сти:ведя|2ть:ивя|1ти:яся,езя,лзя|3ежать:ёжа|3иться:сь{я,теря,а}|3еться:ясь{ид,тр}|4иться:еясь|2ться:сь{смея,дея,мча,ржа,ыша}|3ться:яясь|4сться:янясь|3оться:борясь|5раться:ерясь|4аться:блясь|4таться:ячась|4заться:ажась|7ться:вавшись|5сться:лявшись|1родить:-~2я:идти,ть{а{дел,дум,лом,работ},лез,ду}|2вя:жить|3я:ть{смотре,горе,гляде,ора,поро}|5ёжа:лежать|5ясь:ться{и{нрав,станов,готов,тороп,знаком,беспоко,стро,т{све,пор,забо,кру,ка},сн,р{ссо,гово,тво,ми},крас,нос,шевел,цел},виде,смотре}|5ась:иться{уч,леч,моч,лож,руш}|6-:родить|4ясь:ться{здорова,стара,слуша,теря}|5еясь:бриться|8я:оставаться|2:ть{слыша,молча,стуча,лая,тая}|4сь:ться{смея,надея,держа,слыша,мча}|3ёгши:лечь|6ерясь:раться{д,б}|3а:мочить|6жась:казаться|8ся:прийтись|6чась:прятаться|5лясь:колебаться|5нясь:клясться|4вшись:сняться|4вавшись:деться|5оясь:рыться"
    },
    "participle": {
      "activePresent": "2гущий:речь|11ащий:ить/научить|4ющий:авать|2ющий:ть{а{лав,гр,ир,гор,рак},поте,аде,худе}|3ущий:жаждать|4жущий:зать{я,а}|3ящий:еть{т,д,ор,ел,с}|5рущий:ереть|2щий:оять|3ющий:ть{ая,ея,о}|3дящий:сть|2вущий:лыть|2ущий:зть|4ющийся:ороваться|6ющийся:аваться|5ьющийся:иться{ап,б}|4щийся:ться{оя,у}|5ящийся:еться{д,р}|5ющийся:оться|5дящийся:сться~2ущий:ти|2гущий:чь|4гущий:бежать|3ущий:ть{а{лг,рв,р,он,сос},реве}|3гущий:жечь|4дущий:ехать|3дущий:асть|4овущий:звать|4шущий:сать{пи,е}|4ерущий:брать|5щущий:искать|1ущий:асти|3тущий:ести|4чущий:ать{ак,т{я,п,мо,хо}}|2щий:ть{ну,а{леж,рж,дрож,ч{ву,ту,ри,л,р},лыш,дыш}}|7ёрзнущий:ерзнуть|3нущий:мять|2кущий:ечь|3ящий:ть{и,е{тр,п,шум,ем},спа}|4онящий:гнать|2ющий:ть|8ёркивающий:еркивать|6ёргающий:дергать|3оющий:ыть|5ующий:вать{о,е{ц,ч,ж,ш}}|5юющий:евать{о,пл,ор}|5елющий:олоть|3ащий:ить{ж,ч,ш}|4ющийся:ться|5ющийся:еяться|5еющийся:бриться|7ующийся:оваться|5лющийся:баться|5оющийся:ыться|5ящийся:иться|6онящийся:гнаться|5ащийся:иться{ч,ж,ш}|4щийся:аться{мч,рж,лыш}|4ущийся:тись|6ерущийся:раться{д,б}|6жущийся:заться|5нущийся:ясться|6чущийся:таться{я,ме}|5ущийся:рваться|6шущийся:исаться~4ать:ждущий|5сти:ведущий|5ть:вущий|5ереть:рущий{т,п}|5зать:жущий|4ть:щий{лезу,ызу,аю{раст,ист,д{па,ла,е,ло,ки,жи,ж,ры,ю}}}|4еть:ящий{гор,т{о,ле,вис,лес,вер},ид,гуд,яд,ис,вел}|3ть:тоящий|4ить:опящий|4вать:ающий{зн,ст,д,ред}|4ять:сеющий|5ить:ьющий|5еть:поющий|4оть:рющий|4ить/научить:учащий|6ваться:здающийся|6ться:еющийся{им,н}|6оться:рющийся|7иться:ьющийся|6еться:ящийся{ид,тр}|7сться:едящийся|5ться:щийся{боя,тяну}~2ющий:знать,дуть|2вущий:жить|3ущий:ждать|3ьющий:ить{п,б,л,ш}|3дящий:есть|3оющий:петь|3дущий:вести|4жущий:резать|3ющий:аять{л,т}|5ьющийся:литься|2щий:тонуть",
      "activePast": "4вший:опадать|10вший:ть/научить|3вший:сть|3ёгший:ечь{ж,р}|4шедший:идти|5шийся:таваться|4вавшийся:деться|4вшийся:деться{о,з,и,я}|5вшийся:сться~2ший:ти,ывезти,зть|2вший:ть|8ёркивавший:еркивать|3давший:опасть|6ёргавший:дергать|7ёрзнувший:ерзнуть|2гший:чь|3шедший:йти|5шедший:сойтись|3дший:сти{ве,ю}|4ёдший:вести{д,аз}|4ёсший:нести|4осший:расти|3ший:ереть{м,ап,ыт}|5ёрший:ереть|3ёкший:ечь|2кший:ытечь|4ёзший:езти|3тший:ести|4ётший:ести{цв,л}|4ший:ипнуть|4шийся:тись|4вшийся:ться|6ёдшийся:естись|5шедшийся:йтись|5дшийся:свестись|5ёкшийся:ечься|6ёсшийся:нестись|4гшийся:чься|7ёршийся:ереться|6-:учесть~4сть:вший{а{кл,кр,вып,вп,ап},се,ое,ъе}|4дать:попавший|4ть:висевший|5ечь:ёгший|3ти:лзший|6сться:вшийся{опа,кля,се,ае}~4шедший:идти|3вший:сть{е,па,упа}|10вший:учить/научить|5шийся:оставаться|3ёгший:лечь",
      "passivePast": "1ённый:ь|2жённый:речь|2вший:ть{а{ез,рз,т{хо,ч,е,ас},вис,д{ж,па,ла,ое,бе,ло,ры},ч,в{,о{в,ир{ур,н{а,ункцио,мо,ми},кул,ел,ониз,зерт,од,г,ш},т,тенд,ед,ид,ск}},мир,гор,ср,ж{е,з,ра,ро},туп,дыш,х,г,ин,он,к,ц,б},воня,изменя,и{вон,ход,брод,зд,шут,мст,орос,реч,воп,орож,друж,цар,жур,ым,ул,греш,пеш,роз,ьз},тону,бну}|2нный:ать{рез,кач,в{з,о{,ств{ивет,ь,м,н},рест,лед},р},саж,рж,пах,юх,рог,уг,ск}|8-:ать{пожел,жалов}|7-:ть{ста{за,до},качну,метну}|3ённый:ть{ржда,лони,ажи}|1ый:ть{ача,жа,е{над,зад,од,гр},ня,зя,мя,и{б,ып,зв,рож,дож,еж,нал,зал,пол,сш,ыш},ры,бы,мы,у,о}|10-:насиловать,разглядеть|9-:ть{пробежа,перееха,погляде,пролете}|4ченный:ртеть,тратить|3енный:ить{н{м,ыяс,л,почи,о,ора},елич,пор,скор,ыдел}|5щенный:ыместить|11енный:ить/научить|3ленный:ановить|4женный:зить|2ённый:нести|5вшийся:ясться~2гший:очь|4шедший:идти|2вший:ть|7ёрзнувший:ерзнуть|4осший:расти|3ёкший:течь|2ший:зть,лзти|4ётший:цвести|2нный:ть{а,виде,тре,я{ер,ен,окашл,ел,ал,е}}|5ёсанный:есать|6ёптанный:ептать|5ётанный:метать|5ованный:цевать|5ёванный:евать{ж,аво}|6ёрганный:ергать|3енный:ить{,ыключ}|3денный:сть,ывести|2денный:йти{ро,а}|4жденный:ынудить|3ленный:ить{б{ю,ла,ра,ру,со},п,в,м}|4ченный:тить{,ру}|4шенный:сить|4женный:ть{и{д{о{х{ы,у,а,т},ыв,гор},ла,ту,ле,я},ыраз},биде}|2женный:ичь|5щенный:стить|2енный:ывезти,ызть|2ённый:ти|3ённый:ть{и{н,ч{ю,ли,вру,г},р{о,да,че,щ,д},ш{ре,р,ну,и},бщ,л{де,д,мо,да,схва,з},круж},доле}|4чённый:ятить|2дённый:йти|3дённый:сти{ве,ю}|4ждённый:дить|4шённый:ласить|5щённый:стить{е,о}|4щённый:тить{пре,се,осве,погло,ра,и,у,вя}|4тённый:честь|3тённый:ести|3лённый:ить{треб,рб,в{и,т,но,е},еп,ум,ем}|3жённый:жечь|4ожжённый:сжечь|4жённый:ить{уз,аз,еред}|7ёркнутый:дчеркнуть|5ёртый:ереть|3тый:ереть{п,ыт}|4вшийся:ться|4шийся:стись|3ыйся:ться{заня,риня,апи}|5ленныйся:виться{я,пра}|5денныйся:сться|6шенныйся:роситься|4нныйся:аться{з,ум,зв,абр}|4дённыйся:тись|9-ся:достаться|7-:поедать~2ь:ый|5ить:нный{е{ч{ле,пе,у,ору,на,и,н,мо},ш{ь,у,те,ч},евож,тащ},дражё}|6теть:верченный|6сить:кушенный|6зить:женный{во,рмо,ни}|6дить:женный{ово,бу,р}|5ь:чённый|5ать:утверждённый|6чь:бережённый|6сться:клявшийся~2вший:ть{а{дум,работ,сп,меш,следов,ликов},и{сто,вер,спор,свет,след,вред,прав}}|2нный:ждать|1ый:ть{и{п,л,сл,ш},пе}|11енный:учить/научить|4женный:дить{прово,бу,твер}|4вшийся:казаться|3енный:ранить"
    },
    "perfective": "true¦0:EW;1:EO;2:E1;3:EM;4:EK;5:DY;6:CY;7:E3;8:DW;9:CM;A:D1;B:EV;C:EI;D:EF;E:EE;F:DS;G:ED;H:CP;I:AJ;аF8брF3вC2дBQзABи9Pк9Mл9Kм9Iн8Lо6Uп2Fр1Jс0Gт0FуJх6OчеAGшаг3я52;б0Cв0Aг08д03еHжаDOз02й4кZлXмVнUпQро6сLтJхуд89цеBNч9E;в5VеEAоJра5;ну0ч6;в8Pес2и7Qко8лыCCом93пMтJ;аKрJуD6;а6ои1;ви2ноA3ть;е0окои1;аLеD8ла5оKрJус5;азд6ос5;мя3тA1;коBс0;ес4ичто7;еJно7оDBы2;нь96ре0;еEAоJучDW;ви0жи0;аBDоро5рJ;асJеCSы0;и0ть;ако6на0;аMв87еLи9OоJ;влетво8стоJче8;ве8и0;ли0рAP;ли1ри0ться;аA7оJ;во8ди0с5;еJи7OлечьEEо71;з4лиDSри0с4;еJи0ра0;ди1жа0;о63ро3;б0Kв0GгоA5д0Eес0жACк08л07м04н03оUпRраPтNуMфоKхваDAч8Hши0ъеJыгC1эконо8G;з9с0ха0;ку9HрмJтографиI;и9Oу1T;ме0ну0;аJеA0олк7NуC8;нцеBть;боDвнJ;и0я2;ас81е0иB7ла7IрJусD1;оJя0I;воциIси0;бQвPгNе0QжBPзMй7Yк2Nл7NобLпрово9сJтв55х0Lчи6;редото0VтJ;аCоя2;раCNщи1;да1на0ре0;ласJну0реCX;и2оB;ер84мBCоку2VпC3ра0;люс4ра1;ес4и4Sя1;еKиAFоJу5ягA;ло0н5Iчь;ни1ша0;и1о3Mу0J;аNлMоJры1;льз3мKнJпиI;цен17ча2;би6Yпроме5C;еи0о7F;за1ти0;а1еJох3;ла1рCY;аLеKист3ороJяAM;ва0ти0;рк3с7A;ли1ри0;еCTи0роE;аKеJиск3о9ух3;алиDAши1;зVсJ;кTпPсLтJчеAAши8;аJво8еря2и,ро6S;мо7я0;ерACка9Oла86м5Gор4Wп5AтKчиJ;та1;аCрJ;е0Lои0;аHоLрJус5;е1NостJ;ра8K;з58ло61ро0;ача2ры0;бYвVглUдSлPмNоMрLъеKыJ;гAIс9T;ди6;а05е72уBT;бра1чаI;еJысB4;ня0с5ша0;иKо7уJ;чи2;ться,чи0;а93еJра7;ли1ться;аEяBD;еJи1леFя92;рC4сJ;и0ти6E;и1ро9Iу9;ас0ере3Pлю3ну0о14рJус5;е0Qи09оJ;анализиIб07в05г02д00еHжи0зву9ZиXй4кSлеBRмол9ZнRпQрOсLтKци44чJшепDя7B;ес0иD;еFивопос0Xя3;ия0лKм4Lпа0тJ;и1о4Jу9G;а1Yе9;аJва2;боD;и97ус5;естись,ик3;ашMоJ;ммен3TнJ;сульти7EтроJ;лиI;ля0;г9LзKллюсJнфор7H;триI;вADнADой4;а1виBHеJикBTли1ол4YуB8;кла7Dла0;л2Uна0оKреме0уJ;де0ля2;во8ло5A;аABе8EоJ;ди0зглаE;еB5и0ормоDу9;бYвXгVдUеHжа1зTй4кRлQмPнOоNпMсKт89уJчи6ще5P;краEчи0;в52ес0лJни2оеди5Gпосо6Mту9K;а0у0W;ар62ом6;бр9Zс9Wткры0;ес4у9я1;е71к3;еATо7;а7XрJ;е9Cы0;ва0ем9Xна1;а0ра2уAO;лаEоJ;во8ди2то67;еAXлеFык3я7R;аCеAOи0ли2Bы0;бы0вUдLкраA2небреFоKпо6SрGуJ;велиAменьA5с2I;браB4до7G;а0ло7назнаAоNпLстаKуJъяC;пре9см3D;ви1ть;оJри9I;ло7ч52;преLсKтвJ;ра5;таC;де98;зой4ра9QыE;б21в1Vг1Rд1Bе1Aж16з0Zис7Rй0Yк0Sл0Pм0Lн0Iо0Gп0Cр09сVтPужи33хNцелоGчLшKщи59яJ;ви2с6;еве9Cу5;е7SиJ;ни0с5;ваJло54о9у9H;ли0с07;ерNороMрJу9MяA8;еJу7Sяс4;бJво7;и0оG;пи2;е0я1;а9вVеUка7EлRмQоPпоOсо73тJчи00;аLесня2оя0рKуJ;пи0ча0;а5Zои2;ви0рJ;а2е0;ри0собс8T;ветоGдейс8Sли0;е0отре1;а0е4WуKыJ;ша2;жи0ша1;ли2ти0я0;аNя5;аKва0еJо9уAы2;за0комен4Q;зи0ни0;ас1олз4рKыJ;та2;аCоJы3I;боBси0;беJщ8;да0ща0;адKес3PраJюHя0;ви2;ея2о8X;еLи6DоJча2ы0;ли2чJ;и2ь;ня1с5ти0ша0;еKи0оJу8Wю4N;жи1ма0;з0те0чи1;аNи3лMоLрKуJ;ри0са0ша0;ас5Uу8Dы0;леба2нAри0;о3Aяс2;за1ти1ча0;ма0ти;аNвLдKнаJ;коми1ть;ор7UраC;а0оJ;ли0ни0;бо7JвJимс7Q;и3Vтра64;аKеJ;ва0ла0р7N;лJть;е0оG;с0ха0;аXбWвSг3VдRеPклюAм7HоOпи4QраNсMтвLуKх0CчJъеHы64;е5Tи4K;ма0ть;ер9;ка5Fлу60;з6ться;б6Hж4Gй4;йс7CлJше45;а0и0;а2ер88;еKиJ;га2ну2;рJс4;г89ну0;и0од8;ви0ри0ть;аEиб3лLоKруJ;зи1;во8ди0;о5я7A;а6TеLзрос4Sис3лия0оKре9тJы89;ори1;зи2;да0з4рKсJ;и0ти;и0ну1;еJи0лагода8ри2;ди0жа0;бPвеOдNеHжи0й4куEм5Pн6PсMтерLхKчJ;ис6Kувс6Q;ва5;пе0;еFка4Nп09та0;а1ви7Pела0у7G;з4р3с4;и0ра0;б0Sвла6Tг0Qд0Oзнако5Dк0Mп0Eргани80с06тMфор22хKце6чJщу6W;аIис5ну2;аракте7Xва5рJ;а6ип3;б01вYга3IдXкVлUмеTнес1SоRпPрLсDтJыс4U;оJя19;лк3;аLеJ;агиIдакJмонJ;тиI;боDзи1;раJус5;ви1зд1M;браJзGй4мс5;зи0ть;ни0ти1;иAо7;а4PлJры1;о6юA;а0еZох3;еJлеF;з4рJс4ти0;г3ну2;роE;вOкор2Dла2DмNноGозMпо8тKуJ;ди0щест29;аJриFу9;ви0но27ться;на0;от2Y;е5идетельс5PоJ;бо62и0;ереPи46ла5оNрKуJ;бли1Mс5Z;ав2OедеKоJ;ки3си0;ли1;в4GзJ;да0на0;ди0ться;а42онAрJ;ес5у7;е1оJ;б8л7;ляде2раJ;би0ни61;ви6ду63еWиVлегAмUнSоQрNсMуLъJ;еди2AяJ;ви0с29;слоCчи1;лу7у9;аKес4уJ;ши2;боDдоGзоGти1;бщи0зJй0Eс0G;ли0наA;аруJоCя0;жи1;а3еня1;де1;рKспJ;еAокои2;еFну2;аJедооце6ыр3;б0Dвес3Iгр0Cд09е08жа0з07име06й04к01л00меZнYпSрQсNтKу5Iхму2Vце4TчJ;а1ер5;кKреJя3;ниI;ну2;ла3AтJ;а0оя0рJу41;ои0;ас4иJу50я9;соB;ас0ечаDиMоLрKуJ;га0;а0Uо0Pячься;л6м6;са0тJ;а1ься;ес4я0;к3ти0;а9и0о7;а28лоKоJры0;пи0рQ;ни2;тиJ;!сь;ноB;ва1наA;с2ха0;е0оKыJ;ми0;ес0;а9у42;и0ра1;ах3еJиг3;льк3т3;еFиJ;ши1;ач3иKоJр3Uу37;н4Hп3;в3ну1;зSсJ;кQпOтLчеJ;з3рJ;па0;еFоJра5;лJпи0;коB;оJраCыD;л0Iр3T;алеAлюA;бSвRгQда0жа8ло7мPнNоLрасхоKуJ;ми0чи0;доB;брJй4;а3Fес4;асилоBоJ;си2;а17е09я0;отоC;ес5и07леF;аJе42и0ра0;ви1;аLлоупотJ;реJ;би0;б0Qв0Mг0Jд0FеHж0Eзуб8интересоGй4к0Cл0Bм09н08пVрRсOтMфикLхо3UчJщи5яC;еJис2S;рп3;сиI;к3ормо30рJя3Y;о3уд6;ве36лу7мея2ну0тJу3;а2AрJы3;ахоBе2Lя0;аLегистриKжаJ;ве0;роG;боDзи0;еUиTлQоNрKуJ;с5та0;е5оJ;грамJт3X;миI;доз8зKл6мJ;ни1;да0;аJес4;ка0ниIти0;роB;са1;ре0;ес4очеBя1;еJол1B;ни0ре0ти0;ез0и0о7юб27;а05люAон2WрJу8;е1Kу7ы1;а0еF;а0еKуJ;ма1ши0;рJть;жа1;ля3на0оJру23;во8рJ;е0о9;аLеJис3ла25оеBяV;рJс4;боBи0ну0ши1;ли0ри0;еремеLи0оKрJы0;а1о09;ле0;не0;а1ви2Qе2оJ;бSвеRгOеHжNй4каMло7но2WпLстJ;аJиг3;ви0ть2W;ол6роEус5;за0;да2и0;на0оJ;воJ;ри2;ри0с4;аCи2ра2ы0;ве2Hдохн2Fер2Eз23клю22л1Xме1Vн1Rо11п10руAс0Pт0OъеHыJ;б0Kве2Gг0Hд0FеHжи0зBиг0Eй4к0Bл09м08н06п03рZсQтMу21чKши0яJ;ви0с6;еJис12;рк3;аKеJя3;ре0чь;сJщи0;ка0;аQкOлMоLтJу1J;аCрJу0H;е0Uои0;са0;а0е9уJ;ша0;аJоA;за1;ди2;аJва1уга1;боDзи1сJ;тиJ;!ть;ас0иKла5ол6ряJус5;ми2;са0ть;оEуJ;ди0ть;ес5;еJо7;з0те0;аKи3люAрJупа2;а1Qу5;ча0;ра0;а0ви3еJох3;ли1р1A;лJна0;а9я0K;ди0;е16и0рJ;а1оE;ха0;ис3я3;кRмотQпNтJ;аLрKуJ;пи0;е0Eои0ях3;ви0ть;оJых3;м6те0;ни0;ре2;ипя5оAры0;чи0;ас0;влеFзYй4оWсJтк3;клUпNсMхJ;ваKиJ;ти2;ли0;таV;аOиDользNрJ;епятсLиKоизвJ;ес4;ня0;твоB;ова2;ли2;ик3;браJдушеC;зи0;буQвOглаCдеNнLобKраJ;зи0с4;ноC;енавиJик3;де0;ла0ржа2;ес4раJ;ти1;ди1;чь;еKуJ;ши0;д8с4;ри0;с5ша2;ти0;ез0о7юJ;би2;тьJ;ся;жи0;чи1;болDвPгля3дMлJя1;еKоJ;ма0;те0;оJрог3;роJх3;жа0;еEолноGы0;ва1;си0;та0;ну1;оCу0;ви0;з4с4;ти;оKыз3;ну0;си1;тьJ;!ся;втоLрJ;есJ;тоB;риJ;зоB;ва0;ть",
    "aspectPairs": "смочь¦мочь|сказать¦говорить|захотеть¦хотеть|сделать¦делать|пойти¦идти,ходить|увидеть¦видеть|подумать¦думать|посмотреть¦смотреть|понять¦понимать|написать¦писать|дать¦давать|начать¦начинать|прочесть¦читать0;!ся|назвать¦называть|сыграть¦играть|заняться¦заниматься|ответить¦отвечать|попросить¦просить|выйти¦выходить|получить¦получать|прийти¦приходить|взять¦брать|купить¦покупать|послушать¦слушать|рассказать¦рассказывать|уйти¦уходить|спросить¦спрашивать|поехать¦ехать|понравиться¦нравиться|выпить¦выпива0пи0;ть|войти¦входить|суметь¦уметь|помочь¦помогать|выучиться¦учиться|сесть¦садиться|поставить¦поставля0стави0;ть|назваться¦называться|побежать¦бежать|положить¦класть|съесть¦есть|начаться¦начинаться|позвонить¦звонить|спеть¦петь|родить¦ро0;диться,жать|прочитать¦прочитывать|пасть¦падать|открыть¦открывать|уехать¦уезжать|снять¦снимать|учиться¦учить|объяснить¦объяснять|выбрать¦выбирать|включить¦включать|забыть¦забывать|принести¦приносить|приготовить¦готовить|перейти¦переходить|повторить¦повторять|умереть¦умирать|перевести¦переводить|задать¦задавать|бежать¦бегать|закрыть¦закрывать|пригласить¦приглашать|отдохнуть¦отдыхать|станцевать¦танцевать|произнести¦произносить|поздравить¦поздравлять|заснуть¦засыпать|помыть¦мыть|поломать¦ломать|подарить¦дарить|кончиться¦кончаться|поесть¦поедать|одеться¦одеваться|заполнить¦заполнять|пообедать¦обедать|своровать¦воровать|подписать¦подписывать|поужинать¦ужинать|запретить¦запрещать0;!ся|запомнить¦запоминать|раздеться¦раздеваться|поздороваться¦здороваться|позавтракать¦завтракать|выключить¦выключать|умыться¦умываться|побриться¦бриться|выучить¦выучивать|извинить¦извинять|счесть¦считать|найтись¦находиться|стать¦становиться|остаться¦оставаться|произойти¦происходить|повести¦в0;ести,одить0;!ся|перечувствовать¦чувствовать|продолжить¦продолжать|услышать¦слышать|привести¦приводить|поискать¦искать|провести¦проводить|проводить¦пров0;ести,ожать|пройти¦проходить|поверить¦верить|показать¦показывать|предложить¦предлагать|пожелать¦желать|потерять¦терять|вызвать¦вызывать|подойти¦подходить|получиться¦получаться|встретиться¦встречаться|уплатить¦платить|крикнуть¦кричать|понести¦носить|найти¦находить|побить¦бить0побивать;!ся|засмеяться¦смеяться|помешать¦мешать|прозвучать¦звучать|заплакать¦плакать|выстроить¦выстраива0строи0;ть|полететь¦лететь|обменять¦меня0обменива0;ть|научиться¦научить|ехать¦ездить|подняться¦подниматься|поступить¦поступать|встретить¦встречать|продать¦продавать|встать¦вставать|приехать¦приезжать|отдать¦отдавать|поднять¦поднимать|представиться¦представляться|бросить¦бросать|покурить¦курить|подышать¦дышать|потянуть¦тянуть|случиться¦случаться|остановиться¦останавливаться|послать¦посылать|возненавидеть¦ненавидеть|приблизиться¦приближаться|накормить¦кормить|проверить¦проверять|истратить¦тратить|попробовать¦пробовать|открыться¦открываться|посоветовать¦советовать|дойти¦доходить|поблагодарить¦благодарить|узнать¦узнавать|поторопиться¦торопиться|лечь¦ложиться|поцеловать¦целовать|пугаться¦испугаться|испугаться¦пугаться|попрыгать¦прыгать|нарисовать¦рисовать|записать¦записывать|полечить¦лечить|отправить¦отправлять|пошутить¦шутить|увеличиться¦увеличиваться|потрудиться¦трудиться|постучать¦стучать|увеличить¦увеличивать|отойти¦отходить|проехать¦проезжать|полюбить¦любить|закончить¦заканчивать|заболеть¦заболевать|разделить¦дели0разделя0;ть|разбудить¦будить|разрешить¦разрешать|воспитать¦воспитывать|забрать¦забирать|надеть¦надевать|порезать¦резать|познакомиться¦знакомиться|выругать¦ругать|выехать¦выезжать|убрать¦убирать|различить¦различать0;!ся|заночевать¦ночевать|отличить¦отличать|убежать¦убегать|повезти¦в0;езти,озить|толкнуть¦толкать|проститься¦прощаться|преподать¦преподавать|заказать¦заказывать|доехать¦доезжать|выкупаться¦купаться|отнести¦относить|сварить¦варить|почистить¦чистить|выгладить¦гладить|уменьшиться¦уменьшаться|извиниться¦извиняться|повернуть¦поворачивать|предъявить¦предъявлять|прибыть¦прибывать|прислать¦присылать|соединить¦соединять|закрыться¦закрываться|привыкнуть¦привыкать|выбросить¦выбрасывать|стереть¦стирать|кинуть¦кидать|привезти¦привозить|отвести¦отводить|вылететь¦вылетать|налить¦наливать|вырасти¦вырастать|устать¦уставать|продиктовать¦диктовать|запереть¦запирать|унести¦уносить|исправить¦исправлять|вынуть¦вынимать|уменьшить¦уменьшать|зарегистрироваться¦зарегистрировать|зарегистрировать¦зарегистрироваться,регистрировать|улететь¦улетать|подъехать¦подъезжать|опоздать¦опаздывать|выписать¦выписывать|поправить¦поправлять|сфотографировать¦фотографировать|проспать¦просыпать|переехать¦переезжать|изжарить¦жарить|прилететь¦прилетать|въехать¦въезжать|прокашлять¦кашлять|замерзнуть¦замерза0мерзну0;ть|пересказать¦пересказывать|развестись¦разводиться|выкинуть¦выкидывать|завернуть¦заворачивать|приземлиться¦приземляться|умножить¦умножать|отвезти¦отвозить|переспросить¦переспрашивать|упаковать¦пако0упаковы0;вать|посолить¦солить|отгадать¦отгадывать|припарковать¦парковать|хватить¦хватать|явиться¦являться|последовать¦следовать|представить¦представлять|принять¦принимать|постараться¦стараться|понадеяться¦надеяться|воспользоваться¦пользоваться|выглядеть¦выглядывать|иметь¦иметься|поглядеть¦глядеть|возвратиться¦возвращаться|создать¦создавать|позвать¦звать|обратиться¦обращаться|выступить¦выступать|решить¦решать|напомнить¦напоминать|двинуться¦двигаться|вспомнить¦вспоминать|пообещать¦обещать|испытать¦испытывать|оставить¦оставлять|потребоваться¦требоваться|зайти¦заходить|заметить¦замечать|держать¦держаться|спасти¦спасать|произвести¦производить|продолжиться¦продолжаться|бороть¦бороться|бороться¦бороть|сообщить¦сообщать|указать¦указывать|приготовиться¦готовиться|собрать¦собирать|изучить¦изучать|обсудить¦обсуждать0;!ся|передать¦передавать|заинтересовать¦интересовать|спешить¦спешить|сойти¦сходить|усомниться¦сомневаться|выстрелить¦стрелять|убить¦убивать|отметить¦отмечать|отказаться¦отказываться|поймать¦ловить|применить¦применять|перетерпеть¦терпеть|наступить¦наступать|выразить¦выражать|обрадоваться¦радоваться|спланировать¦планировать|выдать¦выдавать|описать¦описывать|проконтролировать¦контролировать|сохранить¦сохранять|прожить¦проживать|подать¦подавать|заинтересоваться¦интересоваться|удивиться¦удивляться|пожаловаться¦жаловаться|пожалеть¦жалеть|почтить¦почитать|взволноваться¦волноваться|заработать¦зарабатывать|примениться¦применяться|спуститься¦спускаться|установить¦устанавливать|закончиться¦заканчиваться|обеспокоиться¦беспокоиться|нарушить¦нарушать|достать¦доставать|простить¦прощать|согласиться¦соглашаться|продлиться¦длиться|успеть¦успевать|перестать¦переставать|сравнить¦сравнивать|подчеркнуть¦подчеркивать|добавить¦добавлять|хранить¦храниться|повесить¦вешать|тронуть¦трогать|соблюсти¦соблюдать|употребить¦употреблять|предупредить¦предупреждать|возразить¦возражать|беспокоиться¦беспокоить|родиться¦рождаться|проголосовать¦голосовать|охранить¦охранять|выделить¦выделять|испортить¦портить|доставить¦доставлять|внести¦вносить|повысить¦повышать|проанализировать¦анализировать|раздавить¦давить|перенести¦переносить|подраться¦драться|отвернуться¦отвертываться|напечатать¦печатать|вытечь¦вытекать|исключить¦исключать|выругаться¦ругаться|спрятать¦прятать|засветить¦светить|объявить¦объявлять|засветиться¦светиться|катать¦кататься|возвратить¦возвращать|прибежать¦прибегать|одеть¦одевать|повернуться¦поворачиваться|выполнить¦выполнять0;!ся|кончить¦кончать|измениться¦изменяться|махнуть¦махать|блеснуть¦блестеть|кивнуть¦кивать|установиться¦устанавливаться|позавидовать¦завидовать|украсить¦украшать|обмануть¦обманывать|обидеться¦обижаться|шагнуть¦шагать|заменить¦заменять|оплатить¦оплачивать|успокоить¦успокаивать|придумать¦придумывать|двинуть¦двигать|отстать¦отставать|обойти¦обходить|рассердиться¦сердиться|назначить¦назначать|удивить¦удивлять|остановить¦останавливать|залюбоваться¦любоваться|выиграть¦выигрывать|победить¦побеждать|увлечься¦увлекаться|потеряться¦теряться|договориться¦договариваться|уговорить¦уговаривать|доложить¦докладывать|проработать¦прорабатывать|увезти¦увозить|разрешиться¦разрешаться|усилить¦усиливать|увести¦уводить|усилиться¦усиливаться|нажать¦нажимать|пожевать¦жевать|похвалить¦хвалить|подсказать¦подсказывать|сложить¦складывать|присниться¦сниться|сшить¦шить|промолчать¦промалчивать|добраться¦добираться|затормозить¦тормозить|проиграть¦проигрывать|поцеловаться¦целоваться|отказать¦отказывать|раздать¦раздавать|обучиться¦обучаться|догнать¦догонять|отпраздновать¦праздновать|выпасть¦выпадать|сэкономить¦экономить|разбить¦разбивать|оторвать¦отрывать|прекратить¦прекращать|прогреметь¦греметь|повыситься¦повышаться|прекратиться¦прекращаться|измерить¦измерять|зажечь¦зажигать|взлететь¦взлетать|улучшить¦улучшать|сократить¦сокращать|разрезать¦разрезать|пожать¦пожимать|оформить¦оформлять|угостить¦угощать|спастись¦спасаться|воскликнуть¦восклицать|записаться¦записываться|очистить¦очищать|отменить¦отменять|починить¦чинить|вдохнуть¦вдыхать|застраховать¦застраховы0страхо0;вать|выбежать¦выбегать|избрать¦избирать|вытянуть¦вытягивать|влюбиться¦влюбляться|наклониться¦наклоняться|успокоиться¦успокаиваться|натренировать¦тренировать|смешать¦смешивать|расслабить¦расслабляться|отремонтировать¦ремонтировать|надоесть¦надоедать|развернуть¦разворачивать|практиковать¦практиковаться|остричь¦стричь|разбиться¦разбиваться|погасить¦гасить|завязать¦завязывать|взорвать¦взрывать|посоветоваться¦советоваться|расставить¦расставлять|испортиться¦портиться|ухудшиться¦ухудшаться|ударить¦ударять|отключить¦отключать|понюхать¦нюхать|угадать¦угадывать|высушить¦сушить|взвесить¦взвешивать|загореть¦загорать|закурить¦закуривать|наградить¦награждать|подготовить¦подготавливать|вспотеть¦потеть|запрограммировать¦программировать|прикрепить¦прикреплять|передвинуть¦передвигать|простудиться¦простужаться|заговорить¦заговаривать|уволить¦увольнять|повзрослеть¦взрослеть|склеить¦клеить|выздороветь¦выздоравливать|продлить¦продлевать|проконсультировать¦консультировать|выдохнуть¦выдыхать|прописать¦прописывать|вздорожать¦дорожать|проконсультироваться¦консультироваться|проглотить¦проглатывать|развязать¦развязывать|скатить¦скачивать|развесить¦развешивать|вскипятить¦кипятить|подвинуться¦подвигаться|подвигаться¦подвинуться|согнуть¦сгибать|вычеркнуть¦вычеркивать|забронировать¦бронировать|выпрямиться¦выпрямляться|зазубрить¦зубрить|настать¦наставать|прибить¦прибивать|одолжить¦одалживать|размешать¦размешивать|перекусить¦перекусывать|подешеветь¦дешеветь|остудить¦остужать|разменять¦разменивать|воспалиться¦воспаляться|авторизовать¦авторизоваться|удочерить¦удочерять|показаться¦каз0показыв0;аться|просуществовать¦существовать|попытаться¦пытаться|позволить¦позволять|потребовать¦требовать|собраться¦собираться|прийтись¦приходиться|приходиться¦прийтись|подействовать¦действовать|возникнуть¦возникать|оказаться¦оказываться|появиться¦появляться|понаблюдать¦наблюдать|занять¦занимать|устремиться¦стремиться|поддержать¦поддерживать|рассмотреть¦рассматривать0;!ся|определить¦определять|предположить¦предполагать|опубликовать¦опубликовы0публико0;вать|заключиться¦заключаться|проследить¦следить|обеспечить¦обеспечивать|заставить¦заставлять|развиться¦развиваться|изойти¦исходить|учесть¦учитывать|поменяться¦меняться|сделаться¦делаться|попасть¦попадать|удаться¦удаваться|рассчитать¦рассчитывать|оказать¦оказывать|достигнуть¦достигать|защитить¦защищать|воспринять¦воспринимать|предпочесть¦предпочитать|совершить¦совершать|ощутить¦ощущать|завладеть¦владе0завладева0;ть|поспорить¦спорить|осуществить¦осуществлять|повлиять¦влиять|порекомендовать¦рекомендовать|признать¦признавать|пережить¦переживать|осуществиться¦осуществляться|дрогнуть¦дрожать|превратиться¦превращаться|оценить¦оценива0цени0;ть|развить¦развивать|исчезнуть¦исчезать|посадить¦сажать|заподозрить¦подозревать|привлечь¦привлекать|приобрести¦приобретать|проявить¦проявлять|окружить¦окружать|отразить¦отражать|полезть¦лезть|доверить¦доверять|вступить¦вступать|решиться¦решаться|создаться¦создаваться|превысить¦превышать|исполнить¦исполнять|подтвердить¦подтверждать|отправиться¦отправляться|заявить¦заявлять|процитировать¦цитировать|поделиться¦делиться|допустить¦допускать|отреагировать¦реагировать|настоять¦настаивать|позаботиться¦заботиться|помолиться¦молиться|доказать¦доказывать|понаблюдаться¦наблюдаться|сопроводить¦сопровождать|сдать¦сдавать|разобраться¦разбираться|изменить¦изменять|посетить¦посещать|заорать¦орать|погрозить¦грозить|потянуться¦тянуться|достаться¦доставаться|связать¦вяз0связыв0;ать|задуматься¦задумываться|прокомментировать¦комментировать|рискнуть¦рисковать|рассудить¦рассуждать|пострадать¦страдать|расположиться¦располагаться|совпасть¦совпадать|изобразить¦изображать|набрать¦набирать|направить¦направлять|произвестися¦производиться|покинуть¦покидать|пустить¦пускать|выразиться¦выражаться|избежать¦избегать|предположиться¦предполагаться|выносить¦вынашивать|добиться¦добиваться|соврать¦врать|проговорить¦проговаривать|подвести¦подводить|распространиться¦распространяться|размыслить¦размышлять|заслужить¦заслуживать|атаковать¦атаковывать|продаться¦продаваться|направиться¦направляться|броситься¦бросаться|признаться¦признаваться|насладиться¦наслаждаться|сформироваться¦формироваться|побеседовать¦беседовать|повториться¦повторяться|выделиться¦выделяться|продемнстрировать¦продемонстрировать|спрятаться¦прятаться|уступить¦уступать|увидеться¦видеться|объясниться¦объясняться|обвинить¦обвинять|поранить¦ранить|сохраниться¦сохраняться|возглавить¦возглавлять|возрасти¦возрастать|удержать¦удерживать|сформировать¦сформироваться,формировать|раздражить¦раздражать|объединить¦объединять|подвергнуться¦подвергаться|охватить¦охватывать|покрутить¦крутить|прислушаться¦прислушиваться|предусмотреть¦предусматривать|заглянуть¦заглядывать|постесняться¦стесняться|нанести¦наносить|сверкнуть¦сверкать|отпустить¦отпускать|вложить¦вкладывать|обрадовать¦радовать|почувствоваться¦чувствоваться|уничтожить¦уничтожать|ознакомиться¦ознакомляться|порваться¦рваться|обойтись¦обходиться|пригодиться¦годи0пригожда0;ться|обучить¦обучать|убедить¦убеждать|пропустить¦пропускать|дождаться¦дожидаться|прошептать¦шептать|превратить¦превращать|разработать¦разрабатывать|захватить¦захватывать|справляться¦справиться|обозначить¦обозначать|взболтать¦болтать|отразиться¦отражаться|раскрыть¦раскрывать|издать¦издавать|ограничить¦ограничивать|заключить¦заключать|поколебаться¦колебаться|опуститься¦опускаться|сгореть¦сгорать|качнуть¦качать|обнять¦обнимать|осветить¦освещать|удовлетворить¦удовлетворять|сдержать¦сдерживать|написаться¦писаться|опустить¦опускать|напасть¦нападать|отнестись¦относиться|сжать¦сжимать|превзойти¦превосходить|протянуть¦протягивать|поберечь¦беречь|снизить¦снижать|порвать¦поры0р0;вать|обслужить¦обслуживать|пробормотать¦бормотать|вмешаться¦вмешиваться|поползти¦ползти|разрушить¦разрушать|покрутиться¦крутиться|подобрать¦подбирать|подуть¦дуть|выдержать¦выдерживать|умолить¦умолять|разобрать¦разбирать|завести¦заводить|наполнить¦наполнять|покушать¦кушать|осудить¦осуждать|нарасти¦нарастать|вздохнуть¦вздыхать|обернуться¦оборачиваться|внушить¦внушать|оправдать¦оправдывать|удалиться¦удаляться|вращать¦вращаться|восстановить¦восстанавливать|восхититься¦восхищаться|скользнуть¦скользить|вообразить¦воображать|совершиться¦совершаться|отделить¦отделять|предпринять¦предпринимать|распространить¦распространять|продвинуться¦продви0;гаться,нуть|снизиться¦снижаться|похлопать¦хлопать|осмотреть¦осматривать|вытащить¦вытаскивать|включиться¦включаться|преодолеть¦преодолевать|сообщиться¦сообщаться|хохотнуть¦хохотать|организовать¦организовывать|добыть¦добывать|смутить¦смущать|впасть¦впадать|довести¦доводить|изложить¦излагать|потрястись¦трястись|сбежать¦сбегать|возбудить¦возбуждать|обидеть¦обижать|покатиться¦катиться|сочинить¦сочинять|подвергнуть¦подвергать|послушаться¦слушаться|полечиться¦лечиться|прижать¦прижимать|выяснить¦выяснять0;!ся|потрясти¦потрясать,трясти|запустить¦запускать|завершить¦завершать|поохотиться¦охотиться|волновать¦взволновать|освободить¦освобождать|прогудеть¦гудеть|базировать¦базироваться|базироваться¦базировать|выбраться¦выбираться|приказать¦приказывать|отложить¦откладывать|солгать¦лгать|расширить¦расширять|погибнуть¦гибну0погиба0;ть|растаять¦таять|передвинуться¦передвигаться|порубить¦рубить|утонуть¦тонуть|отвлечь¦отвлекать|адресовать¦адресовывать|сожрать¦жрать|политься¦литься|поглотить¦поглощать|пересечь¦пересекать|расспросить¦расспрашивать|наказать¦наказывать|воспроизвести¦воспроизводить|привязать¦привязывать|отозваться¦отзываться|приступить¦приступать|задержаться¦задерживаться|вытереть¦вытирать|развернуться¦разворачиваться|присоединиться¦присоединяться|провзаимодействовать¦взаимодействовать|устроиться¦устраиваться|освоить¦осваивать|вставить¦вставлять|поместить¦помещать|укрепить¦укреплять|обменяться¦обмениваться|отобрать¦отбирать|оскорбить¦оскорблять|дополнить¦дополнять|причинить¦причинять|простонать¦стонать|залить¦заливать|перечислить¦перечислять|пояснить¦пояснять|запротестовать¦протестовать|извлечь¦извлекать|посодействовать¦содействовать|потребить¦потреблять|сбить¦сбивать|пососать¦сосать|проиллюстрировать¦иллюстрировать|приложить¦прилагать|удалить¦удалять|вспыхнуть¦вспыхивать|забить¦забивать|исполниться¦исполняться|проинформировать¦информировать|пролететь¦пролетать|ограбить¦грабить|поссориться¦ссориться|разыскать¦разыскивать|уточнить¦уточнять|похоронить¦хоронить|утешить¦утешать|уложить¦укладывать|передумать¦передумывать|глотнуть¦глотать|покраснеть¦краснеть|одобрить¦одобрять|перебить¦перебивать|выслушать¦выслушивать|полить¦поливать|вырастить¦выращивать|задержать¦задерживать|задушить¦душить|притвориться¦притворяться|опередить¦опережать|выкрасить¦красить|наложить¦накладывать|вздрогнуть¦вздрагивать|пробежать¦пробегать|отредактировать¦редактировать|спровоцировать¦провоцировать|разместить¦размещать|своротить¦сворачивать|распределить¦распределять|увлечь¦увлекать|отследить¦отслеживать|скопировать¦копировать|вручить¦вручать|застрелить¦застреливать|покусать¦кусать|сжечь¦жечь,сжигать|объединиться¦объединяться|вскочить¦вскакивать|постареть¦стареть|прибавить¦прибавлять|вынудить¦вынуждать|освободиться¦освобождаться|обдумать¦обдумывать|истопить¦топить|накрыть¦накрывать|проделать¦проделывать|пожертвовать¦жертвовать|мигнуть¦мигать|сформулировать¦формулировать|разыграть¦разыгрывать|нанять¦нанимать|свистнуть¦свистеть|образовать¦образовывать|нырнуть¦нырять|вывезти¦вывозить|убедиться¦убеждаться|настроить¦настраивать|навестить¦навещать|уронить¦ронять|завершиться¦завершаться|подразнить¦дразнить|кинуться¦кидаться|прижаться¦прижиматься|потереть¦тереть|повредить¦вредить|выжить¦выживать|помириться¦мириться|раскачаться¦раскачиваться|приговорить¦приговаривать|расстрелять¦расстреливать|ворваться¦врываться|устранить¦устранять|натянуть¦натягивать|забраться¦забираться|покатить¦катить|избить¦избивать|изнасиловать¦насиловать|заложить¦закладывать|отомстить¦мстить|преувеличить¦преувеличивать|забеременеть¦беременеть|напрячься¦напрягаться|прогнать¦прогонять|снести¦сносить|украсть¦красть|совместить¦совмещать|распознать¦распознавать|изобрести¦изобретать|воспротивиться¦противиться|перевезти¦перевозить|истечь¦истекать|завонять¦вонять|развлечь¦развлекать|познакомить¦знакомить|прославиться¦прославляться|усесться¦усаживаться|загрузить¦загружать|выгнать¦выгонять|погнаться¦гнаться|допросить¦допрашивать|донести¦доносить|запомниться¦запоминаться|похвастаться¦хвастаться|влезть¦влезать|избавиться¦избавляться|залезть¦залезать|перевернуть¦переворачивать|накопить¦копить|порулить¦рулить|разделиться¦разделяться|реализовать¦реализовывать|злоупотребить¦злоупотреблять|подписаться¦подписываться|принудить¦принуждать|вскрыть¦вскрывать|поручить¦поручать|подключить¦подключать|погрузить¦грузи0погружа0;ть|заехать¦заезжать|почесать¦чесать|ускорить¦ускорять|завоевать¦завоевывать|ослабить¦ослаблять|израсходовать¦расходовать|упростить¦упрощать|рассчитаться¦рассчитываться|обновить¦обновлять|недооценить¦недооценивать|закрепить¦закреплять|предать¦предавать|присвоить¦присваивать|усвоить¦усваивать|удержаться¦удерживаться|списать¦списывать|покатать¦катать|предотвратить¦предотвращать|изготовить¦изготавливать|переместить¦перемещать|воздержаться¦воздерживаться|переделать¦переделывать|окончить¦оканчивать|отделиться¦отделяться|похудеть¦худеть|вычислить¦вычислять|застынуть¦застывать|измазать¦мазать|вместить¦вмещать|похрапеть¦храпеть|потушить¦тушить|задумать¦задумывать|обосновать¦обосновывать|напиться¦напиваться|удостоверить¦удостоверять|разлиться¦разливаться|арестовать¦арестовывать|зажать¦зажимать|брызнуть¦брызгать|расстроить¦расстраивать|заверить¦заверять|продумать¦продумывать|застрять¦застревать|исчерпать¦исчерпывать|подбодрить¦подбадривать|известить¦извещать|ввезти¦ввозить|приоткрыть¦приоткрывать|подмести¦подметать|поморосить¦моросить|застать¦заставать|наметить¦намечать|образоваться¦образовываться|приподнять¦приподнимать|смолоть¦молоть|опрокинуть¦опрокидывать|начертить¦чертить|зависнуть¦зависать|съехать¦съезжать|сосредоточиться¦сосредоточиваться|вышить¦вышивать|возобновить¦возобновлять|помочиться¦мочиться|опросить¦опрашивать|укрыть¦укрывать|основать¦основывать|высосать¦высасывать|рассортировать¦сортировать|преуспеть¦преуспевать|загрязнить¦загрязнять|загородить¦загораживать|распороть¦пороть|заразить¦заражать|обозлить¦злить|смонтировать¦монтировать|разочаровать¦разочаровывать|нагрузить¦нагружать|уволиться¦увольняться|взломать¦взламывать|ужалить¦жалить|заварить¦заваривать|встряхнуть¦встряхивать|зачислить¦зачислять|оповестить¦оповещать|охрипнуть¦хрипнуть|запоздать¦запаздывать|преобразовать¦преобразовывать|расчесать¦расчесывать|выкраситься¦краситься|растворить¦растворять|встроить¦встраивать|сфокусировать¦фокусировать|взглянуть¦взглядывать|заржаветь¦ржаветь|удвоить¦удваивать|запылиться¦пылиться|совокупиться¦совокупляться|приспособить¦приспосабливать|выкрутить¦выкручивать|разгласить¦разглашать|разъединить¦разъединять|опознать¦опознавать|износиться¦изнашиваться|нарядить¦наряжать|пометить¦помечать|наесться¦наедаться|укоротить¦укорачивать|заархивировать¦архивировать|подвернуть¦подворачивать|составить¦составлять|послужить¦служить|посчитаться¦считаться|утвердить¦утверждать|обратить¦обращать|поспособствовать¦способствовать|устроить¦устраивать|освидетельствовать¦свидетельствовать|определиться¦определяться|скрыть¦скрывать|выпустить¦выпускать|предоставить¦предоставлять0;!ся|проявиться¦проявляться|приняться¦приниматься|сложиться¦складываться|опереться¦опираться|призвать¦призывать|столкнуться¦сталкиваться|придать¦придавать|осознать¦осознавать|ввести¦вводить|положиться¦полагаться|построиться¦строиться|взяться¦браться|подавить¦подавлять|расположить¦располагать|вывести¦выводить|просиять¦сиять|скрыться¦скрываться|сотворить¦сотворя0твори0;ть|свести¦сводить|разглядеть¦разглядывать|уставиться¦уставляться|послышаться¦слышаться|валять¦валяться|валяться¦валять|подчиниться¦подчиняться|упомянуть¦упоминать|обнаружить¦обнаруживать|сопроводиться¦сопровождаться|сопровождаться¦сопроводиться|свестись¦сводиться|отметиться¦отмечаться|оглядеться¦оглядываться|передаться¦передаваться|поддаться¦поддаваться|породить¦порождать|доноситься¦донашиваться|напитаться¦питаться|проникнуть¦проникать|поклясться¦клясться|поразить¦поражать|охарактеризовать¦характеризовать0;!ся|основаться¦основываться|ограничиться¦ограничиваться|сработать¦срабатывать|руководствовать¦руководствоваться|лишить¦лишать|сдаться¦сдаваться|высказать¦высказывать|воспрепятствовать¦препятствовать|сняться¦сниматься|прикрыть¦прикрывать|плюнуть¦плевать|покрыть¦покрывать|вырезать¦вырезать|навести¦наводить|сознать¦сознавать|ожидать¦ожидаться|помчаться¦мчаться|наименовать¦именовать|посмотреться¦смотреться|выставить¦выставлять|отстоять¦отстаивать|пошевелиться¦шевелиться|протечь¦протекать|поскакать¦скакать|привестись¦приводиться|обработать¦обрабатывать|скончаться¦скончать|сообразить¦соображать|мелькнуть¦мелькать|вылезть¦вылезать|понестись¦носиться|закружить¦кружиться|отвергнуть¦отвергать|поклониться¦кланяться|зафиксировать¦фиксировать|сойтись¦сходиться|связаться¦связываться|упереться¦упираться|затронуть¦затрагивать|практиковаться¦практиковать|высказаться¦высказываться|нахмуриться¦хмуриться|пронестись¦проноситься|потревожить¦тревожить|перебрать¦перебирать|оторваться¦отрываться|ощутиться¦ощущаться|просмотреть¦просматривать|погрузиться¦погружаться|выдвинуть¦выдвигать|поощрить¦поощрять|намекнуть¦намекать|взвыть¦выть|спустить¦спускать|склониться¦склоняться|сунуть¦совать|замереть¦замирать|дернуть¦дергать|прервать¦прерывать|выработать¦вырабатывать|облегчить¦облегчать|обнаружиться¦обнаруживаться|копнуть¦копать|выложить¦выкладывать|упустить¦упускать|сорвать¦срывать|посвятить¦посвящать|выплатить¦выплачивать|выскочить¦выскакивать|сдохнуть¦сдыхать|смениться¦сменяться|деться¦деваться|задеть¦задевать|пренебречь¦пренебрегать|отбросить¦отбрасывать|позаимствовать¦заимствовать|сравняться¦равняться|оттолкнуть¦отталкивать|рушиться¦рушить|разложить¦раскладывать|присесть¦присаживаться|посеять¦сеять|примкнуть¦примыкать|прогуляться¦прогуливаться|мобилизовать¦мобилизовывать|оберечь¦оберегать|продвинуть¦продви0;гать,нуться|затруднить¦затруднять|затянуть¦затягивать|усовершенствовать¦совершенствовать|занести¦заносить|провалиться¦проваливаться|отработать¦отрабатывать|выслать¦высылать|овладеть¦овладевать|вдохновить¦вдохновлять|сменить¦сменять|материть¦материться|пробить¦пробивать|оспорить¦оспаривать|прерваться¦прерываться|внедрить¦внедрять|наткнуться¦натыкаться|согрешить¦грешить|провозгласить¦провозглашать|вырвать¦вырывать|затянуться¦затягиваться|уловить¦улавливать|лишиться¦лишаться|прорваться¦прорываться|отыскать¦отыскивать|обобщить¦обобщать|окрестить¦крестить|подхватить¦подхватывать|приучить¦приучать|утратить¦утрачивать|нацелиться¦целиться|противопоставить¦противопоставлять|забросать¦забрасывать|разбросать¦разбрасывать|засунуть¦засовывать|отобразить¦отображать|втянуть¦втягивать|наехать¦наезжать|наладить¦налаживать|обрушиться¦обрушиваться|свалить¦сваливать|распахать¦распахивать|подслушать¦подслушивать|надымить¦дымить|перехватить¦перехватывать|распустить¦распускать|избавить¦избавлять|дожить¦доживать|обусловить¦обусловливать|скомбинировать¦комбинировать|слить¦сливать|сконцентрировать¦концентрировать|измять¦мять|согласовать¦согласовывать|созреть¦созревать|возбудиться¦возбуждаться|жениться¦женить|посрать¦срать|продекламировать¦декламировать|искалечить¦калечить|свалиться¦сваливаться|отклонить¦отклонять|повиснуть¦повисать|изумить¦изумлять|высадиться¦высаживаться|воодушевить¦воодушевлять|выследить¦выслеживать|проглядеть¦проглядывать|скомпрометировать¦компрометировать|запутать¦запутывать|поселиться¦поселяться|смириться¦смиряться|очаровать¦очаровывать|приостановить¦приостанавливать|выкачать¦выкачивать|преуменьшить¦преуменьшать|приукрасить¦приукрашивать|посвататься¦свататься|заплести¦заплетать|оснастить¦оснащать|предназначить¦предназначать|зачерпнуть¦зачерпывать|узаконить¦узаконивать|растаможить¦растаможивать|даться¦даваться|посметь¦сметь|постоять¦стоять|уверить¦уверять|пребыть¦пребывать|попасться¦попадаться|раздаться¦раздаваться|уделить¦уделять|развести¦разводить|сотвориться¦твориться|поведать¦поведывать|ступить¦ступать|сказаться¦сказываться|вытаскать¦таскать|пожаловать¦жаловать|напитать¦питать|повозиться¦возиться|метнуть¦метаться|обрести¦обретать|слиться¦сливаться|повалить¦валить|сбросить¦сбрасывать|навязать¦навязывать|схватиться¦схватываться|истолковать¦толковать|вырваться¦вырываться|предстать¦представать|всмотреться¦всматриваться|довестись¦доводиться|выявить¦выявлять|загнать¦загонять|напроситься¦напрашиваться|возвести¦возводить|познать¦познавать|черпнуть¦черпать|набраться¦набираться|набить¦набивать|выбить¦выбивать|припомнить¦припоминать|порыться¦рыться|подчинить¦подчинять|вскарабкаться¦карабкаться|пнуть¦пинать|пробудить¦пробуждать|смягчить¦смягчать|вовлечь¦вовлекать|завалить¦заваливать|покорить¦покорять|придраться¦придираться|пощипать¦щипать|надорваться¦надрываться|воткнуть¦втыкать|заткнуть¦затыкать|восхвалить¦восхвалять|предопределить¦предопределять|завербовать¦вербовать|угодить¦угождать|отозвать¦отзывать|возделать¦возделывать|подбить¦подбивать|оттянуться¦оттягивать|упразднить¦упразднять|вцепиться¦вцепляться|разлучиться¦разлучаться|удостоить¦удостаивать|втиснуть¦втискивать|выместить¦вымещать|выдворить¦выдворять|прищемить¦прищемлять"
  };

  // uncompress them
  const result = {};
  Object.keys(model$1).forEach(k => {
    // efrt-packed word-lists, not suffix-models
    if (k === 'perfective' || k === 'aspectPairs') {
      result[k] = unpack(model$1[k]);
      return
    }
    result[k] = {};
    Object.keys(model$1[k]).forEach(form => {
      result[k][form] = uncompress(model$1[k][form]);
    });
  });

  const { presentTense: presentTense$1, pastTense: pastTense$1, imperative: imperative$1, gerund } = result;
  const perfective$1 = result.perfective || {};
  const aspectPairs = result.aspectPairs || {};

  // perfective → imperfective, built lazily
  let pairsRev = null;
  const getPairsRev = function () {
    if (pairsRev === null) {
      pairsRev = {};
      Object.keys(aspectPairs).forEach(k => {
        pairsRev[aspectPairs[k]] = k;
      });
    }
    return pairsRev
  };

  const doEach = function (str, m, keys) {
    const res = {};
    keys.forEach(k => {
      res[k] = convert(str, m[k]);
    });
    return res
  };

  const toPresent$1 = (str) => doEach(str, presentTense$1, ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']);
  const toPast$1 = (str) => doEach(str, pastTense$1, ['masc', 'fem', 'neut', 'plural']);
  const toImperative$1 = (str) => doEach(str, imperative$1, ['second', 'secondPlural']);

  const isPerfective = (str) => perfective$1[str] === true;

  const toGerund$1 = function (str) {
    const out = convert(str, gerund.gerund);
    if (!out) {
      return null
    }
    // the model guesses for verbs it never saw - reject implausible shapes.
    // perfective gerunds end in -в/-вшись (сделав), imperfective in -я/-ясь/-учи (читая)
    if (isPerfective(str)) {
      return /(в|вшись)$/.test(out) ? out : null
    }
    return /(я|ясь|учи)$/.test(out) ? out : null
  };

  // perfective verbs conjugate straight to future; imperfectives use буду + infinitive
  const toFuture = function (str) {
    if (isPerfective(str)) {
      return toPresent$1(str)
    }
    return {
      first: 'буду ' + str,
      second: 'будешь ' + str,
      third: 'будет ' + str,
      firstPlural: 'будем ' + str,
      secondPlural: 'будете ' + str,
      thirdPlural: 'будут ' + str,
    }
  };

  // the other side of the aspect-pair, if we know it
  const getAspectPair = function (str) {
    if (isPerfective(str)) {
      return getPairsRev()[str] || null
    }
    return aspectPairs[str] || null
  };

  // an array of every inflection, for '{inf}' syntax
  const all = function (str) {
    let res = [str].concat(
      Object.values(toPresent$1(str)),
      Object.values(toPast$1(str)),
      Object.values(toImperative$1(str)),
    ).filter(s => s);
    res = new Set(res);
    return Array.from(res)
  };

  // console.log(toPresent('сидеть'))
  // console.log(toPast('сидеть'))

  const { presentTense, pastTense, imperative } = result;

  // known dictionary-infinitives, for ranking reverse-guesses
  const knownInf = unpack(lexData.Infinitive) ;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse(m[k]);
      return h
    }, {})
  };

  const presentRev = revAll(presentTense);
  const pastRev = revAll(pastTense);
  const imperativeRev = revAll(imperative);

  // russian text often writes 'е' for 'ё' (вернется ~ вернётся).
  // the models are trained on 'ё' spellings - try restoring it, too
  const eVariants = function (str) {
    const out = [str];
    for (let i = 0; i < str.length; i += 1) {
      if (str[i] === 'е') {
        out.push(str.slice(0, i) + 'ё' + str.slice(i + 1));
      }
    }
    return out
  };

  // try each spelling-variant + form, verify by conjugating the result back.
  // a verified guess that is a known dictionary-infinitive wins
  // (шел: fabricated 'шеть' round-trips, but 'шёл' → 'идти' is in the dictionary)
  const tryAll = function (str, revModel, fwdModel, forms) {
    const keys = forms || Object.keys(revModel);
    let verified = null;
    let guess = null;
    const variants = eVariants(str);
    for (let v = 0; v < variants.length; v += 1) {
      for (let i = 0; i < keys.length; i += 1) {
        const k = keys[i];
        const inf = convert(variants[v], revModel[k]);
        if (inf && inf !== variants[v]) {
          // does it round-trip?
          if (convert(inf, fwdModel[k]) === variants[v]) {
            if (knownInf[inf] !== undefined) {
              return inf
            }
            verified = verified || inf;
          } else {
            guess = guess || inf;
          }
        }
      }
    }
    return verified || guess || str
  };

  const fromPresent = function (str, form) {
    if (form && presentRev[form]) {
      return tryAll(str, presentRev, presentTense, [form])
    }
    return tryAll(str, presentRev, presentTense)
  };
  const fromPast = (str) => tryAll(str, pastRev, pastTense);
  const fromImperative = (str) => tryAll(str, imperativeRev, imperative);

  // console.log(fromPresent('сидишь', 'second') === 'сидеть')
  // console.log(fromPast('сидела') === 'сидеть')

  // rule-based russian noun pluralization, with common irregulars.
  // case-declension needs a gender-dictionary, so we stick to nominative number.

  const irregularPlurals = {
    'человек': 'люди',
    'ребёнок': 'дети',
    'ребенок': 'дети',
    'друг': 'друзья',
    'сын': 'сыновья',
    'брат': 'братья',
    'стул': 'стулья',
    'лист': 'листья',
    'дерево': 'деревья',
    'крыло': 'крылья',
    'перо': 'перья',
    'муж': 'мужья',
    'имя': 'имена',
    'время': 'времена',
    'мать': 'матери',
    'дочь': 'дочери',
    'ухо': 'уши',
    'небо': 'небеса',
    'чудо': 'чудеса',
    'сосед': 'соседи',
    'цветок': 'цветы',
    'котёнок': 'котята',
    'щенок': 'щенки',
    // masc nouns with stressed -а plurals
    'город': 'города',
    'дом': 'дома',
    'глаз': 'глаза',
    'лес': 'леса',
    'вечер': 'вечера',
    'голос': 'голоса',
    'поезд': 'поезда',
    'номер': 'номера',
    'паспорт': 'паспорта',
    'доктор': 'доктора',
    'профессор': 'профессора',
    'директор': 'директора',
    'учитель': 'учителя',
    'край': 'края',
    'адрес': 'адреса',
    'берег': 'берега',
    'век': 'века',
    'остров': 'острова',
    'цвет': 'цвета',
    // fleeting-vowel nouns
    'день': 'дни',
    'отец': 'отцы',
    'сон': 'сны',
    'огонь': 'огни',
    'ветер': 'ветры',
    'кусок': 'куски',
    'подарок': 'подарки',
    'рынок': 'рынки',
    'звонок': 'звонки',
    'платок': 'платки',
    'значок': 'значки',
  };
  let irregularSingulars = null;
  const getIrregularSingulars = function () {
    if (irregularSingulars === null) {
      irregularSingulars = {};
      Object.keys(irregularPlurals).forEach(k => {
        irregularSingulars[irregularPlurals[k]] = k;
      });
    }
    return irregularSingulars
  };

  const isHushOrVelar = (c) => /[кгхжчшщ]/.test(c);

  // borrowed words that never decline
  const indeclinable = new Set([
    'кофе', 'метро', 'кино', 'такси', 'пальто', 'меню', 'интервью', 'радио',
    'шоссе', 'кафе', 'желе', 'резюме', 'какао', 'пианино', 'фото', 'видео',
    'бюро', 'депо', 'кашне', 'пюре', 'рагу', 'жюри', 'алоэ', 'кенгуру',
    'шимпанзе', 'евро',
  ]);

  const toPlural$1 = function (str = '') {
    if (indeclinable.has(str)) {
      return str
    }
    if (irregularPlurals[str]) {
      return irregularPlurals[str]
    }
    const stem = str.slice(0, -1);
    // линия → линии
    if (str.endsWith('ия')) {
      return stem + 'и'
    }
    // статья → статьи
    if (str.endsWith('ья')) {
      return stem + 'и'
    }
    // книга → книги, машина → машины
    if (str.endsWith('а')) {
      return stem + (isHushOrVelar(stem.slice(-1)) ? 'и' : 'ы')
    }
    // неделя → недели
    if (str.endsWith('я')) {
      return stem + 'и'
    }
    // окно → окна
    if (str.endsWith('о')) {
      return stem + 'а'
    }
    // море → моря, ружьё → ружья
    if (str.endsWith('е') || str.endsWith('ё')) {
      return stem + 'я'
    }
    // ночь → ночи, музей → музеи
    if (str.endsWith('ь') || str.endsWith('й')) {
      return stem + 'и'
    }
    // парк → парки
    if (isHushOrVelar(str.slice(-1))) {
      return str + 'и'
    }
    // стол → столы
    if (/[бвдзлмнпрстфц]$/.test(str)) {
      return str + 'ы'
    }
    return str
  };

  // best-effort - plural endings are ambiguous without a gender-dictionary
  const toSingular = function (str = '') {
    const irregular = getIrregularSingulars();
    if (irregular[str]) {
      return irregular[str]
    }
    const stem = str.slice(0, -1);
    // линии → линия
    if (str.endsWith('ии')) {
      return stem + 'я'
    }
    // статьи → статья
    if (str.endsWith('ьи')) {
      return stem + 'я'
    }
    if (str.endsWith('и')) {
      // книги → книга, дачи → дача
      if (isHushOrVelar(stem.slice(-1))) {
        return stem + 'а'
      }
      // недели → неделя
      return stem + 'я'
    }
    // столы → стол
    if (str.endsWith('ы')) {
      return stem
    }
    // окна → окно
    if (str.endsWith('а')) {
      return stem + 'о'
    }
    // моря → море
    if (str.endsWith('я')) {
      return stem + 'е'
    }
    return str
  };

  // --- case declension ---

  // nouns with mobile vowels or suppletive stems
  const irregularCases = {
    'день': { genitive: 'дня', dative: 'дню', accusative: 'день', instrumental: 'днём', prepositional: 'дне' },
    'путь': { genitive: 'пути', dative: 'пути', accusative: 'путь', instrumental: 'путём', prepositional: 'пути' },
    'мать': { genitive: 'матери', dative: 'матери', accusative: 'мать', instrumental: 'матерью', prepositional: 'матери' },
    'дочь': { genitive: 'дочери', dative: 'дочери', accusative: 'дочь', instrumental: 'дочерью', prepositional: 'дочери' },
    'любовь': { genitive: 'любви', dative: 'любви', accusative: 'любовь', instrumental: 'любовью', prepositional: 'любви' },
    'церковь': { genitive: 'церкви', dative: 'церкви', accusative: 'церковь', instrumental: 'церковью', prepositional: 'церкви' },
    'имя': { genitive: 'имени', dative: 'имени', accusative: 'имя', instrumental: 'именем', prepositional: 'имени' },
    'время': { genitive: 'времени', dative: 'времени', accusative: 'время', instrumental: 'временем', prepositional: 'времени' },
    'огонь': { genitive: 'огня', dative: 'огню', accusative: 'огонь', instrumental: 'огнём', prepositional: 'огне' },
    'отец': { genitive: 'отца', dative: 'отцу', accusative: 'отца', instrumental: 'отцом', prepositional: 'отце' },
    'сон': { genitive: 'сна', dative: 'сну', accusative: 'сон', instrumental: 'сном', prepositional: 'сне' },
  };

  // guess gender from the nominative ending - the ambiguous cases
  // (soft-sign nouns, natural-gender words) live in the lexicon
  const guessGender = function (str = '') {
    // имя, время - neuter, despite the -я
    if (str.endsWith('мя')) {
      return 'neuter'
    }
    if (/[ая]$/.test(str)) {
      return 'feminine'
    }
    if (/[оеё]$/.test(str)) {
      return 'neuter'
    }
    if (str.endsWith('ь')) {
      return 'feminine' // ~65% of -ь nouns are feminine
    }
    return 'masculine'
  };

  // -ёнок/-ист words are reliably animate; the rest come from the lexicon
  const guessAnimate = function (str = '') {
    if (/[ёо]нок$/.test(str)) {
      return true
    }
    if (str.length > 5 && str.endsWith('ист')) {
      return true
    }
    return false
  };

  // singular case-endings
  const declineBase = function (str, gender) {
    if (indeclinable.has(str)) {
      return { nominative: str, genitive: str, dative: str, accusative: str, instrumental: str, prepositional: str }
    }
    if (irregularCases[str]) {
      return Object.assign({ nominative: str }, irregularCases[str])
    }
    const stem = str.slice(0, -1);
    const res = { nominative: str, accusative: str };
    const hush = (c) => /[жчшщц]/.test(c);

    if (gender === 'feminine') {
      if (str.endsWith('ия')) {
        // линия → линии, линию, линией
        return Object.assign(res, { genitive: stem + 'и', dative: stem + 'и', accusative: stem + 'ю', instrumental: stem + 'ей', prepositional: stem + 'и' })
      }
      if (str.endsWith('а')) {
        // книга → книги, книге, книгу, книгой
        const gen = isHushOrVelar(stem.slice(-1)) ? stem + 'и' : stem + 'ы';
        const instr = hush(stem.slice(-1)) ? stem + 'ей' : stem + 'ой';
        return Object.assign(res, { genitive: gen, dative: stem + 'е', accusative: stem + 'у', instrumental: instr, prepositional: stem + 'е' })
      }
      if (str.endsWith('я')) {
        // неделя → недели, неделе, неделю, неделей
        return Object.assign(res, { genitive: stem + 'и', dative: stem + 'е', accusative: stem + 'ю', instrumental: stem + 'ей', prepositional: stem + 'е' })
      }
      if (str.endsWith('ь')) {
        // ночь → ночи, ночью
        return Object.assign(res, { genitive: stem + 'и', dative: stem + 'и', instrumental: stem + 'ью', prepositional: stem + 'и' })
      }
      return res
    }
    if (gender === 'neuter') {
      if (str.endsWith('ие')) {
        // здание → здания, зданию, зданием, здании
        return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'и' })
      }
      if (str.endsWith('о')) {
        // окно → окна, окну, окном, окне
        return Object.assign(res, { genitive: stem + 'а', dative: stem + 'у', instrumental: stem + 'ом', prepositional: stem + 'е' })
      }
      if (str.endsWith('е') || str.endsWith('ё')) {
        // море → моря, морю, морем, море
        return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'е' })
      }
      // indeclinable (метро, такси)
      return Object.assign(res, { genitive: str, dative: str, instrumental: str, prepositional: str })
    }
    // masculine
    // котёнок → котёнка (fleeting vowel in -ёнок/-онок diminutives)
    if (/[ёо]нок$/.test(str)) {
      const base = str.slice(0, -2) + 'к';
      return Object.assign(res, { genitive: base + 'а', dative: base + 'у', instrumental: base + 'ом', prepositional: base + 'е' })
    }
    if (str.endsWith('ий')) {
      // сценарий → сценария, сценарии
      return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'и' })
    }
    if (str.endsWith('й')) {
      // музей → музея, музеем, музее
      return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'е' })
    }
    if (str.endsWith('ь')) {
      // учитель → учителя, учителем, учителе
      return Object.assign(res, { genitive: stem + 'я', dative: stem + 'ю', instrumental: stem + 'ем', prepositional: stem + 'е' })
    }
    if (/[аяоеёуию]$/.test(str)) {
      // indeclinable (кофе)
      return Object.assign(res, { genitive: str, dative: str, instrumental: str, prepositional: str })
    }
    // стол → стола, столу, столом, столе
    return Object.assign(res, { genitive: str + 'а', dative: str + 'у', instrumental: str + 'ом', prepositional: str + 'е' })
  };

  // accusative of animate masculines takes the genitive form ('я вижу брата')
  const decline = function (str = '', gender, animate) {
    gender = gender || guessGender(str);
    const res = declineBase(str, gender);
    if (animate && gender === 'masculine') {
      res.accusative = res.genitive;
    }
    return res
  };

  // --- plural declension ---

  const irregularPluralGenitives = {
    'человек': 'людей',
    'ребёнок': 'детей',
    'ребенок': 'детей',
    'друг': 'друзей',
    'брат': 'братьев',
    'стул': 'стульев',
    'лист': 'листьев',
    'дерево': 'деревьев',
    'перо': 'перьев',
    'крыло': 'крыльев',
    'сын': 'сыновей',
    'муж': 'мужей',
    'год': 'лет',
    'раз': 'раз',
    'глаз': 'глаз',
    'солдат': 'солдат',
    'волос': 'волос',
    'окно': 'окон',
    'письмо': 'писем',
    'кресло': 'кресел',
    'сестра': 'сестёр',
    'мать': 'матерей',
    'дочь': 'дочерей',
    'время': 'времён',
    'имя': 'имён',
    'море': 'морей',
  };

  // genitive-plural - the trickiest ending in russian
  const toPluralGenitive = function (str, gender, plural) {
    if (irregularPluralGenitives[str]) {
      return irregularPluralGenitives[str]
    }
    const plStem = plural.slice(0, -1);
    if (gender === 'masculine') {
      // нож → ножей, месяц → месяцев, отец → отцов, учитель → учителей, стол → столов
      if (/[жчшщ]$/.test(str)) {
        return str + 'ей'
      }
      if (str.endsWith('ц')) {
        // vowel before ц is unstressed → -ев (месяцев); consonant → -ов (отцов)
        return /[аеёиоуыэюя]ц$/.test(plStem) ? plStem + 'ев' : plStem + 'ов'
      }
      if (str.endsWith('ь')) {
        return plStem + 'ей'
      }
      if (str.endsWith('й')) {
        return plStem + 'ев'
      }
      return plStem + 'ов'
    }
    if (gender === 'feminine') {
      // линия → линий, статья → статей, неделя → недель, ночь → ночей
      if (str.endsWith('ия')) {
        return plStem + 'й'
      }
      if (str.endsWith('ья')) {
        return str.slice(0, -2) + 'ей'
      }
      if (str.endsWith('я')) {
        return plStem + 'ь'
      }
      if (str.endsWith('ь')) {
        return plStem + 'ей'
      }
      // книга → книг, девушка → девушек, сумка → сумок
      if (/[жчшщь]ка$/.test(str)) {
        return str.slice(0, -2) + 'ек'
      }
      if (/[бвгдзклмнпрстфх]ка$/.test(str)) {
        return str.slice(0, -2) + 'ок'
      }
      return plStem
    }
    // здание → зданий, поле → полей, слово → слов
    if (str.endsWith('ие')) {
      return plStem + 'й'
    }
    if (str.endsWith('е') || str.endsWith('ё')) {
      return plStem + 'й'
    }
    return plStem
  };

  // irregular plural instrumentals
  const irregularPluralInstr = {
    'человек': 'людьми',
    'ребёнок': 'детьми',
    'ребенок': 'детьми',
    'лошадь': 'лошадьми',
  };

  // plural oblique cases, built on the nominative-plural stem
  // (handles suppletives like люди → людям for free)
  const declinePlural = function (str = '', gender, animate) {
    if (indeclinable.has(str)) {
      return { nominative: str, genitive: str, dative: str, accusative: str, instrumental: str, prepositional: str }
    }
    gender = gender || guessGender(str);
    const plural = toPlural$1(str);
    const plStem = plural.slice(0, -1);
    // hard-stem takes -ам/-ами/-ах, soft-stem takes -ям/-ями/-ях
    let soft = false;
    if (plural.endsWith('я')) {
      soft = true;
    } else if (plural.endsWith('и') && /[кгхжчшщц]$/.test(plStem) === false) {
      soft = true;
    }
    const a = soft ? 'я' : 'а';
    const genitive = toPluralGenitive(str, gender, plural);
    return {
      nominative: plural,
      genitive,
      dative: plStem + a + 'м',
      accusative: animate ? genitive : plural,
      instrumental: irregularPluralInstr[str] || plStem + a + 'ми',
      prepositional: plStem + a + 'х',
    }
  };

  // russian adjective agreement - derive gender/number forms from any form.
  // endings are regular; the only lexical wrinkle is stressed -ой adjectives.

  // stems of common adjectives with stressed -ой (большой, молодой..)
  const ojStems = new Set([
    'больш', 'молод', 'дорог', 'прост', 'плох', 'жив', 'зл', 'чуж', 'родн',
    'голуб', 'сед', 'сух', 'глух', 'прям', 'крут', 'густ', 'пуст', 'слеп',
    'смешн', 'больн', 'основн', 'миров', 'втор', 'восьм', 'друг', 'как', 'так',
  ]);

  const isVelar = (c) => /[кгх]/.test(c);
  const isHusher = (c) => /[жчшщ]/.test(c);

  // normalize any nominative form to masculine
  const toMasculine = function (str = '') {
    if (/(ый|ий|ой)$/.test(str)) {
      return str
    }
    let stem = null;
    if (/(ая|яя|ое|ее|ые|ие)$/.test(str)) {
      stem = str.slice(0, -2);
    }
    if (stem === null) {
      return str
    }
    if (ojStems.has(stem)) {
      return stem + 'ой'
    }
    // синяя → синий, хорошее → хороший, маленькие → маленький
    if (/(яя|ее|ие)$/.test(str) || isVelar(stem.slice(-1)) || isHusher(stem.slice(-1))) {
      return stem + 'ий'
    }
    return stem + 'ый'
  };

  const stemOf = function (str) {
    const masc = toMasculine(str);
    if (/(ый|ий|ой)$/.test(masc)) {
      return { stem: masc.slice(0, -2), soft: masc.endsWith('ий') }
    }
    return null
  };

  const toFeminine = function (str = '') {
    const res = stemOf(str);
    if (res === null) {
      return str
    }
    const { stem, soft } = res;
    // синий → синяя, but маленький → маленькая, хороший → хорошая
    if (soft && !isVelar(stem.slice(-1)) && !isHusher(stem.slice(-1))) {
      return stem + 'яя'
    }
    return stem + 'ая'
  };

  const toNeuter = function (str = '') {
    const res = stemOf(str);
    if (res === null) {
      return str
    }
    const { stem, soft } = res;
    // синий → синее, хороший → хорошее, but маленький → маленькое
    if (soft && !isVelar(stem.slice(-1))) {
      return stem + 'ее'
    }
    return stem + 'ое'
  };

  const toPlural = function (str = '') {
    const res = stemOf(str);
    if (res === null) {
      return str
    }
    const { stem, soft } = res;
    // новый → новые, but синий/маленький/большой → -ие
    if (soft || isVelar(stem.slice(-1)) || isHusher(stem.slice(-1))) {
      return stem + 'ие'
    }
    return stem + 'ые'
  };

  // --- comparatives + superlatives ---

  const irregularComparatives = {
    'хороший': 'лучше',
    'плохой': 'хуже',
    'большой': 'больше',
    'маленький': 'меньше',
    'старый': 'старше',
    'молодой': 'моложе',
    'высокий': 'выше',
    'низкий': 'ниже',
    'широкий': 'шире',
    'узкий': 'уже',
    'далёкий': 'дальше',
    'далекий': 'дальше',
    'долгий': 'дольше',
    'короткий': 'короче',
    'лёгкий': 'легче',
    'легкий': 'легче',
    'мягкий': 'мягче',
    'строгий': 'строже',
    'дорогой': 'дороже',
    'дешёвый': 'дешевле',
    'дешевый': 'дешевле',
    'громкий': 'громче',
    'тихий': 'тише',
    'сладкий': 'слаще',
    'редкий': 'реже',
    'жаркий': 'жарче',
    'крепкий': 'крепче',
    'чистый': 'чище',
    'толстый': 'толще',
    'богатый': 'богаче',
    'поздний': 'позже',
    'ранний': 'раньше',
    'глубокий': 'глубже',
    'близкий': 'ближе',
    'простой': 'проще',
    'частый': 'чаще',
    'густой': 'гуще',
    'твёрдый': 'твёрже',
    'твердый': 'твёрже',
  };

  const irregularSuperlatives = {
    'хороший': 'лучший',
    'плохой': 'худший',
    'высокий': 'высший',
    'низкий': 'низший',
  };

  // быстрый → быстрее, громкий → громче
  const toComparative = function (str = '') {
    const masc = toMasculine(str);
    if (irregularComparatives[masc]) {
      return irregularComparatives[masc]
    }
    const res = stemOf(masc);
    if (res === null) {
      return 'более ' + str
    }
    const { stem } = res;
    const last = stem.slice(-1);
    // velar-stems mutate: к→ч, г→ж, х→ш
    if (last === 'к') {
      return stem.slice(0, -1) + 'че'
    }
    if (last === 'г') {
      return stem.slice(0, -1) + 'же'
    }
    if (last === 'х') {
      return stem.slice(0, -1) + 'ше'
    }
    return stem + 'ее'
  };

  // быстрый → самый быстрый, хороший → лучший
  const toSuperlative = function (str = '') {
    const masc = toMasculine(str);
    if (irregularSuperlatives[masc]) {
      return irregularSuperlatives[masc]
    }
    return 'самый ' + masc
  };

  var methods$1 = {
    verb: {
      toPresent: toPresent$1,
      toPast: toPast$1,
      toFuture,
      toImperative: toImperative$1,
      toGerund: toGerund$1,
      isPerfective,
      getAspectPair,
      fromPresent,
      fromPast,
      fromImperative,
      all: all,
    },
    noun: {
      toPlural: toPlural$1,
      toSingular,
      decline,
      declinePlural,
      guessGender,
      guessAnimate,
    },
    adjective: {
      toMasculine,
      toFeminine,
      toNeuter,
      toPlural: toPlural,
      toComparative,
      toSuperlative,
    },
  };

  // hand-curated words with multiple tags, plus ambiguity-pins.
  // these win over the packed lexicon and generated conjugations.
  const misc$1 = {};

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
  };

  // --- possessive pronouns (all case-forms) ---
  const possessives = [
    'мой', 'моя', 'моё', 'мое', 'мои', 'моего', 'моей', 'моему', 'моим', 'моими', 'мою', 'моём', 'моем', 'моих',
    'твой', 'твоя', 'твоё', 'твое', 'твои', 'твоего', 'твоей', 'твоему', 'твоим', 'твоими', 'твою', 'твоём', 'твоем', 'твоих',
    'наш', 'наша', 'наше', 'наши', 'нашего', 'нашей', 'нашему', 'нашим', 'нашими', 'нашу', 'нашем', 'наших',
    'ваш', 'ваша', 'ваше', 'ваши', 'вашего', 'вашей', 'вашему', 'вашим', 'вашими', 'вашу', 'вашем', 'ваших',
    'свой', 'своя', 'своё', 'свое', 'свои', 'своего', 'своей', 'своему', 'своим', 'своими', 'свою', 'своём', 'своем', 'своих',
  ];

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
  ];

  // --- particles ---
  const particles = [
    'же', 'ж', 'ли', 'ль', 'бы', 'б', 'ведь', 'вот', 'вон', 'уж', 'лишь',
    'разве', 'неужели', 'пусть', 'пускай', 'ну', 'аж', 'мол', 'якобы', 'только', 'даже',
  ];

  // --- negation ---
  const negatives = ['не', 'ни', 'нет', 'нету'];

  // --- modal predicatives - 'надо работать' ---
  const modals = [
    'можно', 'нельзя', 'надо', 'нужно', 'нужен', 'нужна', 'нужны',
    'должен', 'должна', 'должно', 'должны', 'пора', 'жаль',
  ];

  // --- question-adverbs ---
  const questionAdverbs = ['почему', 'зачем', 'куда', 'откуда', 'отчего', 'сколько', 'столько'];

  // --- interjections + politeness ---
  const expressions = [
    'пожалуйста', 'спасибо', 'привет', 'здравствуй', 'здравствуйте',
    'ладно', 'ой', 'ах', 'ох', 'эх', 'увы', 'ура', 'алло',
  ];

  // --- currency words ---
  const currencies = [
    'рубль', 'рубля', 'рублей', 'рублях',
    'доллар', 'доллара', 'долларов',
    'евро', 'копейка', 'копейки', 'копеек',
  ];

  // --- common nouns that look like verb/adjective conjugations ---
  // (сила ~ говорила, дело ~ хотело, кровать ~ читать..)
  // (кровать, мать, нить.. moved to data/lexicon/nouns/gender.js)
  const nounPins = [
    'сила', 'скала', 'стрела', 'акула', 'юла', 'стая', 'зала', 'пила',
    'дела', 'тела', 'дело', 'тело', 'сало', 'мыло', 'одеяло', 'зеркало', 'покрывало', 'начало',
    'детали', 'медали', 'недели', 'качели', 'дому',
  ];

  // --- common adjectives ending in stressed -ой (no reliable suffix-rule) ---
  const ojAdjectives = [
    'большой', 'молодой', 'дорогой', 'простой', 'плохой', 'живой', 'злой',
    'чужой', 'родной', 'голубой', 'седой', 'сухой', 'глухой', 'прямой',
    'крутой', 'густой', 'пустой', 'слепой', 'смешной', 'больной', 'основной',
    'мировой',
  ];

  Object.keys(bytForms).forEach(w => {
    misc$1[w] = bytForms[w];
  });
  possessives.forEach(w => {
    misc$1[w] = ['Pronoun', 'Possessive'];
  });
  determiners.forEach(w => {
    misc$1[w] = 'Determiner';
  });
  particles.forEach(w => {
    misc$1[w] = 'Particle';
  });
  negatives.forEach(w => {
    misc$1[w] = 'Negative';
  });
  modals.forEach(w => {
    misc$1[w] = 'Modal';
  });
  questionAdverbs.forEach(w => {
    misc$1[w] = 'Adverb';
  });
  expressions.forEach(w => {
    misc$1[w] = 'Expression';
  });
  currencies.forEach(w => {
    misc$1[w] = ['Noun', 'Currency'];
  });
  nounPins.forEach(w => {
    misc$1[w] = 'Noun';
  });
  ojAdjectives.forEach(w => {
    misc$1[w] = 'Adjective';
  });

  const { toPresent, toPast, toImperative, toGerund } = methods$1.verb;
  const perfective = result.perfective || {};
  const lexicon$1 = {};

  const personMap = {
    first: 'FirstPerson',
    second: 'SecondPerson',
    third: 'ThirdPerson',
    firstPlural: 'FirstPersonPlural',
    secondPlural: 'SecondPersonPlural',
    thirdPlural: 'ThirdPersonPlural',
  };
  const addWords = function (obj, tag, lex, extraMap) {
    Object.keys(obj).forEach(k => {
      const w = obj[k];
      if (w && !lex[w]) {
        const tags = [tag];
        if (extraMap && extraMap[k]) {
          tags.push(extraMap[k]);
        }
        lex[w] = tags;
      }
    });
  };

  Object.keys(lexData).forEach(tag => {
    const wordsObj = unpack(lexData[tag]);
    Object.keys(wordsObj).forEach(w => {
      // animacy stacks with a gender-tag (гусь is MaleNoun + AnimateNoun),
      // in either processing-order
      if (lexicon$1[w] && (tag === 'AnimateNoun' || [].concat(lexicon$1[w]).includes('AnimateNoun'))) {
        lexicon$1[w] = Array.from(new Set([].concat(lexicon$1[w], tag)));
      } else {
        lexicon$1[w] = tag;
      }
      // add conjugations for our verbs
      if (tag === 'Infinitive') {
        // perfective verbs' non-past conjugation is semantically future - 'скажу' = 'i will say'
        const tense = perfective[w] === true ? 'FutureTense' : 'PresentTense';
        addWords(toPresent(w), tense, lexicon$1, personMap);
        addWords(toPast(w), 'PastTense', lexicon$1);
        addWords(toImperative(w), 'Imperative', lexicon$1);
        // читая, прочитав - else the 'ая' adjective-rule would catch them
        addWords({ gerund: toGerund(w) }, 'Gerund', lexicon$1);
      }
    });
  });

  // hand-curated entries win over generated ones
  Object.keys(misc$1).forEach(w => {
    lexicon$1[w] = misc$1[w];
  });

  // russian text often spells 'ё' as 'е' - add spelling-variants (идёшь → идешь)
  Object.keys(lexicon$1).forEach(w => {
    if (w.includes('ё')) {
      const plain = w.replace(/ё/g, 'е');
      if (!lexicon$1[plain]) {
        lexicon$1[plain] = lexicon$1[w];
      }
    }
  });

  // tag-name → conjugation-model key
  const tagToForm = {
    FirstPerson: 'first',
    SecondPerson: 'second',
    ThirdPerson: 'third',
    FirstPersonPlural: 'firstPlural',
    SecondPersonPlural: 'secondPlural',
    ThirdPersonPlural: 'thirdPlural',
  };

  const verbForm = function (term) {
    const found = Object.keys(tagToForm).find(tag => term.tags.has(tag));
    return found ? tagToForm[found] : null
  };


  const root = function (view) {
    const { verb } = view.world.methods.two.transform;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        const str = term.implicit || term.normal || term.text;

        // get infinitive form of the verb
        if (term.tags.has('Verb')) {
          if (term.tags.has('Copula')) {
            term.root = 'быть';
          } else if (term.tags.has('Infinitive')) {
            term.root = str;
          } else if (term.tags.has('PastTense')) {
            term.root = verb.fromPast(str);
          } else if (term.tags.has('Imperative')) {
            term.root = verb.fromImperative(str);
          } else if (term.tags.has('PresentTense')) {
            term.root = verb.fromPresent(str, verbForm(term));
          } else {
            // guess!
            term.root = verb.fromPresent(str, verbForm(term));
          }
        }
      });
    });
    return view
  };

  var lexicon = {
    words: lexicon$1,
    compute: { root: root },
    methods: {
      two: {
        transform: methods$1
      }
    },
  };

  var contractions = [

  ];

  const killUnicode = function (str) {
    // а́ е́ и́ о́ у́ ы́ э́ ю́ я́ - strip stress-marks (combining acute/grave accents)
    str = str.replace(/[\u0300\u0301]/g, '');
    // map look-alike latin vowels (from bad encodings) to cyrillic
    str = str.replace(/á/gi, 'а');
    str = str.replace(/é/gi, 'е');
    str = str.replace(/ó/gi, 'о');
    return str
  };

  var tokenizer = {
    mutate: (world) => {
      world.model.one.unicode = {};
      world.methods.one.killUnicode = killUnicode;

      world.model.one.contractions = contractions;

      // 'que' -> 'quebec'
      delete world.model.one.lexicon.que;
    }
  };

  const hasApostrophe = /['‘’‛‵′`´]/;

  // normal regexes
  const doRegs = function (str, regs) {
    for (let i = 0; i < regs.length; i += 1) {
      if (regs[i][0].test(str) === true) {
        return regs[i]
      }
    }
    return null
  };

  const checkRegex = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    const { regexText, regexNormal, regexNumbers } = world.model.two;
    const normal = term.machine || term.normal;
    let text = term.text;
    // keep dangling apostrophe?
    if (hasApostrophe.test(term.post) && !hasApostrophe.test(term.pre)) {
      text += term.post.trim();
    }
    let arr = doRegs(text, regexText) || doRegs(normal, regexNormal);
    // machine-form strips hyphens (по-русски → порусски) - try the raw normal, too
    if (!arr && term.normal !== normal) {
      arr = doRegs(term.normal, regexNormal);
    }
    // hide a bunch of number regexes behind this one
    if (!arr && /[0-9]/.test(normal)) {
      arr = doRegs(normal, regexNumbers);
    }
    if (arr) {
      setTag([term], arr[1], world, false, `1-regex- '${arr[2] || arr[0]}'`);
      term.confidence = 0.6;
      return true
    }
    return null
  };

  const isTitleCase = /^\p{Lu}\p{Ll}/u;

  // add a noun to any non-0 index titlecased word, with no existing tag
  const titleCaseNoun = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    // don't over-write any tags
    if (term.tags.size > 0) {
      return
    }
    // skip first-word, for now
    if (i === 0) {
      return
    }
    if (isTitleCase.test(term.text)) {
      setTag([term], 'ProperNoun', world, false, `1-titlecase`);
    }
  };

  const min = 1400;
  const max = 2100;

  const dateWords = new Set(['pendant', 'dans', 'avant', 'apres', 'pour', 'en']);

  const seemsGood = function (term) {
    if (!term) {
      return false
    }
    if (dateWords.has(term.normal)) {
      return true
    }
    if (term.tags.has('Date') || term.tags.has('Month') || term.tags.has('WeekDay')) {
      return true
    }
    return false
  };

  const seemsOkay = function (term) {
    if (!term) {
      return false
    }
    if (term.tags.has('Ordinal')) {
      return true
    }
    return false
  };

  // recognize '1993' as a year
  const tagYear = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      const num = Number(term.normal);
      // number between 1400 and 2100
      if (num && !isNaN(num)) {
        if (num > min && num < max) {
          if (seemsGood(terms[i - 1]) || seemsGood(terms[i + 1])) {
            setTag([term], 'Year', world, false, '1-tagYear');
            return true
          }
          // or is it really-close to a year?
          if (num > 1950 && num < 2025) {
            if (seemsOkay(terms[i - 1]) || seemsOkay(terms[i + 1])) {
              setTag([term], 'Year', world, false, '1-tagYear-close');
              return true
            }
          }
        }
      }
    }
    return null
  };

  const oneLetterAcronym = /^[A-ZÄÖÜ]('s|,)?$/;
  const isUpperCase = /^[A-Z-ÄÖÜ]+$/;
  const periodAcronym = /([A-ZÄÖÜ]\.)+[A-ZÄÖÜ]?,?$/;
  const noPeriodAcronym = /[A-ZÄÖÜ]{2,}('s|,)?$/;
  const lowerCaseAcronym = /([a-zäöü]\.)+[a-zäöü]\.?$/;



  const oneLetterWord = {
    I: true,
    A: true,
  };
  // just uppercase acronyms, no periods - 'UNOCHA'
  const isNoPeriodAcronym = function (term, model) {
    const str = term.text;
    // ensure it's all upper-case
    if (isUpperCase.test(str) === false) {
      return false
    }
    // long capitalized words are not usually either
    if (str.length > 5) {
      return false
    }
    // 'I' is not a acronym
    if (oneLetterWord.hasOwnProperty(str)) {
      return false
    }
    // known-words, like 'PIZZA' is not an acronym.
    if (model.one.lexicon.hasOwnProperty(term.normal)) {
      return false
    }
    //like N.D.A
    if (periodAcronym.test(str) === true) {
      return true
    }
    //like c.e.o
    if (lowerCaseAcronym.test(str) === true) {
      return true
    }
    //like 'F.'
    if (oneLetterAcronym.test(str) === true) {
      return true
    }
    //like NDA
    if (noPeriodAcronym.test(str) === true) {
      return true
    }
    return false
  };

  const isAcronym = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    //these are not acronyms
    if (term.tags.has('RomanNumeral') || term.tags.has('Acronym')) {
      return null
    }
    //non-period ones are harder
    if (isNoPeriodAcronym(term, world.model)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-no-period-acronym');
      return true
    }
    // one-letter acronyms
    if (!oneLetterWord.hasOwnProperty(term.text) && oneLetterAcronym.test(term.text)) {
      term.tags.clear();
      setTag([term], ['Acronym', 'Noun'], world, false, '3-one-letter-acronym');
      return true
    }
    //if it's a very-short organization?
    if (term.tags.has('Organization') && term.text.length <= 3) {
      setTag([term], 'Acronym', world, false, '3-org-acronym');
      return true
    }
    // upper-case org, like UNESCO
    if (term.tags.has('Organization') && isUpperCase.test(term.text) && term.text.length <= 6) {
      setTag([term], 'Acronym', world, false, '3-titlecase-acronym');
      return true
    }
    return null
  };

  // const isTitleCase = function (str) {
  //   return /^[A-ZÄÖÜ][a-z'\u00C0-\u00FF]/.test(str) || /^[A-ZÄÖÜ]$/.test(str)
  // }

  // const hasNoVerb = function (terms) {
  //   return !terms.find(t => t.tags.has('#Verb'))
  // }

  const fallback = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.size === 0) {
      setTag([term], 'Noun', world, false, '2-fallback');
    }
  };

  //sweep-through all suffixes
  const suffixLoop = function (str = '', suffixes = []) {
    const len = str.length;
    let max = 7;
    if (len <= max) {
      max = len - 1;
    }
    for (let i = max; i > 1; i -= 1) {
      const suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        const tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    const setTag = world.methods.one.setTag;
    const suffixes = world.model.two.suffixPatterns;
    const term = terms[i];
    if (term.tags.size === 0) {
      let tag = suffixLoop(term.normal, suffixes);
      if (tag !== null) {
        setTag([term], tag, world, false, '2-suffix');
        term.confidence = 0.7;
        return true
      }
      // try implicit form of word, too
      if (term.implicit) {
        tag = suffixLoop(term.implicit, suffixes);
        if (tag !== null) {
          setTag([term], tag, world, false, '2-implicit-suffix');
          term.confidence = 0.7;
          return true
        }
      }
    }
    return null
  };

  // 1st pass
  // 3rd
  // import guessNounGender from './3rd-pass/noun-gender.js'
  // import guessPlural from './3rd-pass/noun-plural.js'
  // import adjPlural from './3rd-pass/adj-plural.js'
  // import adjGender from './3rd-pass/adj-gender.js'
  // import verbForm from './3rd-pass/verb-form.js'


  // these methods don't care about word-neighbours
  const firstPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      //  is it titlecased?
      titleCaseNoun(terms, i, world) ||
        // try look-like rules
        checkRegex(terms, i, world);
      // turn '1993' into a year
      tagYear(terms, i, world);
    }
  };
  const secondPass = function (terms, world) {
    for (let i = 0; i < terms.length; i += 1) {
      isAcronym(terms, i, world) ||
        suffixCheck(terms, i, world) ||
        // neighbours(terms, i, world) ||
        fallback(terms, i, world);
    }
  };

  // const thirdPass = function (terms, world) {
  //   for (let i = 0; i < terms.length; i += 1) {
  //     guessNounGender(terms, i, world)
  //     guessPlural(terms, i, world)
  //     adjPlural(terms, i, world)
  //     adjGender(terms, i, world)
  //     verbForm(terms, i, world)
  //   }
  // }


  const tagger = function (view) {
    const world = view.world;
    view.docs.forEach(terms => {
      firstPass(terms, world);
      secondPass(terms, world);
      // thirdPass(terms, world)
    });
    return view
  };

  var regexNormal = [
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
  ];

  var regexNumbers = [

    // russian numeric ordinals - 5-й, 2-го, 1990-х
    [/^[0-9]+-(?:го|му|ми|ых|ой|ое|ая|ий|ым|ом|[йяемхю])$/, ['Ordinal', 'NumericValue'], '5-й'],

    [/^@1?[0-9](am|pm)$/i, 'Time', '3pm'],
    [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, 'Time', '3:30pm'],
    [/^'[0-9]{2}$/, 'Year'],
    // times
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, 'Time', '3:12:31'],
    [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, 'Time', '1:12pm'],
    [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, 'Time', '1:12:31pm'], //can remove?

    // iso-dates
    [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, 'Date', 'iso-date'],
    [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, 'Date', 'iso-dash'],
    [/^[0-9]{1,4}\/[0-9]{1,2}\/[0-9]{1,4}$/, 'Date', 'iso-slash'],
    [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, 'Date', 'iso-dot'],
    [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, 'Date', '12-dec-2019'],

    // timezones
    [/^utc ?[+-]?[0-9]+$/, 'Timezone', 'utc-9'],
    [/^(gmt|utc)[+-][0-9]{1,2}$/i, 'Timezone', 'gmt-3'],

    //phone numbers
    [/^[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '421-0029'],
    [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, 'PhoneNumber', '1-800-'],


    //money
    //like $5.30
    [
      /^[-+]?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6][-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?([kmb]|bn)?\+?$/,
      ['Money', 'Value'],
      '$5.30',
    ],
    //like 5.30$
    [
      /^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]\+?$/,
      ['Money', 'Value'],
      '5.30£',
    ],
    //like
    [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ['Money', 'Value'], '$400usd'],

    //numbers
    // 50 | -50 | 3.23  | 5,999.0  | 10+
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ['Cardinal', 'NumericValue'], '5,999'],
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th|°)$/, ['Ordinal', 'NumericValue'], '53rd'],
    // .73th
    [/^\.[0-9]+\+?$/, ['Cardinal', 'NumericValue'], '.73th'],
    //percent
    [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ['Percent', 'Cardinal', 'NumericValue'], '-4%'],
    [/^\.[0-9]+%$/, ['Percent', 'Cardinal', 'NumericValue'], '.3%'],
    //fraction
    [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ['Fraction', 'NumericValue'], '2/3rds'],
    //range
    [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ['Value', 'NumberRange'], '3-4'],
    //time-range
    [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ['Time', 'NumberRange'], '3-4pm'],
    //with unit
    [/^[0-9.]+([a-z]{1,4})$/, 'Value', '9km'],
  ];

  var regexText = [
    // #хэштег
    [/^#[a-zа-яё0-9_]{2,}$/i, 'HashTag'],

    // @spencermountain
    [/^@[a-zа-яё0-9_]{2,}$/i, 'AtMention'],

    // period-ones acronyms - Ф.С.Б.
    [/^([А-ЯЁA-Z]\.){2}[А-ЯЁA-Z]?/, ['Acronym', 'Noun'], 'Ф.С.Б.'],
  ];

  const jj = 'Adjective';
  const nn = 'Noun';
  const past = 'PastTense';
  const inf = 'Infinitive';
  const imp = 'Imperative';
  const pres = 'PresentTense';
  const first = [pres, 'FirstPerson'];
  const second = [pres, 'SecondPerson'];
  const third = [pres, 'ThirdPerson'];
  const firstPl = [pres, 'FirstPersonPlural'];
  const secondPl = [pres, 'SecondPersonPlural'];
  const thirdPl = [pres, 'ThirdPersonPlural'];

  // russian is a highly-inflected language, so word-endings are a strong signal.
  // known verb-conjugations are found in the lexicon first - these rules are the
  // backstop for unknown words. unmatched words fall-back to Noun, so rules here
  // favour precision. ambiguous common words (сила, дело, кровать..) are
  // pinned in the lexicon.
  var suffixPatterns = [
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
  ];

  var model = {
    regexNormal,
    regexNumbers,
    regexText,
    suffixPatterns
  };

  // roughly, split a document by comma or semicolon
  const splitOn = function (terms, i) {
    const isNum = /^[0-9]+$/;
    const term = terms[i];
    // early on, these may not be dates yet:
    if (!term) {
      return false
    }
    const maybeDate = new Set(['may', 'april', 'august', 'jan']);
    // veggies, like figs
    if (term.normal === 'like' || maybeDate.has(term.normal)) {
      return false
    }
    // toronto, canada  - tuesday, march
    if (term.tags.has('Place') || term.tags.has('Date')) {
      return false
    }
    if (terms[i - 1]) {
      const lastTerm = terms[i - 1];
      // thursday, june
      if (lastTerm.tags.has('Date') || maybeDate.has(lastTerm.normal)) {
        return false
      }
      // pretty, nice, and fun
      if (lastTerm.tags.has('Adjective') || term.tags.has('Adjective')) {
        return false
      }
    }
    // don't split numbers, yet
    const str = term.normal;
    if (str.length === 1 || str.length === 2 || str.length === 4) {
      if (isNum.test(str)) {
        return false
      }
    }
    return true
  };

  // kind-of a dirty sentence chunker
  const quickSplit = function (document) {
    const splitHere = /[,:;]/;
    const arr = [];
    document.forEach(terms => {
      let start = 0;
      terms.forEach((term, i) => {
        // does it have a comma/semicolon ?
        if (splitHere.test(term.post) && splitOn(terms, i + 1)) {
          arr.push(terms.slice(start, i + 1));
          start = i + 1;
        }
      });
      if (start < terms.length) {
        arr.push(terms.slice(start, terms.length));
      }
    });
    return arr
  };

  var methods = {
    two: {
      quickSplit,
    }
  };

  var preTagger = {
    compute: {
      preTagger: tagger
    },
    model: {
      two: model
    },
    methods,
    hooks: ['preTagger']
  };

  var matches = [
    // мистер Кузнецов
    { match: '(мистер|миссис|господин|госпожа|товарищ|доктор|профессор) #ProperNoun', tag: 'Person', reason: 'honorific-name' },

    // имя + фамилия
    { match: '#FirstName #ProperNoun', tag: 'Person', reason: 'first-last' },

    // compound-future: 'буду читать'
    { match: '(буду|будешь|будет|будем|будете|будут) [#Infinitive]', group: 0, tag: 'FutureTense', reason: 'буду-inf' },

    // conditional mood: 'я бы хотел', 'хотел бы'
    { match: '[#PastTense] бы', group: 0, tag: 'Conditional', reason: 'past-бы' },
    { match: 'бы [#PastTense]', group: 0, tag: 'Conditional', reason: 'бы-past' },

    // 'самый + adjective' superlative stays adjective
    { match: '(самый|самая|самое|самые) [#Noun]', group: 0, tag: 'Adjective', reason: 'самый-adj' },
  ];

  let net = null;

  const postTagger$1 = function (view) {
    const { world } = view;
    const { methods } = world;
    // rebuild this only lazily
    net = net || methods.one.buildNet(matches, world);
    // perform these matches on a comma-seperated document
    const document = methods.two.quickSplit(view.document);
    const ptrs = document.map(terms => {
      const t = terms[0];
      return [t.index[0], t.index[1], t.index[1] + terms.length]
    });
    const m = view.update(ptrs);
    m.cache();
    m.sweep(net);
    view.uncache();
    // view.cache()
    return view
  };

  var postTagger = {
    compute: {
      postTagger: postTagger$1
    },
    hooks: ['postTagger']
  };

  const entity = ['Person', 'Place', 'Organization'];

  var nouns$1 = {
    Noun: {
      aliases: [null, 'Существительное'],
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      aliases: [null, 'ЕдинственноеЧисло'],
      is: 'Noun',
      not: ['Plural'],
    },
    ProperNoun: {
      aliases: [null, 'ИмяСобственное'],
      is: 'Noun',
    },
    Person: {
      aliases: [null, 'Персона'],
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      aliases: [null, 'Имя'],
      is: 'Person',
    },
    MaleName: {
      aliases: [null, 'МужскоеИмя'],
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      aliases: [null, 'ЖенскоеИмя'],
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      aliases: [null, 'Фамилия'],
      is: 'Person',
      not: ['FirstName'],
    },
    Honorific: {
      aliases: [null, 'Титул'],
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      aliases: [null, 'Место'],
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      aliases: [null, 'Страна'],
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      aliases: [null, 'Город'],
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    Region: {
      aliases: [null, 'Регион'],
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      aliases: [null, 'Адрес'],
      // is: 'Place',
    },
    Organization: {
      aliases: [null, 'Организация'],
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      aliases: [null, 'Команда'],
      is: 'Organization',
    },
    School: {
      aliases: [null, 'Школа'],
      is: 'Organization',
    },
    Company: {
      aliases: [null, 'Компания'],
      is: 'Organization',
    },
    Plural: {
      aliases: [null, 'МножественноеЧисло'],
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      aliases: [null, 'Неисчисляемое'],
      is: 'Noun',
    },
    Pronoun: {
      aliases: [null, 'Местоимение'],
      is: 'Noun',
      not: entity,
    },
    Actor: {
      is: 'Noun',
      not: entity,
    },
    Activity: {
      aliases: [null, 'Деятельность'],
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    Unit: {
      aliases: [null, 'Единица'],
      is: 'Noun',
      not: entity,
    },
    Demonym: {
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    Possessive: {
      aliases: [null, 'Притяжательное'],
      is: 'Noun',
    },

    FemaleNoun: {
      aliases: [null, 'ЖенскийРод'],
      is: 'Noun',
      not: ['MaleNoun', 'NeuterNoun']
    },
    MaleNoun: {
      aliases: [null, 'МужскойРод'],
      is: 'Noun',
      not: ['FemaleNoun', 'NeuterNoun']
    },
    NeuterNoun: {
      aliases: [null, 'СреднийРод'],
      is: 'Noun',
      not: ['MaleNoun', 'FemaleNoun']
    },
    // grammatically-animate (people + animals) - accusative takes genitive form
    AnimateNoun: {
      aliases: [null, 'Одушевлённое', 'Одушевленное'],
      is: 'Noun',
    },

  };

  var verbs$1 = {
    Verb: {
      aliases: [null, 'Глагол'],
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    PresentTense: {
      aliases: [null, 'НастоящееВремя'],
      is: 'Verb',
      not: ['PastTense', 'FutureTense'],
    },
    // russian infinitives (читать) are their own form - not a present-tense
    Infinitive: {
      aliases: [null, 'Инфинитив'],
      is: 'Verb',
      not: ['Gerund'],
    },
    // деепричастие (читая, прочитав)
    Gerund: {
      aliases: [null, 'Деепричастие'],
      is: 'Verb',
      not: ['Copula'],
    },
    PastTense: {
      aliases: [null, 'ПрошедшееВремя'],
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'FutureTense'],
    },
    FutureTense: {
      aliases: [null, 'БудущееВремя'],
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      aliases: [null, 'Связка'],
      is: 'Verb',
    },
    Modal: {
      aliases: [null, 'Модальный'],
      is: 'Verb',
      not: ['Infinitive'],
    },
    PerfectTense: {
      is: 'Verb',
      not: ['Gerund'],
    },
    // причастие (читающий, прочитанный) - declines like an adjective
    Participle: {
      aliases: [null, 'Причастие'],
      is: 'Adjective',
    },
    Auxiliary: {
      aliases: [null, 'Вспомогательный'],
      is: 'Verb',
      not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
    },
    // 'я бы хотел'
    Conditional: {
      aliases: [null, 'СослагательноеНаклонение'],
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },
    // verbs ending in -ся/-сь
    Reflexive: {
      aliases: [null, 'Возвратный'],
      is: 'Verb',
    },
    // moods
    Imperative: {
      aliases: [null, 'ПовелительноеНаклонение'],
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense'],
    },

    //
    FirstPerson: {
      aliases: [null, 'ПервоеЛицо'],
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPerson: {
      aliases: [null, 'ВтороеЛицо'],
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPerson: {
      aliases: [null, 'ТретьеЛицо'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    FirstPersonPlural: {
      aliases: [null, 'ПервоеЛицоМножественное'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPersonPlural: {
      aliases: [null, 'ВтороеЛицоМножественное'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPersonPlural: {
      aliases: [null, 'ТретьеЛицоМножественное'],
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
    },
  };

  var values = {
    Value: {
      aliases: [null, 'Число'],
      not: ['Verb', 'Adjective', 'Adverb'],
    },
    Ordinal: {
      aliases: [null, 'Порядковое'],
      is: 'Value',
      not: ['Cardinal'],
    },
    Cardinal: {
      aliases: [null, 'Количественное'],
      is: 'Value',
      not: ['Ordinal'],
    },
    Fraction: {
      aliases: [null, 'Дробь'],
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      aliases: [null, 'Кратное'],
      is: 'Value',
    },
    RomanNumeral: {
      aliases: [null, 'РимскоеЧисло'],
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      aliases: [null, 'Числительное'],
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      aliases: [null, 'Числовое'],
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      aliases: [null, 'Деньги'],
      is: 'Cardinal',
    },
    Percent: {
      aliases: [null, 'Процент'],
      is: 'Value',
    },
  };

  var dates = {
    Date: {
      aliases: [null, 'Дата'],
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      aliases: [null, 'Месяц'],
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      aliases: [null, 'ДеньНедели'],
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      aliases: [null, 'Год'],
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      aliases: [null, 'Квартал'],
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      aliases: [null, 'Праздник'],
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      aliases: [null, 'ВремяГода'],
      is: 'Date',
    },
    Timezone: {
      aliases: [null, 'ЧасовойПояс'],
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      aliases: [null, 'Время'],
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      aliases: [null, 'Длительность'],
      is: 'Noun',
      also: ['Date'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc = {
    Adjective: {
      aliases: [null, 'Прилагательное'],
      not: ['Noun', 'Verb', 'Adverb', 'Value'],
    },
    FemaleAdjective: {
      aliases: [null, 'ПрилагательноеЖенскогоРода'],
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    MaleAdjective: {
      aliases: [null, 'ПрилагательноеМужскогоРода'],
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    PluralAdjective: {
      aliases: [null, 'ПрилагательноеМножественногоЧисла'],
      is: 'Adjective',
      not: ['SingularAdjective'],
    },
    SingularAdjective: {
      aliases: [null, 'ПрилагательноеЕдинственногоЧисла'],
      is: 'Adjective',
      not: ['PluralAdjective'],
    },
    Comparable: {
      is: 'Adjective',
    },
    Comparative: {
      aliases: [null, 'СравнительнаяСтепень'],
      is: 'Adjective',
    },
    Superlative: {
      aliases: [null, 'ПревосходнаяСтепень'],
      is: 'Adjective',
      not: ['Comparative'],
    },
    NumberRange: {
      aliases: [null, 'ЧисловойДиапазон'],
    },
    Adverb: {
      aliases: [null, 'Наречие'],
      not: ['Noun', 'Verb', 'Adjective', 'Value'],
    },

    Determiner: {
      aliases: [null, 'Определитель'],
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
    },
    // же, ли, бы, ведь..
    Particle: {
      aliases: [null, 'Частица'],
      not: ['Noun', 'Verb', 'Adjective', 'Adverb'],
    },
    // не, ни, нет
    Negative: {
      aliases: [null, 'Отрицание'],
      not: ['Noun', 'Adjective', 'Value'],
    },
    Conjunction: {
      aliases: [null, 'Союз'],
      not: anything,
    },
    Preposition: {
      aliases: [null, 'Предлог'],
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      aliases: [null, 'ВопросительноеСлово'],
      not: ['Determiner'],
    },
    Currency: {
      aliases: [null, 'Валюта'],
      is: 'Noun',
    },
    Expression: {
      aliases: [null, 'Междометие'],
      not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
    },
    Abbreviation: {
      aliases: [null, 'Сокращение'],
    },
    Url: {
      aliases: [null, 'Ссылка'],
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      aliases: [null, 'Телефон'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {
      aliases: [null, 'Хэштег'],
    },
    AtMention: {
      aliases: [null, 'Упоминание'],
      is: 'Noun',
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      aliases: [null, 'Эмодзи'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      aliases: [null, 'Смайлик'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      aliases: [null, 'Почта'],
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      aliases: [null, 'Акроним'],
      not: ['Plural', 'RomanNumeral'],
    },
    Condition: {
      aliases: [null, 'Условие'],
      not: ['Verb', 'Adjective', 'Noun', 'Value'],
    },
  };

  const tags = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

  var tagset = {
    tags
  };

  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of verb
  const getRoot = function (m) {
    m.compute('root');
    const str = m.text('root');
    return str
  };

  const buduMap = {
    first: 'буду',
    second: 'будешь',
    third: 'будет',
    firstPlural: 'будем',
    secondPlural: 'будете',
    thirdPlural: 'будут',
  };
  const pronounPerson = {
    'я': 'first',
    'ты': 'second',
    'мы': 'firstPlural',
    'вы': 'secondPlural',
    'они': 'thirdPlural',
    'он': 'third',
    'она': 'third',
    'оно': 'third',
  };
  const pronounGender = {
    'он': 'masc',
    'она': 'fem',
    'оно': 'neut',
  };

  // which conjugation-slot is this verb-phrase in?
  const getPerson = function (m) {
    if (m.has('#FirstPersonPlural')) {
      return 'firstPlural'
    }
    if (m.has('#SecondPersonPlural')) {
      return 'secondPlural'
    }
    if (m.has('#ThirdPersonPlural')) {
      return 'thirdPlural'
    }
    if (m.has('#FirstPerson')) {
      return 'first'
    }
    if (m.has('#SecondPerson')) {
      return 'second'
    }
    if (m.has('#ThirdPerson')) {
      return 'third'
    }
    // no person-tag (past-tense) - look for a subject-pronoun
    const pron = m.lookBehind('#Pronoun').last().text('normal');
    if (pronounPerson[pron]) {
      return pronounPerson[pron]
    }
    if (m.has('#PastTense') && /(ли|лись)$/.test(m.text('normal'))) {
      return 'thirdPlural'
    }
    return 'third'
  };

  // which past-tense form (masc/fem/neut/plural) fits this context?
  const getPastSlot = function (m, person) {
    if (/Plural/.test(person)) {
      return 'plural'
    }
    const str = m.text('normal');
    if (m.has('#PastTense')) {
      if (/(ли|лись)$/.test(str)) {
        return 'plural'
      }
      if (/(ла|лась)$/.test(str)) {
        return 'fem'
      }
      if (/(ло|лось)$/.test(str)) {
        return 'neut'
      }
      return 'masc'
    }
    const pron = m.lookBehind('#Pronoun').last().text('normal');
    return pronounGender[pron] || 'masc'
  };

  // split a verb-phrase into its finite head + trailing infinitives
  // ('буду читать' → [буду, читать],  'хочет работать' → [хочет, работать])
  const parseVerb = function (m) {
    const inf = m.match('#Infinitive');
    const head = m.not('#Infinitive');
    return { head, inf }
  };

  const api$2 = function (View) {
    class Verbs extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Verbs';
      }
      conjugate(n) {
        const methods = this.methods.two.transform.verb;
        const { toPresent, toPast, toFuture, toImperative, toGerund, isPerfective, getAspectPair } = methods;
        return getNth(this, n).map(m => {
          const str = getRoot(m);
          const perfective = isPerfective(str);
          return {
            infinitive: str,
            aspect: perfective ? 'perfective' : 'imperfective',
            // the matching verb of the opposite aspect, if known
            aspectPair: getAspectPair(str),
            // for perfective verbs, non-past morphology is semantically future-tense
            presentTense: toPresent(str),
            futureTense: toFuture(str),
            pastTense: toPast(str),
            imperative: toImperative(str),
            gerund: toGerund(str),
          }
        }, [])
      }

      toPastTense(n) {
        const { toPast } = this.methods.two.transform.verb;
        return getNth(this, n).map(m => {
          if (m.has('#PastTense')) {
            return m
          }
          const { head, inf } = parseVerb(m);
          if (!head.found) {
            return m
          }
          const person = getPerson(head);
          const slot = getPastSlot(head, person);
          // 'буду читать' → 'читал',  'будет' → 'был'
          if (head.has('#Copula')) {
            const root = inf.found ? inf.text('normal') : 'быть';
            return m.replaceWith(toPast(root)[slot])
          }
          head.replaceWith(toPast(getRoot(head))[slot]);
          return m.toView()
        })
      }

      toPresentTense(n) {
        const { toPresent, isPerfective, getAspectPair } = this.methods.two.transform.verb;
        return getNth(this, n).map(m => {
          if (m.has('#PresentTense')) {
            return m
          }
          const { head, inf } = parseVerb(m);
          if (!head.found) {
            return m
          }
          const person = getPerson(head);
          // 'буду читать' → 'читаю'
          if (head.has('#Copula')) {
            if (inf.found) {
              return m.replaceWith(toPresent(inf.text('normal'))[person])
            }
            return m
          }
          let root = getRoot(head);
          // perfective has no present - swap to its imperfective pair ('прочитал' → 'читаю')
          if (isPerfective(root)) {
            root = getAspectPair(root) || root;
          }
          head.replaceWith(toPresent(root)[person]);
          return m.toView()
        })
      }

      toFutureTense(n) {
        const { toPresent, isPerfective } = this.methods.two.transform.verb;
        return getNth(this, n).map(m => {
          if (m.has('#FutureTense')) {
            return m
          }
          const { head, inf } = parseVerb(m);
          if (!head.found) {
            return m
          }
          const person = getPerson(head);
          // 'был'/'есть' → 'будет'
          if (head.has('#Copula')) {
            return m.replaceWith(buduMap[person] + (inf.found ? ' ' + inf.text('normal') : ''))
          }
          const root = getRoot(head);
          // perfective conjugates straight to future; imperfective takes буду + infinitive
          if (isPerfective(root)) {
            head.replaceWith(toPresent(root)[person]);
          } else {
            head.replaceWith(buduMap[person] + ' ' + root);
          }
          return m.toView()
        })
      }

      toInfinitive(n) {
        return getNth(this, n).map(m => {
          const { head, inf } = parseVerb(m);
          if (!head.found) {
            return m
          }
          // 'будем работать' collapses to 'работать'
          if (head.has('#Copula') && inf.found) {
            return m.replaceWith(inf.text('normal'))
          }
          let root = getRoot(head);
          if (head.has('#Copula')) {
            root = 'быть';
          }
          head.replaceWith(root);
          return m.toView()
        })
      }
    }

    View.prototype.verbs = function (n) {
      let m = this.match('#Verb+');
      m = getNth(m, n);
      return new Verbs(this.document, m.pointer)
    };
  };

  const keep$1 = { tags: true };

  // singular determiner-forms → plural
  const detPlural = {
    'этот': 'эти', 'эта': 'эти', 'это': 'эти',
    'тот': 'те', 'та': 'те', 'то': 'те',
    'весь': 'все', 'вся': 'все', 'всё': 'все', 'все': 'все',
    'мой': 'мои', 'моя': 'мои', 'моё': 'мои', 'мое': 'мои',
    'твой': 'твои', 'твоя': 'твои', 'твоё': 'твои', 'твое': 'твои',
    'наш': 'наши', 'наша': 'наши', 'наше': 'наши',
    'ваш': 'ваши', 'ваша': 'ваши', 'ваше': 'ваши',
    'свой': 'свои', 'своя': 'свои', 'своё': 'свои', 'свое': 'свои',
    'какой': 'какие', 'какая': 'какие', 'какое': 'какие',
    'такой': 'такие', 'такая': 'такие', 'такое': 'такие',
  };
  // plural determiner-forms → singular, by gender
  const detSingular = {
    'эти': { masculine: 'этот', feminine: 'эта', neuter: 'это' },
    'те': { masculine: 'тот', feminine: 'та', neuter: 'то' },
    'все': { masculine: 'весь', feminine: 'вся', neuter: 'всё' },
    'мои': { masculine: 'мой', feminine: 'моя', neuter: 'моё' },
    'твои': { masculine: 'твой', feminine: 'твоя', neuter: 'твоё' },
    'наши': { masculine: 'наш', feminine: 'наша', neuter: 'наше' },
    'ваши': { masculine: 'ваш', feminine: 'ваша', neuter: 'ваше' },
    'свои': { masculine: 'свой', feminine: 'своя', neuter: 'своё' },
    'какие': { masculine: 'какой', feminine: 'какая', neuter: 'какое' },
    'такие': { masculine: 'такой', feminine: 'такая', neuter: 'такое' },
  };

  // re-agree the words modifying + governed-by this noun
  const agreeAround = function (m, methods, form) {
    const { adjective, verb } = methods;
    // preceding adjectives + determiners  ('новая' in 'новая книга')
    const mods = m.before('(#Adjective|#Determiner|#Possessive)+$');
    mods.terms().forEach(t => {
      const str = t.text('normal');
      if (detPlural[str] !== undefined || detSingular[str] !== undefined) {
        const out = form.plural ? detPlural[str] : (detSingular[str] || {})[form.gender];
        if (out) {
          t.replaceWith(out, keep$1);
        }
        return
      }
      const fns = {
        plural: adjective.toPlural,
        masculine: adjective.toMasculine,
        feminine: adjective.toFeminine,
        neuter: adjective.toNeuter,
      };
      const fn = form.plural ? fns.plural : fns[form.gender];
      const out = fn(str);
      if (out !== str) {
        t.replaceWith(out, keep$1);
      }
    });
    // the verb right after the noun  ('лежала' in 'книга лежала на столе')
    const vb = m.after('^(#Adverb|#Negative)? [#Verb]', 0);
    if (!vb.found) {
      return
    }
    vb.compute('root');
    let root = vb.text('root');
    if (vb.has('#Copula')) {
      root = 'быть';
    }
    if (vb.has('#PastTense')) {
      const slot = form.plural ? 'plural' : { masculine: 'masc', feminine: 'fem', neuter: 'neut' }[form.gender];
      vb.replaceWith(verb.toPast(root)[slot]);
    } else if (vb.has('#ThirdPerson') && form.plural) {
      vb.replaceWith(verb.toPresent(root).thirdPlural);
    } else if (vb.has('#ThirdPersonPlural') && !form.plural) {
      vb.replaceWith(verb.toPresent(root).third);
    }
  };

  const api$1 = function (View) {
    class Nouns extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Nouns';
      }
      toPlural(n) {
        const methods = this.methods.two.transform;
        return getNth(this, n).map(m => {
          // a preceding preposition signals an oblique case ('на столе') - leave it
          if (m.before('#Preposition$').found) {
            return m
          }
          const str = m.text('normal');
          const plural = methods.noun.toPlural(str);
          if (plural !== str) {
            agreeAround(m, methods, { plural: true });
            m = m.replaceWith(plural, keep$1);
          }
          return m
        })
      }
      toSingular(n) {
        const methods = this.methods.two.transform;
        return getNth(this, n).map(m => {
          // a preceding preposition signals an oblique case - leave it
          if (m.before('#Preposition$').found) {
            return m
          }
          const str = m.text('normal');
          const single = methods.noun.toSingular(str);
          if (single !== str) {
            const gender = methods.noun.guessGender(single);
            agreeAround(m, methods, { plural: false, gender });
            m = m.replaceWith(single, keep$1);
          }
          return m
        })
      }
      // gender of each noun - from the lexicon-tag, else the ending
      gender(n) {
        const { guessGender } = this.methods.two.transform.noun;
        return getNth(this, n).map(m => {
          if (m.has('#FemaleNoun')) {
            return 'feminine'
          }
          if (m.has('#MaleNoun')) {
            return 'masculine'
          }
          if (m.has('#NeuterNoun')) {
            return 'neuter'
          }
          return guessGender(m.text('normal'))
        }, [])
      }
      isFeminine(n) {
        const genders = this.gender();
        const res = this.filter((m, i) => genders[i] === 'feminine');
        return getNth(res, n)
      }
      isMasculine(n) {
        const genders = this.gender();
        const res = this.filter((m, i) => genders[i] === 'masculine');
        return getNth(res, n)
      }
      isNeuter(n) {
        const genders = this.gender();
        const res = this.filter((m, i) => genders[i] === 'neuter');
        return getNth(res, n)
      }
      isAnimate(n) {
        const { guessAnimate } = this.methods.two.transform.noun;
        const res = this.filter(m => m.has('#AnimateNoun') || guessAnimate(m.text('normal')));
        return getNth(res, n)
      }
      // full case-table for each noun - singular + plural
      decline(n) {
        const { decline, declinePlural, guessAnimate } = this.methods.two.transform.noun;
        const genders = this.gender();
        return getNth(this, n).map((m, i) => {
          const str = m.text('normal');
          const animate = m.has('#AnimateNoun') || guessAnimate(str);
          const res = decline(str, genders[i], animate);
          res.plural = declinePlural(str, genders[i], animate);
          return res
        }, [])
      }
    }

    View.prototype.nouns = function (n) {
      let m = this.match('#Noun');
      // pronouns + names don't pluralize well
      m = m.not('#Pronoun');
      m = m.not('#ProperNoun');
      m = getNth(m, n);
      return new Nouns(this.document, m.pointer)
    };
  };

  var nouns = {
    api: api$1,
  };

  const keep = { tags: true };

  const swapWith = function (view, n, fn) {
    return getNth(view, n).map(m => {
      const str = m.text('normal');
      const out = fn(str);
      if (out !== str) {
        m = m.replaceWith(out, keep);
      }
      return m
    })
  };

  const api = function (View) {
    class Adjectives extends View {
      constructor(document, pointer, groups) {
        super(document, pointer, groups);
        this.viewType = 'Adjectives';
      }
      toMasculine(n) {
        return swapWith(this, n, this.methods.two.transform.adjective.toMasculine)
      }
      toFeminine(n) {
        return swapWith(this, n, this.methods.two.transform.adjective.toFeminine)
      }
      toNeuter(n) {
        return swapWith(this, n, this.methods.two.transform.adjective.toNeuter)
      }
      toPlural(n) {
        return swapWith(this, n, this.methods.two.transform.adjective.toPlural)
      }
      toComparative(n) {
        return swapWith(this, n, this.methods.two.transform.adjective.toComparative)
      }
      toSuperlative(n) {
        return swapWith(this, n, this.methods.two.transform.adjective.toSuperlative)
      }
    }

    View.prototype.adjectives = function (n) {
      let m = this.match('#Adjective');
      m = getNth(m, n);
      return new Adjectives(this.document, m.pointer)
    };
  };

  var adjectives = {
    api,
  };

  var verbs = {
    api: api$2,
  };

  var version = '0.0.5';

  nlp.plugin(tokenizer);
  nlp.plugin(tagset);
  nlp.plugin(lexicon);
  nlp.plugin(preTagger);
  nlp.plugin(postTagger);
  nlp.plugin(nouns);
  nlp.plugin(adjectives);
  nlp.plugin(verbs);
  // nlp.plugin(numbers)


  const es = function (txt, lex) {
    return nlp(txt, lex)
  };

  // copy constructor methods over
  Object.keys(nlp).forEach(k => {
    if (nlp.hasOwnProperty(k)) {
      es[k] = nlp[k];
    }
  });

  // this one is hidden
  Object.defineProperty(es, '_world', {
    value: nlp._world,
    writable: true,
  });

  /** log the decision-making to console */
  es.verbose = function (set) {
    const env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  es.version = version;

  return es;

}));

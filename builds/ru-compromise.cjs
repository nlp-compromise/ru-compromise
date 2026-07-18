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

  const isArray$a = input => Object.prototype.toString.call(input) === '[object Array]';

  const fns$4 = {
    /** add metadata to term objects */
    compute: function (input) {
      const { world } = this;
      const compute = world.compute;
      // do one method
      if (typeof input === 'string' && compute.hasOwnProperty(input)) {
        compute[input](this);
      }
      // allow a list of methods
      else if (isArray$a(input)) {
        input.forEach(name => {
          if (world.compute.hasOwnProperty(name)) {
            compute[name](this);
          } else {
            console.warn('no compute:', input); // eslint-disable-line
          }
        });
      }
      // allow a custom compute function
      else if (typeof input === 'function') {
        input(this);
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

  const methods$n = Object.assign({}, utils, fns$4, loops);

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
        start = start || 0;
        end = end || (document[n] || []).length;
        //add frozen id, for good-measure
        if (document[n] && document[n][start]) {
          id = id || document[n][start].id;
          if (document[n][end - 1]) {
            endId = endId || document[n][end - 1].id;
          }
        }
        return [n, start, end, id, endId]
      })
    }
    // create a new View, from this one
    update(pointer) {
      const m = new View(this.document, pointer);
      // send the cache down, too?
      if (this._cache && pointer && pointer.length > 0) {
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
          term = Object.assign({}, term);
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

  var version$1 = '14.16.0';

  const isObject$6 = function (item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  };

  const isArray$9 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
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
      model[key] = model[key] || {};
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
    if (isArray$9(plugin)) {
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

  /** log the decision-making to console */
  const verbose = function (set) {
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  const isObject$5 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  const isArray$8 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // internal Term objects are slightly different
  const fromJson = function (json) {
    return json.map(o => {
      return o.terms.map(term => {
        if (isArray$8(term.tags)) {
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
    if (isArray$8(input)) {
      // pre-tokenized array-of-arrays 
      if (isArray$8(input[0])) {
        const document = preTokenized(input);
        return new View(document)
      }
      // handle json output
      const document = fromJson(input);
      return new View(document)
    }
    return doc
  };

  const world = Object.assign({}, tmpWrld);

  const nlp = function (input, lex) {
    if (lex) {
      nlp.addWords(lex);
    }
    const doc = inputs(input, View, world);
    if (input) {
      doc.compute(world.hooks);
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
    if (compute.contractions) {
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

  /** log the decision-making to console */
  nlp.verbose = verbose;
  /** current library release version */
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
        const tags = Array.from(term.tags);
        for (let t = 0; t < tags.length; t += 1) {
          items.add('#' + tags[t]);
        }
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
      const args = [index, 0].concat(child);
      Array.prototype.splice.apply(parent, args);
    }
    return parent
  };

  // add a space at end, if required
  const endSpace = function (terms) {
    const hasSpace = / $/;
    const hasDash = /[-–—]/;
    const lastTerm = terms[terms.length - 1];
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
      const last = needle[needle.length - 1];
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
        needle[needle.length - 1].post += ' ';
      }
    }
    spliceArr(home, ptr[2], needle);
    // set new endId
    ptr[4] = needle[needle.length - 1].id;
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

  const isArray$7 = arr => Object.prototype.toString.call(arr) === '[object Array]';

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
    if (isArray$7(input)) {
      return isArray$7(input[0]) ? input[0] : input
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
      if (document[n] && document[n][ptr[1]]) {
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
      if (groups.hasOwnProperty(num)) {
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
    const isOriginalPossessive = keep.possessives && terms[terms.length - 1].tags.has('Possessive');
    const isOriginalTitleCase = keep.case && isTitleCase$1(terms[0].text);
    // support 'foo $0' replacements
    input = subDollarSign(input, main);

    const original = this.update(ptrs);
    // soften-up pointer
    ptrs = ptrs.map(ptr => ptr.slice(0, 3));
    // original.freeze()
    let oldTags = (original.docs[0] || []).map(term => Array.from(term.tags));
    const originalPre = original.docs[0][0].pre;
    const originalPost = original.docs[0][original.docs[0].length - 1].post;
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
      const term = tmp[tmp.length - 1];
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
      const lastOne = main.docs[0][main.docs[0].length - 1];
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

  // transfer sentence-ending punctuation
  const repairPunct = function (terms, len) {
    const last = terms.length - 1;
    const from = terms[last];
    const to = terms[last - len];
    if (to && from) {
      to.post += from.post; //this isn't perfect.
      to.post = to.post.replace(/ +([.?!,;:])/, '$1');
      // don't allow any silly punctuation outcomes like ',!'
      to.post = to.post.replace(/[,;:]+([.?!])/, '$1');
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
          const lastTerm = terms[terms.length - 1];
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
        const last = this.docs[this.docs.length - 1];
        return last[last.length - 1].post
      }
      this.docs.forEach(terms => {
        const term = terms[terms.length - 1];
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
      const last = docs[docs.length - 1];
      const end = last[last.length - 1];
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
      start = start || `"`;
      end = end || `"`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms[terms.length - 1];
        last.post = end + last.post;
      });
      return this
    },

    /** add brackets around these matches */
    toParentheses: function (start, end) {
      start = start || `(`;
      end = end || `)`;
      this.docs.forEach(terms => {
        terms[0].pre = start + terms[0].pre;
        const last = terms[terms.length - 1];
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
    const counts = {};
    arr.forEach(o => {
      counts[o.normal] = counts[o.normal] || 0;
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
    input = input || 'alpha';
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

  const isArray$6 = (arr) => Object.prototype.toString.call(arr) === '[object Array]';

  // append a new document, somehow
  const combineDocs = function (homeDocs, inputDocs) {
    if (homeDocs.length > 0) {
      // add a space
      const end = homeDocs[homeDocs.length - 1];
      const last = end[end.length - 1];
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
          const at = ptrs[ptrs.length - 1][0];
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
      if (isArray$6(input)) {
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
    if (!ptr || ptr.length < 1) {
      return this
    }
    ptr = ptr.map(a => a.slice(0, 3));
    this.ptrs = ptr;
    return this
  };
  var harden$1 = { harden, soften };

  const methods$h = Object.assign({}, caseFns, fns$3, fns$2, methods$k, methods$j, sort$1, concat, harden$1);

  const addAPI$2 = function (View) {
    Object.assign(View.prototype, methods$h);
  };

  const compute$5 = {
    id: function (view) {
      const docs = view.docs;
      for (let n = 0; n < docs.length; n += 1) {
        for (let i = 0; i < docs[n].length; i += 1) {
          const term = docs[n][i];
          term.id = term.id || toId(term);
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
  const t$1 = true;
  var numberSuffixes = {
    'st': t$1,
    'nd': t$1,
    'rd': t$1,
    'th': t$1,
    'am': t$1,
    'pm': t$1,
    'max': t$1,
    '°': t$1,
    's': t$1, // 1990s
    'e': t$1, // 18e - french/spanish ordinal
    'er': t$1, //french 1er
    'ère': t$1, //''
    'ème': t$1, //french 2ème
  };

  var model$5 = {
    one: {
      contractions: contractions$2,
      numberSuffixes
    }
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
      if (notUnit.hasOwnProperty(unit)) {
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

  const toDocs = function (words, view) {
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
        if (!words && byEnd.hasOwnProperty(after)) {
          words = byEnd[after](terms, i, world);
        }
        // ['j', 'aime']
        if (!words && byStart.hasOwnProperty(before)) {
          words = byStart[before](terms, i);
        }
        // 'there is' vs 'there has'
        if (before === 'there' && after === 's') {
          words = thereHas(terms, i);
        }
        // actually insert the new terms
        if (words) {
          words = toDocs(words, view);
          insertContraction(document, [n, i], words);
          reTag(document[n], view, i, words.length);
          continue
        }
        // '44-2' has special care
        if (numDash.test(terms[i].normal)) {
          words = numberRange(terms, i);
          if (words) {
            words = toDocs(words, view);
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
          words = toDocs(words, view);
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
            if (frozenLex.hasOwnProperty(str) === true) {
              setTag(words, frozenLex[str], world, false, '1-frozen-multi-lexicon');
              words.forEach(term => (term.frozen = true));
              continue
            }
          }
        }
        // test single word
        if (frozenLex[word] !== undefined && frozenLex.hasOwnProperty(word)) {
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
  const blue = str => '\x1b[34m' + str + '\x1b[0m';
  const dim = str => '\x1b[3m\x1b[2m' + str + '\x1b[0m';

  const debug$2 = function (view) {
    view.docs.forEach(terms => {
      console.log(blue('\n  ┌─────────'));
      terms.forEach(t => {
        let str = `  ${dim('│')}  `;
        const txt = t.implicit || t.text || '-';
        if (t.frozen === true) {
          str += `${blue(txt)} ❄️`;
        } else {
          str += dim(txt);
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
        if (lexicon.hasOwnProperty(str) === true) {
          const tag = lexicon[str];
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
    if (lexicon[word] !== undefined && lexicon.hasOwnProperty(word)) {
      setTag([t], lexicon[word], world, false, '1-lexicon');
      return true
    }
    // lookup aliases in the lexicon
    if (t.alias) {
      const found = t.alias.find(str => lexicon.hasOwnProperty(str));
      if (found) {
        setTag([t], lexicon[found], world, false, '1-lexicon-alias');
        return true
      }
    }
    // prefixing for verbs/adjectives
    if (prefix$1.test(word) === true) {
      const stem = word.replace(prefix$1, '');
      if (lexicon.hasOwnProperty(stem) && stem.length > 3) {
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
          found = found || multiWord(terms, i, world);
          // lookup known words
          found = found || checkLexicon(terms, i, world);
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
      lex[word] = lex[word] || tag;
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
        if (goNext[curr] && goNext[curr].hasOwnProperty(word)) {
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

    while (xs.length) {
      const r = xs.shift();
      // for each symbol a such that g(r, a) = s
      const keys = Object.keys(goNext[r]);
      for (let i = 0; i < keys.length; i += 1) {
        const word = keys[i];
        const s = goNext[r][word];
        xs.push(s);
        // set state = f(r)
        n = failTo[r];
        while (n > 0 && !goNext[n].hasOwnProperty(word)) {
          n = failTo[n];
        }
        if (goNext.hasOwnProperty(n)) {
          const fs = goNext[n][word];
          failTo[s] = fs;
          if (endAs[fs]) {
            endAs[s] = endAs[s] || [];
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
      while (n > 0 && (trie.goNext[n] === undefined || !trie.goNext[n].hasOwnProperty(word))) {
        n = trie.failTo[n] || 0; // (usually back to 0)
      }
      // did we fail?
      if (!trie.goNext[n].hasOwnProperty(word)) {
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
    opts.form = opts.form || 'normal';
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

  const isArray$5 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc$2 = (reg, view, group) => {
    if (typeof reg === 'string' || isArray$5(reg)) {
      return view.match(reg, group)
    }
    if (!reg) {
      return view.none()
    }
    return reg
  };

  const addIds$1 = function (ptr, view) {
    const [n, start, end] = ptr;
    if (view.document[n] && view.document[n][start]) {
      ptr[3] = ptr[3] || view.document[n][start].id;
      if (view.document[n][end - 1]) {
        ptr[4] = ptr[4] || view.document[n][end - 1].id;
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
      if (!all[i].after && all[i + 1] && all[i + 1].before) {
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
    lMatch = lMatch || '.$'; //defaults
    rMatch = rMatch || '^.';
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

  const methods$d = Object.assign({}, match$2, lookaround, methods$f, methods$e);
  // aliases
  methods$d.lookBehind = methods$d.before;
  methods$d.lookBefore = methods$d.before;

  methods$d.lookAhead = methods$d.after;
  methods$d.lookAfter = methods$d.after;

  methods$d.notIf = methods$d.ifNo;
  const matchAPI = function (View) {
    Object.assign(View.prototype, methods$d);
  };

  // match  'foo /yes/' and not 'foo/no/bar'
  const bySlashes = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/;
  // match '(yes) but not foo(no)bar'
  const byParentheses = /([!~[^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/;
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
      res = res.concat(str.split(byParentheses));
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
  const captureName = new RegExp(/^<\s*(\S+)\s*>/);
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
  const parseToken = function (w, opts) {
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
        obj.min = opts.fuzzy || 0.85;
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
          return str.split(/ /g).map(s => parseToken(s, opts))
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
      obj.tag = stripStart(w);
      obj.tag = titleCase(obj.tag);
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

  const hasDash$2 = /[a-z0-9][-–—][a-z]/i;

  // match 're-do' -> ['re','do']
  const splitHyphens$1 = function (regs, world) {
    const prefixes = world.model.one.prefixes;
    for (let i = regs.length - 1; i >= 0; i -= 1) {
      const reg = regs[i];
      if (reg.word && hasDash$2.test(reg.word)) {
        let words = reg.word.split(/[-–—]/g);
        // don't split 're-cycle', etc
        if (prefixes.hasOwnProperty(words[0])) {
          continue
        }
        words = words.filter(w => w).reverse();
        regs.splice(i, 1);
        words.forEach(w => {
          const obj = Object.assign({}, reg);
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
    opts = opts || {};
    if (typeof input === 'number') {
      input = String(input); //go for it?
    }
    let tokens = parseBlocks(input);
    //turn them into objects
    tokens = tokens.map(str => parseToken(str, opts));
    // '~re-do~'
    tokens = splitHyphens$1(tokens, world);
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
      // perform a speedup for fast-or
      if (reg.fastOr && anyIntersection(reg.fastOr, cache) === false) {
        return false
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

  const hasHyphen$1 = /^[-–—]$/;
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
    hasHyphen: term => hasHyphen$1.test(term.post) || hasHyphen$1.test(term.pre),
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
      // term aliases for slashes and things
      if (term.alias !== undefined && term.alias.hasOwnProperty(reg.word)) {
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
    const reg = Object.assign({}, state.regs[state.r], { start: false, end: false });
    const start = state.t;
    for (; state.t < state.terms.length; state.t += 1) {
      //stop for next-reg match
      if (endReg && wrapMatch(state.terms[state.t], endReg, state.start_i + state.t, state.phrase_length)) {
        return state.t
      }
      const count = state.t - start + 1;
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
        const tmpReg = Object.assign({}, reg, { end: false });
        if (wrapMatch(state.terms[state.t], tmpReg, state.start_i + state.t, state.phrase_length) === true) {
          // console.log(`endGreedy ${state.terms[state.t].normal}`)
          return true
        }
      }
    }
    return false
  };

  const getGroup$1 = function (state, term_index) {
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
    if (skipto === null || skipto === 0) {
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
      g.length = skipto - state.t;
    }
    state.t = skipto;
    // log(`✓ |greedy|`)
    return true
  };

  const isArray$4 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const doOrBlock = function (state, skipN = 0) {
    const block = state.regs[state.r];
    let wasFound = false;
    // do each multiword sequence
    for (let c = 0; c < block.choices.length; c += 1) {
      // try to match this list of tokens
      const regs = block.choices[c];
      if (!isArray$4(regs)) {
        return false
      }
      wasFound = regs.every((cr, w_index) => {
        let extra = 0;
        const t = state.t + w_index + skipN + extra;
        if (state.terms[t] === undefined) {
          return false
        }
        const foundBlock = wrapMatch(state.terms[t], cr, t + state.start_i, state.phrase_length);
        // this can be greedy - '(foo+ bar)'
        if (foundBlock === true && cr.greedy === true) {
          for (let i = 1; i < state.terms.length; i += 1) {
            const term = state.terms[t + i];
            if (term) {
              const keepGoing = wrapMatch(term, cr, state.start_i + i, state.phrase_length);
              if (keepGoing === true) {
                extra += 1;
              } else {
                break
              }
            }
          }
        }
        skipN += extra;
        return foundBlock
      });
      if (wasFound) {
        skipN += regs.length;
        break
      }
    }
    // we found a match -  is it greedy though?
    if (wasFound && block.greedy === true) {
      return doOrBlock(state, skipN) // try it again!
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
        return wrapMatch(state.terms[tryTerm], cr, tryTerm, state.phrase_length)
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
    } else if (!reg.optional) {
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
        const end = state.phrase_length - 1;
        if (state.t + state.start_i !== end) {
          return null
        }
      }
      state.t += skipNum;
      // log(`✓ |found-and|`)
      return true
    } else if (!reg.optional) {
      return null //die
    }
    return true
  };

  const negGreedy = function (state, reg, nextReg) {
    let skip = 0;
    for (let t = state.t; t < state.terms.length; t += 1) {
      let found = wrapMatch(state.terms[t], reg, state.start_i + state.t, state.phrase_length);
      // we don't want a match, here
      if (found) {
        break//stop going
      }
      // are we doing 'greedy-to'?
      // - "!foo+ after"  should stop at 'after'
      if (nextReg) {
        found = wrapMatch(state.terms[t], nextReg, state.start_i + state.t, state.phrase_length);
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
    const tmpReg = Object.assign({}, reg);
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
      if (!nextTerm || !wrapMatch(nextTerm, regs[state.r + 1], state.start_i + state.t, state.phrase_length)) {
        state.r += 1;
      }
    }
  };

  // keep 'foo+' or 'foo*' going..
  const greedyMatch = function (state) {
    const { regs, phrase_length } = state;
    const reg = regs[state.r];
    state.t = getGreedy(state, regs[state.r + 1]);
    if (state.t === null) {
      return null //greedy was too short
    }
    // foo{2,4} - has a greed-minimum
    if (reg.min && reg.min > state.t) {
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
    if (state.t > 1 && reg.greedy) {
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
  const tryHere = function (terms, regs, start_i, phrase_length) {
    // console.log(`\n\n:start: '${terms[0].text}':`)
    if (terms.length === 0 || regs.length === 0) {
      return null
    }
    // all the variables that matter
    const state = {
      t: 0,
      terms: terms,
      r: 0,
      regs: regs,
      groups: {},
      start_i: start_i,
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
    const pntr = [null, start_i, state.t + start_i];
    if (pntr[1] === pntr[2]) {
      return null //found 0 terms
    }
    const groups = {};
    Object.keys(state.groups).forEach(k => {
      const o = state.groups[k];
      const start = start_i + o.start;
      groups[k] = [null, start, start + o.length];
    });
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
          byGroup[k] = byGroup[k] || [];
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
        const slice = terms.slice(i);
        const found = tryHere(slice, not, i, terms.length);
        if (found !== null) {
          return false
        }
      }
      return true
    });
    return results
  };

  // make proper pointers
  const addSentence = function (res, n) {
    res.pointer[0] = n;
    Object.keys(res.groups).forEach(k => {
      res.groups[k][0] = n;
    });
    return res
  };

  const handleStart = function (terms, regs, n) {
    let res = tryHere(terms, regs, 0, terms.length);
    if (res) {
      res = addSentence(res, n);
      return res //getGroup([res], group)
    }
    return null
  };

  // ok, here we go.
  const runMatch$1 = function (docs, todo, cache) {
    cache = cache || [];
    const { regs, group, justOne } = todo;
    let results = [];
    if (!regs || regs.length === 0) {
      return { ptrs: [], byGroup: {} }
    }

    const minLength = regs.filter(r => r.optional !== true && r.negative !== true).length;
    docs: for (let n = 0; n < docs.length; n += 1) {
      const terms = docs[n];
      // let index = terms[0].index || []
      // can we skip this sentence?
      if (cache[n] && failFast(regs, cache[n])) {
        continue
      }
      // ^start regs only run once, per phrase
      if (regs[0].start === true) {
        const foundStart = handleStart(terms, regs, n);
        if (foundStart) {
          results.push(foundStart);
        }
        continue
      }
      //ok, try starting the match now from every term
      for (let i = 0; i < terms.length; i += 1) {
        const slice = terms.slice(i);
        // ensure it's long-enough
        if (slice.length < minLength) {
          break
        }
        let res = tryHere(slice, regs, i, terms.length);
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
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&apos;');
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
        starts[a] = starts[a] || [];
        starts[a].push(tag.start);
        const b = terms[terms.length - 1].id;
        ends[b] = ends[b] || [];
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
        if (starts.hasOwnProperty(t.id)) {
          out += starts[t.id].join('');
        }
        out += t.pre || '';
        out += t.text || '';
        if (ends.hasOwnProperty(t.id)) {
          out += ends[t.id].join('');
        }
        out += t.post || '';
      }
    });
    return out
  };
  var html$1 = { html };

  const trimEnd = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/;
  const trimStart =
    /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/;

  const punctToKill = /[,:;)('"\u201D\]]/;
  const isHyphen = /^[-–—]$/;
  const hasSpace = / /;

  const textFromTerms = function (terms, opts, keepSpace = true) {
    let txt = '';
    terms.forEach(t => {
      let pre = t.pre || '';
      let post = t.post || '';
      if (opts.punctuation === 'some') {
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
        post = post.replace(/\.{2,}/, '');
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
          post = post.replace(trimEnd, '');
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
      const last = docs[docs.length - 1];
      if (!last[last.length - 1].tags.has('Emoticon')) {
        text = text.replace(trimEnd, '');
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

  const fmts = {
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
  fmts.clean = fmts.normal;
  fmts.reduced = fmts.root;

  /* eslint-disable no-bitwise */
  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-multi-assign */

  // https://github.com/jbt/tiny-hashes/
  const k = [];
  let i$1 = 0;
  for (; i$1 < 64; ) {
    k[i$1] = 0 | (Math.sin(++i$1 % Math.PI) * 4294967296);
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

    for (i$1 = j = 0; i$1 < s; i$1 += 16) {
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
              ~~words[i$1 | ([j, 5 * j + 1, 3 * j + 5, 7 * j][a] & 15)]) <<
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
    return Object.assign({}, a, b)
  };

  const fns$1 = {
    text: terms => textFromTerms(terms, { keepPunct: true }, false),
    normal: terms => textFromTerms(terms, merge(fmts.normal, { keepPunct: true }), false),
    implicit: terms => textFromTerms(terms, merge(fmts.implicit, { keepPunct: true }), false),

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
      return terms.map(t => {
        const term = Object.assign({}, t);
        term.tags = Array.from(t.tags);
        return term
      })
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
    option = option || {};
    if (typeof option === 'string') {
      option = {};
    }
    option = Object.assign({}, defaults$1, option);
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

  //output some helpful stuff to the console
  const debug$1 = function (fmt) {
    const debugMethods = this.methods.one.debug || {};
    // see if method name exists
    if (fmt && debugMethods.hasOwnProperty(fmt)) {
      debugMethods[fmt](this);
      return this
    }
    // log default client-side view
    if (isClientSide()) {
      debugMethods.clientSide(this);
      return this
    }
    // else, show regular server-side tags view
    debugMethods.tags(this);
    return this
  };

  const toText = function (term) {
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
        if (starts.hasOwnProperty(t.id)) {
          const { fn, end } = starts[t.id];
          const m = doc.update([[n, i, end]]);
          text += terms[i].pre || '';
          text += fn(m);
          i = end - 1;
          text += terms[i].post || '';
        } else {
          text += toText(t);
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
    return entry.parents[entry.parents.length - 1]
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

  const makeAliases = function (tagSet) {
    const aliases = {};
    for (const tag in tagSet) {
      const entry = tagSet[tag];
      if (entry.alias) {
        aliases[tag] = entry.alias;
      }
    }
    return aliases
  };

  // one line per sentence: '<text> {Tag,Tag,…}'
  const toSpec = function (doc, world) {
    const tagSet = world.model.one.tagSet;
    const aliases = makeAliases(tagSet);
    return doc.docs.map(terms => {
      const text = terms.reduce((str, t) => str + t.pre + t.text + t.post, '').trim();
      const tags = terms.map(t => {
        let tag = slotForTerm(t, tagSet);
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
    const obj = {};
    arr.forEach(a => {
      obj[a] = obj[a] || 0;
      obj[a] += 1;
    });
    const res = Object.keys(obj).map(k => {
      return { normal: k, count: obj[k] }
    });
    return res.sort((a, b) => (a.count > b.count ? -1 : 0))
  };

  /** some named output formats */
  const out = function (method) {
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
      let list = [];
      this.docs.forEach(terms => {
        let words = terms.map(t => t.text);
        words = words.filter(t => t);
        list = list.concat(words);
      });
      return list
    }
    if (method === 'tags') {
      return this.docs.map(terms => {
        return terms.reduce((h, t) => {
          h[t.implicit || t.normal] = Array.from(t.tags);
          return h
        }, {})
      })
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
    out,
    /** */
    wrap: function (obj) {
      return wrap(this, obj)
    },
  };

  const isObject$1 = val => {
    return Object.prototype.toString.call(val) === '[object Object]'
  };

  var text = {
    /** */
    text: function (fmt) {
      let opts = {};
      if (fmt && typeof fmt === 'string' && fmts.hasOwnProperty(fmt)) {
        opts = Object.assign({}, fmts[fmt]);
      } else if (fmt && isObject$1(fmt)) {
        opts = Object.assign({}, fmt); //todo: fixme
      }
      // is it a full document?
      if (opts.keepSpace === undefined && !this.isFull()) {
        //
        opts.keepSpace = false;
      }
      if (opts.keepEndPunct === undefined && this.pointer) {
        const ptr = this.pointer[0];
        if (ptr && ptr[1]) {
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

  const methods$8 = Object.assign({}, methods$9, text, methods$a, html$1);

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

  // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
  const reset = '\x1b[0m';

  //cheaper than requiring chalk
  const cli = {
    green: str => '\x1b[32m' + str + reset,
    red: str => '\x1b[31m' + str + reset,
    blue: str => '\x1b[34m' + str + reset,
    magenta: str => '\x1b[35m' + str + reset,
    cyan: str => '\x1b[36m' + str + reset,
    yellow: str => '\x1b[33m' + str + reset,
    black: str => '\x1b[30m' + str + reset,
    dim: str => '\x1b[2m' + str + reset,
    i: str => '\x1b[3m' + str + reset,
  };

  /* eslint-disable no-console */

  const tagString = function (tags, model) {
    if (model.one.tagSet) {
      tags = tags.map(tag => {
        if (!model.one.tagSet.hasOwnProperty(tag)) {
          return tag
        }
        const c = model.one.tagSet[tag].color || 'blue';
        return cli[c](tag)
      });
    }
    return tags.join(', ')
  };

  const showTags = function (view) {
    const { docs, model } = view;
    if (docs.length === 0) {
      console.log(cli.blue('\n     ──────'));
    }
    docs.forEach(terms => {
      console.log(cli.blue('\n  ┌─────────'));
      terms.forEach(t => {
        const tags = [...(t.tags || [])];
        let text = t.text || '-';
        if (t.sense) {
          text = `{${t.normal}/${t.sense}}`;
        }
        if (t.implicit) {
          text = '[' + t.implicit + ']';
        }
        text = cli.yellow(text);
        let word = "'" + text + "'";
        if (t.reference) {
          const str = view.update([t.reference]).text('normal');
          word += ` - ${cli.dim(cli.i('[' + str + ']'))}`;
        }
        word = word.padEnd(18);
        const str = cli.blue('  │ ') + cli.i(word) + '  - ' + tagString(tags, model);
        console.log(str);
      });
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const showChunks = function (view) {
    const { docs } = view;
    console.log('');
    docs.forEach(terms => {
      const out = [];
      terms.forEach(term => {
        if (term.chunk === 'Noun') {
          out.push(cli.blue(term.implicit || term.normal));
        } else if (term.chunk === 'Verb') {
          out.push(cli.green(term.implicit || term.normal));
        } else if (term.chunk === 'Adjective') {
          out.push(cli.yellow(term.implicit || term.normal));
        } else if (term.chunk === 'Pivot') {
          out.push(cli.red(term.implicit || term.normal));
        } else {
          out.push(term.implicit || term.normal);
        }
      });
      console.log(out.join(' '), '\n');
    });
    console.log('\n');
  };

  /* eslint-disable no-console */

  const split = (txt, offset, index) => {
    const buff = index * 9; //there are 9 new chars addded to each highlight
    const start = offset.start + buff;
    const end = start + offset.length;
    const pre = txt.substring(0, start);
    const mid = txt.substring(start, end);
    const post = txt.substring(end, txt.length);
    return [pre, mid, post]
  };

  const spliceIn = function (txt, offset, index) {
    const parts = split(txt, offset, index);
    return `${parts[0]}${cli.blue(parts[1])}${parts[2]}`
  };

  const showHighlight = function (doc) {
    if (!doc.found) {
      return
    }
    const bySentence = {};
    doc.fullPointer.forEach(ptr => {
      bySentence[ptr[0]] = bySentence[ptr[0]] || [];
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

  const lastBrace = /\{(?=[^{]*$)/; // split on the last { only

  // parse the spec output
  const parseLine = function (line = '') {
    let [text, tags] = line.split(lastBrace);
    if (tags === undefined) {
      return { text, tags: [] } // no {tags} block on this line
    }
    tags = tags.split(',').map(tag => tag.trim());
    let lastTag = tags[tags.length - 1];
    tags[tags.length - 1] = lastTag.replace(/\}$/, '');
    tags = tags.map(tag => tag.split('|').map(t => t.trim()));
    tags = tags.filter(arr => arr.some(t => t !== '')); // drop empty '{}'
    return { text, tags }
  };

  // make a match syntax looping through the arrays of tags
  const toMatchString = function (tags, aliases) {
    return tags.map(arr => {
      arr = arr.map(str => {
        return '#' + (aliases[str] || str)
      });
      if (arr.length > 1) {
        return `(${arr.join(' && ')})`
      }
      return arr[0]
    }).join(' ')
  };

  // parse the adhoc output of out('spec')
  // note: this(text), not this.tokenize().compute(hooks) - tokenize already
  // splits contractions, so re-running hooks would split them twice
  const fromSpec = function (spec) {
    let cleanText = spec.split('\n').filter(line => line.trim()).map(line => {
      return parseLine(line).text
    }).join('\n');
    return this(cleanText)
  };

  // rebuild spec-formatted tag list
  const toTagList = function (tags) {
    return tags.map(arr => arr.join('|')).join(',')
  };

  // compare the tagged text output of out('spec')
  const testSpec = function (spec, verbose = true, throwError = false) {
    let world = this.world();
    let aliases = {};
    // expand tag aliases
    let tagSet = world.model.one.tagSet;
    Object.keys(tagSet).forEach(k => {
      if (tagSet[k].alias) {
        aliases[tagSet[k].alias] = k;
      }
    });
    let failingLines = spec.split('\n').filter(line => line.trim()).map(line => {
      let { text, tags } = parseLine(line);
      // parse it
      let doc = this(text);
      // make compromise-compatible match string
      let matchStr = toMatchString(tags, aliases);
      let didMatch = doc.has(matchStr);
      if (verbose !== false) {
        let char = didMatch ? '✅' : '❌';
        console.log(`${char} ${text} {${toTagList(tags)}}`); //eslint-disable-line no-console
      }
      if (didMatch === false && throwError === true) {
        throw new Error(`❌ ${text} {${toTagList(tags)}}`)
      }
      return didMatch ? null : text
    }).filter(Boolean).join('\n');
    // return a doc of only the failing lines - empty means everything passed
    return this(failingLines)
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
      byN[ref[0]] = byN[ref[0]] || [];
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
      ptr[4] = terms.length ? terms[terms.length - 1].id : null;
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
      let [n, start, end, id, endId] = ptr; //parsePointer(ptr)
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

  const isArray$3 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  const getDoc = (m, view) => {
    if (typeof m === 'string' || isArray$3(m)) {
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
      obj.regs = parseMatch(obj.match, {}, world);
      // wrap these ifNo properties into an array
      if (typeof obj.ifNo === 'string') {
        obj.ifNo = [obj.ifNo];
      }
      if (obj.notIf) {
        obj.notIf = parseMatch(obj.notIf, {}, world);
      }
      // cache any requirements up-front 
      obj.needs = getNeeds(obj.regs);
      const { wants, count } = getWants(obj.regs);
      obj.wants = wants;
      obj.minWant = count;
      // get rid of tiny sentences
      obj.minWords = obj.regs.filter(o => !o.optional).length;
    });
    return matches
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
    // remove duplicates
    Object.keys(hooks).forEach(k => {
      const already = {};
      hooks[k] = hooks[k].filter(obj => {
        if (typeof already[obj.match] === 'boolean') {
          return false
        }
        already[obj.match] = true;
        return true
      });
    });

    // keep all un-cacheable matches (those with no needs) 
    const always = matches.filter(o => o.needs.length === 0 && o.wants.length === 0);
    return {
      hooks,
      always
    }
  };

  // for each cached-sentence, find a list of possible matches
  const getHooks = function (docCaches, hooks) {
    return docCaches.map((set, i) => {
      let maybe = [];
      Object.keys(hooks).forEach(k => {
        if (docCaches[i].has(k)) {
          maybe = maybe.concat(hooks[k]);
        }
      });
      // remove duplicates
      const already = {};
      maybe = maybe.filter(m => {
        if (typeof already[m.match] === 'boolean') {
          return false
        }
        already[m.match] = true;
        return true
      });
      return maybe
    })
  };

  // filter-down list of maybe-matches
  const localTrim = function (maybeList, docCache) {
    return maybeList.map((list, n) => {
      const haves = docCache[n];
      // ensure all stated-needs of the match are met
      list = list.filter(obj => {
        return obj.needs.every(need => haves.has(need))
      });
      // ensure nothing matches in our 'ifNo' property
      list = list.filter(obj => {
        if (obj.ifNo !== undefined && obj.ifNo.some(no => haves.has(no)) === true) {
          return false
        }
        return true
      });
      // ensure atleast one(?) of the wants is found
      list = list.filter(obj => {
        if (obj.wants.length === 0) {
          return true
        }
        // ensure there's one cache-hit
        const found = obj.wants.filter(str => haves.has(str)).length;
        return found >= obj.minWant
      });
      return list
    })
  };

  // finally,
  // actually run these match-statements on the terms
  const runMatch = function (maybeList, document, docCache, methods, opts) {
    const results = [];
    for (let n = 0; n < maybeList.length; n += 1) {
      for (let i = 0; i < maybeList[n].length; i += 1) {
        const m = maybeList[n][i];
        // ok, actually do the work.
        const res = methods.one.match([document[n]], m);
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
            const todo = Object.assign({}, m, { pointer: ptr });
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

  const tooSmall = function (maybeList, document) {
    return maybeList.map((arr, i) => {
      const termCount = document[i].length;
      arr = arr.filter(o => {
        return termCount >= o.minWords
      });
      return arr
    })
  };

  const sweep$1 = function (document, net, methods, opts = {}) {
    // find suitable matches to attempt, on each sentence
    const docCache = methods.one.cacheDoc(document);
    // collect possible matches for this document
    let maybeList = getHooks(docCache, net.hooks);
    // ensure all defined needs are met for each match
    maybeList = localTrim(maybeList, docCache);
    // add unchacheable matches to each sentence's todo-list
    if (net.always.length > 0) {
      maybeList = maybeList.map(arr => arr.concat(net.always));
    }
    // if we don't have enough words
    maybeList = tooSmall(maybeList, document);

    // now actually run the matches
    const results = runMatch(maybeList, document, docCache, methods, opts);
    // console.dir(results, { depth: 5 })
    return results
  };

  // is this tag consistent with the tags they already have?
  const canBe$1 = function (terms, tag, model) {
    const tagSet = model.one.tagSet;
    if (!tagSet.hasOwnProperty(tag)) {
      return true
    }
    const not = tagSet[tag].not || [];
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      for (let k = 0; k < not.length; k += 1) {
        if (term.tags.has(not[k]) === true) {
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
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env.DEBUG_TAGS) {
      console.log(`\n\n  \x1b[32m→ ${list.length} post-tagger:\x1b[0m`); //eslint-disable-line
    }
    return list.map(todo => {
      if (!todo.tag && !todo.chunk && !todo.unTag) {
        return
      }
      const reason = todo.reason || todo.match;
      const terms = getDoc([todo.pointer], document)[0];
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
      }
      if (todo.tag !== undefined) {
        setTag(terms, todo.tag, world, todo.safe, `[post] '${reason}'`);
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
        unTag(terms, todo.unTag, world, todo.safe, reason);
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

  const tagTerm = function (term, tag, tagSet, isSafe) {
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
    // for known tags, do logical dependencies first
    const known = tagSet[tag];
    if (known) {
      // first, we remove any conflicting tags
      if (known.not && known.not.length > 0) {
        for (let o = 0; o < known.not.length; o += 1) {
          // if we're in tagSafe, skip this term.
          if (isSafe === true && term.tags.has(known.not[o])) {
            return null
          }
          term.tags.delete(known.not[o]);
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
    return true
  };

  // support '#Noun . #Adjective' syntax
  const multiTag = function (terms, tagString, tagSet, isSafe) {
    const tags = tagString.split(isMulti);
    terms.forEach((term, i) => {
      let tag = tags[i];
      if (tag) {
        tag = tag.replace(/^#/, '');
        tagTerm(term, tag, tagSet, isSafe);
      }
    });
  };

  const isArray$2 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  // verbose-mode tagger debuging
  const log = (terms, tag, reason = '') => {
    const yellow = str => '\x1b[33m\x1b[3m' + str + '\x1b[0m';
    const i = str => '\x1b[3m' + str + '\x1b[0m';
    const word = terms
      .map(t => {
        return t.text || '[' + t.implicit + ']'
      })
      .join(' ');
    if (typeof tag !== 'string' && tag.length > 2) {
      tag = tag.slice(0, 2).join(', #') + ' +'; //truncate the list of tags
    }
    tag = typeof tag !== 'string' ? tag.join(', #') : tag;
    console.log(` ${yellow(word).padEnd(24)} \x1b[32m→\x1b[0m #${tag.padEnd(22)}  ${i(reason)}`); // eslint-disable-line
  };

  // add a tag to all these terms
  const setTag = function (terms, tag, world = {}, isSafe, reason) {
    const tagSet = world.model.one.tagSet || {};
    if (!tag) {
      return
    }
    // some logging for debugging
    const env = typeof process === 'undefined' || !process.env ? self.env || {} : process.env;
    if (env && env.DEBUG_TAGS) {
      log(terms, tag, reason);
    }
    if (isArray$2(tag) === true) {
      tag.forEach(tg => setTag(terms, tg, world, isSafe));
      return
    }
    if (typeof tag !== 'string') {
      console.warn(`compromise: Invalid tag '${tag}'`); // eslint-disable-line
      return
    }
    tag = tag.trim();
    // support '#Noun . #Adjective' syntax
    if (isMulti.test(tag)) {
      multiTag(terms, tag, tagSet, isSafe);
      return
    }
    tag = tag.replace(/^#/, '');
    // let set = false
    for (let i = 0; i < terms.length; i += 1) {
      tagTerm(terms[i], tag, tagSet, isSafe);
    }
  };

  // remove this tag, and its children, from these terms
  const unTag = function (terms, tag, tagSet) {
    tag = tag.trim().replace(/^#/, '');
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i];
      // don't untag anything if term is frozen
      if (term.frozen === true) {
        continue
      }
      // support clearing all tags, with '*'
      if (tag === '*') {
        term.tags.clear();
        continue
      }
      // for known tags, do logical dependencies first
      const known = tagSet[tag];
      // removing #Verb should also remove #PastTense
      if (known && known.children.length > 0) {
        for (let o = 0; o < known.children.length; o += 1) {
          term.tags.delete(known.children[o]);
        }
      }
      term.tags.delete(tag);
    }
  };

  // quick check if this tag will require any untagging
  const canBe = function (term, tag, tagSet) {
    if (!tagSet.hasOwnProperty(tag)) {
      return true // everything can be an unknown tag
    }
    const not = tagSet[tag].not || [];
    for (let i = 0; i < not.length; i += 1) {
      if (term.tags.has(not[i])) {
        return false
      }
    }
    return true
  };

  const e=function(e){return e.children=e.children||[],e._cache=e._cache||{},e.props=e.props||{},e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],e},t=/^ *(#|\/\/)/,n=function(t){let n=t.trim().split(/->/),r=[];n.forEach((t=>{r=r.concat(function(t){if(!(t=t.trim()))return null;if(/^\[/.test(t)&&/\]$/.test(t)){let n=(t=(t=t.replace(/^\[/,"")).replace(/\]$/,"")).split(/,/);return n=n.map((e=>e.trim())).filter((e=>e)),n=n.map((t=>e({id:t}))),n}return [e({id:t})]}(t));})),r=r.filter((e=>e));let i=r[0];for(let e=1;e<r.length;e+=1)i.children.push(r[e]),i=r[e];return r[0]},r=(e,t)=>{let n=[],r=[e];for(;r.length>0;){let e=r.pop();n.push(e),e.children&&e.children.forEach((n=>{t&&t(e,n),r.push(n);}));}return n},i=e=>"[object Array]"===Object.prototype.toString.call(e),c=e=>(e=e||"").trim(),s=function(c=[]){return "string"==typeof c?function(r){let i=r.split(/\r?\n/),c=[];i.forEach((e=>{if(!e.trim()||t.test(e))return;let r=(e=>{const t=/^( {2}|\t)/;let n=0;for(;t.test(e);)e=e.replace(t,""),n+=1;return n})(e);c.push({indent:r,node:n(e)});}));let s=function(e){let t={children:[]};return e.forEach(((n,r)=>{0===n.indent?t.children=t.children.concat(n.node):e[r-1]&&function(e,t){let n=e[t].indent;for(;t>=0;t-=1)if(e[t].indent<n)return e[t];return e[0]}(e,r).node.children.push(n.node);})),t}(c);return s=e(s),s}(c):i(c)?function(t){let n={};t.forEach((e=>{n[e.id]=e;}));let r=e({});return t.forEach((t=>{if((t=e(t)).parent)if(n.hasOwnProperty(t.parent)){let e=n[t.parent];delete t.parent,e.children.push(t);}else console.warn(`[Grad] - missing node '${t.parent}'`);else r.children.push(t);})),r}(c):(r(s=c).forEach(e),s);var s;},h=e=>"[31m"+e+"[0m",o=e=>"[2m"+e+"[0m",l=function(e,t){let n="-> ";t&&(n=o("→ "));let i="";return r(e).forEach(((e,r)=>{let c=e.id||"";if(t&&(c=h(c)),0===r&&!e.id)return;let s=e._cache.parents.length;i+="    ".repeat(s)+n+c+"\n";})),i},a=function(e){let t=r(e);t.forEach((e=>{delete(e=Object.assign({},e)).children;}));let n=t[0];return n&&!n.id&&0===Object.keys(n.props).length&&t.shift(),t},p={text:l,txt:l,array:a,flat:a},d=function(e,t){return "nested"===t||"json"===t?e:"debug"===t?(console.log(l(e,true)),null):p.hasOwnProperty(t)?p[t](e):e},u=e=>{r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],t._cache.parents=e._cache.parents.concat([e.id]));}));},f=(e,t)=>(Object.keys(t).forEach((n=>{if(t[n]instanceof Set){let r=e[n]||new Set;e[n]=new Set([...r,...t[n]]);}else {if((e=>e&&"object"==typeof e&&!Array.isArray(e))(t[n])){let r=e[n]||{};e[n]=Object.assign({},t[n],r);}else i(t[n])?e[n]=t[n].concat(e[n]||[]):void 0===e[n]&&(e[n]=t[n]);}})),e),j=/\//;class g{constructor(e={}){Object.defineProperty(this,"json",{enumerable:false,value:e,writable:true});}get children(){return this.json.children}get id(){return this.json.id}get found(){return this.json.id||this.json.children.length>0}props(e={}){let t=this.json.props||{};return "string"==typeof e&&(t[e]=true),this.json.props=Object.assign(t,e),this}get(t){if(t=c(t),!j.test(t)){let e=this.json.children.find((e=>e.id===t));return new g(e)}let n=((e,t)=>{let n=(e=>"string"!=typeof e?e:(e=e.replace(/^\//,"")).split(/\//))(t=t||"");for(let t=0;t<n.length;t+=1){let r=e.children.find((e=>e.id===n[t]));if(!r)return null;e=r;}return e})(this.json,t)||e({});return new g(n)}add(t,n={}){if(i(t))return t.forEach((e=>this.add(c(e),n))),this;t=c(t);let r=e({id:t,props:n});return this.json.children.push(r),new g(r)}remove(e){return e=c(e),this.json.children=this.json.children.filter((t=>t.id!==e)),this}nodes(){return r(this.json).map((e=>(delete(e=Object.assign({},e)).children,e)))}cache(){return (e=>{let t=r(e,((e,t)=>{e.id&&(e._cache.parents=e._cache.parents||[],e._cache.children=e._cache.children||[],t._cache.parents=e._cache.parents.concat([e.id]));})),n={};t.forEach((e=>{e.id&&(n[e.id]=e);})),t.forEach((e=>{e._cache.parents.forEach((t=>{n.hasOwnProperty(t)&&n[t]._cache.children.push(e.id);}));})),e._cache.children=Object.keys(n);})(this.json),this}list(){return r(this.json)}fillDown(){var e;return e=this.json,r(e,((e,t)=>{t.props=f(t.props,e.props);})),this}depth(){u(this.json);let e=r(this.json),t=e.length>1?1:0;return e.forEach((e=>{if(0===e._cache.parents.length)return;let n=e._cache.parents.length+1;n>t&&(t=n);})),t}out(e){return u(this.json),d(this.json,e)}debug(){return u(this.json),d(this.json,"debug"),this}}const _=function(e){let t=s(e);return new g(t)};_.prototype.plugin=function(e){e(this);};

  // i just made these up
  const colors = {
    Noun: 'blue',
    Verb: 'green',
    Negative: 'green',
    Date: 'red',
    Value: 'red',
    Adjective: 'magenta',
    Preposition: 'cyan',
    Conjunction: 'cyan',
    Determiner: 'cyan',
    Hyphenated: 'cyan',
    Adverb: 'cyan',
  };

  const getColor = function (node) {
    if (colors.hasOwnProperty(node.id)) {
      return colors[node.id]
    }
    if (colors.hasOwnProperty(node.is)) {
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
        children: node._cache.children,
        color: getColor(node),
        alias: node.alias,
      };
    });
    // lastly, add all children of all nots
    Object.keys(res).forEach(k => {
      const nots = new Set(res[k].not);
      res[k].not.forEach(not => {
        if (res[not]) {
          res[not].children.forEach(tag => nots.add(tag));
        }
      });
      res[k].not = Array.from(nots);
    });
    return res
  };

  const toArr = function (input) {
    if (!input) {
      return []
    }
    if (typeof input === 'string') {
      return [input]
    }
    return input
  };

  const addImplied = function (tags, already) {
    Object.keys(tags).forEach(k => {
      // support deprecated fmts
      if (tags[k].isA) {
        tags[k].is = tags[k].isA;
      }
      if (tags[k].notA) {
        tags[k].not = tags[k].notA;
      }
      // add any implicit 'is' tags
      if (tags[k].is && typeof tags[k].is === 'string') {
        if (!already.hasOwnProperty(tags[k].is) && !tags.hasOwnProperty(tags[k].is)) {
          tags[tags[k].is] = {};
        }
      }
      // add any implicit 'not' tags
      if (tags[k].not && typeof tags[k].not === 'string' && !tags.hasOwnProperty(tags[k].not)) {
        if (!already.hasOwnProperty(tags[k].not) && !tags.hasOwnProperty(tags[k].not)) {
          tags[tags[k].not] = {};
        }
      }
    });
    return tags
  };


  const validate = function (tags, already) {

    tags = addImplied(tags, already);

    // property validation
    Object.keys(tags).forEach(k => {
      tags[k].children = toArr(tags[k].children);
      tags[k].not = toArr(tags[k].not);
    });
    // not links are bi-directional
    // add any incoming not tags
    Object.keys(tags).forEach(k => {
      const nots = tags[k].not || [];
      nots.forEach(no => {
        if (tags[no] && tags[no].not) {
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
      return { id: k, parent: o.is, props, children: [], alias: o.alias }
    });
    const graph = _(flatList).cache().fillDown();
    return graph.out('array')
  };

  const fromUser = function (tags) {
    Object.keys(tags).forEach(k => {
      tags[k] = Object.assign({}, tags[k]);
      tags[k].novel = true;
    });
    return tags
  };

  const addTags$1 = function (tags, already) {
    // are these tags internal ones, or user-generated?
    if (Object.keys(already).length > 0) {
      tags = fromUser(tags);
    }
    tags = validate(tags, already);

    const allTags = Object.assign({}, already, tags);
    // do some basic setting-up
    // 'fill-down' parent logic
    const nodes = compute$1(allTags);
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
  const isArray$1 = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };
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
      if (isArray$1(input)) {
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
      if (isArray$1(input)) {
        input.forEach(tag => methods.one.unTag(terms, tag, tagSet));
      } else {
        methods.one.unTag(terms, input, tagSet);
      }
      // uncache
      this.uncache();
      return this
    },

    /** return only the terms that can be this tag  */
    canBe: function (tag) {
      tag = tag.replace(/^#/, '');
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
    const { model, methods } = this.world();
    const tagSet = model.one.tagSet;
    const fn = methods.one.addTags;
    const res = fn(tags, tagSet);
    model.one.tagSet = res;
    return this
  };

  var lib$1 = { addTags };

  const boringTags = new Set(['Auxiliary', 'Possessive']);

  const sortByKids = function (tags, tagSet) {
    tags = tags.sort((a, b) => {
      // (unknown tags are interesting)
      if (boringTags.has(a) || !tagSet.hasOwnProperty(b)) {
        return 1
      }
      if (boringTags.has(b) || !tagSet.hasOwnProperty(a)) {
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
      one: { tagSet: {} }
    },
    compute: {
      tagRank
    },
    methods: methods$4,
    api: tagAPI,
    lib: lib$1
  };

  // split by periods, question marks, unicode ⁇, etc
  const initSplit = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s)/g;
  // merge these back into prev sentence
  const splitsOnly = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s$/;
  const newLine = /((?:\r?\n|\r)+)/; // Match different new-line formats

  // Start with a regex:
  const basicSplit = function (text) {
    const all = [];
    //first, split by newline
    const lines = text.split(newLine);
    for (let i = 0; i < lines.length; i++) {
      //split by period, question-mark, and exclamation-mark
      const arr = lines[i].split(initSplit);
      for (let o = 0; o < arr.length; o++) {
        // merge 'foo' + '.'
        if (arr[o + 1] && splitsOnly.test(arr[o + 1]) === true) {
          arr[o] += arr[o + 1];
          arr[o + 1] = '';
        }
        if (arr[o] !== '') {
          all.push(arr[o]);
        }
      }
    }
    return all
  };

  const hasLetter$1 = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i;
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
    return Boolean(c.match(/\n$/))
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
  const hasOpen = /\(/g;
  const hasClosed = /\)/g;
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
    text = text || '';
    text = String(text);
    // Ensure it 'smells like' a sentence
    if (!text || typeof text !== 'string' || hasSomething.test(text) === false) {
      return []
    }
    // cleanup unicode-spaces
    text = text.replace('\xa0', ' ');
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

  const hasHyphen = function (str, model) {
    const parts = str.split(/[-–—]/);
    if (parts.length <= 1) {
      return false
    }
    const { prefixes, suffixes } = model.one;

    // l-theanine, x-ray
    if (parts[0].length === 1 && /[a-z]/i.test(parts[0])) {
      return false
    }
    //dont split 're-do'
    if (prefixes.hasOwnProperty(parts[0])) {
      return false
    }
    //dont split 'flower-like'
    parts[1] = parts[1].trim().replace(/[.?!]$/, '');
    if (suffixes.hasOwnProperty(parts[1])) {
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

  const splitHyphens = function (word) {
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

  const isArray = function (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  };

  //turn a string into an array of strings (naiive for now, lumped later)
  const splitWords = function (str, model) {
    let result = [];
    let arr = [];
    //start with a naiive split
    str = str || '';
    if (typeof str === 'number') {
      str = String(str);
    }
    if (isArray(str)) {
      return str
    }
    const words = str.split(naiiveSplit);
    for (let i = 0; i < words.length; i++) {
      //split 'one-two'
      if (hasHyphen(words[i], model) === true) {
        arr = arr.concat(splitHyphens(words[i]));
        continue
      }
      arr.push(words[i]);
    }
    //greedy merge whitespace+arr to the right
    let carry = '';
    for (let i = 0; i < arr.length; i++) {
      const word = arr[i];
      //if it's more than a whitespace
      if (wordlike.test(word) === true && notWord.hasOwnProperty(word) === false && isBoundary.test(word) === false) {
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

  const normalizePunctuation = function (str, model) {
    // quick lookup for allowed pre/post punctuation
    const { prePunctuation, postPunctuation, emoticons } = model.one;
    let original = str;
    let pre = '';
    let post = '';
    const chars = Array.from(str);

    // punctuation-only words, like '<3'
    if (emoticons.hasOwnProperty(str.trim())) {
      return { str: str.trim(), pre, post: ' ' } //not great
    }

    // pop any punctuation off of the start
    let len = chars.length;
    for (let i = 0; i < len; i += 1) {
      const c = chars[0];
      // keep any declared chars
      if (prePunctuation[c] === true) {
        continue//keep it
      }
      // keep '+' or '-' only before a number
      if ((c === '+' || c === '-' || c === '(') && isFullNumber.test(str.trim())) {
        break//done
      }
      // '97 - year short-form
      if (c === "'" && c.length === 3 && isNumber.test(chars[1])) {
        break//done
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // punctuation
      pre += chars.shift();//keep going
    }

    // pop any punctuation off of the end
    len = chars.length;
    for (let i = 0; i < len; i += 1) {
      const c = chars[chars.length - 1];
      // keep any declared chars
      if (postPunctuation[c] === true) {
        continue//keep it
      }
      // start of word
      if (isLetter.test(c) || isNumber.test(c)) {
        break //done
      }
      // F.B.I.
      if (c === '.' && hasAcronym.test(original) === true) {
        continue//keep it
      }
      //  keep s-apostrophe - "flanders'" or "chillin'"
      if (c === "'" && chillin.test(original) === true) {
        continue//keep it
      }
      // keep '+' or ')' only for a number like (800) or 500+
      if ((c === '+' || c === ')') && isFullNumber.test(str.trim())) {
        break//done
      }
      // punctuation
      post = chars.pop() + post;//keep going
    }
    str = chars.join('');
    //we went too far..
    if (str === '') {
      // do a very mild parse, and hope for the best.
      original = original.replace(/ *$/, after => {
        post = after || '';
        return ''
      });
      str = original;
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
    str = str || '';
    const chars = str.split('');
    chars.forEach((s, i) => {
      if (unicode[s]) {
        chars[i] = unicode[s];
      }
    });
    return chars.join('')
  };

  /** some basic operations on a string to reduce noise */
  const clean = function (str) {
    str = str || '';
    str = str.toLowerCase();
    str = str.trim();
    const original = str;
    //punctuation
    str = str.replace(/[,;.!?]+$/, '');
    //coerce Unicode ellipses
    str = str.replace(/\u2026/g, '...');
    //en-dash
    str = str.replace(/\u2013/g, '-');
    //strip leading & trailing grammatical punctuation
    if (/^[:;]/.test(str) === false) {
      str = str.replace(/\.{3,}$/g, '');
      str = str.replace(/[",.!:;?)]+$/g, '');
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
  const periodAcronym$1 = /([A-Z]\.)+[A-Z]?,?$/;
  const oneLetterAcronym$1 = /^[A-Z]\.,?$/;
  const noPeriodAcronym$1 = /[A-Z]{2,}('s|,)?$/;
  const lowerCaseAcronym$1 = /([a-z]\.)+[a-z]\.?$/;

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
    input = input || '';
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
  const hasEllipse = /(?:\u2026|\.{2,}) *$/; // '...'
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
    if (abbrevs.hasOwnProperty(lastWord) === true && hasPeriod.test(str) === true) {
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
    if (aliases.hasOwnProperty(str)) {
      term.alias = term.alias || [];
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
            term.alias = term.alias || [];
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
    const counts = {};
    for (let i = 0; i < docs.length; i += 1) {
      for (let t = 0; t < docs[i].length; t += 1) {
        const term = docs[i][t];
        const word = term.machine || term.normal;
        counts[word] = counts[word] || 0;
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
    const lastPhrase = docs[docs.length - 1] || [];
    const lastTerm = lastPhrase[lastPhrase.length - 1];
    // if we've already put whitespace, end.
    if (lastTerm.post) {
      return
    }
    // if we found something
    if (prefixes.hasOwnProperty(lastTerm.normal)) {
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
    const lastPhrase = docs[docs.length - 1] || [];
    const term = lastPhrase[lastPhrase.length - 1];
    if (term.typeahead === true && term.machine) {
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
        if (opts.safe && world.model.one.lexicon.hasOwnProperty(prefix)) {
          continue
        }
        // does it already exist?
        if (existing.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        if (index.hasOwnProperty(prefix) === true) {
          collisions.push(prefix);
          continue
        }
        index[prefix] = str;
      }
    });
    // merge with existing prefixes
    index = Object.assign({}, existing, index);
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
    opts = Object.assign({}, defaults, opts);
    if (isObject(words)) {
      Object.assign(model.one.lexicon, words);
      words = Object.keys(words);
    }
    const prefixes = getPrefixes(words, opts, this.world());
    // manually combine these with any existing prefixes
    Object.keys(prefixes).forEach(str => {
      // explode any overlaps
      if (model.one.typeahead.hasOwnProperty(str)) {
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
    "Conjunction": "true¦а,будJгде,да,есIзаJиGкFлибо,нEоDп8словHт4хот3ч0;ем,то0;!б0;!ы;ь,я;ак1о0; есть,же; 0же;как,чB;о2ри0;том,ч0;ем,ём;ка,тому0этому;! ч6;днако,ттого;еже3о;ак,огда;!бо,ли,мен0;но;ли;то",
    "Preposition": "true¦бQвLдKза,изIкHмEнаAо9п3раMс0у,через;!в1квозь,о0пустя,реL;!гласно;ерх,ыше;ередOо2р0;и,о0;!т7;!дLзаFми8с0;ле,ред0;и,ством;!бIколо,тI;!встречу,дHкануне,п1сч0;ет,ёт;ерекор,одобие,рот0;ив;еж1и0;мо;!ду;!о,роме;!-0о;за,под;ля,о;!близи,доль,место,н2о1пере0роде,след;ди;!зле,круг,преки;е,утр0;и,ь;ез1л0;агодаря,из;!о",
    "Adverb": "true¦0:16;абсолют0б11в0Nг0Lд0Eещ0Dз0Aиног0Qк07л05м01нRоNпFрDс7т5у4х3ч1;ас0Lуть1;!-чуO;орошо,уже;же,тр0S;ам,еперь,иHруд0у1;да,т;е5зади,ко0Vл3н2ов1пра4разу,ю0J;ершVс04;ачала,о2;е1ишк0M;ва;годня,йчас;ан1ед0Sяд0J;о,ь0P;ло7о2р1;имер0ос06ямо;-3з2лностBслезавт07т0Fч1;ему-04ти;авче05д0же;англий1моему,рус1;ски;хо;быч0пя3с2т1чень;деVсю02ту02;ен3обE;ть;а6е4и2оч1;ью;г06к1;огWуW;дав0м1;а8ноL;вер3зад,конец,ле2пр1;а1имер;во;ное,ху;а3е1ноG;дл1нь01;ен0;ло;е1учY;гZтQ;ак-Fо1райLстати,уда-F;гда-1неч0;нибудь,то;а1десь,имO;втDт1;ем;е,ё;ал6ействите5н4о1;во4л2м1;а,ой;го;ем,ём;ль0;еLьJ;де-1ромK;то;верхDдруг,е8месте,низDо7п4с2че1;ра;ег1юду;да;ер2ол1;не;ед,ёд;змож0обще;з4с2чер1;ом;н1ьма;ой;де;!у;ли3оль2ыст1;ро;ше;же,з1;ко;но",
    "Pronoun": "true¦вLеKиJкEмBн5он4с1т0что-Gэто,я;еб2о1ы;еб1о0;боA;е,я;!а,и,о;аJе4и0ём;к1мJх,ч0;е9то;ем,о0то;го,му;го,е,й,м7ю,ё;еня,н0ы;е,о0;й,ю;ем,о2то0;!-0;нибудь,то;го,м0;!у;м6х;го,е,й,му,ю,ё;а3с0ы;е0ю,ё;!го,м0х;!и,у;м0с;!и",
    "FemaleNoun": "true¦б0Aв06гр03дZе01жиз0Dзеле0DкVлTмKнIоFпBр9с5т3це2ч0шерс08ще01;ас07е0;с06тв6;пь,рK;е0ка09;нь,тра00;вяYе02ире07корSм2оVт0;а0еп9р00упе06;ль,рQ;ерZ;адOеQо0ысь;жь,ль;амяWеч1лощаTо0ропVыP;моWстеO;а0ь;ль,ть;б1с0череP;еWь;лPуT;иPо0;вEчь;а7е5о1ы0;сFшь;лод1р0;коN;е0ё0;жь;беAд0теA;а9ь;зь,ть;адоJеJо0;жь,шаA;азHосCр0;еп1ов0;аAь;ос9;а2верь,ета1о0;чь;ль;ль,нь;а9у1я0;зь;дь;е2л0;ас0;ть;щь;ол1ро0;вь;ез0ь;нь",
    "AnimateNoun": "true¦а29б21в1Rг1Kд1Gе1Eж18з16и12к0Pл0Lм0Dначальн0Uо07пVрSсHтFуBфAх7ц4ч1шофUщен15электр0Uю0яще0Qёж;ноша,ри2D;е0ита1W;ловек,мпиLр0;вь,епаH;а0ыплV;пля,р0;и0Kь;о0удожн0M;зя0мяк;ин,й1Y;ерм0Tотог10;лит1Wт1Wч0;ени1итель0;!ни0D;к,ца;е0игр,оварищ,ури1YюлWётя;лJтя;в8е7л6о4порт1Lт0уд9ын;ар1р0удент4;аус,ои1E;ик,у0;ха;ба1Lва,кол,лд1Sсед0;!ка;он;крета0Hст12;ин0ященн03;ья;абFе0ыбак;б6да1Gжисс0;ер,ёр;а8е6и5о3р0тиVче0Tёс;е1о0;грамми1GдавCфесс1I;зидеGступнV;вZдру00купа0Yпугай,рос0эт;ен04ён04;л0Dнгв0Mса0W;в0реводчRс,т3;ец,иN;нда,па,р7с0;саж10т0;ух;безья05вJл4р13с3т2фиц1х0;отнL;ер,иа5;ец;ел,ёл;ень;а6е4инистр,о3у0ышь;ж1зыка0рав0Iха;нт;!чиW;нах,рж;д0ханB;ве4сест08;льч9ма,ть;е1и0Rо0яг0Lётч8;сь,ша1;бе0опард,тч6;дь;абан,енгуру,нязь,о5р2у0;ри0;ца;о0ы0K;кодил,л0;ик;з5лле4м3нь,ро1смонавт,т0ш0C;!ен8ён8;ва,л0;ева,ь;ар;га;а,ел,ёл;гр2н0;дюк,жен0;ер;ок;аяц,ве0ебLмея;рь;ен3и2у0;к,р0;авOнали03;раф;а,щи0;на;ж,н0;от;е1иреTо0руг,ядя;ктYчь;в0дOльф5путW;очOушO;е5ид,о0усь;лубь,рил3с0;по0ть;д0жа;ин;ла;нерал,рой;ерблюд,ну8о2ра1ыд0;ра;г,ч;ди3лк,р0;!о0;б0на;ей;те0;ль;к,ч7;а2ел6изне1о0рDык;бр,г;смен;б2нк1р0;ан,сук;ир;уш0;ка;вт6двок5и4кт2нг1рхите0;кт5;ел;ер,ри0ёр;са;ст;ат;ор",
    "FemaleName": "true¦0:0T;а0Hв0Dг0Bда0Aе01ж00зYиVкSлNмHнFоCпBр8с7та6у4ф2целес0Qюл0Uя1;на,рI;аи0е1ёкN;врZодо0M;л1рсуL;и00ья0;ис0Oма0Jтья0;вет2ерафиWнежа0оф0NусT;а2еги0имVогнеRус1;ла0;да,и09;ав0Gелагея,ин0о0Gрасков0K;к2л1;импиаMьга;са0тябS;а1и0он0;дежJтал0F;а3и1;лица,р1;ослава;р1трё0;гариKи1фа;на,я;а4и3ю1;бовь,дми1;ла;д04л04;да,риS;а1иXлавд02сH;питоYр1;и0оX;н2о5р1я;аи3и0;га,есMна;инаи1ла7оя;да;ан0;в6кате5л3писти2рми1;онS;ма;е0изаве1;та;ри0;г2докNла1праксNфросинN;лMмпM;енL;на,рL;аGл1;афиDикерI;а2ер1икторHладимиC;а,они7;ле1рваAсили4;нAрE;гBза,куAл5н1;астасCге9жел2на,тони0фи1;са;а,и1;ка;е2и1ла;на,са;в2ксанд1;ра;ти0;ли0;аф3лая,н2риппи0;на;ия;ья",
    "MaleNoun": "true¦аZбукXвоевода,гTдRевро,журав00зPкJлIмGнEоDп9р7с4т3у2фонаYцирку00ч1шимпанзе,юноша,я0;коXнтаX;ервь,ита8;ровеLчи7;опоWюлеK;л1пектакVт0ухаT;аршBиU;оQуга;емеGу0;бRль;а1еEиса0ортDуG;теP;па,р0;еBоN;гоAлеA;о0уL;гоAль;едвеFужч0;ина;агеFебеDоко7;а2енгуру,исеGо0ремG;н0ре3фе;троEь;лендаBме1рто0;феC;нь;ве8я0;ть;е0ож4ядя;душка,нь;воз2о0усь;лубь,с0;пита4ть;дь;ва0;рь;втомоби0нсамб0;ль",
    "NeuterNoun": "true¦алоэ,бю9видео,депо,ж8интервью,к5ме4п2р0такси,фо3шоссе;а0езюме;гу,дио;аль0иани3юре;то;ню,т4;а1и0;но;као,фе,шне;еле,юри;ро",
    "MaleName": "true¦0:2C;1:2D;2:29;3:24;spencer,а1Wбо1Uв1Eг18д12е0Vжд3зинов0и0Oк0Gл0Cм06н01оZпTрQсGтCурб3ф5х4;ар0Mриса0T;адд1е8и5о4рол,ёд1J;ка,ма,т0;л4рс;ат,и4;м2пп;до4ликс,октист;с1т;арас,и5р4;иф2оф1T;м4т,х2;оф1ур;аBвятоAе8ил7о6п5т4;анTеп3;енсер,ирид2;з2фр2;а,ьвесD;васть1Bмён,р4;аф1Kг1;полк,с0Y;в4му0S;ва,ел0;азумник,о4усл3;д4м3стJ;и2ос0T;а7лат2о6ро5ё4;тр;в,коп0т15х0T;ликарп,рфир0тап;вел,ис0н4рф16фнут0хом0;крYтелейм2;лег,н4;ис16уфр0;азар,ест0Nик4;ан6и5о4;д13лYн;та,ф0K;др,ор;а6еле1Bи5ст4;ис0E;на,рос0Dтроф3ха08;гистри3к5моEр4тв1;к,тын;ар,с0V;авре15е5огг11ук4;а,ий,ь0J;в,он4;ид,т0;апAи8лиме7о5у4;зьма,при0F;н4рн0A;дрOон,стант0U;нт;м,р4;!илл;ит2;аки9в3г7зот,лья,нноке0Tр6с5у4;да,ли3;аак,идY;акл0ин1;н4орь;ат0;нф;в7гTмель01р5ф4;им,рем;ем1мол4оф1;ай;г5док07с4;ей,таф0;ен0раф;ан8е6митр0о4;брыня,н4роф1;ат;м4нT;ид,ьQ;аJи9;а7е4леб,орд1ригор0;лRннVорг0р4;асWман4;!н;ври4лакти2;ил;аDенBи8ла4севолод,ячес7;д4с;и4лен;мир,с4;лав;к4ссари2тал0;еXт4;ор;еди4иамR;кт;вила,дIле6р5с4;ил0;лам,соноф0фолом1;нтMр4;ий,ь4;ян;гд3р4;ис;вKгаIкGлCн9р5фан4;ас0;истарх,к6с5т4хипп;ем0ур,ём;ен0;ад0;атол0др1икита,тон5ф4;им;!ин;екс6ь4;берт,ви3;ан;андр,ей;ак0инд4;ин;пит,ф2;он;д1ксе4;нт0;ий;ей",
    "City": "true¦0:37;1:30;2:2W;3:2U;а2Yб2Fв25г21д1Uе1Sжуков29златоуст,и1Qйо1Oк16л11м0Tн0Gо0Dп08р07сQтNуLфKхGцFчAш7щёлко3э5южно-сахал2я4;к1Qнг2Dрослав01;л4нгельс,р-рияд;ектростаZис2Z;а5энь4;чжэ1ян;нх8хты;е5и4унц1Fэнду;каYта;боксары,ляб2нн5р4;еповец,кес0;ай;зина1индао;а4им28ошим19ьюст21;бар0Kйдар2Mн5р4савюрт;б17тум;ты-манс13ч1M;иладельф2Uоша1укуо1J;л4ссур11фа,ха1;ан-удэ,ьян0F;а5верь,егер2Sо4у15юме1яньцзи1;бо2Kкио,льят22м0ронто;ганрог,мб0U;аGеAи9мол1Vо0Xт7у5ы4;з04ктывк0N;р4ч1D;ат,гут;а4ерлитамак;вр9мб20рый оскол;а1мферопo9нга0G;в5р4ул;гиев пос26пух0L;аст5ер4;одв2ск;опо4;ль;лават,м14н5ра4;н0т0F;-паулу,кт-петер0Rтья4;го;аменск18еут0Cио-де-жанейро,остов-на-дону,убцUыб2яза1;ариж,е5одо20рокопь24ск0Bу4ятиг07;на,шкино;к0Fнза,р5тро4;за07павловск-камчат11;воура1Wмь;бн2динцо3ктябрь0Zм0р4са0Q;е4ск,ёл;н0Hхово-зуе3;аEеBижн8о4ью-йорк;в4г2ри1Rябрь0;о4ый уренгой;кузнOмоскIросс03сибир0че4шахт2;бокс1Qркас0;е5ий 4;н0Uтагил;вартEк6;винномыс0фте4;к4югA;ам0;бережные челны,гоя,з4льчик,нкYход0C;ра1;а9ехико,и7осква,у4ытищи;мбаи,р4;м4ом;ан0;асс,хайл4;ов0;гнитогGдрид,й4ниTхачкаT;ами,коп;а7и5о4уан0Aюберцы;нд0Fс-анджел0H;ма,п4;ецк;гос,х0T;аFеEиBоAрасно7у4ызыл;ала лум5р4;г17ск;пур;г5д4яр0;ар;ор0;вр6лом0Hмсомольск-на-амуре,пей0ролёв,строма;ншаса,р5сло4;вод0;ов;меро3рчь;за1ир,л8м6ра5сп4;ий0;чи;енск-уральRыш4;ин;ининCуга,ькут0I;ханнес8шкар-о4;ла;вано3ж0Mрк4;ут0;впатор0Mкатерин4ссентуW;бург;а7е6жакар0Bзерж2имитров5о4унгуа1;лгопрудBмодедо3;гр08;ли,рбент;к5л4р-эс-салам;л0Aя1;ка;вадалах6онконг,роз5уанч4;жоу;ный;ара;ашингтCеликий нBиднAлади9о4;л4ронеж;го6ж5ог4;да;ский;грUдон0;востMкавказ;ое;овгE;он;аDе7ий0лаговещ6огоQр5уэнос-айр4;ес;ат0ян0;ен0;л6р4;д0езни4;ки;г5у-оризон4;ти;ород;гдFлаAнг7р4тай0;на5село4;на;ул;ал5к4;ок;ор;ко3шиха;во;бакHлDнгCр9страха1тлан7хмед5ч2;ин0;аб4;ад;та;нь;зам5мавир,ханге4;ль0;ас;ар0;ександр6ьметь4;ев0;ск;ия;ан",
    "Ordinal": "true¦в4де1п0сед5третий,четверт3шест6;ерв2ят2;в0с0;ят0;ый;ос0тор1;ьм0;ой",
    "Cardinal": "true¦восVдKмиллиIоDпятBс7т2четыр0шестA;е0нYёх;!с4х;р1ысяч0;!а,и,у;ех,и0ёх;!дNнTс0;та;ем2орок1т0;а,о;!а;и,нOьM;и0нNьL;!десяE;б3д0;ин1н0;а,и,о;!нI;а,е;ард0он0;!а,ов;в4е0;вя0сят8;носто,т0;и,нBь0;!с9;а2е0ух;!н8с0;ти;!д0;цат0;и,ь;ем0ьми;н2ь0;!десят,с0;от;адцать",
    "Country": "true¦0:3B;а2Tб2Eв26г1Qд1Mегип1Lз1Jи1Cйемен,к11л0Xм0Lн0Bо09п03рZсKтEуDфAхорват0центральноафрикан1Oч8ш6э4ю2я1;май31п0E;́жная коре́я,жн1;ая аф12ый суд36;ква1ритр04ст0Bфиоп0;д23ториальн02;ве1ри-ланка (ранее цейлон);йц2Dц0;ад,е1иF;рногор0х0;арер2Gедеративные штаты микронезии,и2олкленд2Gранц1;ия,узская поли17;джи,липпIнля1I;ган2Oзбе6краи2Lоллис и футу2LруT;а4иб17о3ринидад и тоба1Bу1;валу,нEр1;км2Gц0;го,кел1Kнга;джи1иланд (ранее сиам),нз2Q;ки2B;аDва́зиле́нд (эсватини),е6и5лов4о2у1ьерра-леоне;д2Oрин1M;ломон05ма1;ли;ак0ен0;нгапур,р0;верн5йшель20н1рб0;егRт-1;винсент и гренад2китс и нев1люс0;ис;ины;ая 1ые марианские;корCмакI;львад1Bм29н-1удовская арR;марино,томе и принсипи;е2у1;ан21мын0;спублика ко1юнь14;н0Nр6со04;а2еHо1уэрто-риP;льша,ртуг09;ки1Pл0Wна1Gпуа — нов2ра1;гвай;ая гвин1;ея;бъединённые арабские эмираты (оаэ),м20строва к1;айм1Zу1S;а8еп7и5о1;вая 1рвег0;зела0Hкал1;ед1;он0;гер1карагуа;!ия;ал;миб0у1;ру;а4екси1Hо1ьян10;замбик,лд2н1;гол0тсеррат;ав0;ври7дагаск08йотта,као,л4р1;ок2тини1Cшалл1;овы10;ко;а2и,ь1;дивы,та;ви,йз0;кий,т1C;а3есото,и1юксембург;бер0в1т0Uхтеншт0R;ан,ия;ос,тв0;а9ен0и6ндр,о2у1;ба,вейт;лумб0мор0Nс1т-д'ивуU;о2та-1;ри0X;во;пр (остров),р2тай1;!ская республика (тайвань);гиз0ибаV;бо-верде,зах0Kм1на0RтN;боджа,ерун;зраиль,нд5орд0Wр3с2т1;ал0;лаGп0U;а1лаF;к,н (персU;ия,о1;нез0;а1имбабве;мб0падная саха0J;ет;ан0емократическая республика кон3жибуIоминика1;!н1;ская республи0E;го;аDв8ерм0Iибралт7о5р1уH;е1уз0;н1ц0;а08ла1;нд0;н1сударство палес02;дурас,конг;ар;а4и1;аZнея1;!-бис1;ау;делупа,тема03;б2и1йаVмб0на;ти;он;а7е5иргинские острова3осточный тим2ьетн1;ам;ор;! (великобритан1;ия);ликобритания (соединённое короле́вство),н1;гр0есуэT;нуату,тикан (святой престол);аAе8и́р7о4р3у1;р1тU;кина-фасо,унди;азил0уней;л1сния и герцеговиGтсваG;г1ив0;ар0;ма;л1нин,рмуд4;из,орусс0ьг0;гам2нгладеш,рбадос,хр1;ейн;ские1; остро1;ва;встрHзербайджGлEмериканское самDн6омынь,р2фгани1;стF;ген2м1уба;ен0;ти1;на;г5дор4т1;аркти2игуа и барбу1;да;ка;ра;илья,о1;ла;оа;б1жир;ан0;ан;ал0ия;ия",
    "Infinitive": "true¦0:SW;1:T0;2:RV;3:SV;4:RO;5:SZ;6:SU;7:RK;8:QD;9:QG;A:QA;B:SS;C:RG;D:R2;E:Q5;F:QH;G:PZ;H:S5;I:SQ;J:RW;K:JX;аSYбS7вNAгMTдLNеLMжLIзIXиHPкGUлGMмGCнEYоC9п60р4Dс1Wт1Kу05ф03хZцUчQшNщMэкLявR3;о1WспI7;иJJёлкG;агGеMи0оSIуL;ме0ти0;вF3пSD;еMиLувс4B;ни0сFта1;рLса0;пGти0;арOвес7еMиL;ркуSUтиB;лLни0;и2о5;и0сH;арактеT2ваNлоJ6муLVоMраLуQS;ни1пе0;ди0роLBте1хоS1;ли0с9AтA;иLлирSDо1KунGW;кIUнанIU;б0Wв0Rг0Pд0IеOHж0Hз0Gй7к0Bл09м07н06п00роL7сRтPхOцеQTчL;асHес0итL;ы3ьL;/науOZся;аDCоEудшBL;вA6ешAоLраNT;ну0чн8;а6MвELес2илиKк45лыA1мехOEоSпQтLыIT;аNрLупA;аLои1;и5н8;вLнCDть;а0и2ля2;е4окL;аи5ои1;верше2EмJE;аPеOJи6PлаFоNрLусN6;аLоNB;вGKзIF;мLтHX;иIWяD;кS7с0;ес7ичтKQоPOы3;еLиMAнKPол8ыD7;ньшR4ре0ть;авOQетQ7оLучшAыбNW;ви0жи0;аз3GлаPXорOрL;аLепCы4;сLша0;и0ть;аJRоF;акоDOна4;аM8иO0;аQвDUеPивH9оL;влетв3DстLчN;аи3оL;вLи0;ер8;л8ржJ8;ва2лN3р8тьJ;ад6оLроPX;вJBди0жMKсFща0;аPVеOиде1леNоL;ди0зи0лL;и1ьня1;ка1чьRQ;з7лиC8р8с7;еLиGUра0;га0ди1жL;а0да1;аVвUеSоOрLуLNя6X;аMеLоQAу6ZясKE;бо5воP2ниB;нсR2ти0;лкNну0пMрLсFQшJO;го3моKRо6Yча0;и0та0;а0ну0о3;рLсIчь;е0пе0я1;ерEоKT;нце3сMUя0;а20б1Zв1Rг1Qд1Oе1NжICи1Mк1Eл1Aм17н15о0Iп09р06с05тVуTфоRхPчOши0ъеNыMэкоL;ноDR;гL4па0;зD4с0ха0;ес0и3P;ватLоJW;и1ы9;куGVрмLтографиB;иQDуQL;ди0мLну0ши0щ5K;е0миB;аRеQиPоOрLу6L;аMеLиI2ои1;ля0ми2;да0хо3;и0лкI3на0я0;муQDра0;ли0ре0с6H;ви1лки9нMрLть;а2е0то3;оN8це3;оJDыла2;аLы5;бL5внLжа2зи2ть;и4я2;аRеQис6лаK8оOрLусAK;аMоLя33;воFSси0;вNZши3;ри0с69тL;кHOыMK;ть,циализиPQши0;сLть;а1тиOL;б05в01гYдеXедBNжWзVйJ5к57лUмне9оSпроRрQсOтMх1YчL;е6Hин8;ворLруд6J;и1я0;а0ла2редотоAQтLущ4R;авCоя1;ва1евно9тиB;воN9тивля2;бLтвеP6;раMUщOU;га0и0;даKна4ре4;аNSра0;йсHржа1;лаLну0реJZ;сLша2;и2ов6;а0еLмеKMокупNCпаM2ра0;ршLто5;а1еLи1;нсH;и1NлюLра1;да0с7;ес7иLоMYя1;жа1зи1ма1тьJ;еMирMAоLуF8яAR;ло0нIт5Hчь;нKRри0ть,шKQя2;едNиKо64уMыL;ха0ша1;жи0ч86ша1;и0о3;аQлPоLрыKуNQ;льзNмMнLпиB;цCYча1;биJ0прD4;и0ну0;ады5еи0онLY;зLка0ти0чи3;а1ы9;г2Uде0я0;р4Lс0я0;аKеLохDыNI;ла1ржKA;иба0орMZ;аRеQиOоLязJD;ди1рL;аGMоL;ва0ти0;д8UстL;е0ну0;ркGсHQти1;лиKри0та2;еKAи4р8C;ди2жа0нCN;а00ва1еTжаJVисRоPуMыL;да0тьOR;би0га1ководLли0хDши1;и0сL;тво5;ди1жLня0;а0да2;кLо3;ну0о3;аPвOгNд7LзMкLм7Kф1OшNB;лаHKомендо5;а0ерNWюHJ;иHGуO0;е0но3;гиBлизовL;а0ы5;боN9в41до5з04ни0сL;к01пWсPтMходLчес6шир8;и2о3;аMвLеря2и,роDA;ор8;моECя0;ер3Lк6LлPмOорIпрGLтLужIWчитIHыпа2;аMрL;аи3ел05ои0;в7SтьJ;атри5отEN;абLеNI;и0ля2;ахJ5оNрLусIL;е2WостL;ранJ4;з7Mл2QрL;о0я0O;аLлаLIры4;и9чL7я2;б04в01гZдWлUмQоOрMъед94ыL;гр6скIX;абI9еLушAы3;за0шMH;бLй0NчарNG;ра1;еMыL;сHQшBN;нLсFшIQща0;и3я0;иLоL1уч67;ва2тьJчGO;аMеLражA;ва2лIMтьJ;вGLтьNE;лLоваEV;а2DядIN;еMиKлеKIоLяз6;ди1раEA;р2LсLHши3;иMрLуE;а6QоHD;ва1ра1тьN6;а5Rе5Eи5Cл5Aну0о29рOуMыL;ли2та1;блиBCга1сHPтL;а0еш1M;а24е1Eи0PоMыC2яL;та1;а0Mб0Kв0Iг0Bд07еIGжи4звуLAи03й7к00летKVмZнXпWрVсQтMхоEциIчLшепLWща1явC6;ес0ит6;еNивLяIG;и2оL;дL1постJWреIXст7N;ка0сM5чь;иOлNм1Fпа0тLыHP;и1оIPуL;ди2жа2;авK8еE;ть,я0;абH7ва2ы9;аганM5ис6усH9;есLикGоBH;тись;алE6олKV;ашALоL;ммM6нL;суA5тA3;гр6зMлB5нфLс1I;орFH;вLн4Uой7;естиMDоF5;аKвиFGеMикLNлLолжL4ум6;е3и1;кFBл6мL;нF9онF9;лQнPоOрNуL;де0лL;и9я2;амF7еме0;вDLло83ня0;а0оLP;аGMоFядHD;а5UеEUоL;ди1жа0згла11циB;еHFи4оLу8M;ва0рмоKV;наLI;б07в04г02д00еHDжZзYйEQкWлVмUнTоSпQсMтворIKуLхоEOч78щемC;краK0чA;аNв7Mес0лMни2оединIIпосLтупAуKXыFV;абI8оF6;а0ушJ6;жи9;ар9ZоL;дн0GмHL;бреC6сI1ткры4;адлеJPес7иI9оIXу8Aя1;енGTкDыH6;аAMетJHоJ4;аз6рL;епCы4;ва0емлI6наKы3;а1иI3;а4ержIUиLра2ум6;ра2;ла0FоL;вCUди2ж79тоES;атиKYеMлеIJоLыкGяз6;ди1зи0;з7сE4тсH;авCеGPи4лиLы4;жа2зи2;бы4в07дQкраIAнебре6IоOпNрMс9Hт1BуL;вели6FменьшAспе4;ва1ы5;ода4яK7;бLдоле4;лаFSразKU;а4виINл00назн7GоWпRстOуMчуAJшLъявC;есH;пре7MсмL;атCGотBJ;аLоя0;вLть;а0и1ля1;оMринL;иIOя0;лMчL;ес0иJO;аF4ожи1;преNставMтвLхра0E;раAA;и0ля1;дел8;аEZоI4;зой7осMраHNыL;си0ша0;хоE;ви0здHAктико5;б2Iв2Bг27д1Nе1Mж1Iз1BисG0й1Aк13л10м0Wн0Uо0Sп0Mр0Hс01тRужиGDхPцело5чNшMщиAGяL;вHXсн8;ев61уF;еEJиLти0;ни0сFта0;ваLлоABоEуHX;ли0с0H;еSороRрMуEBяL;ну1;еNуMясL;а0ти;ди2;бLвоHN;и0ля0о5;пи2;рLть;е0я1;аEвZеYкаFJлWмUоTпоRра0соCOтLчи06ыE0;аOесNи2оя0рMуL;пAча0;аEMои2;ня2;вCрL;а2е0;ри0сL;обсH;вето5дHWли0;е0отL;ре1;а0еJ4уLыша2;жи0ша1;лG9ти0ща0я0;аRя96;аOва0еMоE8ти1учAыL;ва0тьJ;за0комL;енIX;жа0зи0ни0;аPолз7рMыL;та2;авCоLы8D;бо3си0шайL;ниHL;да1с1;беLщр8;да0ща0;адLесC0иH1раFPюHJя0;ея2оби2;еNиBTни0оLучи2ча2ы0;га0ли2чL;и2ь;ня1сFти0ча0ша0ща0;аDEеMз7и4оLучHSьFNюCD;жи1ма0;з0те0чи1;аQиPлOоNрMуL;па0ри0са0ша0;асI4у91ы4;ле6PнEWр8;о9Mяс2;да0ну0;зD2ти1ча0;ма0ти;аPвNдMнаL;ва0к82ть;о86рFO;а0оL;л8ни0;бо1DвLимсH;иI0тA3;аMеLиGD;ва0ла0рH;лLть;е0о5;да0с0ха0;а03б02вWг7GдVеUкл6SлеGFме8VнTоSписCOраQсPтвOуNх0PчMъеDUыL;ша0;еC5инDI;ма0ть;ер4W;к0NлушDE;жа0зLтьJ;ни0уме3;бC2жCVзре3й7;иEQя1;йсHлAшеD6;а2WержD8;еNиMоL;ди0ра9M;га2ну2;рLс7;гLну0;а1ну1;ад9Dи71одH0;вDMри0ть;аF3ибGлNоMруL;жа1зи1;воGWди0;о7CядD1;аBUеOзросFIиNлия0оMреEторCWыL;си1ша1;зи2ра8N;но9сG;д6з7рMсL;и0ти;и0ну1;еLи4лагодаGNри2;ди0жLре8M;а0да0;аLе3ы0юD;ва0ка0ниGQти0;ли0на0са1тL;а1ь;реLть,чаG8;бVвSдRеCRжи4й7кус72меC2нQсOтNхMчL;иB2у6R;в6ZоE;ерпе0ь;еEDкLпр9Lта4;аз6;ес7оEE;аKвиA7ел6ум6;еMоL;ди0зи0ра8N;з7рDс7;и65ра0;да0ко3рLс0хD;ал41ко3;б1Hвл8Jг1Dд1AжиE2зна19к16п0Uр0Tс0GтQформCхNцениKчMшибLщуDZ;а2и2;арGMиBMну2уN;арактер3Xв6KоMрL;ан8ипD;ти2;б07в04гад6д03зы5к01л00меZнYоWпUрPсNтLхоEыскBW;алки3олкDяL;ги3ну2;леAVтLуFQ;а2Fоя0упA;аOеLица0ы5;агиBдMза0мL;онI;акI;бB0жа1зи1;раLусB2;в5MздD8;браLз5й7мсFр5;жа0зи0ть;ес96иE7оBBя0;н8ти1ча1;ичF2оDT;азAKлLрыK;аDWикBTон8ючA;а4елBEохDыEK;еLлеDDоEN;з7рLс7ти0ча0;гGну2ты9;иA0рL;аLоDC;сы3;вUкорбCлабCмSнRозQп7HтMуL;ди0жAPществ56;аLри73у1W;вMнLтьJ;авли5о9B;а2и0ля0;на4;аALовA4;ат7AеLот6D;ли0L;аи3е5CидMоL;боCUи0;етельсH;а0ган2Iиен3C;аVерTиSлаAKоQрNуL;бликFDсL;ка1ти1;аMеделAQоL;киDLси0;вд6ши3;веA8зL;да0на4;ра2с6;еLиB;ди0жа0тьJ;зCZса2;аMкупиBонBCрL;есFужA;з9Jн6U;комCPча0;алMеKоL;бр8лCO;жи3;лядNраL;би0ниL;чиK;е2ы9;в0Bдум6е06и05л03м00нZоVрSсPуNхо7Rща2ъLяз6;единA5яL;вCснA4;словLчDO;и0ли3;лу4ZтMуL;ди0жBZ;оя0;аMе59ушиL;ва2тьJ;б98до5зов90ти1ща1;бщAжа0зNй7IрMсL;нEFра2;ачи9уE3;ли0н10;аружиKиCFовCя0;анMенL;и5я1;у0ы3;а96еL;гчA;де1жа1та0;да0рNспLща0;еLокои2;чи4;еLну2;га0чь;ин8;аSеOоNраAQуж03ыLюCK;рLть;ну0я0;си1че3;доMнB2рвL;иBниCD;оцеLста4;ни4;б0Pв0Nгр0Lд0Hе0Gж0Fз0DимеASй6Tк0Aл09ме07н06пZрWсPтOу4WхNцMчL;а1ерFи4E;ели2;му6Lо6O;к54ре7JыA0я9E;и2RлOме51тL;аMоя0рLупA;аи3ои0;ва0и3ть;аLеD7;ди2жL;да2;астAJе82иMушAяL;ди0жа0;со3;а9SечаCHиPоOрLу2L;аMо2EяL;га2чьJ;в2Oши9;лн8м9C;ва2са1тL;а1ьJ;ес7иB8оANя0;кGрLти0ча0;е9и2;а7Iи4оAT;аз6лMоLры4;пи0рR;аAVон9V;ва1нLы5;ачA;а0иAZ;да2зB5с2ха0;еNоMры9ыL;ми0;е98р9;ва0ть,я2;аLу9Q;ди0ж7N;еLоEяз6;сти7Dща0;и89люA0ра1;аTеQиPоMсFу3Qча2ыLя0;с6Xть;билMдер18лLнIроA1тиC6чZ;и2о0ча0;изCH;гGно3ри2;лькGня1рMтLчBKша0;а2ну0;зDи0;за0нипуC4ршиBте62хG;ая0га0еQиOоMюбL;и0о9;ви0жи2калLма0;изо3;кLсBCтьCFшB7;виBWо3;жа0з0тA9чL;и1ь;а0Cи0Aл07оRрNуL;пLри0са0ша0;а2и0;асNесFиMуL;жи2ти1;кDти0Fча0;и1не0ть;лXмUнOорди5SпMрLс3D;ми0реBN;а0иLну0;ро3ть;в53ку5LсNтMцLчAS;ент5K;роBI;таIуL;льL;тиB7;анBBби5IмBIпL;ен1MрL;омеI;еMлеL;кцио5E;ба2;аLеи0яс2;ня2сL;с0Vть;вGда1ну1пL;е0яF;зMле7Lр7Nса2тABчGшL;ля0;а2ни0;г0Rд0Oз06л05м02нYроXсL;кTпQсPтMхоEчеL;зGрп6;е8KоLраF;лLпи0;ко3;леAR;оLр8Aу3Rыт6;веAPлLр1E;н6EьB4;аMлL;ючA;ле76ть;ниAP;весIтеMфL;инитив,ор43;г4LрL;е21преI;еMиIпL;орI;но3тьAW;лю3V;бZвYгXдWжа9ZлUмSнOоMрасхоABуL;мCчA;брLй7лиB;а7Jе19;аMоL;си2;сиLши9;ло3;а51еLя0;н5Sр8;аLо83;га0;а4е9;от6V;е58ин5Nле7N;авMе5VиLра0;ва0ра0ть;и1ля1;ентLти;ифиL;циB;но3Uра0;аTвSдPлNнаLуб9D;кLть,чи0;оми1;и0оупотL;ребC;оMраL;всH;ро9;а0о27у8B;б1Sв1Iг1Bд15е5Gж12зуб94и10й7к0Tл0Qм0Nн0Lп08р06сYтTфикSхOчMщиLявC;ти0ща0;ерпLи3Q;ну0ы3;вMоL;ди0те1;атL;и0ы3;сиB;кDоOрMы5AяL;ги5ну1;а7NоDуL;дн8;рмо2Xш1T;веRлуQмея2ну0овы3тMуDыL;па0;а5AрMыL;ва0ну0;ах99еLя0;ва0ли4;жи4;ти1;аLегистри8Pжа4G;б3Vжа0зи0;аз6ZеWиVлSоPрMуL;с3Wт6;еMоL;грам2Aтес8J;ти0ща1;доз8Bз3Wлн8мL;иLни1;на1;аMеL;с7та0;ка0ниBти0;ра0с3B;ре0;ес7и5KоLя1;си0че3;еLи2Tол77у4Y;н8рLти0ча0;е0зG;ез6Eи4оLюбо9;гиLжи0;ни2;аPлOонNрLури4;епCу68ыK;ва1ть8O;чи1;а6Aюч1T;з6нL;чи5;мсHнтереL;со5;а0еMиL;га0ма0;чь;а4еOохNуMыL;ха2;м2Nши0;ну2;ва0ржLть;а1и5;ля6Bна0оMрL;у4Zязн8;вNня0рL;аLе0оE;жи3ть;аLо78;ри3;аTеRиPлOоMтLяз6;ра3K;ди0ев6раL;чи3;аде4;до3сL;а0е0ну0;до3рLс7;бо3и0ну0ш6Lя0;ли4ри4;ереме70и36оNрLы4;а34оL;ниBса0;ле4ти2;аMда0еLи0ра0;ва0ла0ни1рHчь;ж2BлLри0;е0и0о5;зEс0ха0;а0Nви0Mе0Gи0Fли2оQрNуMыL;ми0ша0;ма1ть,ши0;аLо5Hу4Y;зLтьJ;ни0;б07в03гYе2TжWй7кVло4VмTнSпPрOстLхоE;аLигG;вLть7A;а1и0ля0;ожA;олн8рMусL;ка1ти0;а1Wо4F;аши9о23;и0RоL;га2;аз6ла4Pум6P;да2иL;ва0да2ть;адOна0оL;вLня0;а2WоL;ри2;а2ы9;еMоL;ди1;р8сL;ти4Z;авCиLра2ы4;ва2ра2тьJ;к5YскуI;ва2жу5RзPйсHкNл5EмонMрLтьJше1P;га0жа1ну0;ст05;лаL;миB;ерI;га1ну1;вMри0тL;иBь6E;а1и0;аYенеXибDлVна1оQрMуL;де0ля0;аNеMоLуLыз0;зи0;ме0ть,ши0;би0;воOди2лоNрMсподсHтоL;ви1;ди2е4;да0со3;ри1;аLо4Yя3N;ди0си0;риB;рLси0;анIмоL;ниB;а4Fв4Bд47е42з3Mи3Kкл3Iл3Cме38н33о24па23р21с1Iт1DхоEцеп3Dъе1CыLя0A;б16в4Aг13д0Yе1Bжи4з0Vигр6й7к0Pл0Nме0Mн0Iп0Fр07сUтQучиPхоEчMши4яL;вCсн4E;еMиL;сл8;рк1K;ва0ть5P;аNеMиLь,я17;ра0;ка0ре0чь;ск0Rщи0;аWкTлRоQтNуMыL;ла0;ши0;авCрLупA;аи3еLои0;ли0;са0;а0еLуш0J;ди0жи3;аLо1D;зLки3;а1ы5;ди2жи9сы3;аNва1еMуLы5;га1;за0;бNжа1зи1стLщи3;а0иL;!ть;аLо3Y;ты3;а17иMлаXолн3Kрям2HусL;ка0ти0;ва0с6ть;аNи2Rо26уL;ди0жLть;да0;ши3;сFща0;еLо2A;з2Bт2M;ачVи2SлPрMуL;па1;аMуL;ти0чи3;си1;а28ючA;ва0дорLы3;ав0XоL;ве0;а4вOеLохDы2T;лMржL;а0и3;и1я1;и32ор8;лLна0оня0;аEядL;е0ы3;еOиNрL;аLо1H;сы3ть46;ва0ра1ть;га0жа0;з25ха0;исOоргNыMяL;ги3ну0;ка0;а2ну2;ки3ну0;кYмVпQтL;аNрLупA;аи3еLои0яхP;ти1ча1;вLть;а0и0ля0;оMыхL;и3ну0;мLте0;иLни0;на0;атMотL;ре2;ри9;аMипяFоLры4;чи0;ки3рL;абL;ка2;аLеEучAы9;ть,ща1;да0с0;вле0Iди1е3з05й7л04ня0о02пи0р01сLткD;клиZпQсNхL;вал8иL;ти2ща2;танL;авLови0;ли3;алSит6ольRрL;епя26инOоL;извMтиL;ви2;ес7оE;иLя0;ма1;зо9;и2я2;кDца0;ва2о3;браLдушевC;жа0зи0;но3;буVвSглRдеQи1нNобновCраL;жа0зи0стL;а0и;енMикG;а0ну0;ави07;йсHл6ржY;авC;ес7оEраL;ти1ща1;ди0;ди1жL;да1;ка0чь;еNоMушA;а0и0;си0;др8с7;и0я0;сFшLща0;а2и9;ва2;ти0;аPеNия0оMюбL;и2ля2;жи0;зLчь;а0ть;де0;аLюч0P;ды3;дLзиBсе0;е1не2;аимодZбол0QвXгляWдQлNор5рLя1;осLы5;ле0;амы3етMоL;ма0;а0е0;оNрLы00;аLогD;ги3;роMхD;ну0;жа0;ды3ну0;еLолно5ы0;си0ши3;ейсH;да0з7ле0нOрNсLша0;и0тиL;!сь;бо3и0те0;ча0;охнMыL;ха0;овCу0;и0ля0;еMоL;ди0зи0;з7с7;ти;лLри0;и0я1;а08е04и1лXоRрNуMы4;ва0ть;ди0ше3;а1и2оMызL;га0ну0;ди0ниBсL;а1и1;дрсHйкоIлPмбар09рNя2;тьJ;ся;моLо1;та0;е0та0;агоNесMоL;киB;ну0те0;даNприяL;тсH;тво3;ри0;га0жа0реMсL;еUпокои1;меLчь;не0;зиMсL;то3;ро5;вто03дресZкUнQплоPрLссоцииBтакZ;гумUеMхиL;виB;нLстW;до3;диB;аMнуL;лиB;лиL;зиB;тивиNцL;енI;тиB;зиBро3;ро3;ов6;а0ы3;ва0;ть;риL;зо5;ва1;тьL;!ся",
    "Month": "true¦а4дека3ию2ма1ноя3ок0сен0феврал5январ5;тя2;е,й,рт4я;л2н2;бр1;вгуст1прел0;е,ь,я;!а,е",
    "WeekDay": "true¦в4п1с0четверг6;ред1уббот1;онедель3ятниц0;а0у;!м;оскресень2тор0;ник0;!ам;е,ям",
    "LastName": "true¦0:MK;1:ME;2:MF;3:LO;4:L2;5:JA;6:L6;7:M9;8:LE;9:JS;A:IJ;B:M4;C:LH;D:LX;E:L7;F:HI;larin,аL8бISвHRгGNдFUеFEжF3зEKиE5кBKлAHм94н8Pо85п6Oр60с3Zт31у2Lф24х1Qц1Gч0Wш05щWэQюHёG;жиC3лк1;бк1г0дLмаKнJрIсуп0фK3ха7CшG;ак0кG;ивы1ов;ас0ен2ин,к0л0на2ь2;ге,евKCк1;т0ш2;аHиG;н,цкE;ч5шк1;йбожLWкель,лJмD9нHпингJOрGссен,туш;дели,ист0;гGт1;ельгардт,овD;емба2ьG;к1мпт;авNеHуGёBW;к1р0;гJдр8коч3Fпк1рбHтG;ин1к1;аGиAA;к0т64;еKXл0олG;ев,их1я2;еKVл2;аZвеYеVиPкуOлык0мNпMуG;бFBв9й6кKлHрGх0;уп0шал1ыг1;ьGёв;гGдеш0ц;а,ин;ов,ш1;ак,ик9;аASел5;рDт;б9гKк9н6рJхIшG;кGл0ов;ан0ин,о;ов,р4;ин0к0м4ок0;а2ин;вел5лHпов9рG;емеD1ст0;аг1еп0ом0яп1;д0рнI0;бKкмHQляп1поJрHст1тGшл0;ал0ун0;ап0оGш1;в,н0;в9шн3;ал1уG;н1р0;аWеMиKк9мых0уG;бBг8Dд0жKFкре2мHIпGрк1ч4;аHов,рG;ак0ин,ов;л0х1;грHEж3ла2стFчG;ик0к4;бOкNлMмерис,нд2п0DрGснDLх0;вFеKкаJнG;ак0е6Qик0оHух1ыGяв6;х,ш5;бров1в,мырд1;с0ш1;нч3п4;омей,п4;м5JуJ;от5Iык1;аHд0з0йкGлIPпа2рк0;а,ов6;да2;аNвLеKиIуHыG;г4зHE;к4лукидзе;глHVммермHZолкAрGци4;ин6к7Qю5H;йтл1ликAртел2хан1P;етGил0X;а2к0н0;пл1рG;егородц2ицFJёв;аMвостAигир,лLмельн0оJрIуG;дGрт1;овек0як0;ам0ебт0ом0ущ5;в93лIAмGрьк0хл8O;к2Dо65;ебAKоп5E;бKлIмидK3нHрG;ит7лам0мац;ип0ц2;ип0тG;ур1;аGен6;л0р0;аUеQиMл9QоJрHуGыны0ёдD2;к1рм4;анGол0;ко,ц2;к1мGнвиз1роп7;еCиG;н,ч5;лGрс0;ат0еCиGьчеC;м7пG;ов,п0;дGнJ7тис0;ин,оGул0чеC;сGт0;е2ов;де2нG;ин,ыг1;вBгRдом,лPмOнNрLсHтёс0хGшFU;ов,том6;аIенJ0ил0ов,пERтG;иGюжDL;мB7н0;т0ч5;аGбанAи54ус0;к0лBK;герн,кAтFX;ан0скE;ан0и50ьяG;н8ш1;лHолG;ев,ьн3;иGов;цкEчES;а04вардAе00иVкач7LоQрKсыыHAуGыEPюшнFё3K;м9UпIрGхачCA;б1гGов;ен2;ицE3ол2;аJеIиф7оHуGынд1;с0тн2ф4х1;фI6цкE;диакAтьF;вGпезн3;к1н3;кJлHпорDBрG;оп0ш1;б4к74м74окон6стоG;бр0й,кож2;ар2мEZ;моIтIUхG;в9SоG;мC2н9Kход;фе2шG;енI2к1;лDLмн3плIрGтFY;еGёш1;б0х0шк0щHY;ов,яш1;бEPлаMмаLнк0рJтGуш2;аGтар;рGур0;ин68ов;ас0кAнG;ове40;рк1х1;лGн0;их1;а13в9е0Tи0Mк0Jл0Iм0Dн0Bо04п02тRуIчастли03ыGьI7ём1;со2тн3чG;к1ёв;бNворMдлеCкLлт4нгатKпр58рJсIтKхGчк8;аGих,орG8;н0рн3;лFн1;ик0к0н1;ул1;ач5ин,лет1;ин,к1ов;бот1от1;аNеKрG;еGог4;к9лG;к0ьG;н3ц0;бл5жCYпG;аGн0;нC5ш1;л1рGтнE5;ик0оGц2;в7Uдуб5G;ан0ер6BраG;вц2;бLкKлGм0н1п0р35;дDоG;вь5дHмG;ах1ин,он0;н3с8L;ол0;аCWолевFKч50;а6XеG;гир5тк0;аг1еJирнIоG;лGтр0;ин,янин;ит6ов;тB8х0шнEO;ав6епын1обожB7учAA;во2VороHряб1уG;м1рD;богDхEZ;вD9гаLдA0з9BлIмHтн3янG;ин,ко,овH5;ак1он0;а2иHьG;вестр0н0;в4н;ев,л0ч5;вNдLлKмJнIрGчE2;ге2ебрGов,пи7ябки4Wёг1;ов,як0;отрEEьк1;ер3ян1ён0;езн5ив4;е1IоG;в,коC1;ерGо2W;ин0нEGов,юх1;бRвOгаде2дNз7ит0й,лLмJнн3пHрн9FфGхBянAE;иGCр7;ал5оGрAW;г0жн3;ар1оGс7;йл0х1;аг1им0ко,т4ьG;к0н3;ов6ык0;ас1вHеCиGк1р70;нк0ч2;атFGин;а0Uит0;аZеUж9CоOуLыIюр7GяG;бGх1;к8ов,ц2;баHжGк0нд1чеC;ан0ик0к0ов;к0лк1;баFEдHмя0Nн0сGчк1;а04н3Nс76;ав1ин,н3ов;борAгJдIжк0зHкоссAм4стовGщ1;!ц2;ан0ов6;зянFBин,чFA;ач5оG;в,з1;вяJзнHм1Oп1тюнс6YшетG;ил0н3;иGов;к0чF4;г1к1;бин7CвCVзIмаз4сGтк1Fф3;к9пGскDIторгу2;оп0ут1;ин,ува2;а0Pе0Gи0Cл0AоVрQуIшеничн3ы9OьGятос1;еха,янG;ых;гMдLзаKтIшG;кGнCX;ар5ин;иGят1;л8н;к0н0;ин,о30;ач5ин;азD0еJиIоG;ниGскуA2т5Wх86;н,ч2;был0в9гож1мBDходьEL;ображABсьнF;гTдSжар6зднFкрAлLмелKнJпIртн0сох0тG;ап0ёG;мк1;ов,ыр1;икBомMч3;ов,ьн3;иLнKоIтHуGяк0;н1ш1;ан0ор2I;вц2теG;нц2;ар5;в4щEH;а,шив9;од1ребн0;аGемяAMисе0C;кс1т7;вовBмBUроIчуHщаG;льн3;г1шк1;г0жк0;вц0лNнк1рIст0тGчк1;рGух0;енDWов,ух1;в22еHмGов,филь2;ин0як0;вHжог1сторG;он1;ал0ерз2ё0S;ев1ёв1;вл55люл1нKп4рJсHтA0улк1хом0шG;ин,к0;тGх1;ерн1Tух;ам7ши3H;ар1ин,кGфANькив;ин,ов,рD;бWве9LгSз4AкE8лRмельниQнPпOрNсGшуVщов ;иKм9MоJтG;аHровG;еCWскE;л74пB3;к1лодк1;нGп8U;!ов,ц2;бакайте,л0;ок1;ег1ипчD7;цкE;ен2ьхA;аIиHороBHуG;рц0;евBD;рк0;нHоGразцо́8Z;л8Rр1;из0;аTеPиLоHурG;и2магомC0;вHздр3Hр1сG;ач5к0ов;и2LоG;кш7сел6J;замBDкG;иHоGул1;ла2н0;т1ф68ш1;вз67жд4крHмцGн16пе1ст3GтребCOча2;ев,ов;ас0еG;стьD4;бDзBс7ум40ч9;а0Dе07иTоOуIышHяG;гк0сн3тл2ук1;ел0к1;рJхG;аHин,оG;рт0;метш1н0;аGог0;вь5т0;жа2исе2крив6лч4рIсGх0;ал5ин,кGяк0;ал5в1;двBWен0оGяк0;з0шк1;гSлPнOрMс9тLхHшG;ин,н5ут1;аGе2;йл0лG;ицGёв;ин,ын;ин,роф4ьк1;н4SоGскE;в,н0х1;а2е2ин,к1ькA;оHюGёх1;к0т1;в,р7Tс4H;ун0;дKлIнHркуGсяц,хан3RщерF;л0ш2;шиков/меньш3щ3;еGик0ьн3;д1х0щBX;вед9Rн3;гTйсSкPлMмLнKрIслHтве2хмуд0шG;ар1ир;ак,ов;инGк8тюш2ь1;!ин,к1;ин,т4Zяк1;ин,он0ык1;ах0иHк1ыGюг1;х1ш2;к0н8;ар0л83сG;имGуд0;ов,уB6;ак;ер,омAA;а0Bе04и00оPуMыLьв0юJяHёG;вк1;гуш5Iд0люB1м1пG;ин,ун0;бимGт6K;ов,ц2;зл0тк1;бHжк0кG;ашAXин,ов,ь2D;аш2;бNвз06гин9MктMмKпHсGщ7Z;ев9Mкут1O;атGух0;ин,киG;на;оGт2;вц2нос0;ев,и7;аGов;н8AчG;ев6ёв;д1л0м7п8сHхG;ач5;иц64ов,тG;рDун0;бедKв4Bдовск8Jлух,н1онJпIрмонт0сHт0ш2щG;енAGёв;к0ничE;с,ёх1;ид0ов,ти2;ев,инGь;скEц2;врLгJзар2нц0пHри7стовка,чG;ин0к0;а2иGо7Fт2ун0;дус,н;ош1рGут0;ан6;ен24ов;а1Dв1CеAAи18л14няз2о0BрTуG;бRва2дOзMим0клLлIпц0рHст0тG;еп0ик0уз0як0;ак1бDг4д1еп1иц5Lо63пDта9Xч1;аHиG;б1к7L;г1к0;ач5ев,ин;нец0уб0ьG;к1миS;аш0рG;ин,яG;вц2ш0;л4ы9N;аSиPоп4BуIыHюG;к0чк0;л0м0с0;гLк0пJтGч68;иHоG;в,й;к0н;иGн0;н,ч;!л0;вGд;к0оG;в,ух0;вч9Mев83мн6DсG;ав1ноHоG;тк1;в,пG;ёр0;б07в04жу03з01лXмWнUпTрMсIт0чеCшG;еGк1;л2чк1;арIк0оHтGяк;ин,омBю90;м0р7Q;ев,ин;аблLен2жKнIоGтн2ч57яв8;в1л5тG;а2е2к8;еGил0;в,ев;ак0ев;ин,ёв;е97с0ц2;дGев,ин,н3ов9стантин,ьFяш0;ра0Rур0юр1;ар0з1иссBол0;есIлHоGу4Cьц0;бк0мн3н3Kс0;ер0;н3ов;аGл7Bыр2;к0рь;р0х0;алGр0ш0O;еGёв;в6н8G;зон,як0;еHимGок0;ов,уш1ц0;бле2пG;ак,ин;лессо,при8TрHсG;ел2лух1;е2илGк1Rс4ь8R;л0ов;ас0;бл6Tвер1д01заZлWмTндSпQрMсJтIч6CшG;ар1ирGн3у3C;ин,скE;а2ерино45ин;ат6GьG;янG;ен7Zов;аIба7Nг1еHи2наух0ры2ташGч45яв1;ов,ёв;в,тн3;ва2ндаш0ул8;ица,раGуст1;л0н0;ин6;енGк1;ев,кZсG;ких;аGг4ин1уг1яг1;г1шнG;ик59;к58нGрез0;ц2ьк0;н3ур1ц34;браг79вSгPжOзMлJноземц2паIсHшOщегG;ел0л0;а2мLтом1;ть2;ьHюG;х1ш17;ин,кун,юш1яс0;мGюм0;айл0;ут1;натGош1умн0;кGь2;ов5G;аGк1лее33олг1ч74;к1н24ш8;аOвNеф11иLлоб1оJуHыGюг4ём1;к8р7L;бGев,йк0;ар2к0ов;лGн0р1т0;ин,от0;мGнч6W;ин,к0нF;ер2яг1;болотн59вLгоро58дорKйц2кр0JпорожJруб1сIхаG;ев,рG;ов,ч6Rь1;лав6;ец;н0ожн54;раGьял0;жGз1;ин,нG;ов,ый;аOв3д4еKиIолд1уGён0;к46рGт0;авл5ов;гGдк0к1л8р0;л0ун0;гл0лезIрHстG;ок0;д2н35;к1н0;б1рG;к0ых1;вTгSдем6ж0лPмел6RнNрJсHфGшY;им0рем0;а6XиG;к0п0;е2MмHоGх0ш0ём1;фе2х1;ак0ил0олGуш1;oв,а2;галGин;ыч2;аг1еш2иHьG;ц8ч1;зBсе2;ор0;док5MсGтушеC;е2тигне2;а05ворн3еZмитри2оSрOуHыховичн48южеCятл0ёG;гт2м1;бJдIлHнаGр0;ев6;ьц2;ин,ко,н2P;инHоGрA;в,л42;ин,к1;агHесвян1й23угGяг1ём0;ан1ов;омGун0;ир0;брKлJмIроHстоG;в9ев6;фе2х8;аш5н1;гор40ж3;оGын1;люб0н33;гтяр5д0жн5лKмIниHрG;ж4Jн0;к1с0;енGид0;ок,ть2;ов,ян1;выдHйне53цG;иш1юк;к1ов;а0Bе0Aил5л07оUрKуG;б4л1н1рHсGщ1;ар0ев,ин,лFьк0;кAьG;ев,ян0;аOеNиJом0уGязн0;зHшG;ан1;д2ин6;бHгоGн1ш1;рь2;ан0к0оG;в,ед0;бенщ3к0шнoв;д6нк1ф0ч5;вяд4AлMнчBрG;бJеHносGох0шк0юн0;та2;в,л0мG;ык1;ач5унG;к0ов;оIуG;бGмбA;ев,к1ов,ц0;вGдя2лоб0;!аGин,к1;н0ха;аHеб0ин1оGух0;ба;гол2зк0;нк1рас3W;вриLгKзм4лIрGч2;ан1иG;н,ф4F;д1иаскBк1ыг1ёG;рк1;ар1ол1;к0лG;еCов;а06еXиTоKыIьялG;ицG;ын;рыGсот6;па2;дNлLроJскHтF;як0;обойн3ресG;ен6;бь5нG;ин,к0ов,ц0;ик0к0оGьв0D;д1сеCш1;овDян0;ноHтвNхр0ц1шнёG;ва;грGкур0;ад0;деMн1HрIсел24тG;оGр0;чк1;еHшG;ин1;н1JщG;аг1;нGрн3;е2ин;в08г1енOли2рLсHхG;руш2;иHнеG;в,ц0;лGн;ев6ь2;еHт4у2WфолоG;ме2;нн3;га;а1Eе0Rи0Pл0GоUрSуIыG;к0лGчк0;инк1;гаOдMзLк8лJн1рHтGхало;ус0ыл1;дукAк0мак1ов,ц0ый,як0;ов6;гGыг1;ак0;ин6ов;аGн3ыл1;ев,н0;ев,йч2Tк0;аGежн2усLызг9;в3г1нт0;бYгRдр0йQкPлLндарKрGчBяр0;е2зIис04оHтнGц0;ик;вк0д1;ил0;ев,ч2L;дIоHтоног0ьшG;ак0ов;тн3;ыр2;!ар5;к0ц0;аKд4оGр0ун;лHмG;аз0ол0;еп0юбG;ов,скE;тыр5ч5;ёв;к0рG;!иGов;к,н6;аKиIоGум;кGх1;!ов;знGн0;юк;гонIжHнтGт0;ер;ен0;рав0;лGрюк0;ан;б01зUлNнMрJсHхтG;ер2;п9с7фамильнW;ал0;еGия,ш0;жнGз1;ой;едикт0;евLиKоHяG;ев,к0;в,глPместнHрGус0чк1;ус0;ов,ых;к0н6;ич;борLобрKрHуклаG;дн3;оGук0;днG;ый;аз0;од0;н2ч17;бTгр0жSзQлаOрIск8тG;ищ2рG;утд0J;аIбол1ин0к0сHышG;ев,н3;ук0;нGтын6;овG;!скE;б4киGнд1ш0;н,р2;аGин;н0р0;ан0ен0;аHиGк1ур1ык1;к0ч2;ев,н1;б12в0Wг0Rдакс1зBк0Nл0Hм0GнYпXрPсLфJхHюG;ши2щегл0;мGрем0C;ед0;анасGон1;к1ь2;лаHпид0с7таG;нк0фь2х0;н0х4;ан0;ефь2замасц2истLсень2тKхангеHшG;ав1;ль6;скE;ий;ам7емь2ём0;аGов;рх0;алк0текарь;аUдрPиMкудLнJоIреп,тGущеC;ак0ип8он0J;ин,ов;с0х1шк1;еCик0;нк0;ин0;кHсGш1;им0;ан0ин;еIоGюх1;н3п0;ик0;ев,юG;шк1;нь2сG;енG;ко;али2ел1ин2;еIиGлилу2огр1ёх1;ев,стрD;ат0;ев,ксGн1х1;анGе2;др0;инфе2сGул0;ак0енчGён0;ук;ар0;аIеHлиG;улл1;йк1;п0ф7;он0;дIерGил0;ин,ьG;ян0;е2он1;ин;ев;акум0дIрамG;овG;!ич;ул0;ов"
  };

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
    while (places--) {
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
    //... process these lines
    const reSymbol = new RegExp('([0-9A-Z]+):([0-9A-Z]+)');
    for (let i = 0; i < t.nodes.length; i++) {
      const m = reSymbol.exec(t.nodes[i]);
      if (!m) {
        t.symCount = i;
        break
      }
      t.syms[encoding.fromAlphaCode(m[1])] = encoding.fromAlphaCode(m[2]);
    }
    //remove from main node list
    t.nodes = t.nodes.slice(t.symCount, t.nodes.length);
  };

  // References are either absolute (symbol) or relative (1 - based)
  const indexFromRef = function (trie, ref, index) {
    const dnode = encoding.fromAlphaCode(ref);
    if (dnode < trie.symCount) {
      return trie.syms[dnode]
    }
    return index + dnode + 1 - trie.symCount
  };

  const toArray = function (trie) {
    const all = [];
    const crawl = (index, pref) => {
      let node = trie.nodes[index];
      if (node[0] === '!') {
        all.push(pref);
        node = node.slice(1); //ok, we tried. remove it.
      }
      const matches = node.split(/([A-Z0-9,]+)/g);
      for (let i = 0; i < matches.length; i += 2) {
        const str = matches[i];
        const ref = matches[i + 1];
        if (!str) {
          continue
        }
        const have = pref + str;
        //branch's end
        if (ref === ',' || ref === undefined) {
          all.push(have);
          continue
        }
        const newIndex = indexFromRef(trie, ref, index);
        crawl(newIndex, have);
      }
    };
    crawl(0, '');
    return all
  };

  //PackedTrie - Trie traversal of the Trie packed-string representation.
  const unpack$1 = function (str) {
    const trie = {
      nodes: str.split(';'),
      syms: [],
      symCount: 0
    };
    //process symbols, if they have them
    if (str.match(':')) {
      symbols(trie);
    }
    return toArray(trie)
  };

  const unpack = function (str) {
    if (!str) {
      return {}
    }
    //turn the weird string into a key-value object again
    const obj = str.split('|').reduce((h, s) => {
      const arr = s.split('¦');
      h[arr[0]] = arr[1];
      return h
    }, {});
    const all = {};
    Object.keys(obj).forEach(function (cat) {
      const arr = unpack$1(obj[cat]);
      //special case, for botched-boolean
      if (cat === 'true') {
        cat = true;
      }
      for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (all.hasOwnProperty(k) === true) {
          if (Array.isArray(all[k]) === false) {
            all[k] = [all[k], cat];
          } else {
            all[k].push(cat);
          }
        } else {
          all[k] = cat;
        }
      }
    });
    return all
  };

  // 01- full-word exceptions
  const checkEx = function (str, ex = {}) {
    if (ex.hasOwnProperty(str)) {
      return ex[str]
    }
    return null
  };

  // 02- suffixes that pass our word through
  const checkSame = function (str, same = []) {
    for (let i = 0; i < same.length; i += 1) {
      if (str.endsWith(same[i])) {
        return str
      }
    }
    return null
  };

  // 03- check rules - longest first
  const checkRules = function (str, fwd, both = {}) {
    fwd = fwd || {};
    let max = str.length - 1;
    // look for a matching suffix
    for (let i = max; i >= 1; i -= 1) {
      let size = str.length - i;
      let suff = str.substring(size, str.length);
      // check fwd rules, first
      if (fwd.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + fwd[suff]
      }
      // check shared rules
      if (both.hasOwnProperty(suff) === true) {
        return str.slice(0, size) + both[suff]
      }
    }
    // try a fallback transform
    if (fwd.hasOwnProperty('')) {
      return str += fwd['']
    }
    if (both.hasOwnProperty('')) {
      return str += both['']
    }
    return null
  };

  //sweep-through all suffixes
  const convert = function (str = '', model = {}) {
    // 01- check exceptions
    let out = checkEx(str, model.ex);
    // 02 - check same
    out = out || checkSame(str, model.same);
    // check forward and both rules
    out = out || checkRules(str, model.fwd, model.both);
    //return unchanged
    out = out || str;
    return out
  };

  const flipObj = function (obj) {
    return Object.entries(obj).reduce((h, a) => {
      h[a[1]] = a[0];
      return h
    }, {})
  };

  const reverse = function (model = {}) {
    return {
      reversed: true,
      // keep these two
      both: flipObj(model.both),
      ex: flipObj(model.ex),
      // swap this one in
      fwd: model.rev || {}
    }
  };

  const prefix = /^([0-9]+)/;

  const toObject = function (txt) {
    let obj = {};
    txt.split('¦').forEach(str => {
      let [key, vals] = str.split(':');
      vals = (vals || '').split(',');
      vals.forEach(val => {
        obj[val] = key;
      });
    });
    return obj
  };

  const growObject = function (key = '', val = '') {
    val = String(val);
    let m = val.match(prefix);
    if (m === null) {
      return val
    }
    let num = Number(m[1]) || 0;
    let pre = key.substring(0, num);
    let full = pre + val.replace(prefix, '');
    return full
  };

  const unpackOne = function (str) {
    let obj = toObject(str);
    return Object.keys(obj).reduce((h, k) => {
      h[k] = growObject(k, obj[k]);
      return h
    }, {})
  };

  const uncompress = function (model = {}) {
    if (typeof model === 'string') {
      model = JSON.parse(model);
    }
    model.fwd = unpackOne(model.fwd || '');
    model.both = unpackOne(model.both || '');
    model.rev = unpackOne(model.rev || '');
    model.ex = unpackOne(model.ex || '');
    return model
  };

  // generated in ./lib/models
  var model$1 = {
    "presentTense": {
      "first": {
        "fwd": "3:онуть,чнуть¦жу:дить,зить¦шу:сить,сеть¦жусь:диться,зиться,заться¦у:ить/научить¦ру:ереть¦оюсь:ыться¦щусь:ститься¦щу:стить,стеть¦юсь:оться¦шусь:ситься¦зовусь:озваться¦елю:олоть¦:цепляться¦1сь:уться¦1ю:рить,оять,авать,оить,лить,роть,аять,еить,еять¦1у:дти,жить,шить,зти,щить,зть¦1лю:пить,мить¦1жу:азать,ядеть,язать¦1усь:читься,житься,шиться,щиться¦1ою:рыть,выть¦1юсь:аваться,еяться,литься,ояться,оиться,риться¦1щу:искать,итить¦1ду:ехать¦1чусь:етиться,отиться¦1чу:ететь,ртить,ятать,ртеть¦1шу:ахать,есать¦1жусь:идеться,ядеться¦1шусь:исаться¦1люсь:баться¦1беру:зобрать¦1нусь:ясться¦2у:ачить,ржать,очить,ечить,онать,рчать¦2ю:ореть,дуть¦2ту:очесть¦2юсь:меться¦2лю:ипеть,еметь,ипать¦2еру:збрать¦2чу:катить,рутить,хотать,какать¦2люсь:емиться¦2усь:ржаться¦3у:лежать,ручить",
        "both": "3:унуть,юнуть,пнуть,снуть,ынуть,тнуть,бнуть,гнуть,внуть,хнуть,инуть,януть,кнуть,рнуть¦4:ызнуть,ьзнуть,езнуть,мануть¦5ю:зревать,лкивать,ырезать,тревать,акивать,ережать,скивать,трезать,окидать,счезать,орожать,зрезать,овожать,спевать,поздать,растать,олевать¦5люсь:роявиться,надобиться¦5м:ередать¦5у:остучать,одождать¦5юсь:ороваться¦4ну:дстать,естать,остать¦4ю:аскать,ведать,иучать,пивать,мевать,рясать,висать,худеть,лезать,ручать,щивать,лотать,хивать,долеть,гивать,божать,бучать,тожать,ускать,вивать,ладеть,шеветь,нивать,потеть,лодать,аивать,живать,бивать,зучать,ножать,ливать,кучать,девать,росать,ривать,чивать,ракать,бедать,оедать,лавать,шивать,лучать,ботать¦4мся:аздаться,оздаться¦4м:ридать,аздать,подать¦4юсь:упляться,астаться,качаться,четаться,росаться,олжаться,тараться,лижаться¦4нусь:остаться¦4у:опадать,расти¦4чу:асветить¦4лю:требить¦3юсь:адаться,уляться,ужаться,еляться,идаться,знаться,ажаться,ираться,юдаться,ждаться,ючаться,ытаться,аляться,бляться,асаться,учаться,итаться,ататься,вляться,мляться,ичаться,иваться,ываться,ечаться,еваться,нчаться,инаться¦3ю:сметь,утать,зреть,ытать,гчать,ькать,икать,яжать,аветь,ареть,усать,алеть,вдать,ичать,лтать,ркать,ицать,ужать,юдать,слеть,орать,юхать,нчать,екать,ждать,асать,спеть,ажать,атать,рзать,ыкать,лкать,зжать,болеть,ылать,етать,чтать,лжать,ючать,ыхать,ирать,адать,ачать,ывать,ечать,грать,итать,инать,елать¦3у:иучить,сосать,бучить,зучить,пасти,дышать,вучать,лышать,ыучить,нести,лучить¦3ью:робить¦3мся:едаться,одаться¦3усь:лышаться,нестись¦3щу:братить,вратить,кратить,претить¦3лю:собить,рабить,лабить¦3ну:трять¦3ву:ыжить,ежить¦3мусь:рижаться¦3му:рижать¦3даю:опасть¦3люсь:ямиться¦3жу:орезать¦3чу:тратить,третить,ахотеть¦3м:тдать¦2ью:ыбить,ышить,ибить,ыпить¦2чусь:ватиться,катиться,рутиться¦2юсь:неться,хаться,треться,ряться,латься,каться,няться,шаться,паться,гаться,щаться,маться¦2ту:лести,мести,рести¦2юю:оревать¦2усь:рваться,мчаться,ястись,астись¦2щу:вятить,мутить,сетить,щутить¦2у:гчить,рвать,жрать,лгать,ясти,врать,нчить,ичить,лчать,ючить¦2щусь:щутиться,ратиться¦2еру:ебрать,абрать,ыбрать¦2ову:извать,ызвать,азвать¦2мусь:риняться¦2мся:аесться¦2люсь:упиться,юбиться,омиться,опиться¦2ьюсь:апиться¦2лю:апеть,рбить,рпеть,спать,юбить¦2чу:ротить,мотать,пятить,метить,ватить,шутить,латить¦2ю:неть,бать,иять,щать,лять,рять,нять,пать,гать,шать,треть,мать¦2ку:сечь,лечь,течь¦2жу:гудеть¦2гу:речь,бежать¦2иму:бнять¦2дусь:ойтись,айтись,вестись¦2му:ринять¦2м:ъесть,оесть¦2еюсь:бриться¦2ду:вести¦2овусь:азваться¦2шу:писать¦1обью:дбить,збить¦1зову:тозвать¦1ую:шевать,жевать,чевать,цевать¦1дусь:асться,ийтись¦1яду:сесть¦1ольюсь:злиться¦1ядусь:сесться¦1гусь:ячься¦1щу:ыскать¦1беру:тобрать,добрать¦1щусь:ититься¦1чу:птать¦1чусь:ятаться,ртиться¦1берусь:зобраться¦1овью:звить¦1овьюсь:звиться¦1обьюсь:збиться¦1гу:ичь,очь¦1оню:гнать¦1ерусь:браться,драться¦1кусь:ечься¦1ду:юсти,асть,ийти,йти¦1юю:оевать¦1юсь:ниться¦1ою:мыть¦1уду:быть¦1лю:вить¦1люсь:виться¦1ю:нить¦1жу:идеть¦озьмусь:зяться¦омну:мять¦ёрзну:ерзнуть¦ёркиваю:еркивать¦уюсь:оваться¦шлю:слать¦озьму:зять¦ую:овать",
        "rev": "нять:йму¦няться:ймусь¦есть:яду¦чь:ку¦ечь:ягу¦шить:ошью¦жечь:ожгу¦переться:бопрусь¦евать:юю¦ергать:ёргаю¦литься:ольюсь¦1ть:иву,ам,ыву,ену¦1сить:ошу,ашу¦1еть:пою¦1ять:ниму¦1ереть:мру,пру¦1ться:енусь,анусь,амся¦1иться:реюсь¦1дить:зжу¦1ститься:ощусь¦1ситься:ашусь,ошусь¦1ать:жму¦1зить:ьжу¦1титься:ачусь¦1сти:ету¦1ить:блю¦1озваться:тзовусь¦1диться:ежусь¦1стить:мщу¦1олоть:мелю¦1яться:нимусь¦2ти:есу,лзу¦2зать:кажу,вяжу,мажу¦2ть:мею,тану,тею,жаю,дею,ызу¦2ять:тою,сею¦2тить:вечу,рачу,щищу,лощу¦2дить:хожу,бужу,лажу,сужу,бежу,сажу,нужу,ряжу,гожу¦2ить:уплю,арю,лжу,ерю,урю,рмлю,алью,ьшу,бщу,кою,алю,омлю,чшу,ушу,длю,ршу,слю,ирю,абью,брю,оплю,улю,еплю,дрю,злю,щрю,илю,ымлю¦2аться:ачнусь,ждусь,еблюсь¦2ыть:крою,звою¦2диться:хожусь,вожусь,оржусь,тужусь,лажусь,бужусь,сажусь,гожусь¦2скать:оищу¦2хать:оеду,ыеду,ъеду,аеду,пашу¦2и:сту¦2зиться:лижусь,ражусь,нижусь¦2иться:ичусь,лжусь,коюсь,длюсь,орюсь,ешусь,алюсь,елюсь,олюсь,ршусь,ючусь,ирюсь,ылюсь,урюсь,ушусь,ерюсь¦2стить:чищу,рощу,гощу,пущу,мещу¦2ыться:кроюсь,ороюсь¦2яться:деюсь,тоюсь¦2деть:ляжу¦2вать:озову¦2заться:кажусь,вяжусь¦2ститься:пущусь¦2зить:ражу¦2сить:вышу,вешу,кушу¦2тать:рячу¦2титься:вечусь,бочусь,хочусь,мечусь¦2стеть:лещу¦2ться:жаюсь¦2ситься:вышусь¦2саться:пишусь¦2деться:вижусь¦2обрать:азберу¦2ереть:ытру¦2ать:осу,жду¦2сать:чешу¦2сться:лянусь¦2еть:еву¦3ться:рнусь,инусь,гнусь,кнусь¦3иться:ыучусь,ончусь,лучусь,аучусь,ньшусь,силюсь,бучусь,удшусь,ремлюсь,ложусь,лечусь,троюсь,мочусь¦3ить:ложу,начу,торю,трою,делю,ножу,солю,пешу,ворю,волю,клею,озрю,лужу,молю,тащу,свою,тешу,релю,корю,кочу,зумлю,щемлю¦3дить:ивожу,овожу,звожу,прежу,стужу,слежу,двожу,обожу,ережу,врежу,вержу,ывожу,авожу¦3ать:ричу,щиплю¦3теть:олечу,ылечу¦3хать:риеду,рееду¦3есть:рочту,почту¦3вать:знаю¦3яться:смеюсь¦3диться:тружусь,сержусь¦3ти:везу¦3сеть:авишу¦3зить:рможу,гружу¦3еть:ремлю,горю¦3ть:лезу¦3тить:кручу,свещу,окачу,черчу¦3тать:охочу¦3стить:ыращу,авещу,звещу,овещу,крещу¦3деться:гляжусь¦3кать:скачу¦3зиться:гружусь¦3ваться:здаюсь¦4титься:стречусь¦4вать:родаю,подаю,редаю,остаю,естаю,тстаю,аздаю,ридаю,дстаю¦4ить:зрешу,спечу,кружу,дражу,чтожу,еребью,оручу,оречу,грешу,алечу¦4теть:рилечу¦4ть:жидаю,истаю,целею,рону¦4ать:длежу,держу,стону¦4тить:спорчу,оглочу¦4дить:агражу,горожу¦4аться:держусь¦4ться:тянусь¦4иться:ообщусь,оточусь,аружусь¦4диться:вобожусь¦5дить:еревожу¦5иться:иземлюсь¦5ить:оспорю,наружу,таможу,достою¦5оть:аспорю",
        "ex": "1:вцепляться¦3:пнуть¦4:тонуть¦5:качнуть,утонуть¦есть:быть¦3у:нести,лежать,дышать,сосать,реветь,решить,мочить,лезть,везти,лишить¦3ю:знать,иметь,уметь,греть,велеть,сметь,гореть,делить,солить,бороть,клеить,сдавать,пороть¦2чу:хотеть,шутить,катить,лететь¦2ву:жить¦2йму:понять,занять,нанять¦2шу:писать,висеть,весить,махать,чесать¦2м:дать¦3ну:начать,стать,одеть,пожать,зажать¦2у:ждать,орать,врать,рвать,лгать,жрать,срать,идти,учить/научить¦2ймусь:заняться¦4чу:ответить,взлететь¦2лю:спать¦1еру:брать¦1ду:ехать¦1ью:пить,бить,лить,шить¦1яду:сесть¦2гу:бежать¦1м:есть¦3нусь:начаться,одеться¦1ою:петь,мыть,выть,рыть,ныть¦2ою:спеть¦2иму:снять¦4ю:болеть,кидать,суметь,кивать,потеть,рыдать,худеть,ведать,задавать,вставать,отдавать,уставать,выдавать,подавать,спорить,издавать,подуть,удвоить¦4м:задать,выдать,подать,издать¦5нусь:раздеться¦2еюсь:бриться¦4нусь:остаться¦2ду:вести,уехать¦1щу:искать,мстить¦4у:расти,кричать,научить,стучать,дрожать,жаждать,держать,дружить,стонать,вручить,торчать,грешить¦3ью:побить,налить,залить,забить,полить,набить¦5м:продать,создать,предать¦4ну:встать,надеть,устать,задеть¦3чу:тратить,светить,улететь,портить,вертеть,скатить,крутить,чертить¦2ку:течь¦3ву:плыть¦2жу:резать,гудеть,ходить,родить,водить,будить,судить,вязать,мазать¦2еру:убрать¦1отру:стереть¦5ю:ожидать,снижать,обижать,листать,уцелеть,создавать,наставать,растаять,заставать,оспорить¦1ову:звать¦3ову:позвать¦3еру:собрать,избрать¦2ью:убить¦1ягу:лечь¦5ву:прожить¦1ерусь:драться,браться¦5юсь:обижаться,снижаться¦5ну:отстать,настать,застать¦3лю:шуметь,рубить,кипеть¦3му:нажать¦1ую:жевать¦1ошью:сшить¦3гу:зажечь¦6чу:проглотить¦2ту:учесть¦3мся:удаться,сдаться¦3м:сдать¦6ю:угрожать¦3ьюсь:добиться¦1очту:счесть¦2усь:рваться,мчаться,учиться¦4усь:дождаться,держаться,кружиться¦4щу:осветить¦1ожну:сжать¦2ю:дуть,давать,лаять,таять,злить,сеять¦2чусь:катиться,метаться¦3ту:цвести¦1ьюсь:литься,биться¦5щу:поглотить¦1обью:сбить¦5ью:перебить¦1ожгу:сжечь¦1онюсь:гнаться¦1бопрусь:опереться¦5мся:поддаться¦2имусь:сняться¦2юю:плевать¦2русь:упереться¦1гу:жечь¦1ёргаю:дергать¦2нусь:деться¦4ву:дожить¦1олью:слить¦1ну:мять¦2мся:даться¦1оню:гнать¦1ольюсь:слиться¦2жусь:родиться,садиться,казаться,видеться,годиться,водиться¦2оюсь:умыться¦4юсь:оставаться¦3юсь:смеяться,иметься,бороться¦3усь:ложиться,лечиться,мочиться,лишиться¦3жусь:трудиться,обидеться¦2щу:чистить,пустить¦4жу:отводить,породить¦2юсь:бояться,длиться¦3жу:увозить,следить,грозить,снизить,вредить,ввозить,бродить,сводить,грузить¦4сь:тянуться,очнуться¦2шусь:писаться¦3щу:свистеть,крестить¦1ру:тереть,переть¦3ру:потереть¦1елю:молоть¦6у:тревожить¦8у:потревожить¦4жусь:повозиться¦5у:дорожить¦1оюсь:рыться"
      },
      "second": {
        "fwd": "шь:ть/научить¦ешься:оться¦зовёшься:озваться¦:цепляться¦1ёшь:дти¦1ишь:оять,сеть¦1ишься:ояться¦1ешь:роть,аять,еять¦1берёшь:зобрать¦2чешь:хотеть,хотать¦2шь:оесть,жить,оить,мить¦2ишь:ореть,ететь,стеть,еметь,ртеть¦2ешь:онуть,ануть,дуть,онать¦2ерёшь:збрать¦2тёшь:очесть¦2ёшь:чнуть¦2рёшь:отереть¦2шься:аесться",
        "both": "5ешь:зревать,лкивать,ыпивать,ырезать,хрипнуть,тревать,оручать,акивать,ережать,вергать,скивать,трезать,грожать,звивать,орожать,ыдохнуть,зрезать,овожать,поздать,растать,олевать¦5шь:риучить,корбить,требить,еподать,олучить¦5ёшь:арасти,зрасти,одождать,тдохнуть¦5ешься:ороваться¦4нешь:дстать,естать,остать¦4ешь:аскать,ведать,хивать,иучать,лькать,мевать,рясать,певать,висать,худеть,лезать,ывезти,тареть,рогнуть,щивать,лотать,бивать,бижать,долеть,гивать,божать,бучать,тожать,кидать,ускать,чезать,ладеть,тигнуть,шеветь,нивать,потеть,лодать,аивать,ытечь,живать,зучать,ножать,ливать,выкнуть,олкать,кучать,девать,росать,ривать,чивать,ракать,бедать,оедать,лавать,шивать,лучать,ботать¦4ёшь:имкнуть,отечь,стечь,опадать¦4шь:ридать,ручить,рабить,лабить,аздать,редать¦4ешься:упляться,астаться,качаться,четаться,нижаться,росаться,бижаться,олжаться,лижаться¦4нешься:остаться¦4ишь:аболеть,слышать¦3ёшь:ткнуть,рпнуть,етнуть,опнуть,ервать,екнуть,ькнуть,яхнуть,сечь,ьзнуть,скнуть,лечь,пасти,лкнуть,аснуть,нести¦3шь:гчить,евить,опить,очить,убить,твить,епить,ивить,явить,нчить,ичить,ечить,тдать,авить,овить,ючить,ачить,упить,юбить¦3ешься:ырваться,адаться,ататься,ужаться,идаться,еляться,знаться,ажаться,ираться,юдаться,ючаться,ытаться,аляться,бляться,асаться,итаться,ждаться,иваться,вляться,араться,мляться,ичаться,ечаться,учаться,еваться,нчаться,инаться,ываться¦3ешь:сметь,зреть,ыкать,гчать,ухнуть,яжать,аветь,спеть,сосать,иснуть,ызнуть,ужать,знать,стнуть,усать,ыхнуть,алеть,ргнуть,вдать,утать,лтать,ркать,езнуть,икать,ибать,ыхать,слеть,орать,юхать,игать,агать,нчать,екать,юдать,асать,ждать,ытать,атать,адать,рзать,зжать,ичать,угать,ыгать,ажать,ылать,етать,чтать,икнуть,лжать,ючать,егать,ирать,ывать,ачать,огать,ечать,грать,итать,инать,елать¦3ёшься:орваться,ерваться,нестись,лечься¦3ьёшь:робить¦3ишься:лышаться¦3шься:едаться,одаться,здаться¦3дешь:ывести,ыпасть¦3ишь:орчать,гудеть,тучать,дышать,вучать¦3нешь:трять¦3вешь:ыжить¦3мёшься:рижаться¦3дёшь:апасть¦3вёшь:ежить¦3даешь:опасть¦3жешь:орезать¦3нешься:здеться¦2лешь:ипать¦2ьешь:ыбить,ышить,ыпить¦2ёшь:ызть,жрать,ясти,врать,внуть,рнуть¦2ешься:неться,хаться,гнуться,януться,латься,инуться,ряться,каться,няться,меться,деяться,шаться,паться,гаться,щаться,маться¦2тёшь:лести,мести,рести¦2юешь:оревать¦2ешь:унуть,юнуть,неть,бнуть,цать,иять,щать,ынуть,инуть,януть,нять,лять,рять,мать,пать,шать¦2ерёшь:ебрать,абрать¦2чешь:какать,мотать,лакать¦2ишься:треться,мчаться,ядеться,идеться,ржаться¦2уёшься:сноваться¦2ёшься:кнуться,ястись,астись,рнуться,меяться¦2овёшь:извать,азвать¦2мешься:риняться¦2ьёшься:апиться¦2ишь:апеть,ипеть,рпеть,ядеть,спать,лчать,ржать,ежать,треть,идеть¦2дёшь:расть,ласть,вести¦2ерёшься:абраться¦2решь:ытереть¦2ерешься:ыбраться¦2жёшь:речь,ажечь¦2дёшься:ойтись,айтись,вестись¦2ьёшь:ибить¦2шь:еить,щить,шить,зить,лить,ъесть,дить,сить,тить,нить,рить¦2мешь:ринять¦2вёшь:лыть¦2овешь:ызвать¦2еешься:бриться¦2ерешь:ыбрать¦2овёшься:азваться¦2шешь:писать¦1обьёшь:дбить,збить¦1зовёшь:тозвать¦1уешь:шевать,чевать,цевать¦1дёшься:асться,ийтись¦1шлешь:ыслать¦1ядешь:сесть¦1оешь:выть,мыть,рыть¦1нёшься:ясться¦1ольёшься:злиться¦1шешь:есать,ахать¦1ядешься:сесться¦1жёшься:ячься¦1щешь:ыскать,искать¦1берёшь:тобрать,добрать¦1жёшь:лгать,ичь¦1лешься:баться¦1чешь:птать,ятать¦1чешься:ятаться¦1берёшься:зобраться¦1ешь:зть¦1овьёшь:звить¦1овьёшься:звиться¦1жешь:язать,азать,очь¦1обьёшься:збиться¦1шешься:исаться¦1онишь:гнать¦1уёшь:жевать¦1ерёшься:драться¦1дёшь:юсти,ийти,йти¦1юешь:оевать¦1рёшь:переть,мереть¦1ёшь:зти,авать¦1шлёшь:ислать,ослать¦1дешь:ехать¦1ёшься:аваться¦1удешь:быть¦1шься:иться¦озьмёшься:зяться¦омнёшь:мять¦елешь:олоть¦ёрзнешь:ерзнуть¦ёркиваешь:еркивать¦жешься:заться¦уешься:оваться¦озьмёшь:зять¦оешься:ыться¦уешь:овать",
        "rev": "нять:ймёшь¦няться:ймёшься¦есть:ядешь¦еть:оёшь¦скать:щешь¦шить:ошьёшь¦жечь:ожжёшь¦переться:бопрёшься¦евать:юёшь¦ергать:ёргаешь¦таться:чешься¦литься:ольёшься¦1ть:еешь,ивёшь,ашь,анешь,енешь¦1ти:йдешь¦1ять:нимешь¦1ться:енешься,ашься,яешься¦1сти:едёшь,етёшь¦1ь:чёшь¦1зать:ежешь¦1и:тешь¦1ать:жмёшь¦1озваться:тзовёшься¦1овать:нуёшь¦1яться:нимешься¦2ти:есёшь¦2ять:тоишь,сеешь¦2аться:ачнёшься,ждёшься¦2ться:танешься¦2ать:ышишь,осёшь,ажнёшь,ждешь,рвёшь¦2и:стёшь¦2еть:исишь,евёшь¦2ить:альёшь,абьёшь,ебьёшь¦2вать:озовёшь¦2оться:орешься¦2рать:оберёшь¦2уть:хнешь,хнёшь,гнёшь,кнешь,кнёшь¦2раться:оберёшься¦2ть:жаешь,чаешь,бишь¦2обрать:азберёшь¦2оть:орешь¦3ть:ожишь,лжишь,роишь,рмишь,ужишь,идаешь,омишь,ажишь,ыдаешь,воишь,ымишь,едаешь¦3теть:ахочешь¦3еть:летишь,ремишь,горишь¦3яться:стоишься¦3уть:ронешь,манешь¦3сть:доешь,впадёшь¦3есть:почтёшь¦3тать:охочешь¦3ать:ырвешь¦4ть:ыучишь,аучишь,зучишь,окоишь,бучишь,истаешь,зумишь,щемишь¦4еть:лестишь,вистишь¦4ать:стонешь",
        "ex": "1:вцепляться¦есть:быть¦3ёшь:нести,течь,сосать,реветь¦3ешь:знать,иметь,уметь,греть,сметь,тонуть¦2чешь:хотеть¦2вёшь:жить¦2ймёшь:понять,занять,нанять¦2шешь:писать¦2шь:дать¦3нёшь:начать,пожать,зажать¦2ёшь:ждать,орать,врать,рвать,жрать,срать,пнуть,идти¦2ймёшься:заняться¦3дешь:выйти¦2ишь:спать¦1ерёшь:брать¦1дешь:ехать¦1ьёшь:пить,бить,лить,шить¦1ядешь:сесть¦1шь:есть¦3нёшься:начаться¦1оёшь:петь¦2оёшь:спеть¦2дёшь:пасть,вести¦2имешь:снять¦4ешь:болеть,кидать,суметь,пахнуть,кивать,потеть,рыдать,худеть,вырвать,жаждать,ведать,подуть,утонуть,стонать¦4шь:задать,выдать,подать,издать¦1оешь:мыть,выть,рыть,ныть¦3нешься:одеться¦2еешься:бриться¦5шь:выучить,продать,научить,создать,изучить,обучить¦3нешь:стать,одеть¦4нешься:остаться¦4ишь:слышать,кричать,дрожать,вертеть¦1щешь:искать¦4ёшь:расти,махнуть,шагнуть,согнуть,мигнуть,порвать,качнуть¦3дёшь:упасть,впасть¦3ьёшь:побить,налить,залить,забить,полить,набить¦4нешь:встать,надеть,устать,задеть¦3ишь:дышать,шуметь,гудеть,велеть,лететь,гореть¦2жешь:резать¦2ерёшь:убрать¦1отрёшь:стереть¦6ешь:вырасти¦5ешь:ожидать,снижать,вручать,листать,уцелеть,сдохнуть,растаять¦1овёшь:звать¦3овёшь:позвать¦3ерёшь:собрать,избрать¦2ьёшь:убить¦1яжешь:лечь¦5вёшь:прожить¦8ёшь:подчеркнуть¦1ерёшься:драться,браться¦5нешь:отстать,настать,застать¦3мёшь:нажать¦1уёшь:жевать,совать¦1ошьёшь:сшить¦3ерёшься:добраться,собраться¦5ёшь:вдохнуть¦7ешь:вычеркнуть¦2тёшь:учесть¦3шься:удаться,сдаться,наесться¦3шь:сдать,учить/научить,поесть¦5дёшь:совпасть¦3ьёшься:добиться¦1очтёшь:счесть¦6ёшь:сверкнуть,вздохнуть¦2ёшься:рваться¦4ёшься:дождаться¦3имешь:обнять¦1ожнёшь:сжать¦2ешь:дуть,лаять,таять,сеять¦4мёшь:прижать¦3тёшь:цвести¦1жёшь:лгать,жечь¦1ьёшься:литься,биться¦1обьёшь:сбить¦5ьёшь:перебить¦1ожжёшь:сжечь¦1рёшь:тереть,переть¦1онишься:гнаться¦3уёшь:основать¦10шь:приспособить¦1бопрёшься:опереться¦5шься:поддаться¦2имешься:сняться¦2юёшь:плевать¦3ёшься:очнуться¦2ишься:мчаться,бояться¦2рёшься:упереться¦1ёргаешь:дергать¦2нешься:деться¦7ешься:прогуляться¦4вёшь:дожить¦1ольёшь:слить¦1нёшь:мять¦2шься:даться¦1онишь:гнать¦2чешься:метаться¦1ольёшься:слиться¦4тёшь:прочесть¦3рёшь:потереть¦7шь:удостоить"
      },
      "third": {
        "fwd": "3:оить,мить,жить¦:ь/научить¦ется:оться¦зовётся:озваться¦1ёт:дти¦1ит:оять,сеть¦1ится:ояться¦1ет:роть,аять,еять¦1берёт:зобрать¦2чет:хотеть,хотать¦2ит:ететь,ореть,стеть,еметь,ртеть¦2тёт:очесть¦2ет:онуть,ануть,дуть,онать¦2ерёт:збрать¦2ёт:чнуть¦2рёт:отереть¦3ся:житься,оиться",
        "both": "3:еить,щить,зить,лить,тить,нить,дить,сить,рить¦4:опить,евить,гчить,ишить,очить,епить,убить,ршить,явить,ушить,чшить,ивить,нчить,ьшить,ичить,ешить,ечить,ъесть,оесть,овить,ючить,ачить,авить,упить,юбить¦5:иучить,собить,ручить,рабить,орбить,бучить,ствить,лабить,зучить,ыучить,лучить¦5нет:едстать¦5ет:зревать,лкивать,ыпивать,ырезать,умевать,хрипнуть,тревать,акивать,ережать,вергать,скивать,чтожать,трезать,грожать,счезать,орожать,спотеть,зрезать,поздать,растать,олевать¦5ся:мириться,добиться,силиться¦5ёт:арасти,зрасти,одождать,тдохнуть¦5ст:еподать¦5ется:ороваться¦4ет:аскать,ведать,хивать,иучать,девать,лькать,певать,висать,худеть,ручать,лезать,аивать,ывезти,рогнуть,щивать,лотать,бивать,бижать,долеть,ничать,гивать,божать,ускать,кидать,вивать,ладеть,тигнуть,шеветь,нивать,оедать,лодать,вожать,ытечь,живать,зучать,шивать,ливать,выкнуть,личать,кучать,росать,ривать,чивать,ракать,бедать,лавать,лучать,ботать¦4ся:ериться,уриться,аесться,ылиться,алиться,елиться,олиться,явиться,юбиться,ориться,длиться,ивиться,млиться,опиться,овиться,авиться¦4ёт:отечь,стечь,опадать¦4стся:оддаться¦4ст:ридать,аздать,редать¦4ется:астаться,четаться,изнаться,бижаться,олжаться,лижаться¦4нется:остаться¦4вёт:режить¦4нет:тстать,естать,остать¦3ёт:ткнуть,етнуть,рпнуть,лкнуть,опнуть,ервать,екнуть,ькнуть,яхнуть,сечь,ьзнуть,скнуть,лечь,агнуть,пасти,аснуть,нести¦3ется:ырваться,адаться,ужаться,идаться,осаться,ажаться,ираться,юдаться,ючаться,ытаться,асаться,итаться,ататься,ждаться,араться,ичаться,иваться,ечаться,учаться,еваться,нчаться,инаться,ываться¦3ет:сметь,зреть,ырвать,гчать,икнуть,ясать,яжать,аветь,сосать,иснуть,ызнуть,стнуть,ареть,усать,ыхнуть,ргнуть,вдать,утать,лтать,ркать,ужать,езнуть,знать,икать,слеть,орать,юхать,егать,ыхать,игать,ачать,нчать,екать,юдать,асать,спеть,алеть,ждать,ытать,атать,адать,рзать,ыкать,угать,ыгать,ажать,ылать,етать,чтать,агать,лжать,ючать,ирать,зжать,огать,ечать,грать,ывать,итать,инать,елать¦3ётся:орваться,ерваться,нестись¦3ьёт:робить¦3стся:едаться,одаться,здаться¦3ится:лышаться¦3дет:ывести,ыпасть¦3ит:орчать,гудеть,тучать,болеть,дышать,вучать,ричать,лышать¦3нет:трять¦3вет:ыжить¦3мётся:рижаться¦3ся:щиться,шиться,ситься,ниться,титься,миться,зиться,диться,читься¦3дёт:апасть¦3дает:опасть¦3жет:орезать¦3нется:здеться¦2лет:ипать¦2ьет:ыбить,ышить,ыпить¦2ёт:ызть,жрать,ясти,врать,внуть,рнуть¦2ется:неться,хаться,гнуться,януться,латься,ряться,каться,инуться,меться,деяться,няться,шаться,паться,гаться,ляться,щаться,маться¦2тёт:лести,мести,рести¦2юет:оревать¦2ет:унуть,юнуть,неть,бнуть,цать,иять,бать,щать,ынуть,инуть,януть,нять,лять,рять,мать,пать,шать¦2ерёт:ебрать,абрать¦2чет:какать,мотать,лакать¦2ится:треться,мчаться,ядеться,идеться,ржаться¦2уётся:сноваться¦2ётся:кнуться,ястись,астись,ечься,рнуться,меяться¦2овёт:извать,азвать¦2мется:риняться¦2ьётся:апиться¦2ит:апеть,ипеть,рпеть,ядеть,спать,лчать,ржать,ежать,треть,идеть¦2дёт:расть,ласть,вести¦2ерётся:абраться¦2рет:ытереть¦2ерется:ыбраться¦2жёт:речь,ажечь¦2дётся:ойтись,айтись,вестись¦2ьёт:ибить¦2мет:ринять¦2вёт:лыть¦2овет:ызвать¦2еется:бриться¦2ерет:ыбрать¦2овётся:азваться¦2дет:ыйти¦2шет:писать¦1обьёт:дбить,збить¦1зовёт:тозвать¦1ует:шевать,чевать,цевать¦1дётся:асться,ийтись¦1шлет:ыслать¦1ядет:сесть¦1оет:выть,мыть,рыть¦1нётся:ясться¦1ольётся:злиться¦1шет:есать,ахать¦1ядется:сесться¦1жётся:ячься¦1щет:ыскать,искать¦1берёт:тобрать,добрать¦1жёт:лгать,ичь¦1лется:баться¦1чет:птать,ятать¦1чется:ятаться¦1берётся:зобраться¦1ет:зть¦1овьёт:звить¦1овьётся:звиться¦1жет:язать,азать,очь¦1обьётся:збиться¦1шется:исаться¦1онит:гнать¦1уёт:жевать¦1ерётся:драться¦1дёт:юсти,ийти,йти¦1юет:оевать¦1рёт:переть,мереть¦1ёт:зти,авать¦1шлёт:ислать,ослать¦1дет:ехать¦1ётся:аваться¦1удет:быть¦озьмётся:зяться¦омнёт:мять¦елет:олоть¦ёрзнет:ерзнуть¦ёркивает:еркивать¦жется:заться¦уется:оваться¦озьмёт:зять¦оется:ыться¦ует:овать",
        "rev": "нять:ймёт¦няться:ймётся¦есть:ядет¦еть:оёт¦ыть:оет¦скать:щет¦шить:ошьёт¦жечь:ожжёт¦переться:бопрётся¦евать:юёт¦ергать:ёргает¦таться:чется¦литься:ольётся¦1ть:еет,ивёт,аст,анет,енет¦1ять:нимет¦1ться:енется,астся,ается¦1сти:едёт,етёт¦1ь:чёт¦1зать:ежет¦1и:тет¦1ать:жмёт¦1озваться:тзовётся¦1овать:нуёт¦1яться:нимется¦2ти:есёт¦2ять:тоит,сеет¦2аться:ачнётся¦2ться:танется¦2и:стёт¦2еть:исит,евёт¦2ть:кает,жает,чает¦2ить:альёт,абьёт,ебьёт¦2вать:озовёт¦2оться:орется¦2рать:оберёт¦2уть:хнет,кнёт,хнёт,гнёт¦2раться:оберётся¦2обрать:азберёт¦2ать:осёт,ажнёт,ждет,рвёт¦2оть:орет¦3теть:ахочет¦3еть:летит,ремит,горит¦3есть:рочтёт,почтёт¦3ть:идает,ыдает,едает¦3ься:вится,лится,пится¦3яться:стоится¦3ь:бит¦3уть:манет,ронет¦3сть:впадёт¦3аться:ождётся¦3тать:охочет¦4ь:ожит,лжит,роит,рмит,ужит,коит,омит,ажит,воит,ымит¦4ься:ожится,лжится,коится,роится,ирится,ужится¦4еть:лестит,вистит¦4уть:еркнет¦4ать:стонет¦5ь:аучит,зумит,щемит",
        "ex": "3:есть¦4:учить/научить¦6:научить¦8:потребить,удостоить¦9:употребить¦12:злоупотребить¦есть:быть¦3ёт:нести,течь,сосать,реветь¦3ет:знать,иметь,уметь,греть,сметь,тонуть¦2чет:хотеть¦2вёт:жить¦2ймёт:понять,занять,нанять¦2шет:писать¦2ст:дать¦3нёт:начать,пожать,зажать¦2ёт:ждать,орать,врать,рвать,жрать,срать,пнуть,идти¦2ймётся:заняться¦2ит:спать¦1ерёт:брать¦1дет:ехать¦1ьёт:пить,бить,лить,шить¦1ядет:сесть¦3нётся:начаться¦1оёт:петь¦2оёт:спеть¦2дёт:пасть,вести¦2имет:снять¦4ет:болеть,кидать,суметь,пахнуть,кивать,потеть,рыдать,худеть,рухнуть,жаждать,ведать,подуть,утонуть,стонать¦4ст:задать,отдать,выдать,подать,издать¦1оет:мыть,выть,рыть,ныть¦3нется:одеться¦2еется:бриться¦3нет:стать,одеть¦4нется:остаться¦1щет:искать¦4ёт:расти,махнуть,согнуть,мигнуть,порвать,качнуть¦3дёт:упасть,впасть¦3ьёт:побить,налить,залить,забить,полить,набить¦5ст:продать,создать¦4нет:встать,надеть,устать,задеть¦3ит:дышать,шуметь,гудеть,велеть,лететь,гореть¦2жет:резать¦2ерёт:убрать¦5ет:толкать,ожидать,обучать,снижать,листать,уцелеть,сдохнуть,растаять¦1отрёт:стереть¦6ет:вырасти,умножать,выдохнуть¦4ся:явиться,длиться¦1овёт:звать¦3овёт:позвать¦3ерёт:собрать,избрать¦2ьёт:убить¦1яжет:лечь¦5вёт:прожить¦8ёт:подчеркнуть¦1ерётся:драться,браться¦3мёт:нажать¦1уёт:жевать,совать¦1ошьёт:сшить¦3ерётся:добраться,собраться¦5ёт:вдохнуть¦7ет:вычеркнуть¦5нет:настать,застать¦2тёт:учесть¦3стся:удаться,сдаться¦10ся:осуществиться¦4ит:дрожать,вертеть¦3ст:сдать¦5дёт:совпасть¦3ьётся:добиться¦1очтёт:счесть¦6ёт:сверкнуть,вздохнуть,примкнуть¦2ётся:рваться¦4ётся:дождаться¦3имет:обнять¦1ожнёт:сжать¦2ет:дуть,лаять,таять,сеять¦5ется:снижаться¦4мёт:прижать¦3тёт:цвести¦1жёт:лгать,жечь¦1ьётся:литься,биться¦1обьёт:сбить¦5ьёт:перебить¦1ожжёт:сжечь¦1рёт:тереть,переть¦5ся:мириться¦7ется:раскачаться¦1онится:гнаться¦3уёт:основать¦9ся:совокупиться¦1бопрётся:опереться¦2имется:сняться¦2юёт:плевать¦3ётся:очнуться¦2ится:мчаться,бояться¦2рётся:упереться¦1ёргает:дергать¦2нется:деться¦4вёт:дожить¦1ольёт:слить¦1нёт:мять¦2стся:даться¦1онит:гнать¦2чется:метаться¦1ольётся:слиться¦3рёт:потереть"
      },
      "firstPlural": {
        "fwd": "м:ть/научить¦емся:оться¦зовёмся:озваться¦:цепляться¦1им:теть,оять,сеть¦1ём:дти¦1имся:ояться¦1ем:роть,аять,еять¦1берём:зобрать¦2м:дить,жить,оить,мить¦2ем:онуть,ануть,дуть,онать¦2им:еметь,ореть¦2ерём:збрать¦2тём:очесть¦2ём:чнуть¦2рём:отереть",
        "both": "5ем:зревать,лкивать,ыпивать,ырезать,хрипнуть,тревать,оручать,акивать,ережать,вергать,скивать,трезать,грожать,звивать,орожать,ыдохнуть,зрезать,овожать,поздать,растать,олевать¦5м:риучить,корбить,требить,олучить¦5ём:арасти,зрасти,одождать,тдохнуть¦5дим:еподать¦5емся:ороваться¦4нем:дстать,естать,остать¦4ем:аскать,ведать,хивать,иучать,лькать,мевать,рясать,певать,висать,худеть,лезать,ывезти,тареть,рогнуть,щивать,лотать,бивать,бижать,долеть,гивать,божать,бучать,тожать,кидать,ускать,чезать,ладеть,тигнуть,шеветь,нивать,потеть,лодать,аивать,ытечь,живать,зучать,ножать,ливать,выкнуть,олкать,кучать,девать,росать,ривать,чивать,ракать,бедать,оедать,лавать,шивать,лучать,ботать¦4ём:имкнуть,отечь,стечь,опадать¦4дим:ридать,аздать,редать¦4емся:упляться,астаться,качаться,четаться,нижаться,росаться,бижаться,олжаться,лижаться¦4м:ручить,рабить,лабить¦4немся:остаться¦4им:аболеть,слышать¦3ём:ткнуть,рпнуть,етнуть,опнуть,ервать,екнуть,ькнуть,яхнуть,сечь,ьзнуть,скнуть,лечь,пасти,лкнуть,аснуть,нести¦3м:гчить,евить,опить,очить,убить,твить,епить,ивить,явить,нчить,ичить,ечить,авить,овить,ючить,ачить,упить,юбить¦3емся:ырваться,адаться,ататься,ужаться,идаться,еляться,знаться,ажаться,ираться,юдаться,ючаться,ытаться,аляться,бляться,асаться,итаться,ждаться,иваться,вляться,араться,мляться,ичаться,ечаться,учаться,еваться,нчаться,инаться,ываться¦3ем:сметь,зреть,ыкать,гчать,ухнуть,яжать,аветь,спеть,сосать,иснуть,ызнуть,ужать,знать,стнуть,усать,ыхнуть,алеть,ргнуть,вдать,утать,лтать,ркать,езнуть,икать,ибать,ыхать,слеть,орать,юхать,игать,агать,нчать,екать,юдать,асать,ждать,ытать,атать,адать,рзать,зжать,ичать,угать,ыгать,ажать,ылать,етать,чтать,икнуть,лжать,ючать,егать,ирать,ывать,ачать,огать,ечать,грать,итать,инать,елать¦3ёмся:орваться,ерваться,нестись,лечься¦3ьём:робить¦3имся:лышаться¦3димся:едаться,одаться,здаться¦3дем:ывести,ыпасть¦3им:орчать,гудеть,тучать,дышать,вучать¦3нем:трять¦3вем:ыжить¦3мёмся:рижаться¦3дём:апасть¦3вём:ежить¦3даем:опасть¦3жем:орезать¦3дим:тдать¦3немся:здеться¦2лем:ипать¦2ьем:ыбить,ышить,ыпить¦2ём:ызть,жрать,ясти,врать,внуть,рнуть¦2емся:неться,хаться,гнуться,януться,латься,инуться,ряться,каться,няться,меться,деяться,шаться,паться,гаться,щаться,маться¦2тём:лести,мести,рести¦2юем:оревать¦2ем:унуть,юнуть,неть,бнуть,цать,иять,щать,ынуть,инуть,януть,нять,лять,рять,мать,пать,шать¦2ерём:ебрать,абрать¦2чем:какать,хотать,мотать,лакать¦2имся:треться,мчаться,ядеться,идеться,ржаться¦2уёмся:сноваться¦2ёмся:кнуться,ястись,астись,рнуться,меяться¦2овём:извать,азвать¦2мемся:риняться¦2димся:аесться¦2ьёмся:апиться¦2им:апеть,ипеть,рпеть,ядеть,спать,лчать,ржать,ежать,треть,идеть¦2дём:расть,ласть,вести¦2ерёмся:абраться¦2рем:ытереть¦2еремся:ыбраться¦2жём:речь,ажечь¦2дёмся:ойтись,айтись,вестись¦2ьём:ибить¦2м:еить,щить,шить,зить,лить,сить,тить,нить,рить¦2мем:ринять¦2вём:лыть¦2дим:ъесть,оесть¦2овем:ызвать¦2еемся:бриться¦2ерем:ыбрать¦2овёмся:азваться¦2шем:писать¦1обьём:дбить,збить¦1зовём:тозвать¦1уем:шевать,чевать,цевать¦1дёмся:асться,ийтись¦1шлем:ыслать¦1ядем:сесть¦1оем:выть,мыть,рыть¦1нёмся:ясться¦1ольёмся:злиться¦1шем:есать,ахать¦1ядемся:сесться¦1жёмся:ячься¦1щем:ыскать,искать¦1берём:тобрать,добрать¦1жём:лгать,ичь¦1лемся:баться¦1чем:птать,ятать¦1чемся:ятаться¦1берёмся:зобраться¦1ем:зть¦1овьём:звить¦1овьёмся:звиться¦1жем:язать,азать,очь¦1обьёмся:збиться¦1шемся:исаться¦1оним:гнать¦1уём:жевать¦1ерёмся:драться¦1дём:юсти,ийти,йти¦1юем:оевать¦1рём:переть,мереть¦1ём:зти,авать¦1шлём:ислать,ослать¦1дем:ехать¦1ёмся:аваться¦1удем:быть¦1мся:иться¦озьмёмся:зяться¦омнём:мять¦елем:олоть¦ёрзнем:ерзнуть¦ёркиваем:еркивать¦жемся:заться¦уемся:оваться¦озьмём:зять¦оемся:ыться¦уем:овать",
        "rev": "нять:ймём¦няться:ймёмся¦есть:ядем¦еть:оём¦ыть:оем¦скать:щем¦шить:ошьём¦жечь:ожжём¦переться:бопрёмся¦евать:юём¦ергать:ёргаем¦таться:чемся¦литься:ольёмся¦1ть:еем,ивём,анем,енем¦1ти:йдем¦1ять:нимем¦1ться:енемся,яемся¦1сти:едём,етём¦1ь:чём¦1и:тем¦1ать:жмём¦1озваться:тзовёмся¦1овать:нуём¦1яться:нимемся¦2ти:есём¦2ять:тоим,сеем¦2аться:ачнёмся,ждёмся¦2ть:дадим,жаем,чаем,бим¦2ться:танемся,дадимся¦2ать:ышим,осём,ажнём,ждем,рвём¦2и:стём¦2еть:исим,евём¦2ить:альём,абьём,ебьём¦2вать:озовём¦2оться:оремся¦2рать:оберём¦2уть:хнем,хнём,гнём,кнем,кнём¦2раться:оберёмся¦2обрать:азберём¦2оть:орем¦3ть:одим,ожим,лжим,роим,рмим,ужим,идаем,коим,омим,рдим,ажим,ыдаем,воим,ымим,едаем¦3еть:хотим,летим,ремим,горим¦3яться:стоимся¦3уть:ронем,манем¦3есть:почтём¦3сть:впадём¦3ать:ырвем¦4ть:ыучим,аучим,ладим,зучим,редим,ездим,бедим,радим,ледим,садим,бучим,судим,нудим,истаем,рядим,зумим,будим¦4еть:лестим¦4ать:стонем¦5ть:студим,ищемим",
        "ex": "1:вцепляться¦есть:быть¦3ём:нести,течь,сосать,реветь¦3ем:знать,иметь,уметь,греть,сметь,тонуть¦2вём:жить¦2ймём:понять,занять,нанять¦2шем:писать¦2дим:дать¦3нём:начать,пожать,зажать¦2ём:ждать,орать,врать,рвать,жрать,срать,пнуть,идти¦2ймёмся:заняться¦3дем:выйти¦2им:спать¦1ерём:брать¦1дем:ехать¦1ьём:пить,бить,лить,шить¦1ядем:сесть¦1дим:есть¦3нёмся:начаться¦1оём:петь¦2оём:спеть¦2дём:пасть,вести¦2имем:снять¦4ем:болеть,кидать,суметь,пахнуть,кивать,потеть,рыдать,худеть,вырвать,жаждать,ведать,подуть,утонуть,стонать¦4дим:задать,выдать,подать,издать¦1оем:мыть,выть,рыть,ныть¦3немся:одеться¦2еемся:бриться¦5м:выучить,научить,изучить,обучить¦3нем:стать,одеть¦4немся:остаться¦4им:слышать,кричать,дрожать,вертеть¦1щем:искать¦4ём:расти,махнуть,шагнуть,согнуть,мигнуть,порвать,качнуть¦3дём:упасть,впасть¦3ьём:побить,налить,залить,забить,полить,набить¦5дим:продать,создать¦4нем:встать,надеть,устать,задеть¦3им:дышать,шуметь,гудеть,велеть,хотеть,лететь,гореть¦2жем:резать¦2ерём:убрать¦1отрём:стереть¦6ем:вырасти¦5ем:ожидать,снижать,вручать,листать,уцелеть,сдохнуть,растаять¦1овём:звать¦3овём:позвать¦3ерём:собрать,избрать¦2ьём:убить¦1яжем:лечь¦5вём:прожить¦8ём:подчеркнуть¦1ерёмся:драться,браться¦5нем:отстать,настать,застать¦3мём:нажать¦1уём:жевать,совать¦1ошьём:сшить¦3ерёмся:добраться,собраться¦5ём:вдохнуть¦7ем:вычеркнуть¦2тём:учесть¦3димся:удаться,сдаться¦3дим:сдать¦5дём:совпасть¦3ьёмся:добиться¦1очтём:счесть¦6ём:сверкнуть,вздохнуть¦2ёмся:рваться¦4ёмся:дождаться¦3имем:обнять¦1ожнём:сжать¦2ем:дуть,лаять,таять,сеять¦4мём:прижать¦3тём:цвести¦1жём:лгать,жечь¦1ьёмся:литься,биться¦1обьём:сбить¦5ьём:перебить¦1ожжём:сжечь¦1рём:тереть,переть¦1онимся:гнаться¦3уём:основать¦10м:приспособить¦1бопрёмся:опереться¦5димся:поддаться¦2имемся:сняться¦2юём:плевать¦3ёмся:очнуться¦2имся:мчаться,бояться¦2рёмся:упереться¦1ёргаем:дергать¦2немся:деться¦7емся:прогуляться¦4вём:дожить¦1ольём:слить¦1нём:мять¦2димся:даться¦1оним:гнать¦2чемся:метаться¦1ольёмся:слиться¦3м:учить/научить¦4м:ездить,будить,судить¦4тём:прочесть¦5им:свистеть¦3рём:потереть¦7м:удостоить"
      },
      "secondPlural": {
        "fwd": "е:ь/научить¦етесь:оться¦зовётесь:озваться¦:цепляться¦1ите:теть,оять,сеть¦1ёте:дти¦1итесь:ояться¦1ете:роть,аять,еять¦1берёте:зобрать¦2ите:ореть,еметь¦2тёте:очесть¦2ете:онуть,ануть,дуть,онать¦2ерёте:збрать¦2ёте:чнуть¦2рёте:отереть¦3е:дить,оить,мить,жить¦3есь:диться,житься,оиться",
        "both": "5ете:зревать,лкивать,ыпивать,ырезать,умевать,хрипнуть,тревать,оручать,акивать,ережать,вергать,скивать,чтожать,трезать,грожать,счезать,орожать,спотеть,зрезать,поздать,растать,олевать¦5е:иучить,собить,ручить,рабить,орбить,бучить,ствить,лабить,зучить,ыучить,лучить¦5есь:мириться,добиться,силиться¦5ёте:арасти,зрасти,одождать,тдохнуть¦5дите:еподать¦5етесь:ороваться¦4нете:дстать,тстать,естать,остать¦4ете:аскать,ведать,хивать,иучать,девать,лькать,певать,висать,худеть,лезать,аивать,ывезти,рогнуть,щивать,лотать,бивать,бижать,долеть,ничать,гивать,божать,ускать,кидать,вивать,ладеть,тигнуть,шеветь,нивать,лодать,вожать,ытечь,живать,зучать,шивать,ливать,выкнуть,личать,кучать,росать,ривать,чивать,ракать,бедать,оедать,лавать,лучать,ботать¦4е:евить,гчить,ишить,опить,епить,убить,ршить,явить,ушить,очить,чшить,ивить,ьшить,ичить,ешить,нчить,ечить,овить,ючить,ачить,авить,упить,юбить¦4есь:ериться,уриться,упиться,ылиться,алиться,елиться,олиться,явиться,юбиться,ориться,длиться,ивиться,млиться,опиться,овиться,авиться¦4ёте:отечь,стечь,опадать¦4дитесь:оддаться¦4дите:ридать,аздать,редать¦4етесь:астаться,четаться,изнаться,бижаться,олжаться,лижаться¦4нетесь:остаться¦4вёте:режить¦3ёте:ткнуть,етнуть,рпнуть,лкнуть,опнуть,ервать,екнуть,ькнуть,яхнуть,сечь,ьзнуть,скнуть,лечь,агнуть,пасти,аснуть,нести¦3етесь:ырваться,адаться,уляться,ужаться,идаться,еляться,осаться,ажаться,ираться,юдаться,ючаться,ытаться,аляться,бляться,асаться,итаться,ататься,ждаться,араться,мляться,ичаться,иваться,вляться,ечаться,учаться,еваться,нчаться,инаться,ываться¦3ете:сметь,зреть,ырвать,гчать,икнуть,ясать,яжать,аветь,сосать,иснуть,ызнуть,стнуть,ареть,усать,ыхнуть,ргнуть,вдать,утать,лтать,ркать,ужать,езнуть,знать,икать,слеть,орать,юхать,егать,ыхать,игать,ачать,нчать,екать,юдать,асать,спеть,алеть,ждать,ытать,атать,адать,рзать,ыкать,угать,ыгать,ажать,ылать,етать,чтать,агать,лжать,ючать,ирать,зжать,огать,ечать,грать,ывать,итать,инать,елать¦3ётесь:орваться,ерваться,нестись¦3ьёте:робить¦3дитесь:едаться,одаться,здаться¦3итесь:лышаться¦3дете:ывести,ыпасть¦3ите:орчать,гудеть,тучать,болеть,дышать,вучать,ричать,лышать¦3нете:трять¦3вете:ыжить¦3мётесь:рижаться¦3есь:щиться,шиться,ситься,ниться,титься,миться,зиться,читься¦3дёте:апасть¦3даете:опасть¦3е:еить,щить,зить,лить,тить,нить,сить,рить¦3жете:орезать¦3нетесь:здеться¦2лете:ипать¦2ьете:ыбить,ышить,ыпить¦2ёте:ызть,жрать,ясти,врать,внуть,рнуть¦2етесь:неться,хаться,гнуться,януться,латься,ряться,каться,инуться,меться,деяться,няться,шаться,паться,гаться,щаться,маться¦2тёте:лести,мести,рести¦2юете:оревать¦2ете:унуть,юнуть,неть,бнуть,цать,иять,бать,щать,ынуть,инуть,януть,нять,лять,рять,мать,пать,шать¦2ерёте:ебрать,абрать¦2чете:какать,хотать,мотать,лакать¦2итесь:треться,мчаться,ядеться,идеться,ржаться¦2уётесь:сноваться¦2ётесь:кнуться,ястись,астись,ечься,рнуться,меяться¦2овёте:извать,азвать¦2метесь:риняться¦2дитесь:аесться¦2ьётесь:апиться¦2ите:апеть,ипеть,рпеть,ядеть,спать,лчать,ржать,ежать,треть,идеть¦2дёте:расть,ласть,вести¦2ерётесь:абраться¦2рете:ытереть¦2еретесь:ыбраться¦2жёте:речь,ажечь¦2дётесь:ойтись,айтись,вестись¦2ьёте:ибить¦2мете:ринять¦2вёте:лыть¦2дите:ъесть,оесть¦2овете:ызвать¦2еетесь:бриться¦2ерете:ыбрать¦2овётесь:азваться¦2дете:ыйти¦2шете:писать¦1обьёте:дбить,збить¦1зовёте:тозвать¦1уете:шевать,чевать,цевать¦1дётесь:асться,ийтись¦1шлете:ыслать¦1ядете:сесть¦1оете:выть,мыть,рыть¦1нётесь:ясться¦1ольётесь:злиться¦1шете:есать,ахать¦1ядетесь:сесться¦1жётесь:ячься¦1щете:ыскать,искать¦1берёте:тобрать,добрать¦1жёте:лгать,ичь¦1летесь:баться¦1чете:птать,ятать¦1четесь:ятаться¦1берётесь:зобраться¦1ете:зть¦1овьёте:звить¦1овьётесь:звиться¦1жете:язать,азать,очь¦1обьётесь:збиться¦1шетесь:исаться¦1оните:гнать¦1уёте:жевать¦1ерётесь:драться¦1дёте:юсти,ийти,йти¦1юете:оевать¦1рёте:переть,мереть¦1ёте:зти,авать¦1шлёте:ислать,ослать¦1дете:ехать¦1ётесь:аваться¦1удете:быть¦озьмётесь:зяться¦омнёте:мять¦елете:олоть¦ёрзнете:ерзнуть¦ёркиваете:еркивать¦жетесь:заться¦уетесь:оваться¦озьмёте:зять¦оетесь:ыться¦уете:овать",
        "rev": "нять:ймёте¦няться:ймётесь¦есть:ядете¦еть:оёте¦ыть:оете¦скать:щете¦шить:ошьёте¦жечь:ожжёте¦переться:бопрётесь¦евать:юёте¦ергать:ёргаете¦таться:четесь¦литься:ольётесь¦1ть:еете,ивёте,анете,енете¦1ять:нимете¦1ться:енетесь,аетесь,яетесь¦1сти:едёте,етёте¦1ь:чёте¦1и:тете¦1ать:жмёте¦1озваться:тзовётесь¦1овать:нуёте¦1яться:ниметесь¦2ти:есёте¦2ять:тоите,сеете¦2аться:ачнётесь,ждётесь¦2ть:дадите,каете,жаете,чаете¦2ться:танетесь,дадитесь¦2и:стёте¦2еть:исите,евёте¦2ить:альёте,абьёте,ебьёте¦2вать:озовёте¦2оться:оретесь¦2рать:оберёте¦2уть:хнете,кнёте,хнёте,гнёте¦2раться:оберётесь¦2обрать:азберёте¦2ать:осёте,ажнёте,ждете,рвёте¦2оть:орете¦3еть:хотите,летите,ремите,горите¦3есть:рочтёте,почтёте¦3ть:идаете,ыдаете,едаете¦3ься:витесь,литесь¦3яться:стоитесь¦3уть:ронете,манете,ркнете¦3сть:впадёте¦3ь:бите¦4ь:одите,ожите,лжите,роите,здите,рмите,ужите,коите,омите,рдите,ажите,воите,ымите¦4ься:одитесь,ожитесь,удитесь,лжитесь,коитесь,рдитесь,роитесь,иритесь,ужитесь¦4еть:лестите,вистите¦4ать:стонете¦5ь:аучите,ладите,судите,редите,бедите,радите,ледите,садите,будите,нудите,рядите,зумите,щемите¦5ься:ладитесь",
        "ex": "1:вцепляться¦есть:быть¦3ёте:нести,течь,сосать,реветь¦3ете:знать,иметь,уметь,греть,сметь,тонуть¦2вёте:жить¦2ймёте:понять,занять,нанять¦2шете:писать¦2дите:дать¦3нёте:начать,пожать,зажать¦2ёте:ждать,орать,врать,рвать,жрать,срать,пнуть,идти¦2ймётесь:заняться¦2ите:спать¦1ерёте:брать¦1дете:ехать¦1ьёте:пить,бить,лить,шить¦1ядете:сесть¦1дите:есть¦3нётесь:начаться¦1оёте:петь¦2оёте:спеть¦2дёте:пасть,вести¦2имете:снять¦4ете:болеть,кидать,суметь,пахнуть,кивать,потеть,рыдать,худеть,рухнуть,жаждать,ведать,подуть,утонуть,стонать¦4дите:задать,отдать,выдать,подать,издать¦1оете:мыть,выть,рыть,ныть¦3нетесь:одеться¦2еетесь:бриться¦3нете:стать,одеть¦4нетесь:остаться¦1щете:искать¦4ёте:расти,махнуть,согнуть,мигнуть,порвать,качнуть¦3дёте:упасть,впасть¦3ьёте:побить,налить,залить,забить,полить,набить¦5дите:продать,создать¦4нете:встать,надеть,устать,задеть¦3ите:дышать,шуметь,гудеть,велеть,хотеть,лететь,гореть¦6е:научить¦2жете:резать¦2ерёте:убрать¦5ете:толкать,ожидать,обучать,снижать,вручать,листать,уцелеть,сдохнуть,растаять¦1отрёте:стереть¦6ете:вырасти,умножать,выдохнуть¦4есь:явиться,длиться¦1овёте:звать¦3овёте:позвать¦3ерёте:собрать,избрать¦2ьёте:убить¦1яжете:лечь¦5вёте:прожить¦8ёте:подчеркнуть¦9е:употребить¦1ерётесь:драться,браться¦3мёте:нажать¦1уёте:жевать,совать¦1ошьёте:сшить¦3ерётесь:добраться,собраться¦5ёте:вдохнуть¦7ете:вычеркнуть¦5нете:настать,застать¦2тёте:учесть¦3дитесь:удаться,сдаться¦10есь:осуществиться¦4ите:дрожать,вертеть¦3дите:сдать¦5дёте:совпасть¦3ьётесь:добиться¦1очтёте:счесть¦6ёте:сверкнуть,вздохнуть,примкнуть¦2ётесь:рваться¦4ётесь:дождаться¦3имете:обнять¦1ожнёте:сжать¦2ете:дуть,лаять,таять,сеять¦5етесь:снижаться¦4мёте:прижать¦3тёте:цвести¦1жёте:лгать,жечь¦1ьётесь:литься,биться¦8е:потребить,удостоить¦1обьёте:сбить¦5ьёте:перебить¦1ожжёте:сжечь¦1рёте:тереть,переть¦5есь:мириться,садиться¦7етесь:раскачаться¦1онитесь:гнаться¦12е:злоупотребить¦3уёте:основать¦9етесь:совокупляться¦1бопрётесь:опереться¦2иметесь:сняться¦2юёте:плевать¦3ётесь:очнуться¦2итесь:мчаться,бояться¦2рётесь:упереться¦1ёргаете:дергать¦2нетесь:деться¦4вёте:дожить¦1ольёте:слить¦1нёте:мять¦2дитесь:даться¦1оните:гнать¦2четесь:метаться¦1ольётесь:слиться¦4е:учить/научить¦5е:будить,судить¦7е:остудить¦6есь:убедиться¦3рёте:потереть¦7есь:высадиться"
      },
      "thirdPlural": {
        "fwd": "3:оять¦4:онуть¦5:ачнуть¦ат:ить/научить¦рут:ереть¦ются:оться¦зовутся:озваться¦1ят:теть,пить,оить,сеть,мить¦1ут:дти,зти,зть¦1ют:авать,аять,еять¦1ат:жить¦1дут:асть,ехать¦1ются:аваться,еяться¦1атся:житься¦1ятся:оиться¦1берут:зобрать¦1нутся:ясться¦1дутся:асться¦2ся:уться¦2тут:очесть¦2ят:еметь,ореть¦2ерут:збрать¦2ют:дуть¦2ут:онать¦3ся:ояться",
        "both": "4:унуть,юнуть,рчать,пнуть,тнуть,бнуть,гнуть,внуть,ынуть,инуть,януть,лчать,кнуть,ржать,снуть,хнуть,рнуть¦5:ызнуть,ьзнуть,езнуть,мануть,лежать,тучать,дышать,вучать,ричать,лышать¦5ют:зревать,лкивать,ыпивать,ырезать,акивать,ережать,скивать,олевать,трезать,окидать,звивать,орожать,зрезать,спевать,поздать,растать¦5ся:лышаться¦5ются:скачаться,должаться,ороваться¦5ятся:надобиться¦5дут:ередать¦5ут:одождать¦4нут:дстать,естать¦4ют:аскать,ведать,иучать,целеть,висать,худеть,лезать,истать,ручать,щивать,лотать,хивать,долеть,гивать,божать,бучать,тожать,ускать,нивать,ладеть,шеветь,потеть,лодать,аивать,вожать,ливать,живать,бивать,зучать,жидать,ножать,кучать,девать,росать,ривать,чивать,ракать,бедать,оедать,шивать,лучать,ботать¦4дутся:аздаться,оддаться,оздаться¦4ся:мчаться,ржаться¦4ются:астаться,четаться,нижаться,росаться,бижаться¦4ят:требить¦4нутся:остаться¦4ут:опадать,расти¦4дут:аздать,подать¦3ются:адаться,ататься,ужаться,идаться,знаться,ажаться,ираться,юдаться,ждаться,ючаться,ытаться,ываться,асаться,итаться,араться,ичаться,иваться,ечаться,учаться,еваться,нчаться,инаться¦3ют:сметь,зреть,ыкать,гчать,ькать,ясать,яжать,аветь,ареть,усать,вдать,утать,ичать,лтать,ркать,ицать,ужать,икать,слеть,орать,юхать,нчать,екать,ждать,юдать,асать,спеть,алеть,ытать,атать,рзать,ылать,лкать,зжать,ажать,етать,чтать,лжать,ючать,ыхать,ирать,адать,ачать,ывать,ечать,грать,итать,инать,елать¦3ат:иучить,ручить,бучить,зучить,ыучить,лучить¦3ьют:робить¦3дутся:едаться,одаться¦3ят:собить,рабить,гудеть,лабить,болеть¦3ут:сосать,пасти,нести¦3нут:трять¦3вут:ыжить,ежить¦3мутся:рижаться¦3мут:рижать¦3утся:нестись¦3дают:опасть¦3жут:орезать¦3дут:тдать¦3нутся:здеться¦2лют:ипать¦2ьют:ыбить,ышить,ибить,ыпить¦2ются:неться,хаться,ряться,латься,каться,няться,шаться,паться,гаться,ляться,щаться,маться¦2тут:лести,мести,рести¦2юют:оревать¦2утся:рваться,ястись,астись¦2ат:гчить,очить,нчить,ичить,ечить,ючить,ачить¦2ут:рвать,жрать,лгать,ясти,врать¦2ерут:ебрать,абрать,ыбрать¦2чут:какать,хотать,мотать,лакать¦2ятся:треться,ядеться,упиться,юбиться,идеться,опиться¦2овут:извать,ызвать,азвать¦2мутся:риняться¦2дятся:аесться¦2ьются:апиться¦2ят:апеть,рбить,убить,ипеть,рпеть,ядеть,спать,юбить,треть,идеть¦2ют:неть,иять,бать,щать,нять,лять,рять,мать,пать,гать,шать¦2кут:сечь,лечь,течь¦2гут:речь,бежать¦2имут:бнять¦2дутся:ойтись,айтись,вестись¦2мут:ринять¦2дят:ъесть,оесть¦2еются:бриться¦2дут:вести¦2овутся:азваться¦2шут:писать¦1обьют:дбить,збить¦1зовут:тозвать¦1уют:шевать,жевать,чевать,цевать¦1ядут:сесть¦1оют:выть,мыть,рыть¦1ольются:злиться¦1шут:есать,ахать¦1ядутся:сесться¦1гутся:ячься¦1щут:ыскать,искать¦1берут:тобрать,добрать¦1атся:щиться,шиться,читься¦1лются:баться¦1чут:птать,ятать¦1чутся:ятаться¦1берутся:зобраться¦1овьют:звить¦1овьются:звиться¦1дутся:ийтись¦1ят:еить,зить,лить,рить,вить,сить,тить,дить,нить¦1жут:язать,азать¦1обьются:збиться¦1гут:ичь,очь¦1шутся:исаться¦1онят:гнать¦1ерутся:браться,драться¦1ятся:риться,ситься,литься,ниться,миться,зиться,титься,диться,виться¦1кутся:ечься¦1дут:юсти,ийти,йти¦1юют:оевать¦1ат:щить,шить¦1ют:роть¦1удут:быть¦озьмутся:зяться¦омнут:мять¦елют:олоть¦ёрзнут:ерзнуть¦ёркивают:еркивать¦жутся:заться¦уются:оваться¦шлют:слать¦озьмут:зять¦оются:ыться¦уют:овать",
        "rev": "нять:ймут¦няться:ймутся¦есть:ядут¦скать:щут¦чь:кут¦зать:жут¦ечь:ягут¦шить:ошьют¦жечь:ожгут¦переться:бопрутся¦евать:юют¦ергать:ёргают¦таться:чутся¦литься:ольются¦1ть:ивут,ывут,енут¦1еть:поют¦1ять:нимут¦1ереть:мрут,прут¦1ться:енутся,анутся¦1оться:рются¦1ать:жмут¦1сти:етут¦1озваться:тзовутся¦1яться:нимутся¦2ти:есут,лзут¦2ть:меют,леют,дадут,танут,реют,теют,зают,жают,деют,ызут¦2ить:упят,ожат,лжат,роят,рмят,ужат,альют,коят,омят,ажат,воят,ебьют,опят,ымят,абьют¦2аться:ачнутся,ждутся¦2и:стут¦2хать:иедут,оедут,ъедут,аедут¦2еть:исят,евут¦2ться:жаются,дадутся¦2иться:ожатся,лжатся,коятся,роятся,ужатся¦2яться:деются¦2вать:озовут¦2ечь:ажгут¦2обрать:азберут¦2ереть:ытрут¦2ать:осут,ждут¦2сть:радут¦2сться:лянутся,падутся¦2ять:сеют¦3еть:хотят,летят,ремят,горят¦3ть:авают,лезут,евают¦3вать:тдают,знают¦3есть:рочтут,почтут¦3ти:везут¦3хать:реедут¦3сть:ыпадут,впадут,ападут¦3ить:репят,зумят,щемят¦3ваться:здаются¦4ься:рнутся,инутся,гнутся,кнутся¦4ь:тоят,ежат,ышат¦4вать:родают,подают,редают,остают,тстают,аздают,дстают¦4яться:асмеются¦4еть:лестят,вистят¦4ать:стонут¦5ься:стоятся,тянутся¦5вать:рестают¦5ь:ронут¦5ить:достоят",
        "ex": "4:пнуть¦5:лежать,дышать,тонуть¦6:дрожать,качнуть,утонуть¦есть:быть¦3ут:нести,сосать,реветь,лезть,везти¦3ют:знать,иметь,уметь,греть,сметь,сдавать¦2вут:жить¦2ймут:понять,занять,нанять¦2шут:писать¦2дут:дать,вести,пасть,уехать¦3нут:начать,стать,одеть,пожать,зажать¦2ут:ждать,орать,врать,рвать,лгать,жрать,срать,идти¦2ймутся:заняться¦2ят:спать¦1ерут:брать¦1дут:ехать¦1ьют:пить,бить,лить,шить¦1ядут:сесть¦2гут:бежать¦1дят:есть¦3нутся:начаться,одеться¦1оют:петь,мыть,выть,рыть,ныть¦2оют:спеть¦2имут:снять¦4ют:болеть,кидать,суметь,кивать,потеть,рыдать,худеть,ведать,задавать,вставать,уставать,выдавать,подавать,издавать,подуть¦4дут:задать,выдать,подать,издать¦5ют:плавать,снижать,обижать,создавать,наставать,растаять,заставать,придавать¦2еются:бриться¦4нутся:остаться¦1щут:искать¦4ут:расти,жаждать,стонать¦3ьют:побить,налить,залить,забить,полить,набить¦5дут:продать,создать,предать,придать¦4нут:встать,надеть,устать,задеть¦8ются:приближаться¦4ат:научить¦2кут:течь¦3вут:плыть¦2жут:резать¦2ерут:убрать¦1отрут:стереть¦3ются:иметься,смеяться¦1овут:звать¦3овут:позвать¦3ерут:собрать,избрать¦2ьют:убить¦1ягут:лечь¦5вут:прожить¦5нут:достать,отстать,настать,застать¦1ерутся:драться,браться¦3ят:шуметь,гудеть,велеть,хотеть,лететь,гореть¦3мут:нажать¦1уют:жевать¦1ошьют:сшить¦3гут:зажечь¦2тут:учесть¦3дутся:удаться,сдаться¦6ют:исчезать,угрожать¦3дут:сдать,класть,упасть,выехать,впасть¦3ьются:добиться¦1очтут:счесть¦2утся:рваться¦4утся:дождаться¦1ожнут:сжать¦2ют:дуть,давать,лаять,таять,сеять¦3тут:цвести¦1ьются:литься,биться¦1обьют:сбить¦5ьют:перебить¦1ожгут:сжечь¦1онятся:гнаться¦8ют:застревать¦1бопрутся:опереться¦11ют:подразумевать¦2имутся:сняться¦2юют:плевать¦4ся:мчаться,бояться¦2рутся:упереться¦1гут:жечь¦1ёргают:дергать¦2нутся:деться¦4вут:дожить¦1ольют:слить¦1нут:мять¦2дутся:даться¦1онят:гнать¦2чутся:метаться¦1ольются:слиться¦2ат:учить/научить¦4ются:оставаться¦4ят:вертеть¦5ся:тянуться,очнуться¦1рут:тереть,переть¦3рут:потереть"
      }
    },
    "pastTense": {
      "masc": {
        "fwd": "1:зть¦2:езнуть¦л:сть¦лся:сться¦1г:ичь",
        "both": "1:бнуть¦2:ясти,лзти,ыкнуть¦3:никнуть,тигнуть,переть,мереть¦4:ывезти¦4ёк:ересечь¦3ёл:обрести,рочесть¦3ся:рястись¦3к:ытечь¦2ёл:плести¦2ёк:отечь,стечь¦2ёр:отереть¦2ся:астись¦1ёг:речь,лечь,жечь¦1ёсся:нестись¦1ёл:мести,вести¦1гся:ячься¦1ос:расти¦1л:юсти¦1ёлся:вестись¦1ёс:нести¦1шел:ыйти¦1г:очь¦шёлся:йтись¦ёгся:ечься¦ёз:езти¦шёл:йти¦лся:ться¦л:ть",
        "rev": "ести:ёс¦асти:ос¦ечь:ёк,ёг¦ереть:ёр¦1есть:чёл¦1еться:рся¦1ести:рёл¦2сть:оел,ъел,чел¦2чь:риг¦2еть:ер¦2сться:селся,аелся¦2ть:ыз¦3ти:пас¦3нуть:чез¦3ть:лез¦3сть:апал,крал¦3сться:клялся,опался¦4сть:овпал,рисел",
        "ex": "3:переть,лезть¦4:спасти¦5:вытереть¦шёл:идти¦1ёс:нести¦1ёл:вести¦1ос:расти¦1ёк:течь¦2ёр:стереть¦1ёг:лечь,жечь¦2ёл:счесть¦1ёр:тереть¦4ся:опереться,упереться¦4л:вывести,выпасть,попасть¦3ёл:обрести¦2л:сесть,пасть¦1л:есть¦3л:класть,упасть,впасть,красть¦3лся:клясться"
      },
      "fem": {
        "fwd": "ла:сть¦лась:сться¦1ла:зти¦1гла:ичь¦2ла:вести,езнуть,рести,мести,лести",
        "both": "4ла:ытереть,стигнуть¦3ла:мереть,никнуть,переть,рочесть,нести¦3лась:нестись¦2лась:ереться,астись,вестись¦2гла:лечь,речь¦2кла:сечь,течь¦2ла:ясти,ыкнуть¦1ла:бнуть,юсти¦1осла:расти¦1гла:очь¦шлась:йтись¦глась:чься¦шла:йти¦лась:ться¦ла:ть",
        "rev": "асти:осла¦ереть:ёрла¦жечь:ожгла¦1чь:екла,егла¦1тись:слась¦2ти:есла,асла,лзла¦2сть:оела,ъела,чела¦2ечь:ажгла¦2чь:ригла¦2сться:селась,аелась¦2еть:ерла¦3сти:ивела,звела,овела,дмела,ывела,плела,брела¦3ти:везла¦3нуть:чезла¦3сть:апала,крала¦3сться:клялась¦4сти:ревела¦4сть:овпала,рисела",
        "ex": "шла:идти¦3ла:нести,переть,класть,упасть,увести,впасть,цвести,красть,везти,ввести,свести¦2ла:вести,сесть,пасть¦1осла:расти¦2кла:течь¦2ёрла:стереть¦4ла:спасти,отвести,выпасть,попасть,завести,навести¦2гла:лечь¦3гла:зажечь¦1очла:счесть¦4лась:трястись,попасться¦1ожгла:сжечь¦1ёрла:тереть¦3ёрла:потереть¦1гла:жечь¦1ла:есть¦5ла:подвести¦3лась:клясться"
      },
      "neut": {
        "fwd": "ло:сть¦лось:сться¦1ло:зти¦1гло:ичь¦2ло:вести,езнуть,рести,мести,лести",
        "both": "4ло:ытереть,стигнуть¦3ло:мереть,никнуть,переть,рочесть,нести¦3лось:нестись¦2лось:ереться,астись,вестись¦2гло:лечь,речь¦2кло:сечь,течь¦2ло:ясти,ыкнуть¦1ло:бнуть,юсти¦1осло:расти¦1гло:очь¦шлось:йтись¦глось:чься¦шло:йти¦лось:ться¦ло:ть",
        "rev": "асти:осло¦ереть:ёрло¦жечь:ожгло¦1чь:екло,егло¦1тись:слось¦2ти:есло,асло,лзло¦2сть:оело,ъело,чело¦2ечь:ажгло¦2чь:ригло¦2сться:селось,аелось¦2еть:ерло¦3сти:ивело,звело,овело,дмело,ывело,плело,брело¦3ти:везло¦3нуть:чезло¦3сть:апало,крало¦3сться:клялось¦4сти:ревело¦4сть:овпало,рисело",
        "ex": "шло:идти¦3ло:нести,переть,класть,упасть,увести,впасть,цвести,красть,везти,ввести,свести¦2ло:вести,сесть,пасть¦1осло:расти¦2кло:течь¦2ёрло:стереть¦4ло:спасти,отвести,выпасть,попасть,завести,навести¦2гло:лечь¦3гло:зажечь¦1очло:счесть¦4лось:трястись,попасться¦1ожгло:сжечь¦1ёрло:тереть¦3ёрло:потереть¦1гло:жечь¦1ло:есть¦5ло:подвести¦3лось:клясться"
      },
      "plural": {
        "fwd": "ли:сть¦лись:сться¦1ли:зти¦1гли:ичь¦2ли:вести,езнуть,рести,мести,лести",
        "both": "4ли:ытереть,стигнуть¦3ли:мереть,никнуть,переть,рочесть,нести¦3лись:нестись¦2лись:ереться,астись,вестись¦2гли:лечь,речь¦2кли:сечь,течь¦2ли:ясти,ыкнуть¦1ли:бнуть,юсти¦1осли:расти¦1гли:очь¦шлись:йтись¦глись:чься¦шли:йти¦лись:ться¦ли:ть",
        "rev": "асти:осли¦ереть:ёрли¦жечь:ожгли¦1чь:екли,егли¦1тись:слись¦2ти:если,асли,лзли¦2сть:оели,ъели,чели¦2ечь:ажгли¦2чь:ригли¦2сться:селись,аелись¦2еть:ерли¦3сти:ивели,звели,овели,дмели,ывели,плели,брели¦3ти:везли¦3нуть:чезли¦3сть:апали,крали¦3сться:клялись¦4сти:ревели¦4сть:овпали,рисели",
        "ex": "шли:идти¦3ли:нести,переть,класть,упасть,увести,впасть,цвести,красть,везти,ввести,свести¦2ли:вести,сесть,пасть¦1осли:расти¦2кли:течь¦2ёрли:стереть¦4ли:спасти,отвести,выпасть,попасть,завести,навести¦2гли:лечь¦3гли:зажечь¦1очли:счесть¦4лись:трястись,попасться¦1ожгли:сжечь¦1ёрли:тереть¦3ёрли:потереть¦1гли:жечь¦1ли:есть¦5ли:подвести¦3лись:клясться"
      }
    },
    "imperative": {
      "second": {
        "fwd": "2:нить,дить,пить,тить,зить,щить¦3:елить,ешить,ивить,ажить,очить,ишить,умить,емить¦:ть/научить¦ри:ереть¦и:уть¦ойся:ыться¦ись:оться¦жись:заться¦зовись:озваться¦ели:олоть¦омни:мять¦1и:дти,теть,зти,роть¦1й:оять,оить,аять,еить,еять¦1ди:асть¦1ой:рыть,выть¦1нься:аваться¦1йся:еяться,ояться,оиться¦1зжай:ехать¦1шись:исаться¦1бери:зобрать¦1ши:есать¦1нись:ясться¦1дись:асться¦2и:треть,ореть,еметь,онать¦2ь:ачить¦2сь:диться,ниться,житься¦2ись:астись,януться¦2ери:збрать¦2ти:очесть,рести,лести¦2й:дуть¦3й:зжать,алеть¦3сь:ериться,ишиться",
        "both": "3:гчить,ымить,щрить,злить,дрить,улить,рбить,слить,зрить,ршить,лжить,брить,ьшить,явить,ужить,нчить,рмить,ючить,осить,юбить¦4:тушить,ручить,душить,далить,нушить,молить,кусить,сушить,гасить,учшить,валить,новить,давить,солить,варить,курить,ласить,торить,ложить,лучить,ворить¦5:окорить,орожить,риучить,требить,расти,ествить,родлить,зличить,олечить,одарить¦5й:таскать,зревать,лкивать,ыпивать,трясать,тревать,оручать,акивать,скивать,грожать,счезать,орожать,овожать,множать,растать,олевать,олучать¦5ь:таможить¦5сь:окупиться,гласиться,еньшиться¦5ься:ротивиться¦5йся:скачаться,ороваться¦5нь:рестать¦4нь:дстать,тстать,остать¦4сь:вориться,селиться,рузиться,велиться,делиться,разиться,ториться,молиться,ветиться,дивиться,новиться¦4ь:алечить,словить,бросить,скорить,инудить,оранить,ависеть,еличить,тратить,третить,тветить¦4й:иучать,целеть,мевать,хивать,висать,худеть,лезать,аивать,тареть,режать,щивать,лотать,долеть,ничать,нижать,бучать,тожать,ускать,вивать,ладеть,шеветь,потеть,гивать,нивать,певать,живать,бивать,зучать,ерзать,ливать,олкать,личать,кучать,девать,росать,ривать,чивать,ракать,шивать,ботать¦4ься:аружиться,третиться¦4йся:астаться,четаться,бижаться,лижаться¦4нься:остаться,аздеться¦4и:опадать,дождать¦3йся:учаться,ужаться,ываться,знаться,осаться,ажаться,ираться,ючаться,ытаться,асаться,итаться,ататься,лжаться,араться,ичаться,упаться,иваться,ечаться,еваться,нчаться,инаться¦3й:рпать,сметь,зреть,гчать,ькать,яжать,аветь,ужать,усать,опать,утать,лтать,ркать,екать,икать,слеть,орать,юхать,нчать,асать,спеть,ытать,атать,ыкать,знать,ажать,ылать,етать,чтать,лжать,ючать,ыхать,ирать,упать,ачать,ывать,ечать,грать,итать,инать,авать,елать¦3сь:озиться,ылиться,ириться,ршиться,ититься,утиться,оситься,емиться,явиться,алиться,ямиться,дшиться,юбиться,ешиться,длиться,атиться,млиться,ститься,опиться¦3ь:конить,вожить,речить,собить,жалить,тешить,рабить,ширить,бидеть,ничить,тожить,порить,печить,волить,лабить,журить,силить,расить,ронуть,рушить,метить,ножить,жарить,ладить,лышать,видеть,товить¦3ься:целиться,метиться,раситься,точиться,сориться,выситься,товиться¦3ей:робить¦3ись:нестись¦3жи:ырезать¦3и:орчать,сосать,рапеть,гудеть,нести,лежать,тучать,дышать,вучать,ричать¦3нь:трять¦3ви:ыжить,ежить¦3чи:охотать¦3дай:опасть¦3жь:зрезать,орезать¦2ей:дбить,ыбить,ышить,звить,ибить,збить,ыпить¦2ли:ипать¦2и:ызть,рвать,жрать,лгать,ясти,врать,ржать,ипеть,рпеть,ядеть,спать,лчать¦2йся:неться,хаться,латься,ряться,даться,каться,няться,шаться,гаться,ляться,маться,щаться¦2юй:оревать¦2ись:рваться,треться,мчаться,ядеться,кнуться,ястись,гнуться,рнуться,ржаться¦2ься:ушиться,уриться,ыпаться,отиться,илиться,идеться,инуться,омиться,ичиться,изиться,авиться¦2ь:унуть,юнуть,изить,езть,омить,ысить,есить,ынуть,инуть,ерить,ыпать,авить¦2ери:ебрать,абрать,ыбрать¦2чи:какать,мотать¦2ови:извать,ызвать,азвать¦2мись:риняться¦2шься:аесться¦2ти:мести¦2ейся:злиться,апиться,обиться,звиться,збиться,бриться¦2жь:мазать¦2й:неть,цать,иять,бать,щать,лять,дать,рять,нять,гать,шать,мать¦2ки:сечь,лечь,течь¦2сь:щиться,читься¦2ги:речь,ажечь,бежать¦2ими:бнять¦2ми:ринять¦2дись:вестись¦2шь:ъесть,оесть¦2чь:лакать¦2ди:вести¦2ши:писать¦1зови:тозвать¦1уй:шевать,жевать,чевать,цевать¦1ши:ахать¦1ядь:сесть¦1ядься:сесться¦1гись:ячься¦1щи:ыскать,искать¦1бери:тобрать,добрать¦1лись:баться¦1чи:птать¦1чься:ятаться¦1берись:зобраться¦1дись:йтись¦1жи:язать,азать¦1ги:ичь,очь¦1они:гнать¦1ерись:браться,драться¦1кись:ечься¦1чь:ятать¦1ди:юсти,йти¦1юй:оевать¦1ой:мыть¦1удь:быть¦озьмись:зяться¦ёрзни:ерзнуть¦ёркивай:еркивать¦уйся:оваться¦шли:слать¦озьми:зять¦уй:овать",
        "rev": "4:асти¦нять:йми¦няться:ймись¦есть:ядь¦чь:ки¦ечь:яг¦жечь:ожги¦переться:бопрись¦евать:юй¦ергать:ёргай¦1еть:пой¦1ять:ними¦1ереть:мри,при¦1ться:енься,айся¦1ыться:мойся¦1ить:бей,ть,рь,шей¦1ть:ыви,ень¦1заться:ажись,яжись¦1ать:жми¦1являться:о¦1иться:сься,лься,лейся¦1озваться:тзовись¦1аться:жмись¦1зать:ажь¦1олоть:мели¦1яться:нимись¦1мять:зомни¦2ть:най,мей,тань,ои,жай,живи,рей,тей,би,чай,дей,кай¦2еть:иди¦2аться:ачнись,ждись¦2ыть:крой,звой¦2уть:хни,кни,яни,рни,гни,бни,тни,пни¦2ить:ось,кой,аль,ужь,ушь¦2ать:ыши,ажни,жди¦2ыться:кройся,оройся¦2хать:оезжай¦2ти:ези,лзи¦2яться:дейся¦2вать:озови¦2рать:обери¦2иться:койся¦2саться:пишись¦2зать:режь¦2обрать:азбери¦2ереть:ытри¦2сать:чеши¦2сться:лянись,падись¦2ять:сей¦3ть:оди,упи,ати,лни,ини,ури,ути,ози,бщи,ази,ани,ави,зди,уши,епи,яти,ити,ени,рди,ьзи,ащи,опи,узи,ари,дни,или,али¦3ить:начь,трой,клей,свой,двой¦3ться:одись,ожись,удись,инись,мнись,рдись,анись,енись,снись,твись,олись,лнись,ужись¦3еть:хоти,лети,реми¦3уть:асни,мани,ызни,исни¦3есть:рочти¦3ти:паси¦3сть:ыпади,впади,апади,кради¦3тись:пасись¦3уться:тянись¦3иться:тройся¦3сти:брети,плети¦3оть:пори¦4еть:мотри,лести,агори,висти¦4ть:вони,ясни,ыучи,аучи,дели,реши,личи,зучи,пеши,ости,авни,диви,лоти,чери,леди,усти,ражи,бучи,суди,рели,жалей,очни,реди,кочи,рони,истай,мсти,ряди,лони,буди¦4яться:асмейся¦4ться:олжись,лонись,ладись,терись,садись¦4есть:дпочти¦4уть:чезни¦4ать:стони¦5ть:прети,помни,свети,обеди,гради,студи,осади,осети,мести,ороти,вести,разни,черти,рести,ушеви¦5уть:ользни¦5ить:достой",
        "ex": "2:появляться¦3:злить,учить/научить¦4:дарить,курить,лечить,варить,солить,давить,гасить,сушить,ловить,рубить,душить,тушить,царить,пилить,валить,делить,будить,решить,мочить,судить,мстить,лишить¦5:выучить,расти,строить,научить,изучить,обучить,уловить,помнить,светить,убедить,казнить,чертить,изумить¦6:отличить,вынудить¦7:удочерить,прищемить¦9:воодушевить¦-:переехать¦1удь:быть¦3й:знать,иметь,уметь,греть,сметь,стоять,клеить¦2ви:жить¦2йми:понять,занять,нанять¦2ши:писать,чесать¦3и:сидеть,лежать,висеть,дышать,шуметь,гудеть,сосать,реветь,велеть,лететь,гореть,бороть,тонуть,пороть¦2й:дать,дуть,лаять,таять,сеять¦3ни:начать,пожать,зажать¦2и:ждать,спать,орать,врать,рвать,лгать,жрать,срать,идти,пнуть¦2ймись:заняться¦1ери:брать¦1ей:пить,бить,лить,шить¦1ядь:сесть¦3овись:назваться¦2ги:бежать¦1шь:есть¦3нись:начаться¦1ой:петь,выть,рыть,ныть¦2ой:спеть¦2ими:снять¦4й:болеть,суметь,кивать,потеть,худеть,жалеть,подуть¦3нься:одеться¦2ейся:бриться,слиться¦3нь:стать,одеть¦2ди:вести,пасть¦1щи:искать¦3ей:побить,налить,залить,забить,полить,набить¦4нь:встать,надеть,устать,задеть¦4ь:бросить,тратить,ударить¦2ки:течь¦3ви:плыть¦5и:заболеть¦2жь:резать,мазать¦2ери:убрать¦1отри:стереть¦3ь:жарить,ранить,жалить,рушить¦3сь:явиться,длиться,сниться¦3йся:иметься,смеяться¦1ови:звать¦3ови:позвать¦4и:спасти,дрожать,жаждать,кивнуть,вертеть,сгореть,качнуть,утонуть,стонать¦3ери:собрать,избрать¦2ей:убить,сшить,сбить,слить¦1яг:лечь¦5ви:прожить¦1ерись:драться,браться¦3ми:нажать¦1уй:жевать¦5нь:настать,застать¦2ти:учесть¦9сь:осуществиться¦4сь:делиться,молиться,садиться,лишиться¦4ься:броситься,уволиться¦4жь:отрезать¦1очти:счесть¦2ись:рваться,мчаться¦4ись:дождаться¦5й:обожать,обижать,вручать,листать,таскать,растаять,постоять¦1ожни:сжать¦5йся:снижаться¦4ми:прижать¦3ти:цвести¦1ейся:литься,биться¦5ей:перебить¦1ожги:сжечь¦4мись:прижаться¦1онись:гнаться¦1бопрись:опереться¦7ь:обнаружить¦2имись:сняться¦2юй:плевать¦3ись:очнуться,бороться,тянуться¦2рись:упереться¦1ги:жечь¦1ёргай:дергать¦2нься:деться¦3ься:целиться¦4ви:дожить¦1ни:мять¦2йся:даться,бояться¦1они:гнать¦2чись:метаться¦2зжай:уехать¦3ди:класть,упасть,впасть,красть¦4нься:оставаться¦2шись:писаться¦5сь:убедиться¦1ри:тереть,переть¦3ри:потереть¦1ели:молоть¦1ойся:рыться"
      },
      "secondPlural": {
        "fwd": "е:ь/научить¦рите:ереть¦ите:уть¦ойтесь:ыться¦итесь:оться¦житесь:заться¦зовитесь:озваться¦елите:олоть¦омните:мять¦1ите:дти,теть,зти,роть¦1йте:оять,оить,аять,еить,еять¦1дите:асть¦1ойте:рыть,выть¦1ньтесь:аваться¦1йтесь:еяться,ояться,оиться¦1зжайте:ехать¦1шитесь:исаться¦1берите:зобрать¦1шите:есать¦1нитесь:ясться¦1дитесь:асться¦2ите:треть,ореть,еметь,онать¦2ьте:ачить¦2тите:очесть,рести,лести¦2итесь:астись,януться¦2ерите:збрать¦2йте:дуть¦3е:дить,нить,тить,щить¦3есь:диться,ниться,житься¦3йте:зжать,алеть¦4е:елить,ешить,ивить,очить,ажить,ишить,евить,емить¦4есь:ечиться,ериться,ишиться",
        "both": "5есь:вориться,селиться,велиться,купиться,мочиться,делиться,ершиться,хититься,ториться,молиться,любиться,ветиться,ласиться,дивиться,емлиться,новиться¦5йте:зревать,лкивать,тревать,акивать,скивать,грожать,счезать,ешеветь,орожать,растать,олевать,олучать¦5е:иучить,озлить,тушить,ручить,душить,далить,орбить,молить,ершить,кусить,сушить,гасить,валить,новить,давить,зучить,солить,варить,курить,ыучить,ласить,торить,ложить,ворить¦5ьтесь:наружиться¦5ьте:наружить¦5те:расти¦5йтесь:ороваться¦4ньте:дстать,тстать,естать¦4есь:озиться,ириться,узиться,ылиться,ючиться,алиться,утиться,оситься,азиться,твиться,емиться,явиться,ямиться,ешиться,длиться,атиться,ьшиться,ститься,опиться,нчиться,учиться¦4йте:аскать,иучать,пивать,мевать,рясать,певать,висать,худеть,лезать,истать,аивать,ручать,режать,щивать,лотать,хивать,бижать,долеть,ничать,нижать,бучать,тожать,ускать,вивать,ладеть,нивать,живать,потеть,шивать,гивать,вожать,ливать,бивать,зучать,ножать,ерзать,личать,кучать,девать,росать,ривать,чивать,ракать,ботать¦4ьте:алечить,словить,бросить,скорить,инудить,оранить,еличить,тратить,третить,тветить¦4е:ымить,гчить,щрить,дрить,узить,опить,епить,убить,ьзить,слить,зрить,брить,длить,чшить,нчить,явить,азить,ьшить,озить,ужить,рмить,лжить,ючить,упить,осить,юбить¦4йтесь:астаться,четаться,нижаться,бижаться,олжаться,лижаться¦4ньтесь:остаться¦4ите:опадать,дождать¦4ьтесь:третиться¦3йтесь:учаться,ужаться,знаться,осаться,ажаться,ираться,ючаться,ытаться,асаться,итаться,ататься,араться,ичаться,ываться,упаться,иваться,ечаться,еваться,нчаться,инаться¦3йте:рпать,сметь,зреть,ыкать,гчать,ькать,яжать,аветь,ужать,ареть,усать,опать,утать,лтать,ркать,екать,икать,слеть,орать,юхать,нчать,атать,асать,спеть,ечать,ытать,лкать,знать,ажать,ылать,етать,чтать,упать,лжать,ючать,ыхать,ирать,ачать,грать,ывать,итать,инать,авать,елать¦3ьте:конить,вожить,речить,собить,жалить,рабить,ширить,бидеть,ничить,тожить,порить,печить,волить,лабить,журить,силить,расить,ронуть,рушить,метить,висеть,ножить,жарить,ладить,лышать,видеть,товить¦3ьтесь:целиться,метиться,раситься,волиться,точиться,тивиться,сориться,выситься,товиться¦3ейте:робить¦3ите:орчать,сосать,гудеть,лежать,болеть,тучать,дышать,вучать,ричать,нести¦3ньте:трять¦3вите:ыжить,ежить¦3митесь:рижаться¦3мите:рижать¦3есь:щиться¦3итесь:нестись¦3дайте:опасть¦3ньтесь:здеться¦2ейте:дбить,ыбить,ышить,звить,ибить,збить,ыпить¦2лите:ипать¦2ите:ызть,рвать,апеть,жрать,лгать,ясти,врать,ржать,ипеть,рпеть,ядеть,спать,лчать¦2йтесь:неться,хаться,латься,ряться,даться,каться,няться,шаться,гаться,ляться,маться,щаться¦2юйте:оревать¦2итесь:рваться,треться,мчаться,ядеться,кнуться,ястись,гнуться,рнуться,ржаться¦2ьтесь:ушиться,уриться,ыпаться,отиться,илиться,идеться,инуться,омиться,ичиться,изиться,авиться¦2ьте:унуть,юнуть,изить,езть,омить,ысить,есить,ынуть,инуть,ерить,ыпать,авить¦2ерите:ебрать,абрать,ыбрать¦2чите:какать,хотать,мотать¦2овите:извать,ызвать,азвать¦2митесь:риняться¦2шьтесь:аесться¦2тите:мести¦2ейтесь:злиться,апиться,обиться,звиться,збиться,бриться¦2жьте:мазать,резать¦2йте:неть,цать,иять,бать,щать,лять,дать,рять,нять,гать,шать,мать¦2ките:сечь,лечь,течь¦2гите:речь,ажечь,бежать¦2имите:бнять¦2мите:ринять¦2дитесь:вестись¦2вите:лыть¦2шьте:ъесть,оесть¦2чьте:лакать¦2дите:вести¦2шите:писать¦1зовите:тозвать¦1уйте:шевать,жевать,чевать,цевать¦1шите:ахать¦1ядьте:сесть¦1ядьтесь:сесться¦1гитесь:ячься¦1щите:ыскать,искать¦1берите:тобрать,добрать¦1литесь:баться¦1чите:птать¦1чьтесь:ятаться¦1беритесь:зобраться¦1дитесь:йтись¦1жите:язать,азать¦1гите:ичь,очь¦1оните:гнать¦1еритесь:браться,драться¦1китесь:ечься¦1чьте:ятать¦1дите:юсти,йти¦1юйте:оевать¦1ойте:мыть¦1удьте:быть¦озьмитесь:зяться¦ёрзните:ерзнуть¦ёркивайте:еркивать¦уйтесь:оваться¦шлите:слать¦озьмите:зять¦уйте:овать",
        "rev": "4:астите¦нять:ймите¦няться:ймитесь¦есть:ядьте¦чь:ките¦ечь:ягте¦жечь:ожгите¦переться:бопритесь¦евать:юйте¦ергать:ёргайте¦1еть:пойте¦1ять:нимите¦1ереть:мрите,прите¦1ться:еньтесь,айтесь¦1ыться:мойтесь¦1ить:бейте,тьте,рьте,шейте,льте¦1ть:еньте¦1заться:ажитесь,яжитесь¦1ать:жмите¦1являться:о¦1иться:сьтесь,льтесь,лейтесь¦1озваться:тзовитесь¦1зать:ажьте¦1олоть:мелите¦1яться:нимитесь¦1мять:зомните¦2ть:найте,мейте,таньте,жайте,живите,рейте,тейте,дейте¦2еть:идите¦2ать:ежите,ышите,ажните,ждите¦2аться:ачнитесь,ждитесь¦2ыть:кройте,звойте¦2уть:хните,кните,яните,рните,гните,бните,тните,пните¦2ить:осьте,койте,ушьте,ожьте¦2ыться:кройтесь,оройтесь¦2хать:оезжайте¦2ти:езите,лзите¦2яться:дейтесь¦2вать:озовите¦2рать:оберите¦2иться:койтесь¦2саться:пишитесь¦2обрать:азберите¦2ереть:ытрите¦2сать:чешите¦2сться:лянитесь,падитесь¦2ять:сейте¦3ить:начьте,клейте,свойте,тешьте,тройте,двойте¦3еть:хотите,летите,ремите,горите,истите¦3уть:асните,ивните,езните,ьзните,ызните,исните¦3ь:оите,бите¦3есть:рочтите,почтите¦3яться:смейтесь¦3ти:пасите¦3сть:ыпадите,впадите,ападите,крадите¦3тись:паситесь¦3сти:бретите,плетите¦3уться:тянитесь¦3иться:тройтесь¦3оть:порите¦3ть:елейте¦4еть:мотрите¦4ь:одите,атите,арите,ините,урите,ечите,бщите,аните,авите,лните,здите,ените,ушите,ятите,итите,твите,рдите,утите,ащите,улите,дните,илите,алите¦4ься:одитесь,ожитесь,удитесь,инитесь,лжитесь,мнитесь,енитесь,рдитесь,анитесь,снитесь,дшитесь,олитесь,лнитесь,очитесь,ужитесь¦4уть:бманите¦4ть:жалейте¦4ать:стоните¦5ь:лучите,воните,ясните,аучите,делите,решите,личите,судите,остите,авните,дивите,лотите,черите,ледите,садите,устите,ражите,бучите,релите,азните,естите,очните,редите,нудите,роните,мстите,рядите,кочите,лоните,будите¦5ься:лонитесь,ладитесь,лечитесь,теритесь,садитесь",
        "ex": "2:появляться¦-:переехать¦1удьте:быть¦3йте:знать,иметь,уметь,греть,сметь,стоять,клеить¦2вите:жить¦2ймите:понять,занять,нанять¦2шите:писать,чесать¦3ите:сидеть,лежать,висеть,дышать,шуметь,гудеть,сосать,реветь,велеть,лететь,гореть,бороть,тонуть,пороть¦2йте:дать,дуть,лаять,таять,сеять¦3ните:начать,пожать,зажать¦2ите:ждать,спать,орать,врать,рвать,лгать,жрать,срать,идти,пнуть¦2ймитесь:заняться¦7е:получить,подарить,полечить,отличить,дорожить,покорить,победить,остудить,посетить,осветить¦1ерите:брать¦1ейте:пить,бить,лить,шить¦4есь:учиться,явиться,длиться,сниться¦1ядьте:сесть¦3овитесь:назваться¦2гите:бежать¦1шьте:есть¦3нитесь:начаться¦1ойте:петь,выть,рыть,ныть¦2ойте:спеть¦2имите:снять¦4йте:болеть,суметь,кивать,потеть,худеть,жалеть,подуть¦5е:дарить,курить,лечить,варить,солить,давить,гасить,сушить,ловить,душить,рулить,тушить,царить,пилить,валить,делить,будить,решить,мочить,судить,мстить,лишить¦3ньтесь:одеться¦2ейтесь:бриться,слиться¦3ньте:стать,одеть¦2дите:вести,пасть¦1щите:искать¦5те:расти¦3ейте:побить,налить,залить,забить,полить,набить¦6е:строить,научить,обучить,внушить,уловить,изумить,помнить,спешить,светить,убедить,чертить¦4ньте:встать,надеть,устать,задеть¦4ьте:бросить,тратить,ударить,утешить¦10е:благодарить,осуществить,воодушевить¦2ките:течь¦2жьте:резать,мазать¦2ерите:убрать¦12е:поблагодарить,злоупотребить¦8е:различить,удочерить,потребить,запретить,запомнить,напомнить,вспомнить,засветить,наградить,своротить,начертить,укоротить,прищемить¦1отрите:стереть¦3ьте:жарить,ранить,жалить,рушить¦3йтесь:иметься,смеяться¦1овите:звать¦3овите:позвать¦4ите:спасти,дрожать,жаждать,вертеть,качнуть,утонуть,стонать¦3ерите:собрать,избрать¦2ейте:убить,сшить,сбить,слить¦1ягте:лечь¦5вите:прожить¦5ньте:достать,настать,застать¦9е:употребить,припомнить¦1еритесь:драться,браться¦3мите:нажать¦1уйте:жевать¦7есь:ухудшиться¦2тите:учесть¦5есь:делиться,молиться,мочиться,садиться,лечиться,лишиться¦4ьтесь:броситься¦1очтите:счесть¦2итесь:рваться,мчаться¦4итесь:дождаться¦5йте:обожать,уцелеть,растаять,постоять¦1ожните:сжать¦3тите:цвести¦1ейтесь:литься,биться¦5ейте:перебить¦1ожгите:сжечь¦7йтесь:раскачаться¦1онитесь:гнаться¦4е:злить,учить/научить¦1бопритесь:опереться¦2имитесь:сняться¦2юйте:плевать¦3итесь:очнуться,бороться,тянуться¦2ритесь:упереться¦1гите:жечь¦1ёргайте:дергать¦2ньтесь:деться¦3ьтесь:целиться¦4вите:дожить¦1ните:мять¦8ьте:растаможить¦2йтесь:даться,бояться¦1оните:гнать¦2читесь:метаться¦2зжайте:уехать¦3дите:класть,упасть,впасть,красть¦4ньтесь:оставаться¦5ите:блестеть¦2шитесь:писаться¦6есь:убедиться¦1рите:тереть,переть¦3рите:потереть¦1елите:молоть¦1ойтесь:рыться¦6йте:удостоить"
      }
    },
    "gerund": {
      "gerund": {
        "fwd": "2:оять,аять,еять¦а:ить/научить¦я:таваться¦ясь:оться¦еля:олоть¦1я:дти,дить,вить,сеть,мить,зить,роть,петь,оить,еить¦1дя:ийти¦1ясь:диться¦1а:шить¦2а:ачить,очить¦2дя:ласть¦2я:ерить,ететь,стить,етить,стеть,езти,ртеть¦2ясь:меться,ериться¦3а:рожить",
        "both": "3:рчать,ржать¦4:лежать,вучать,ричать¦5в:оходить,оносить,лновать,ыносить,осадить,оменять,портить,глядеть,стучать,плакать,молчать,аболеть,дождать,слышать,ставить,звинить,платить,звонить¦5вшись:свататься,равняться,аружиться,кончаться,сноваться,ередаться,слышаться,краситься,твориться,ссориться,строиться,крутиться,слушаться,прятаться,траниться,оменяться,портиться,светиться,надеяться,стараться¦5я:зревать,акивать,умевать,тревать,скивать,ешеветь,риносить¦5ясь:очетаться,ъясняться,овышаться,зменяться,именяться,ближаться¦4вшись:годиться,ватиться,целиться,рузиться,питаться,метиться,чиниться,ложиться,волиться,читаться,мириться,бедиться,катиться,видеться,ториться,разиться,оздаться,пытаться,казаться,теряться,ердиться,ругаться,ласиться,уститься,мениться,дивиться,олжиться,купаться,смеяться,азваться¦4в:ведать,можить,целеть,годить,качать,ватить,релить,гореть,влиять,радать,пугать,ездить,весить,будить,любить,ломать,терять,думать,хотеть,писать,делать¦4ясь:миряться,сыпаться,нижаться,росаться,бижаться¦4я:иучать,пивать,висать,ручать,лотать,хивать,двидеть,бучать,аивать,вивать,нивать,гивать,бивать,ривать,девать,певать,живать,зучать,ватать,ерзать,ливать,кучать,авидеть,росать,чивать,зносить,шивать,лучать¦4ши:ползти¦3я:нчать,гчать,ясать,аветь,росить,ареть,усать,снеть,утать,лтать,стать,езать,адеть,слеть,асать,ичать,ратить,ылать,етать,чтать,ючать,ыхать,ывать,ачать,ечать,итать,авать¦3в:инуть,кнуть,хнуть,онуть,нчить,ймать,спать,ехать,упить,азать¦3ясь:оститься,ишаться,ужаться,ечаться,ьняться,тивиться,иняться,хотиться,ршаться,идаться,оряться,аняться,ажаться,юдаться,ючаться,ираться,дшаться,оняться,асаться,ешаться,лняться,ждаться,ашаться,лжаться,ичаться,ываться,ьшаться,иваться,учаться,еваться,инаться¦3вшись:рваться,язаться,мчаться,клясться,ддаться,явиться,упиться,злиться,исаться,ачаться,знаться,одаться,твиться,звиться,ямиться,ыситься,браться,сниться,илиться,драться,тояться,изиться,бриться,здеться,авиться¦3а:вожить,речить¦3уясь:зироваться¦3ча:охотать¦3ши:лезть¦3дав:опасть¦3кши:ытечь¦2я:ызть,илить,улить,опить,абить,убить,ясти,слить,цать,брить,бать,ятить,асить,еметь,алить,олить,щать,утить,урить,кать,арить,пать,жать,дать,гать,шать,рать,мать,нать¦2уясь:иноваться,изоваться,ндоваться,вноваться¦2ясь:озиться,неться,хаться,уриться,ылиться,маться,ястись,емиться,каться,гаться,ляться,щаться¦2вшись:зяться,щиться,биться,шиться,читься¦2юя:оревать¦2ёкши:отечь,стечь¦2дя:расть,вести¦2ча:мотать¦2гши:ричь¦2шись:астись¦2а:ужить¦2вя:лыть¦2в:ъесть,зять,оесть¦1уя:шевать,чевать,цевать¦1ёсши:нести¦1ёгши:речь,жечь¦1ши:пнуть¦1жа:язать¦1ёкши:сечь,лечь¦1ча:птать,ятать¦1уясь:воваться,коваться¦1дясь:йтись¦1юя:оевать¦1вшись:уться,ыться¦1тя:честь¦1я:ять,нить¦1гши:очь¦1дя:йти¦ёкшись:ечься¦ёркивая:еркивать¦осши:асти¦уя:овать",
        "rev": "ыть:удучи¦ежать:ёжа¦скать:ща¦оваться:уясь¦ечь:ёгши¦наться:онясь¦евать:юя¦ергать:ёргая¦1ть:ея,ивя,ив,яв¦1ить:бя¦1иться:вясь,мясь,лясь,тясь¦1ться:аясь,авшись,ившись,евшись,яясь,евавшись¦1заться:ажась¦1являться:о¦1таться:ячась¦1аться:блясь¦1сться:янясь¦2еть:отя,ися,ядя,умя,ипя,евя¦2ть:лая,тая,дев,вав,мев,хая,тав,нев¦2ить:одя,авя,атя,рмя,озя,еся,еша,омя,уша,ьзя,узя,ымя,еча,рдя¦2иться:одясь,адясь,опясь,удясь,коясь,анясь,ирясь,очась,асясь,роясь,осясь,ушась¦2кать:лача¦2ться:нявшись¦2ти:лзя¦2еться:трясь¦3ить:воря,нача,товя,нося,окоя,ортя,ледя,редя¦3еть:отря,ерпя,рапя¦3ть:тоя,трев,ыша,лча,уча,алев,евая,огав¦3ться:деясь,ржась,ышась¦3иться:сорясь,ворясь,ружась,терясь¦4еть:лестя¦4ть:щивая¦4ить:рестя,орожа¦5ть:лкивая",
        "ex": "2:появляться¦3:лаять,таять,сеять¦4:дышать¦5:слышать,молчать,стучать,дрожать¦-:родить¦ся:прийтись¦1удучи:быть¦5я:говорить,смотреть,свистеть¦3я:хотеть,иметь,видеть,любить,сидеть,уметь,носить,гореть,делить,весить,шуметь,греть,лезть,гудеть,сосать,катить,реветь,велеть,сметь,верить,лететь,ездить,будить,бороть,клеить,судить,ловить,мстить,пороть,везти¦4я:делать,болеть,желать,платить,уносить,глядеть,жалеть,вносить,кивать,портить,нюхать,потеть,спорить,ползти,катать,худеть,чертить,творить,пытать,чистить,гладить,светить,увезти,вертеть¦6я:работать,печатать,сожалеть¦2вя:жить¦1ёжа:лежать¦1еря:брать¦4ясь:нравиться,купаться,храниться,светиться,кататься,теряться,читаться,портиться,пытаться,делаться,крутиться,ссориться,краситься,строиться,питаться,твориться,гордиться¦2ась:учиться¦2в:сесть¦7в:прочитать,сработать¦1оя:мыть,выть,рыть,ныть¦5ясь:кончаться,торопиться,стараться,готовиться,заботиться,относиться,слушаться,говориться,смотреться,шевелиться,равняться,свататься¦3вшись:одеться,удаться,сдаться,сняться,слиться¦7ясь:здороваться,беспокоиться¦9вшись:поздороваться,познакомиться,приготовиться,взволноваться,потребоваться,обеспокоиться¦2еясь:бриться¦5в:увидеть,научить¦6ясь:становиться,знакомиться,стесняться,хвастаться¦8в:посмотреть,нарисовать,поцеловать,поговорить,напечатать,растрогать,искалечить,пожаловать¦2дя:вести¦1ща:искать¦7вшись:встретиться,успокоиться,подвигаться,задержаться,всмотреться¦3в:упасть¦4сь:смеяться¦3ча:плакать,скакать¦8вшись:остановиться,поторопиться,пожаловаться,установиться,залюбоваться,договориться,поцеловаться,позаботиться,обрадоваться,постесняться,ознакомиться,поколебаться,похвастаться,воздержаться,образоваться,пошевелиться¦3ясь:жениться,делиться,молиться,видеться,катиться,мириться,носиться,целиться,иметься,бороться¦3ась:ложиться,лечиться,мочиться,рушиться¦3а:лечить,мочить¦8я:заболевать,выращивать,беременеть¦11в:поблагодарить,запланировать,зафиксировать¦14вшись:зарегистрироваться¦3сь:бояться,мчаться¦5сь:надеяться,держаться,слышаться¦5уясь:пользоваться,советоваться¦1овя:звать¦4уясь:требоваться,волноваться¦4в:суметь¦1ёгши:лечь¦3уясь:радоваться,жаловаться,любоваться,целоваться¦7уясь:интересоваться,использоваться¦12в:заинтересовать¦2ясь:длиться,сниться¦1ерясь:драться,браться¦5вшись:обидеться,броситься,дождаться,прижаться,сделаться¦9в:проработать,проговорить¦1уя:жевать¦12вшись:заинтересоваться¦10в:застраховать,опубликовать,изнасиловать,забеременеть,сформировать¦10вшись:посоветоваться,сформироваться¦10уясь:консультироваться¦16вшись:проконсультироваться¦2жась:казаться¦11вшись:воспользоваться¦7сь:содержаться¦2я:орать,дуть,идти,оставаться¦6уясь:формироваться¦3чась:прятаться¦6в:пожалеть,постоять¦5лясь:колебаться¦14в:проанализировать¦10я:преодолевать¦3тя:цвести¦6вшись:обменяться,удержаться,износиться,доноситься¦1онясь:гнаться¦8уясь:ориентироваться¦3нясь:клясться¦2юя:плевать¦4ась:кружиться¦1ёргая:дергать¦2вавшись:деться¦9я:отталкивать¦5а:калечить¦2вшись:даться¦1оня:гнать¦2чась:метаться¦1оясь:рыться¦3дя:прийти,класть¦2а:учить/научить¦1еля:молоть"
      }
    },
    "participle": {
      "activePresent": {
        "fwd": "ящий:ить¦ащий:ить/научить¦ющийся:оться¦ущийся:тись¦рущий:ереть¦1ящий:теть,сеть,петь¦1ущий:дти,зть,зти¦1ющий:авать,аять,еять¦1ащийся:читься,житься,шиться¦1ющийся:еяться,аваться¦1ащий:жить,шить¦1щийся:уться¦1ящийся:деться,реться¦1нущийся:ясться¦2ющий:нать,дать¦2щийся:ояться¦2ющийся:меться¦2ущий:онать¦2ящий:елеть¦3ющий:стать",
        "both": "5ющий:зревать,акивать,тревать,ащивать,скивать,звивать,ешеветь,мерзать,олевать¦5ющийся:должаться,ороваться¦4ющий:пивать,мевать,висать,лотать,хивать,живать,нивать,гивать,ривать,аивать,певать,бивать,ливать,девать,росать,чивать,лавать,шивать,ботать¦4ющийся:четаться,ражаться¦4щий:лежать,тучать,вучать,ричать,лышать¦3ющий:ытать,ясать,аветь,ареть,усать,алеть,утать,лтать,адеть,слеть,орать,езать,асать,атать,етать,чтать,ирать,ывать,грать,итать¦3ющийся:ужаться,статься,осаться,ираться,ытаться,асаться,итаться,ататься,араться,иваться,ижаться,еваться,инаться,ываться¦3щий:рчать,бнуть,хнуть,януть,лчать,ржать¦3щийся:ржаться¦2кущий:лечь¦2ющийся:неться,хаться,латься,ряться,даться,шаться,каться,няться,паться,гаться,ляться,щаться,чаться,маться¦2юющий:оревать¦2чущий:какать,хотать,мотать,лакать¦2ьющийся:апиться¦2ющий:неть,бать,цать,щать,кать,пать,хать,жать,гать,шать,чать,мать,лать¦2ущий:ясти¦2гущий:речь¦2щий:оять¦2ащий:очить,ечить,ачить¦2ящий:еметь,уметь,идеть,треть¦2вущий:лыть¦1ерущийся:драться,браться¦1ующий:шевать,чевать,цевать¦1дящийся:есться¦1жущий:азать,язать¦1шущий:есать¦1дущий:асть¦1шущийся:исаться¦1лющийся:баться¦1чущий:птать,ятать¦1чущийся:ятаться¦1ьющийся:биться¦1гущий:ичь,очь¦1юющий:оевать¦1ющий:роть,ять¦оющийся:ыться¦елющий:олоть¦жущийся:заться¦ёрзнущий:ерзнуть¦ёркивающий:еркивать¦ующийся:оваться¦ующий:овать¦ящийся:иться",
        "rev": "сать:шущий¦рать:ерущий¦ить:ьющий¦скать:щущий¦чь:кущий¦зать:жущий¦вать:овущий¦раться:ерущийся¦иться:ьющийся¦наться:онящийся¦евать:юющий¦ергать:ёргающий¦таться:чущийся¦1ть:еющий,ивущий¦1ить:нящий,сящий,вящий,лящий,зящий,еящий,бящий¦1иться:реющийся¦1сти:едущий,етущий¦1оться:рющийся¦1аться:вущийся¦1тись:сущийся¦2еть:отящий,исящий,ядящий,ипящий,апящий,евущий¦2ить:одящий,арящий,ерящий,атящий,здящий,рмящий,ужащий,адящий,ешащий,коящий,омящий,урящий,ушащий,ятящий,едящий,утящий,опящий,ымящий¦2иться:ожащийся,ечащийся,очащийся,ужащийся,ушащийся¦2яться:деющийся¦2еться:идящийся,трящийся¦2ти:лзущий¦2ать:осущий,ждущий¦2сться:лянущийся¦2ть:ызущий¦3ить:ворящий,ветящий,убрящий,порящий,вожащий¦3ть:инающий,ежащий,адающий,юдающий,ждающий¦3и:астущий¦3вать:тдающий,знающий,здающий¦3еть:ерпящий¦3ать:тонущий¦3ться:ышащийся¦3ваться:здающийся¦4ть:оедающий,жидающий,лодающий,истающий¦4вать:родающий,подающий,остающий,тстающий,редающий,ридающий,дстающий¦4еть:лестящий,вистящий¦4ить:рестящий,вердящий¦5ть:растающий,лкивающий¦5вать:рестающий",
        "ex": "3ющий:иметь,уметь,греть,сметь,знать,сдавать¦2вущий:жить¦2шущий:писать¦2ущий:ждать,орать,врать,рвать,лгать,жрать,срать,идти¦4щий:лежать,дышать,тонуть¦2ящий:спать¦1ерущий:брать¦1дущий:ехать¦1ьющий:пить,бить,лить,шить¦2гущий:бежать¦1дящий:есть¦1оющий:петь,мыть,выть,рыть,ныть¦4ющий:болеть,кивать,потеть,худеть,задавать,вставать,кидать,уставать,выдавать,подавать,рыдать,ведать¦2еющийся:бриться¦2дущий:вести¦1щущий:искать¦4ущий:расти,жаждать¦3ящий:гореть,гудеть,лететь,будить,судить,мстить,велеть¦2кущий:течь¦2жущий:резать¦4ящий:глядеть,чистить,портить,вертеть,чертить¦1овущий:звать¦1ерущийся:драться,браться¦1ующий:жевать¦5щий:дрожать¦2ущийся:рваться¦2ющий:дуть,давать,лаять,таять,сеять¦3тущий:цвести¦1ьющийся:литься,биться¦3ущий:сосать,реветь,лезть,везти¦1онящийся:гнаться¦5щийся:слышаться¦2юющий:плевать¦3щийся:мчаться,бояться¦1гущий:жечь¦1ёргающий:дергать¦9ющий:отталкивать¦1нущий:мять¦1онящий:гнать¦2чущийся:метаться¦2ащийся:учиться¦2ащий:учить/научить¦5ющий:обедать,наставать,заставать¦3ющийся:смеяться,иметься¦4щийся:тянуться¦1рущий:тереть,переть¦5ащий:дорожить"
      },
      "activePast": {
        "fwd": "вший:сть¦вшийся:сться¦1ший:зть¦2вший:чить/научить¦4шийся:ставаться",
        "both": "4ший:ытереть¦3ёдший:азвести,одвести¦3ёкший:ротечь¦3ший:рипнуть,переть,мереть¦3давший:опасть¦3кший:ытечь¦2ётший:плести¦2ший:ясти,лзти¦2тший:мести,рести¦2ёрший:отереть¦2ёкший:есечь¦2шедшийся:бойтись¦2шийся:астись¦2ёдшийся:звестись¦2дший:вести¦1ёгший:речь,жечь¦1гшийся:ячься¦1ёкший:лечь¦1ёсшийся:нестись¦1шедшийся:айтись¦1гший:ичь,очь¦1дший:юсти¦1осший:расти¦1ёсший:нести¦ёршийся:ереться¦ёрзнувший:ерзнуть¦ёкшийся:ечься¦ёркивавший:еркивать¦ёзший:езти¦вшийся:ться¦шедший:йти¦вший:ть",
        "rev": "асти:осший¦ечь:ёкший,ёгший¦йтись:шедшийся¦ести:ётший¦ереть:ёрший¦ергать:ёргавший¦2сть:оевший,ъевший¦2ть:езший,ызший¦2тись:ясшийся¦2сться:севшийся¦2стись:ведшийся¦3ти:пасший,везший¦3сть:впавший,кравший¦3сться:клявшийся,опавшийся¦4сть:рисевший",
        "ex": "шедший:идти¦-:учесть¦2дший:вести¦1осший:расти¦1ёкший:течь¦2ёрший:стереть¦4ший:спасти¦1ёгший:лечь,жечь¦3шедшийся:прийтись¦4вший:попадать,выпасть,напасть¦4шийся:трястись¦2ётший:цвести¦5ший:вывезти¦1ёрший:тереть,переть¦3ёкший:истечь¦3дшийся:свестись¦1ёргавший:дергать¦2шедший:сойтись¦2вший:сесть,пасть¦1вший:есть¦3вший:учить/научить,класть,упасть,впасть,красть¦5шийся:оставаться¦3вшийся:наесться,клясться"
      },
      "passivePast": {
        "fwd": "шенный:сить¦енный:ить/научить¦1щённый:остить,естить¦1ченный:ртить,ртеть¦1женный:ичь,изить¦1щенный:астить¦1вшийся:ясться¦1жённый:узить¦2енный:ожить,ечить,ачить,очить,ащить¦2женный:возить,мозить¦2ённый:ажить¦2ченный:рутить¦2жённый:речь¦3жённый:ередить¦3ённый:рждать",
        "both": "5ый:иснуть,ткнуть,лкнуть,ронуть¦5вший:орожить,оходить,бладать,оросить,охотать,сковать,счезать,рослеть,идовать,очевать,дходить,сходить,иходить¦5нный:лковать,спахать,одовать,адовать,оменять,аковать,кашлять,еловать,бменять¦5лённый:охновить¦5ыйся:риняться¦5ждённый:проводить¦5ченный:роглотить¦5енный:ыключить¦5ённый:бъяснить¦4ый:дбить,ыбить,пнуть,унуть,хнуть,збить,анять,ижать,бнять,звить,ежить,инять,ибить,гнуть,ануть,инуть,януть,ыпить¦4ённый:хвалить,окорить,ояснить,одолеть,кружить,тличить,зличить,зрешить¦4вший:шевать,девать,левать,речить,висать,ревать,лезать,ражать,жалеть,ышлять,уждать,розить,оедать,лодать,журить,падать,певать,летать,астать,товать,вонить,бедать,мирать,вовать,могать¦4нный:ведать,рогать,оптать,качать,ридать,истать,лотать,новать,авдать,бовать,ховать,ботать,редать,зовать,гадать,ровать,тирать,подать,совать,родать,терять,видеть,писать,купать¦4енный:спорить,аружить,скорить,ыяснить,оранить,акурить,ыделить,еличить¦4женный:городить¦4ыйся:апиться¦4лённый:бновить,требить¦4ждённый:ринудить¦4ленныйся:правиться¦4ченный:асветить¦4нныйся:казаться¦3щенный:ыместить¦3вший:елеть,ымить,ькать,рчать,блять,улить,екать,ырять,ареть,онать,бнуть,удеть,ьзить,ркать,икать,отеть,орать,ивать,агать,стеть,рзать,ывать,ыкать,егать,ыгать,чтать,упать,здить,ететь,учать,лчать,ичать,акать,инать,авать,ыхать,улять,зжать,ежать¦3енный:конить,иучить,варить,релить,тешить,ничить,бучить,лужить,волить,жарить,верить,ыучить,лучить¦3нный:утать,рвать,алять,рпать,усать,осать,жрать,опать,лтать,ржать,юхать,ятать,атать,елять,ытать,здать,спать,угать,звать,скать,брать,грать,итать,треть¦3лённый:шевить¦3ённый:лонить,далить,нушить,молить,лечь,черить,ворить,ранить,пасти,нести,делить,дарить,торить¦3ый:мять¦3женный:ыводить,следить,студить,ыразить,тходить¦3ленный:собить,копить,топить,рабить,лабить¦3жённый:аразить,тразить¦3ждённый:вредить,предить¦3жденный:ынудить¦3нныйся:зваться,уматься¦3дённый:зойти,бойти¦3щённый:кратить,вратить¦3ёркнутый:одчеркнуть¦3тый:переть¦3ченный:тратить,третить,тветить¦3денный:ройти¦2лённый:емить,умить,рбить,твить,епить¦2шенныйся:роситься¦2енный:ызть,ирить,слить,зрить,брить,чшить,илить,ушить,ьшить,нчить,лжить,лнить,мнить¦2ённый:бщить,дрить,днить,гчить,щрить,ишить,злить,чнить,знить,ясти,ршить,длить,внить,енить,езти,инить,ючить¦2нный:еять,щать,нать,мать,шать,лать,зать¦2щённый:вятить,мутить,сетить¦2вший:иять,неть,бать,веть,аять,цать,петь,лыть,сеть,меть,оять¦2тённый:мести,рести¦2ёванный:воевать¦2ленный:омить,рмить,упить,юбить¦2ёртый:отереть¦2ченный:ротить,катить,метить,ватить,латить¦2ждённый:бодить,будить,радить,бедить,судить¦2ший:лзти,езть¦2ленныйся:явиться¦2чённый:пятить¦2жённый:ажечь¦2ый:оть,ыть¦2женный:ладить¦2денный:ъесть,айти¦2шённый:ласить¦2дённый:вести,ейти¦1денныйся:есться¦1женный:ядить¦1ётанный:метать¦1денный:асть¦1шийся:стись¦1дённыйся:йтись¦1щенный:устить,истить¦1щённый:итить¦1енный:еить,оить¦1дённый:юсти¦1тённый:честь¦1ованный:цевать¦1ленный:вить¦1гший:очь¦ёрганный:ергать¦ёсанный:есать¦ёптанный:ептать¦ёрзнувший:ерзнуть¦вшийся:ться",
        "rev": "асти:осший¦ечь:ёкший¦ереть:ёртый¦иться:ленныйся¦евать:ёванный¦ести:ётший¦жечь:ожжённый¦1ть:авший,евший,ивший,янный,явший,ывший¦1ься:тыйся¦1сить:ошенный,ышенный,ашенный¦1ить:рённый,влённый,ненный,бленный,пленный¦1сти:едённый¦1тить:ущённый,ащённый¦1ться:анныйся¦1дить:ождённый,рженный¦2ь:ятый,атый,етый,итый¦2дить:хоженный¦2ть:данный,ранный,чанный,жанный¦2тить:раченный,орченный,лощённый¦2ить:елённый,аренный,оленный,ешённый,аленный,учённый¦2стить:рощённый,гощённый,мещённый,ращенный¦2чь:риженный¦2сить:вешенный¦2зить:ниженный¦2деть:биженный¦2сти:веденный¦3ть:иденный,онувший¦3ить:ложенный,аученный,леченный,ноженный,зученный,наченный,печенный,тоженный,тащенный¦3тить:прещённый,свещённый,черченный,крученный¦3зить:рможенный¦3сить:екушенный¦3ти:везенный¦3стить:звещённый,крещённый¦4дить:ровоженный¦4ь:ынутый¦4ть:кованный,вованный,дованный¦4еть:ытертый¦4ить:орученный,евоженный,аможенный¦4стить:повещённый¦4чь:бережённый¦5дить:дтверждённый¦5ть:стованный",
        "ex": "шедший:идти¦-:поедать¦-ся:достаться¦4нный:видеть,писать,задать,терять,отдать,выдать,подать,качать,сажать,ведать¦4вший:думать,сидеть,стоить,ходить,падать,болеть,верить,мешать,гореть,летать,дышать,шутить,махать,рыдать,тонуть,мигать,мстить,вонять,царить,вопить¦6вший:работать,дорожать,изменять,ликовать,угождать¦5ый:понять,начать,побить,надеть,налить,вынуть,нажать,пожать,залить,забить,полить,зажать,вышить,задеть,дожить,набить¦2нный:дать¦3нный:ждать,звать,сдать,орать,рвать¦5ыйся:заняться¦4женный:выходить,находить,твердить¦3вший:спать,ехать,лгать,срать¦3женный:уходить,обидеть,увозить¦3ый:пить,петь,бить,лить,шить,дуть,мять¦5вший:входить,дружить,кашлять,спешить,воевать,светить,следить,владеть,спорить,дрожать,вредить,бродить,править,грешить¦1денный:есть¦4ый:снять,взять,убить,одеть,сшить,греть,сжать,сбить,слить¦3ённый:дарить,делить,решить¦5щённый:запретить,поглотить¦2дённый:вести¦5женный:проводить¦1осший:расти¦3енный:курить,варить,жарить,солить,ранить,жалить,валить,лечить,мочить¦4енный:научить,изучить,хвалить¦3ченный:тратить,вертеть,крутить,чертить¦1ёкший:течь¦2женный:возить,будить¦2ёртый:стереть¦8нный:арендовать,арестовать¦7нный:парковать,разменять¦10нный:припарковать,опубликовать,расследовать,заимствовать¦2ленныйся:явиться¦7вший:следовать¦9вший:планировать,реагировать,маршировать¦6ый:прожить¦12нный:приветствовать¦4лённый:удивить¦1ёванный:жевать¦5енный:починить,хоронить,вывезти,поручить,завалить¦10вший:аплодировать,претендовать,доминировать¦9ый:вычеркнуть¦3щённый:ощутить,крестить¦11нный:рекомендовать¦7ждённый:подтвердить¦9нный:исследовать,публиковать,наследовать,оборудовать¦8вший:беседовать,заведовать¦4щённый:осветить,обратить,навестить¦13вший:функционировать¦11вший:конкурировать,циркулировать,гармонировать,коррелировать,иронизировать,дезертировать¦2ётший:цвести¦3ленный:рубить,топить,копить¦5тый:вытереть¦7ый:перебить¦4ённый:вручить¦1ожжённый:сжечь¦5нныйся:забраться¦2ченный:катить¦16нный:освидетельствовать¦4денный:вывести¦4ждённый:породить¦1жённый:жечь¦2вший:выть,ныть¦14нный:совершенствовать¦2енный:учить/научить¦7ённый:раздражить,утверждать¦4жённый:беречь¦5жённый:опередить¦3вшийся:клясться¦3жённый:грузить"
      }
    },
    "perfective": "true¦0:EW;1:EO;2:E1;3:EM;4:EK;5:DY;6:CY;7:E3;8:DW;9:CM;A:D1;B:EV;C:EI;D:EF;E:EE;F:DS;G:ED;H:CP;I:AJ;аF8брF3вC2дBQзABи9Pк9Mл9Kм9Iн8Lо6Uп2Fр1Jс0Gт0FуJх6OчеAGшаг3я52;б0Cв0Aг08д03еHжаDOз02й4кZлXмVнUпQро6сLтJхуд89цеBNч9E;в5VеEAоJра5;ну0ч6;в8Pес2и7Qко8лыCCом93пMтJ;аKрJуD6;а6ои1;ви2ноA3ть;е0окои1;аLеD8ла5оKрJус5;азд6ос5;мя3тA1;коBс0;ес4ичто7;еJно7оDBы2;нь96ре0;еEAоJучDW;ви0жи0;аBDоро5рJ;асJеCSы0;и0ть;ако6на0;аMв87еLи9OоJ;влетво8стоJче8;ве8и0;ли0рAP;ли1ри0тьDU;аA7оJ;во8ди0с5;еJи7OлечьEEо71;з4лиDSри0с4;еJи0ра0;ди1жа0;о63ро3;б0Kв0GгоA5д0Eес0жACк08л07м04н03оUпRраPтNуMфоKхваDAч8Hши0ъеJыгC1эконо8G;з9с0ха0;ку9HрмJтографиI;и9Oу1T;ме0ну0;аJеA0олк7NуC8;нцеBть;боDвнJ;и0я2;ас81е0иB7ла7IрJусD1;оJя0I;воциIси0;бQвPгNе0QжBPзMй7Yк2Nл7NобLпрово9сJтв55х0Lчи6;редото0VтJ;аCоя2;раCNщи1;да1на0ре0;ласJну0реCX;и2оB;ер84мBCоку2VпC3ра0;люс4ра1;ес4и4Sя1;еKиAFоJу5ягA;ло0н5Iчь;ни1ша0;и1о3Mу0J;аNлMоJры1;льз3мKнJпиI;цен17ча2;би6Yпроме5C;еи0о7F;за1ти0;а1еJох3;ла1рCY;аLеKист3ороJяAM;ва0ти0;рк3с7A;ли1ри0;еCTи0роE;аKеJиск3о9ух3;алиDAши1;зVсJ;кTпPсLтJчеAAши8;аJво8еря2и,ро6S;мо7я0;ерACка9Oла86м5Gор4Wп5AтKчиJ;та1;аCрJ;е0Lои0;аHоLрJус5;е1NостJ;ра8K;з58ло61ро0;ача2ры0;бYвVглUдSлPмNоMрLъеKыJ;гAIс9T;ди6;а05е72уBT;бра1чаI;еJысB4;ня0с5ша0;иKо7уJ;чи2;тьBVчи0;а93еJра7;ли1тьBT;аEяBD;еJи1леFя92;рC4сJ;и0ти6E;и1ро9Iу9;ас0ере3Pлю3ну0о14рJус5;е0Qи09оJ;анализиIб07в05г02д00еHжи0зву9ZиXй4кSлеBRмол9ZнRпQрOсLтKци44чJшепDя7B;ес0иD;еFивопос0Xя3;ия0лKм4Lпа0тJ;и1о4Jу9G;а1Yе9;аJва2;боD;и97ус5;естись,ик3;ашMоJ;ммен3TнJ;сульти7EтроJ;лиI;ля0;г9LзKллюсJнфор7H;триI;вADнADой4;а1виBHеJикBTли1ол4YуB8;кла7Dла0;л2Uна0оKреме0уJ;де0ля2;во8ло5A;аABе8EоJ;ди0зглаE;еB5и0ормоDу9;бYвXгVдUеHжа1зTй4кRлQмPнOоNпMсKт89уJчи6ще5P;краEчи0;в52ес0лJни2оеди5Gпосо6Mту9K;а0у0W;ар62ом6;бр9Zс9Wткры0;ес4у9я1;е71к3;еATо7;а7XрJ;е9Cы0;ва0ем9Xна1;а0ра2уAO;лаEоJ;во8ди2то67;еAXлеFык3я7R;аCеAOи0ли2Bы0;бы0вUдLкраA2небреFоKпо6SрGуJ;велиAменьA5с2I;браB4до7G;а0ло7назнаAоNпLстаKуJъяC;пре9см3D;ви1ть;оJри9I;ло7ч52;преLсKтвJ;ра5;таC;де98;зой4ра9QыE;б21в1Vг1Rд1Bе1Aж16з0Zис7Rй0Yк0Sл0Pм0Lн0Iо0Gп0Cр09сVтPужи33хNцелоGчLшKщи59яJ;ви2с6;еве9Cу5;е7SиJ;ни0с5;ваJло54о9у9H;ли0с07;ерNороMрJу9MяA8;еJу7Sяс4;бJво7;и0оG;пи2;е0я1;а9вVеUка7EлRмQоPпоOсо73тJчи00;аLесня2оя0рKуJ;пи0ча0;а5Zои2;ви0рJ;а2е0;ри0собс8T;ветоGдейс8Sли0;е0отре1;а0е4WуKыJ;ша2;жи0ша1;ли2ти0я0;аNя5;аKва0еJо9уAы2;за0комен4Q;зи0ни0;ас1олз4рKыJ;та2;аCоJы3I;боBси0;беJщ8;да0ща0;адKес3PраJюHя0;ви2;ея2о8X;еLи6DоJча2ы0;ли2чJ;и2ь;ня1с5ти0ша0;еKи0оJу8Wю4N;жи1ма0;з0те0чи1;аNи3лMоLрKуJ;ри0са0ша0;ас5Uу8Dы0;леба2нAри0;о3Aяс2;за1ти1ча0;ма0ти;аNвLдKнаJ;коми1ть;ор7UраC;а0оJ;ли0ни0;бо7JвJимс7Q;и3Vтра64;аKеJ;ва0ла0р7N;лJть;е0оG;с0ха0;аXбWвSг3VдRеPклюAм7HоOпи4QраNсMтвLуKх0CчJъеHы64;е5Tи4K;ма0ть;ер9;ка5Fлу60;з6ть83;б6Hж4Gй4;йс7CлJше45;а0и0;а2ер88;еKиJ;га2ну2;рJс4;г89ну0;и0од8;ви0ри0ть;аEиб3лLоKруJ;зи1;во8ди0;о5я7A;а6TеLзрос4Sис3лия0оKре9тJы89;ори1;зи2;да0з4рKсJ;и0ти;и0ну1;еJи0лагода8ри2;ди0жа0;бPвеOдNеHжи0й4куEм5Pн6PсMтерLхKчJ;ис6Kувс6Q;ва5;пе0;еFка4Nп09та0;а1ви7Pела0у7G;з4р3с4;и0ра0;б0Sвла6Tг0Qд0Oзнако5Dк0Mп0Eргани80с06тMфор22хKце6чJщу6W;аIис5ну2;аракте7Xва5рJ;а6ип3;б01вYга3IдXкVлUмеTнес1SоRпPрLсDтJыс4U;оJя19;лк3;аLеJ;агиIдакJмонJ;тиI;боDзи1;раJус5;ви1зд1M;браJзGй4мс5;зи0ть;ни0ти1;иAо7;а4PлJры1;о6юA;а0еZох3;еJлеF;з4рJс4ти0;г3ну2;роE;вOкор2Dла2DмNноGозMпо8тKуJ;ди0щест29;аJриFу9;ви0но27ть6H;на0;от2Y;е5идетельс5PоJ;бо62и0;ереPи46ла5оNрKуJ;бли1Mс5Z;ав2OедеKоJ;ки3си0;ли1;в4GзJ;да0на0;ди0ть65;а42онAрJ;ес5у7;е1оJ;б8л7;ляде2раJ;би0ни61;ви6ду63еWиVлегAмUнSоQрNсMуLъJ;еди2AяJ;ви0с29;слоCчи1;лу7у9;аKес4уJ;ши2;боDдоGзоGти1;бщи0зJй0Eс0G;ли0наA;аруJоCя0;жи1;а3еня1;де1;рKспJ;еAокои2;еFну2;аJедооце6ыр3;б0Dвес3Iгр0Cд09е08жа0з07име06й04к01л00меZнYпSрQсNтKу5Iхму2Vце4TчJ;а1ер5;кKреJя3;ниI;ну2;ла3AтJ;а0оя0рJу41;ои0;ас4иJу50я9;соB;ас0ечаDиMоLрKуJ;га0;а0Uо0Pячь54;л6м6;са0тJ;а1ь51;ес4я0;к3ти0;а9и0о7;а28лоKоJры0;пи0рQ;ни2;тиJ;!сь;ноB;ва1наA;с2ха0;е0оKыJ;ми0;ес0;а9у42;и0ра1;ах3еJиг3;льк3т3;еFиJ;ши1;ач3иKоJр3Uу37;н4Hп3;в3ну1;зSсJ;кQпOтLчеJ;з3рJ;па0;еFоJра5;лJпи0;коB;оJраCыD;л0Iр3T;алеAлюA;бSвRгQда0жа8ло7мPнNоLрасхоKуJ;ми0чи0;доB;брJй4;а3Fес4;асилоBоJ;си2;а17е09я0;отоC;ес5и07леF;аJе42и0ра0;ви1;аLлоупотJ;реJ;би0;б0Qв0Mг0Jд0FеHж0Eзуб8интересоGй4к0Cл0Bм09н08пVрRсOтMфикLхо3UчJщи5яC;еJис2S;рп3;сиI;к3ормо30рJя3Y;о3уд6;ве36лу7мея2ну0тJу3;а2AрJы3;ахоBе2Lя0;аLегистриKжаJ;ве0;роG;боDзи0;еUиTлQоNрKуJ;с5та0;е5оJ;грамJт3X;миI;доз8зKл6мJ;ни1;да0;аJес4;ка0ниIти0;роB;са1;ре0;ес4очеBя1;еJол1B;ни0ре0ти0;ез0и0о7юб27;а05люAон2WрJу8;е1Kу7ы1;а0еF;а0еKуJ;ма1ши0;рJть;жа1;ля3на0оJру23;во8рJ;е0о9;аLеJис3ла25оеBяV;рJс4;боBи0ну0ши1;ли0ри0;еремеLи0оKрJы0;а1о09;ле0;не0;а1ви2Qе2оJ;бSвеRгOеHжNй4каMло7но2WпLстJ;аJиг3;ви0ть2W;ол6роEус5;за0;да2и0;на0оJ;воJ;ри2;ри0с4;аCи2ра2ы0;ве2Hдохн2Fер2Eз23клю22л1Xме1Vн1Rо11п10руAс0Pт0OъеHыJ;б0Kве2Gг0Hд0FеHжи0зBиг0Eй4к0Bл09м08н06п03рZсQтMу21чKши0яJ;ви0с6;еJис12;рк3;аKеJя3;ре0чь;сJщи0;ка0;аQкOлMоLтJу1J;аCрJу0H;е0Uои0;са0;а0е9уJ;ша0;аJоA;за1;ди2;аJва1уга1;боDзи1сJ;тиJ;!ть;ас0иKла5ол6ряJус5;ми2;са0ть;оEуJ;ди0ть;ес5;еJо7;з0те0;аKи3люAрJупа2;а1Qу5;ча0;ра0;а0ви3еJох3;ли1р1A;лJна0;а9я0K;ди0;е16и0рJ;а1оE;ха0;ис3я3;кRмотQпNтJ;аLрKуJ;пи0;е0Eои0ях3;ви0ть;оJых3;м6те0;ни0;ре2;ипя5оAры0;чи0;ас0;влеFзYй4оWсJтк3;клUпNсMхJ;ваKиJ;ти2;ли0;таV;аOиDользNрJ;епятсLиKоизвJ;ес4;ня0;твоB;ова2;ли2;ик3;браJдушеC;зи0;буQвOглаCдеNнLобKраJ;зи0с4;ноC;енавиJик3;де0;ла0ржа2;ес4раJ;ти1;ди1;чь;еKуJ;ши0;д8с4;ри0;с5ша2;ти0;ез0о7юJ;би2;тьJ;ся;жи0;чи1;болDвPгля3дMлJя1;еKоJ;ма0;те0;оJрог3;роJх3;жа0;еEолноGы0;ва1;си0;та0;ну1;оCу0;ви0;з4с4;ти;оKыз3;ну0;си1;тьJ;!ся;втоLрJ;есJ;тоB;риJ;зоB;ва0;ть",
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

  let { presentTense: presentTense$1, pastTense: pastTense$1, imperative: imperative$1, gerund } = result;
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
    let res = {};
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
    let out = convert(str, gerund.gerund);
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

  let { presentTense, pastTense, imperative } = result;

  // =-=-
  const revAll = function (m) {
    return Object.keys(m).reduce((h, k) => {
      h[k] = reverse(m[k]);
      return h
    }, {})
  };

  let presentRev = revAll(presentTense);
  let pastRev = revAll(pastTense);
  let imperativeRev = revAll(imperative);

  // try each form's reverse-model, verify by conjugating the result back
  const tryAll = function (str, revModel, fwdModel) {
    let keys = Object.keys(revModel);
    let guess = null;
    for (let i = 0; i < keys.length; i += 1) {
      let k = keys[i];
      let inf = convert(str, revModel[k]);
      if (inf && inf !== str) {
        // does it round-trip?
        if (convert(inf, fwdModel[k]) === str) {
          return inf
        }
        guess = guess || inf;
      }
    }
    return guess || str
  };

  const fromPresent = function (str, form) {
    if (form && presentRev[form]) {
      return convert(str, presentRev[form]) || str
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
    let stem = str.slice(0, -1);
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
    let irregular = getIrregularSingulars();
    if (irregular[str]) {
      return irregular[str]
    }
    let stem = str.slice(0, -1);
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
    if (/[ая]$/.test(str)) {
      return 'feminine'
    }
    if (/[оеё]$/.test(str) || str.endsWith('мя')) {
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
    let stem = str.slice(0, -1);
    let res = { nominative: str, accusative: str };
    const hush = (c) => /[жчшщц]/.test(c);

    if (gender === 'feminine') {
      if (str.endsWith('ия')) {
        // линия → линии, линию, линией
        return Object.assign(res, { genitive: stem + 'и', dative: stem + 'и', accusative: stem + 'ю', instrumental: stem + 'ей', prepositional: stem + 'и' })
      }
      if (str.endsWith('а')) {
        // книга → книги, книге, книгу, книгой
        let gen = isHushOrVelar(stem.slice(-1)) ? stem + 'и' : stem + 'ы';
        let instr = hush(stem.slice(-1)) ? stem + 'ей' : stem + 'ой';
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
      let base = str.slice(0, -2) + 'к';
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
    let res = declineBase(str, gender);
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
    let plStem = plural.slice(0, -1);
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
    let plural = toPlural$1(str);
    let plStem = plural.slice(0, -1);
    // hard-stem takes -ам/-ами/-ах, soft-stem takes -ям/-ями/-ях
    let soft = false;
    if (plural.endsWith('я')) {
      soft = true;
    } else if (plural.endsWith('и') && /[кгхжчшщц]$/.test(plStem) === false) {
      soft = true;
    }
    let a = soft ? 'я' : 'а';
    let genitive = toPluralGenitive(str, gender, plural);
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
    let masc = toMasculine(str);
    if (/(ый|ий|ой)$/.test(masc)) {
      return { stem: masc.slice(0, -2), soft: masc.endsWith('ий') }
    }
    return null
  };

  const toFeminine = function (str = '') {
    let res = stemOf(str);
    if (res === null) {
      return str
    }
    let { stem, soft } = res;
    // синий → синяя, but маленький → маленькая, хороший → хорошая
    if (soft && !isVelar(stem.slice(-1)) && !isHusher(stem.slice(-1))) {
      return stem + 'яя'
    }
    return stem + 'ая'
  };

  const toNeuter = function (str = '') {
    let res = stemOf(str);
    if (res === null) {
      return str
    }
    let { stem, soft } = res;
    // синий → синее, хороший → хорошее, but маленький → маленькое
    if (soft && !isVelar(stem.slice(-1))) {
      return stem + 'ее'
    }
    return stem + 'ое'
  };

  const toPlural = function (str = '') {
    let res = stemOf(str);
    if (res === null) {
      return str
    }
    let { stem, soft } = res;
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
    let masc = toMasculine(str);
    if (irregularComparatives[masc]) {
      return irregularComparatives[masc]
    }
    let res = stemOf(masc);
    if (res === null) {
      return 'более ' + str
    }
    let { stem } = res;
    let last = stem.slice(-1);
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
    let masc = toMasculine(str);
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
  let misc$1 = {};

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
  let lexicon$1 = {};

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
      let w = obj[k];
      if (w && !lex[w]) {
        let tags = [tag];
        if (extraMap && extraMap[k]) {
          tags.push(extraMap[k]);
        }
        lex[w] = tags;
      }
    });
  };

  Object.keys(lexData).forEach(tag => {
    let wordsObj = unpack(lexData[tag]);
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
        let tense = perfective[w] === true ? 'FutureTense' : 'PresentTense';
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
      let plain = w.replace(/ё/g, 'е');
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
    let found = Object.keys(tagToForm).find(tag => term.tags.has(tag));
    return found ? tagToForm[found] : null
  };


  const root = function (view) {
    const { verb } = view.world.methods.two.transform;
    view.docs.forEach(terms => {
      terms.forEach(term => {
        let str = term.implicit || term.normal || term.text;

        // get infinitive form of the verb
        if (term.tags.has('Verb')) {
          if (term.tags.has('Infinitive')) {
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
    let setTag = world.methods.one.setTag;
    let term = terms[i];
    let { regexText, regexNormal, regexNumbers } = world.model.two;
    let normal = term.machine || term.normal;
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
    let setTag = world.methods.one.setTag;
    let term = terms[i];
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
    let setTag = world.methods.one.setTag;
    const term = terms[i];
    if (term.tags.has('NumericValue') && term.tags.has('Cardinal') && term.normal.length === 4) {
      let num = Number(term.normal);
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
    let str = term.text;
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
    let setTag = world.methods.one.setTag;
    let term = terms[i];
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
    let setTag = world.methods.one.setTag;
    let term = terms[i];
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
      let suffix = str.substr(len - i, len);
      if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
        // console.log(suffix)
        let tag = suffixes[suffix.length][suffix];
        return tag
      }
    }
    return null
  };

  // decide tag from the ending of the word
  const suffixCheck = function (terms, i, world) {
    let setTag = world.methods.one.setTag;
    let suffixes = world.model.two.suffixPatterns;
    let term = terms[i];
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
    let world = view.world;
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
    let term = terms[i];
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
      let lastTerm = terms[i - 1];
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
    let str = term.normal;
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
    let arr = [];
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
    let document = methods.two.quickSplit(view.document);
    let ptrs = document.map(terms => {
      let t = terms[0];
      return [t.index[0], t.index[1], t.index[1] + terms.length]
    });
    let m = view.update(ptrs);
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
      not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
    },
    Singular: {
      is: 'Noun',
      not: ['Plural'],
    },
    ProperNoun: {
      is: 'Noun',
    },
    Person: {
      is: 'Singular',
      also: ['ProperNoun'],
      not: ['Place', 'Organization', 'Date'],
    },
    FirstName: {
      is: 'Person',
    },
    MaleName: {
      is: 'FirstName',
      not: ['FemaleName', 'LastName'],
    },
    FemaleName: {
      is: 'FirstName',
      not: ['MaleName', 'LastName'],
    },
    LastName: {
      is: 'Person',
      not: ['FirstName'],
    },
    Honorific: {
      is: 'Noun',
      not: ['FirstName', 'LastName', 'Value'],
    },
    Place: {
      is: 'Singular',
      not: ['Person', 'Organization'],
    },
    Country: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['City'],
    },
    City: {
      is: 'Place',
      also: ['ProperNoun'],
      not: ['Country'],
    },
    Region: {
      is: 'Place',
      also: ['ProperNoun'],
    },
    Address: {
      // is: 'Place',
    },
    Organization: {
      is: 'ProperNoun',
      not: ['Person', 'Place'],
    },
    SportsTeam: {
      is: 'Organization',
    },
    School: {
      is: 'Organization',
    },
    Company: {
      is: 'Organization',
    },
    Plural: {
      is: 'Noun',
      not: ['Singular'],
    },
    Uncountable: {
      is: 'Noun',
    },
    Pronoun: {
      is: 'Noun',
      not: entity,
    },
    Actor: {
      is: 'Noun',
      not: entity,
    },
    Activity: {
      is: 'Noun',
      not: ['Person', 'Place'],
    },
    Unit: {
      is: 'Noun',
      not: entity,
    },
    Demonym: {
      is: 'Noun',
      also: ['ProperNoun'],
      not: entity,
    },
    Possessive: {
      is: 'Noun',
    },

    FemaleNoun: {
      is: 'Noun',
      not: ['MaleNoun', 'NeuterNoun']
    },
    MaleNoun: {
      is: 'Noun',
      not: ['FemaleNoun', 'NeuterNoun']
    },
    NeuterNoun: {
      is: 'Noun',
      not: ['MaleNoun', 'FemaleNoun']
    },
    // grammatically-animate (people + animals) - accusative takes genitive form
    AnimateNoun: {
      is: 'Noun',
    },

  };

  var verbs$1 = {
    Verb: {
      not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
    },
    PresentTense: {
      is: 'Verb',
      not: ['PastTense', 'FutureTense'],
    },
    // russian infinitives (читать) are their own form - not a present-tense
    Infinitive: {
      is: 'Verb',
      not: ['Gerund'],
    },
    // деепричастие (читая, прочитав)
    Gerund: {
      is: 'Verb',
      not: ['Copula'],
    },
    PastTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'FutureTense'],
    },
    FutureTense: {
      is: 'Verb',
      not: ['PresentTense', 'Gerund', 'PastTense'],
    },
    Copula: {
      is: 'Verb',
    },
    Modal: {
      is: 'Verb',
      not: ['Infinitive'],
    },
    PerfectTense: {
      is: 'Verb',
      not: ['Gerund'],
    },
    // причастие (читающий, прочитанный) - declines like an adjective
    Participle: {
      is: 'Adjective',
    },
    Auxiliary: {
      is: 'Verb',
      not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
    },
    // 'я бы хотел'
    Conditional: {
      is: 'Verb',
      not: ['Infinitive', 'Imperative'],
    },
    // verbs ending in -ся/-сь
    Reflexive: {
      is: 'Verb',
    },
    // moods
    Imperative: {
      is: 'Verb',
      not: ['PresentTense', 'PastTense', 'FutureTense'],
    },

    //
    FirstPerson: {
      is: 'Verb',
      not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPerson: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    FirstPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
    },
    SecondPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
    },
    ThirdPersonPlural: {
      is: 'Verb',
      not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
    },
  };

  var values = {
    Value: {
      not: ['Verb', 'Adjective', 'Adverb'],
    },
    Ordinal: {
      is: 'Value',
      not: ['Cardinal'],
    },
    Cardinal: {
      is: 'Value',
      not: ['Ordinal'],
    },
    Fraction: {
      is: 'Value',
      not: ['Noun'],
    },
    Multiple: {
      is: 'Value',
    },
    RomanNumeral: {
      is: 'Cardinal',
      not: ['TextValue'],
    },
    TextValue: {
      is: 'Value',
      not: ['NumericValue'],
    },
    NumericValue: {
      is: 'Value',
      not: ['TextValue'],
    },
    Money: {
      is: 'Cardinal',
    },
    Percent: {
      is: 'Value',
    },
  };

  var dates = {
    Date: {
      not: ['Verb', 'Adverb', 'Adjective'],
    },
    Month: {
      is: 'Singular',
      also: ['Date'],
      not: ['Year', 'WeekDay', 'Time'],
    },
    WeekDay: {
      is: 'Noun',
      also: ['Date'],
    },
    Year: {
      is: 'Date',
      not: ['RomanNumeral'],
    },
    FinancialQuarter: {
      is: 'Date',
      not: 'Fraction',
    },
    // 'easter'
    Holiday: {
      is: 'Date',
      also: ['Noun'],
    },
    // 'summer'
    Season: {
      is: 'Date',
    },
    Timezone: {
      is: 'Noun',
      also: ['Date'],
      not: ['ProperNoun'],
    },
    Time: {
      is: 'Date',
      not: ['AtMention'],
    },
    // 'months'
    Duration: {
      is: 'Noun',
      also: ['Date'],
    },
  };

  const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'];

  var misc = {
    Adjective: {
      not: ['Noun', 'Verb', 'Adverb', 'Value'],
    },
    FemaleAdjective: {
      is: 'Adjective',
      not: ['MaleAdjective'],
    },
    MaleAdjective: {
      is: 'Adjective',
      not: ['FemaleAdjective'],
    },
    PluralAdjective: {
      is: 'Adjective',
      not: ['SingularAdjective'],
    },
    SingularAdjective: {
      is: 'Adjective',
      not: ['PluralAdjective'],
    },
    Comparable: {
      is: 'Adjective',
    },
    Comparative: {
      is: 'Adjective',
    },
    Superlative: {
      is: 'Adjective',
      not: ['Comparative'],
    },
    NumberRange: {},
    Adverb: {
      not: ['Noun', 'Verb', 'Adjective', 'Value'],
    },

    Determiner: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
    },
    // же, ли, бы, ведь..
    Particle: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb'],
    },
    // не, ни, нет
    Negative: {
      not: ['Noun', 'Adjective', 'Value'],
    },
    Conjunction: {
      not: anything,
    },
    Preposition: {
      not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
    },
    QuestionWord: {
      not: ['Determiner'],
    },
    Currency: {
      is: 'Noun',
    },
    Expression: {
      not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
    },
    Abbreviation: {},
    Url: {
      not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    PhoneNumber: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
    },
    HashTag: {},
    AtMention: {
      is: 'Noun',
      not: ['HashTag', 'Email'],
    },
    Emoji: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Emoticon: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Email: {
      not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
    },
    Acronym: {
      not: ['Plural', 'RomanNumeral'],
    },
    Condition: {
      not: ['Verb', 'Adjective', 'Noun', 'Value'],
    },
  };

  let tags = Object.assign({}, nouns$1, verbs$1, values, dates, misc);

  var tagset = {
    tags
  };

  const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc);

  // get root form of verb
  const getRoot = function (m) {
    m.compute('root');
    let str = m.text('root');
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
    let pron = m.lookBehind('#Pronoun').last().text('normal');
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
    let str = m.text('normal');
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
    let pron = m.lookBehind('#Pronoun').last().text('normal');
    return pronounGender[pron] || 'masc'
  };

  // split a verb-phrase into its finite head + trailing infinitives
  // ('буду читать' → [буду, читать],  'хочет работать' → [хочет, работать])
  const parseVerb = function (m) {
    let inf = m.match('#Infinitive');
    let head = m.not('#Infinitive');
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
          let str = getRoot(m);
          let perfective = isPerfective(str);
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
          let { head, inf } = parseVerb(m);
          if (!head.found) {
            return m
          }
          let person = getPerson(head);
          let slot = getPastSlot(head, person);
          // 'буду читать' → 'читал',  'будет' → 'был'
          if (head.has('#Copula')) {
            let root = inf.found ? inf.text('normal') : 'быть';
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
          let { head, inf } = parseVerb(m);
          if (!head.found) {
            return m
          }
          let person = getPerson(head);
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
          let { head, inf } = parseVerb(m);
          if (!head.found) {
            return m
          }
          let person = getPerson(head);
          // 'был'/'есть' → 'будет'
          if (head.has('#Copula')) {
            return m.replaceWith(buduMap[person] + (inf.found ? ' ' + inf.text('normal') : ''))
          }
          let root = getRoot(head);
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
          let { head } = parseVerb(m);
          if (!head.found) {
            return m
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
    let mods = m.before('(#Adjective|#Determiner|#Possessive)+$');
    mods.terms().forEach(t => {
      let str = t.text('normal');
      if (detPlural[str] !== undefined || detSingular[str] !== undefined) {
        let out = form.plural ? detPlural[str] : (detSingular[str] || {})[form.gender];
        if (out) {
          t.replaceWith(out, keep$1);
        }
        return
      }
      let fns = {
        plural: adjective.toPlural,
        masculine: adjective.toMasculine,
        feminine: adjective.toFeminine,
        neuter: adjective.toNeuter,
      };
      let fn = form.plural ? fns.plural : fns[form.gender];
      let out = fn(str);
      if (out !== str) {
        t.replaceWith(out, keep$1);
      }
    });
    // the verb right after the noun  ('лежала' in 'книга лежала на столе')
    let vb = m.after('^(#Adverb|#Negative)? [#Verb]', 0);
    if (!vb.found) {
      return
    }
    vb.compute('root');
    let root = vb.text('root');
    if (vb.has('#Copula')) {
      root = 'быть';
    }
    if (vb.has('#PastTense')) {
      let slot = form.plural ? 'plural' : { masculine: 'masc', feminine: 'fem', neuter: 'neut' }[form.gender];
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
          let str = m.text('normal');
          let plural = methods.noun.toPlural(str);
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
          let str = m.text('normal');
          let single = methods.noun.toSingular(str);
          if (single !== str) {
            let gender = methods.noun.guessGender(single);
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
        let genders = this.gender();
        let res = this.filter((m, i) => genders[i] === 'feminine');
        return getNth(res, n)
      }
      isMasculine(n) {
        let genders = this.gender();
        let res = this.filter((m, i) => genders[i] === 'masculine');
        return getNth(res, n)
      }
      isNeuter(n) {
        let genders = this.gender();
        let res = this.filter((m, i) => genders[i] === 'neuter');
        return getNth(res, n)
      }
      isAnimate(n) {
        const { guessAnimate } = this.methods.two.transform.noun;
        let res = this.filter(m => m.has('#AnimateNoun') || guessAnimate(m.text('normal')));
        return getNth(res, n)
      }
      // full case-table for each noun - singular + plural
      decline(n) {
        const { decline, declinePlural, guessAnimate } = this.methods.two.transform.noun;
        let genders = this.gender();
        return getNth(this, n).map((m, i) => {
          let str = m.text('normal');
          let animate = m.has('#AnimateNoun') || guessAnimate(str);
          let res = decline(str, genders[i], animate);
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
      let str = m.text('normal');
      let out = fn(str);
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

  var version = '0.0.2';

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
    let env = typeof process === 'undefined' ? self.env || {} : process.env; //use window, in browser
    env.DEBUG_TAGS = set === 'tagger' || set === true ? true : '';
    env.DEBUG_MATCH = set === 'match' || set === true ? true : '';
    env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : '';
    return this
  };

  es.version = version;

  return es;

}));

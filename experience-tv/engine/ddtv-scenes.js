/*!
 * Divine DunlopDreams — Experience TV: scenes
 * Version 0.2.0 (prototype for review — not for live deployment)
 *
 * A scene turns the product's own content into a screen made for the
 * monitor. The original description is only READ here (text, numbers, media
 * addresses); nothing is copied into code and nothing is lost: a test
 * compares every sentence of the source with what the screens show.
 *
 * Two kinds of screens are kept strictly apart:
 *   choose / result  - the customer's selection: tap a choice and the native
 *                      Ecwid control follows; "Your …" shows that choice
 *   everything else  - explanation and presentation
 *
 * Needs ddtv-engine.js (window.DDTV). ES5, no dependencies.
 */
(function (global) {
  'use strict';

  var DDTV = global.DDTV;
  if (!DDTV) return;
  var doc = global.document, scenes = DDTV.scenes, U = DDTV.util;
  var $ = U.$, $$ = U.$$, el = U.el, each = U.each, clamp = U.clamp, norm = U.norm;
  var same = DDTV.ConfigConnector.sameValue;

  /* ================================================================== */
  /* Reading the source                                                  */
  /* ================================================================== */

  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  /* Plain text of a node; <br> reads as a space. */
  function text(node) {
    if (!node) return '';
    var c = node.cloneNode(true);
    each($$('br', c), function (b) { b.parentNode.replaceChild(doc.createTextNode(' '), b); });
    return clean(c.textContent);
  }

  /* Copies text with bold/italic kept, everything else flattened. */
  function inlineInto(node, target) {
    each([].slice.call(node.childNodes), function (n) {
      if (n.nodeType === 3) {
        var t = n.nodeValue.replace(/\s+/g, ' ');
        if (t) target.appendChild(doc.createTextNode(t));
      } else if (n.nodeType === 1) {
        var tag = n.tagName.toLowerCase();
        if (tag === 'br') target.appendChild(doc.createTextNode(' '));
        else if (tag === 'strong' || tag === 'b') { var s = doc.createElement('strong'); inlineInto(n, s); target.appendChild(s); }
        else if (tag === 'em' || tag === 'i') { var e = doc.createElement('em'); inlineInto(n, e); target.appendChild(e); }
        else if (tag !== 'script' && tag !== 'style') inlineInto(n, target);
      }
    });
    return target;
  }

  function trimEdges(e) {
    var f = e.firstChild, l, nx;
    while (f && f.nodeType === 3 && !f.nodeValue.trim()) { nx = f.nextSibling; e.removeChild(f); f = nx; }
    if (f && f.nodeType === 3) f.nodeValue = f.nodeValue.replace(/^\s+/, '');
    l = e.lastChild;
    while (l && l.nodeType === 3 && !l.nodeValue.trim()) { nx = l.previousSibling; e.removeChild(l); l = nx; }
    if (l && l.nodeType === 3) l.nodeValue = l.nodeValue.replace(/\s+$/, '');
    return e;
  }

  /* A new element holding the (inline-formatted) text of a source node. */
  function rich(tag, cls, node) {
    var e = el(tag, { class: cls || null });
    if (node) inlineInto(node, e);
    return trimEdges(e);
  }

  function srcOf(source) {
    return source ? (source.getAttribute('src') || source.getAttribute('data-ddtv-src')) : null;
  }

  function summaryTitle(d) {
    var s = $('summary', d);
    if (!s) return '';
    var c = s.cloneNode(true);
    each($$('.sum-idx, .sum-arr, .b-cover-menu__tag', c), function (n) { n.parentNode.removeChild(n); });
    return clean(c.textContent);
  }

  /* Typed content blocks of a description section. */
  function blocks(container, out) {
    out = out || [];
    if (!container) return out;
    each([].slice.call(container.children), function (n) {
      var cls = n.className || '', tag = n.tagName.toLowerCase();
      if (tag === 'p') out.push({ t: 'p', n: n });
      else if (tag === 'h4') out.push({ t: 'h', text: text(n) });
      else if (/b-fconf__analogy/.test(cls)) out.push({ t: 'quote', n: $('p', n) || n });
      else if (/b-drow/.test(cls)) out.push({ t: 'stats', items: $$('.b-di', n).map(function (d) { return { v: text($('.b-dv', d)), l: text($('.b-dl', d)) }; }) });
      else if (/b-itab/.test(cls)) out.push({ t: 'facts', rows: $$('.b-irow', n).map(function (r) { return { k: text($('.b-ilab', r)), v: text($('.b-ival', r)) }; }) });
      else if (/b-vchart/.test(cls)) out.push({ t: 'chart', title: text($('.b-over', n)), rows: $$('.b-vrow', n).map(function (r) { return { name: text($('.b-vn', r)), pct: text($('.b-vpct', r)) }; }) });
      else blocks(n, out);
    });
    return out;
  }

  /* Splits blocks at headings. Figures (facts, stats, chart) are kept apart
     so they can sit beside the text instead of inside one topic. */
  function topicsOf(list, introTitle) {
    var topics = [], figures = [], cur = null;
    each(list, function (b) {
      if (b.t === 'h') { cur = { title: b.text, blocks: [] }; topics.push(cur); return; }
      if (b.t === 'facts' || b.t === 'chart') { figures.push(b); return; }
      if (!cur) { cur = { title: introTitle || '', blocks: [] }; topics.push(cur); }
      cur.blocks.push(b);
    });
    return { topics: topics, figures: figures };
  }

  function readHead(sel) {
    var r = sel && $(sel);
    if (!r) return null;
    var t = text($('.b-sh__t', r));
    if (!t) t = clean(text($('.b-sh__n', r)).replace(/^\s*\d+\s*[—–-]\s*/, ''));
    return { title: t, sub: $('.b-sh__s', r) };
  }

  /* ================================================================== */
  /* Building blocks                                                     */
  /* ================================================================== */

  function headBlock(h, cls) {
    var box = el('header', { class: 'sc-head' + (cls ? ' ' + cls : '') });
    if (h.title) box.appendChild(el('h2', { class: 'sc-title', text: h.title }));
    if (h.sub) box.appendChild(rich('p', 'sc-sub', h.sub));
    return box;
  }

  function renderBlock(b) {
    var q, rows;
    switch (b.t) {
      case 'p': return rich('p', 'sc-p', b.n);
      case 'quote': return rich('blockquote', 'sc-quote', b.n);
      case 'stats':
        return el('div', { class: 'sc-stats' }, b.items.map(function (i) {
          return el('div', { class: 'sc-stat' }, [el('b', { text: i.v }), el('span', { text: i.l })]);
        }));
      case 'facts':
        rows = [];
        each(b.rows, function (r) { rows.push(el('dt', { text: r.k })); rows.push(el('dd', { text: r.v })); });
        return el('dl', { class: 'sc-facts' }, rows);
      case 'chart':
        q = el('div', { class: 'sc-chart' }, [el('p', { class: 'sc-chart__k', text: b.title })]);
        each(b.rows, function (r) {
          var n = parseFloat(String(r.pct).replace(/[^0-9.]/g, '')) || 0;
          q.appendChild(el('div', { class: 'sc-bar' }, [
            el('span', { class: 'sc-bar__n', text: r.name }),
            el('span', { class: 'sc-bar__t' }, [el('i', { style: '--w:' + clamp(n, 0, 100) + '%' })]),
            el('span', { class: 'sc-bar__v', text: r.pct })
          ]));
        });
        return q;
    }
    return el('span');
  }

  function renderBlocks(list, into) {
    each(list, function (b) { into.appendChild(renderBlock(b)); });
    return into;
  }

  function button(label, cls, onclick) {
    return el('button', { type: 'button', class: 'sc-btn ' + (cls || ''), onclick: onclick }, [label]);
  }

  /* A figure that carries one of the source's own videos. */
  function figure(tv, mtv) {
    var frame = el('div', { class: 'sc-video' });
    tv.takeVideo($('video', mtv), frame);
    var tag = text($('.b-mtv__mode', mtv));
    return el('figure', { class: 'sc-figure' }, [
      frame,
      el('figcaption', { class: 'sc-figcap' }, [
        tag ? el('span', { class: 'sc-tag', text: tag }) : null,
        el('strong', { text: text($('.b-mtv__title', mtv)) }),
        el('span', { class: 'sc-figdesc', text: text($('.b-mtv__desc', mtv)) })
      ])
    ]);
  }

  function empty(tv, E, goTo) {
    return el('div', { class: 'sc-empty' }, [
      el('h3', { class: 'sc-empty__t', text: E.title }),
      el('p', { class: 'sc-empty__p', text: E.text }),
      button(E.action, 'sc-btn--solid', function () { tv.userAction(); tv.go(goTo.chapter, goTo.panel); })
    ]);
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* ================================================================== */
  /* Discover                                                            */
  /* ================================================================== */

  scenes.hero = function (c) {
    var P = c.p, tv = c.tv, root = c.root;
    var actions = $$(P.actions).map(function (a) { return { label: text(a), href: a.getAttribute('href') }; });
    var copy = el('div', { class: 'sc-hero__copy' }, [
      el('p', { class: 'sc-kicker', text: text($(P.kicker)) }),
      el('h2', { class: 'sc-hero__brand', text: text($(P.brand)) }),
      el('p', { class: 'sc-hero__line', text: text($(P.headline)) }),
      rich('p', 'sc-hero__intro', $(P.intro)),
      el('div', { class: 'sc-actions' }, actions.map(function (a, i) {
        return button(a.label, i ? 'sc-btn--ghost' : 'sc-btn--solid', function () { tv.goHref(a.href); });
      }))
    ]);

    var frame = el('div', { class: 'sc-video sc-video--hero' });
    tv.takeVideo($(P.video), frame);
    var full = srcOf($(P.fullSrc));
    var stage = el('div', { class: 'sc-hero__stage' }, [
      el('p', { class: 'sc-hero__label', text: text($(P.videoTitle)) }),
      frame
    ]);
    if (full) {
      stage.appendChild(el('button', {
        type: 'button', class: 'sc-play',
        onclick: function () { tv.userAction(); tv.openPlayer({ title: text($(P.fullTitle)), src: full }); }
      }, [el('span', { class: 'sc-play__ico', 'aria-hidden': 'true' }), text($(P.fullLabel))]));
    }
    stage.appendChild(rich('p', 'sc-hero__note', $(P.note)));
    root.appendChild(el('div', { class: 'sc-hero' }, [copy, stage]));
  };

  scenes.facts = function (c) {
    var P = c.p, tv = c.tv, root = c.root;
    var facts = $$(P.facts).map(function (it) {
      return {
        label: text($('.b-ocard__lbl', it)), value: text($('.b-ocard__val', it)),
        pills: $$('.b-ocard__pills span', it).map(text), note: text($('.b-ocard__note', it)),
        wide: /--full/.test(it.className)
      };
    });
    var grid = el('div', { class: 'sc-factgrid' });
    each(facts, function (f) {
      var body = f.pills.length
        ? el('ul', { class: 'sc-chips' }, f.pills.map(function (p) { return el('li', { text: p }); }))
        : el('p', { class: 'sc-fact__v', text: f.value });
      grid.appendChild(el('div', { class: 'sc-fact' + (f.wide ? ' is-wide' : '') }, [
        el('p', { class: 'sc-fact__k', text: f.label }), body, f.note ? el('p', { class: 'sc-fact__n', text: f.note }) : null
      ]));
    });
    var feats = el('ul', { class: 'sc-featlist' });
    each($$(P.features), function (a) {
      var href = a.getAttribute('href');
      feats.appendChild(el('li', {}, [el('button', { type: 'button', class: 'sc-feat', onclick: function () { tv.goHref(href); } }, [
        el('span', { class: 'sc-feat__mk', 'aria-hidden': 'true' }), text(a)
      ])]));
    });
    root.appendChild(el('div', { class: 'sc-glance' }, [
      el('section', { class: 'sc-glance__a' }, [el('h2', { class: 'sc-title sc-title--s', text: text($(P.title)) }), grid]),
      el('section', { class: 'sc-glance__b' }, [el('h2', { class: 'sc-title sc-title--s', text: text($(P.featuresTitle)) }), feats])
    ]));
  };

  /* ================================================================== */
  /* Overview of a topic: cards, or points beside a video                */
  /* ================================================================== */

  scenes.points = function (c) {
    var P = c.p, tv = c.tv, root = c.root, M = P.map;
    var head = readHead(P.head);
    if (head) root.appendChild(headBlock(head));
    var items = $$(P.items).map(function (n) {
      return { title: text($(M.title, n)), sub: M.sub ? text($(M.sub, n)) : '', body: $(M.text, n) };
    });
    var mtv = P.media && $(P.media);

    if (!mtv) {
      var grid = el('div', { class: 'sc-cards' });
      each(items, function (it) {
        grid.appendChild(el('article', { class: 'sc-card' }, [
          el('h3', { class: 'sc-card__t', text: it.title }),
          it.sub ? el('p', { class: 'sc-card__s', text: it.sub }) : null,
          rich('p', 'sc-card__p', it.body)
        ]));
      });
      root.appendChild(grid);
      return;
    }

    /* With a video: the points sit beside it and open one at a time, so the
       customer picks what to read and the video never leaves the screen. */
    var list = el('div', { class: 'sc-pointlist' }), rows = [];
    function open(i) {
      each(rows, function (r, k) {
        var on = k === i;
        r.btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        r.row.classList.toggle('is-open', on);
      });
    }
    each(items, function (it, i) {
      var btn = el('button', { type: 'button', class: 'sc-point__h', 'aria-expanded': 'false', onclick: function () { tv.userAction(); open(i); } }, [
        el('span', { class: 'sc-point__mk', 'aria-hidden': 'true' }),
        el('span', { class: 'sc-point__t', text: it.title }),
        it.sub ? el('span', { class: 'sc-point__s', text: it.sub }) : null
      ]);
      var row = el('div', { class: 'sc-point' }, [btn, el('div', { class: 'sc-point__b' }, [rich('p', 'sc-p', it.body)])]);
      rows.push({ row: row, btn: btn });
      list.appendChild(row);
    });
    open(0);
    root.appendChild(el('div', { class: 'sc-split' }, [figure(tv, mtv), list]));
  };

  /* ================================================================== */
  /* Reading screens                                                     */
  /* ================================================================== */

  scenes.reader = function (c) {
    var P = c.p, tv = c.tv, root = c.root;
    var head = readHead(P.head);
    if (head) root.appendChild(headBlock(head));
    if (P.lead && $(P.lead)) root.appendChild(rich('p', 'sc-lead', $(P.lead)));

    var d = P.details && $(P.details);
    var title = d ? summaryTitle(d) : '';
    var list = d ? blocks($('.d-body', d)) : blocks($(P.container));
    var split = topicsOf(list, P.introTitle);
    var topics = split.topics, figures = split.figures;
    var titled = topics.filter(function (t) { return t.title; }).length;
    var mode = P.mode || (titled >= 3 ? 'topics' : 'article');

    if (mode === 'split' && topics.length >= 2) {
      root.appendChild(el('div', { class: 'sc-twin' }, [
        el('section', { class: 'sc-twin__a' }, [el('h3', { class: 'sc-h3', text: title }), renderBlocks(topics[0].blocks, el('div', { class: 'sc-prose' }))]),
        el('section', { class: 'sc-twin__b' }, [el('h3', { class: 'sc-h3', text: topics[1].title }), renderBlocks(topics[1].blocks, el('div', { class: 'sc-prose' }))])
      ]));
      return;
    }

    if (mode === 'topics') {
      var nav = el('div', { class: 'sc-topics__nav', role: 'tablist', 'aria-orientation': 'vertical' });
      var pane = el('div', { class: 'sc-topics__pane' });
      var btns = [], panes = [];
      /* Every topic is built once and only the chosen one is shown, so all
         of the text is on the page (searchable, readable by assistive tech). */
      var show = function (i) {
        each(btns, function (b, k) { b.classList.toggle('is-active', k === i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
        each(panes, function (p, k) { p.hidden = k !== i; });
        pane.scrollTop = 0;
      };
      each(topics, function (t, i) {
        var b = el('button', { type: 'button', role: 'tab', class: 'sc-topic', onclick: function () { tv.userAction(); show(i); } }, [t.title]);
        var p = el('div', { class: 'sc-topics__one', role: 'tabpanel' }, [el('h3', { class: 'sc-h3', text: t.title })]);
        renderBlocks(t.blocks, p);
        btns.push(b);
        panes.push(p);
        nav.appendChild(b);
        pane.appendChild(p);
      });
      var side = el('div', { class: 'sc-topics__side' }, [title ? el('p', { class: 'sc-topics__k', text: title }) : null, nav]);
      each(figures, function (f) { side.appendChild(renderBlock(f)); });
      show(0);
      root.appendChild(el('div', { class: 'sc-topics' }, [side, pane]));
      return;
    }

    /* article: one flowing page, two columns when there is room */
    if (title) root.appendChild(el('h3', { class: 'sc-h3 sc-h3--top', text: title }));
    var art = el('div', { class: 'sc-article' + (P.lead || P.leadFirst ? ' has-lead' : '') });
    each(topics, function (t, i) {
      if (t.title) art.appendChild(el('h4', { class: 'sc-h4', text: t.title }));
      each(t.blocks, function (b, k) {
        var node = renderBlock(b);
        if (P.leadFirst && i === 0 && k === 0 && b.t === 'p') node.className = 'sc-lead';
        art.appendChild(node);
      });
    });
    each(figures, function (f) { art.appendChild(renderBlock(f)); });
    root.appendChild(art);
  };

  /* ================================================================== */
  /* Selections: reading the options from the source                     */
  /* ================================================================== */

  var READERS = {
    firmness: function (I, tv) {
      return $$(I.sel).map(function (n) {
        var title = text($(I.title, n)), kg = text($(I.kg, n));
        var range = kg.match(/(\d+)\s*[–-]\s*(\d+)/), open = kg.match(/(\d+)\s*\+/);
        return {
          title: title, kg: kg, st: text($(I.st, n)), body: $(I.text, n),
          lo: range ? +range[1] : open ? +open[1] : 0, hi: range ? +range[2] : null,
          ref: tv.connector.normalise('firmness', title)
        };
      });
    },
    depth: function (I, tv) {
      return $$(I.sel).map(function (n) {
        var cm = text($(I.cm, n));
        return {
          value: parseFloat(cm), cm: cm, inch: text($(I.inch, n)), title: text($(I.name, n)), body: $(I.text, n),
          ref: tv.connector.normalise('depth', cm + ' cm')
        };
      });
    },
    cover: function (I, tv) {
      var imgs = $$(I.img), tabs = $$(I.tab), menus = $$(I.menu);
      return $$(I.micro).map(function (m, i) {
        var name = text($('strong', m)), full = text(m), menu = menus[i];
        /* The tagline is the loose text after the bold name. */
        return {
          title: name, tagline: clean(full.indexOf(name) === 0 ? full.slice(name.length) : full), short: text(tabs[i]), src: imgs[i] ? imgs[i].getAttribute('src') : '', alt: imgs[i] ? imgs[i].getAttribute('alt') : name,
          menuName: menu ? text($('strong', menu)) : name, menuTag: menu ? text($('.b-cover-menu__tag', menu)) : '', body: menu ? $('.b-cbody-cover', menu) : null,
          ref: tv.connector.normalise('cover', name), index: i + 1
        };
      });
    },
    size: function (I, tv) {
      return $$(I.sel).map(function (n) {
        var name = text($(I.name, n)), dims = text($(I.dims, n));
        var d = dims.match(/(\d+)\s*[×x]\s*(\d+)/);
        return { title: name, dims: dims, w: d ? +d[1] : 0, l: d ? +d[2] : 0, ref: tv.connector.normalise('size', name + ' — ' + dims) };
      });
    }
  };

  function selectedOf(tv, key, items) {
    var s = tv.state()[key], hit = null;
    if (!s) return null;
    each(items, function (it) { if (!hit && same(s, it.ref)) hit = it; });
    return hit;
  }

  /* One block of "mattress cross-section" used by the height screens. */
  function slabVisual(value, cover, max) {
    var total = value + cover, band = cover ? (cover / 2) / total * 100 : 0;
    return el('div', { class: 'sc-slab', style: 'height:' + (total / max * 100).toFixed(1) + '%' }, [
      el('i', { class: 'sc-slab__cover', style: 'height:' + band.toFixed(2) + '%' }),
      el('i', { class: 'sc-slab__core' }),
      el('i', { class: 'sc-slab__cover', style: 'height:' + band.toFixed(2) + '%' })
    ]);
  }

  /* To-scale outline of a mattress (head end at the top). */
  function footprint(w, l, box) {
    var big = 220;
    return el('div', { class: 'sc-print', style: 'width:' + (w / big * box).toFixed(1) + 'px;height:' + (l / big * box).toFixed(1) + 'px' }, [
      el('span', { class: 'sc-print__w', text: w + ' cm' }),
      el('span', { class: 'sc-print__l', text: l + ' cm' })
    ]);
  }

  /* ================================================================== */
  /* Selections: choose                                                  */
  /* ================================================================== */

  var VISUALS = {};

  scenes.choose = function (c) {
    var P = c.p, tv = c.tv, root = c.root, key = P.option;
    var items = READERS[key](P.items, tv);
    var head = readHead(P.head) || (P.title ? { title: P.title } : null);
    if (head) root.appendChild(headBlock(head, 'sc-head--tight'));
    var ctx = {
      tv: tv, c: c, P: P, key: key, items: items, preview: null, focus: null, selected: null,
      pick: function (item) {
        ctx.preview = item;
        tv.choose(key, item.ref);
        ctx.render();
      },
      resolve: function () {
        ctx.selected = selectedOf(tv, key, items);
        ctx.focus = ctx.selected || ctx.preview;
      }
    };
    var ui = VISUALS[P.visual](ctx);
    root.appendChild(ui.el);
    ctx.render = function () { ctx.resolve(); ui.render(); };
    ctx.render();
    return { update: function () { ctx.render(); } };
  };

  /* Firmness: one weight scale; the segment that holds your weight is yours. */
  VISUALS.scale = function (ctx) {
    var tv = ctx.tv, P = ctx.P, items = ctx.items;
    var spans = items.map(function (it) { return it.hi != null ? it.hi - it.lo + 1 : 0; });
    var known = spans.filter(Boolean), avg = known.reduce(function (a, b) { return a + b; }, 0) / (known.length || 1);
    spans = spans.map(function (s) { return s || Math.round(avg * 0.8); });

    var track = el('div', { class: 'sc-scale', role: 'group', 'aria-label': P.label || 'Firmness' });
    var segs = items.map(function (it, i) {
      var meter = el('span', { class: 'sc-meter', 'aria-hidden': 'true' }, items.map(function (x, k) { return el('i', { class: k <= i ? 'on' : '' }); }));
      var b = el('button', { type: 'button', class: 'sc-seg', 'aria-pressed': 'false', style: 'flex-grow:' + spans[i], onclick: function () { ctx.pick(it); } }, [
        meter,
        el('span', { class: 'sc-seg__n', text: it.title }),
        el('span', { class: 'sc-seg__kg', text: it.kg }),
        el('span', { class: 'sc-seg__st', text: it.st })
      ]);
      track.appendChild(b);
      return b;
    });

    /* Every range's explanation is built once; only the focused one shows. */
    var hint = el('p', { class: 'sc-detail__hint', text: P.hint || 'Choose a range to see what it means.' });
    var ones = items.map(function (f) {
      return el('div', { class: 'sc-detailone' }, [
        el('h3', { class: 'sc-detail__t', text: f.title }),
        el('p', { class: 'sc-detail__m', text: f.kg + ' · ' + f.st }),
        rich('p', 'sc-p', f.body)
      ]);
    });
    var detail = el('div', { class: 'sc-detail', 'aria-live': 'polite' }, [hint].concat(ones));
    var cta = button(P.resultLabel || 'Your choice', 'sc-btn--solid', function () { tv.userAction(); tv.go(ctx.c.chapter.id, P.result); });
    cta.hidden = true;

    var decisions = el('div', { class: 'sc-decide' });
    each($$(P.decision), function (d) {
      decisions.appendChild(el('div', { class: 'sc-decide__i' }, [
        el('span', { class: 'sc-decide__mk', 'aria-hidden': 'true', text: text($('.b-fdecision__mark', d)) }),
        el('div', {}, [el('p', { class: 'sc-decide__t', text: text($('.b-fdecision__label', d)) }), rich('p', 'sc-decide__p', $('.b-fdecision__hint', d))])
      ]));
    });

    var note = P.note && text($(P.note));
    var wrap = el('div', { class: 'sc-choose' }, [
      track,
      el('div', { class: 'sc-detailrow' }, [detail, cta]),
      note ? el('p', { class: 'sc-note', text: note }) : null,
      decisions
    ]);

    return {
      el: wrap,
      render: function () {
        each(items, function (it, i) {
          var on = ctx.selected === it, pv = !on && ctx.preview === it;
          segs[i].classList.toggle('is-selected', on);
          segs[i].classList.toggle('is-preview', pv);
          segs[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        each(ones, function (o, i) { o.hidden = ctx.focus !== items[i]; });
        hint.hidden = !!ctx.focus;
        cta.hidden = !ctx.selected;
      }
    };
  };

  /* Height: the three depths to scale, each one tappable. */
  VISUALS.slabs = function (ctx) {
    var tv = ctx.tv, items = ctx.items, cover = tv.product.coverAddsCm || 0;
    var max = Math.max.apply(Math, items.map(function (i) { return i.value; })) + cover;
    var row = el('div', { class: 'sc-slabs', role: 'group', 'aria-label': ctx.P.label || 'Height' });
    var cards = items.map(function (it) {
      var b = el('button', { type: 'button', class: 'sc-slabcard', 'aria-pressed': 'false', onclick: function () { ctx.pick(it); } }, [
        el('span', { class: 'sc-slabcard__stage' }, [slabVisual(it.value, cover, max)]),
        el('span', { class: 'sc-slabcard__cm', text: it.cm }),
        el('span', { class: 'sc-slabcard__in', text: it.inch }),
        el('span', { class: 'sc-slabcard__n', text: it.title }),
        rich('span', 'sc-slabcard__p', it.body),
        cover ? el('span', { class: 'sc-slabcard__tot', text: '≈ ' + (it.value + cover) + ' cm with cover' }) : null
      ]);
      row.appendChild(b);
      return b;
    });
    var cta = button(ctx.P.resultLabel || 'Your choice', 'sc-btn--solid', function () { tv.userAction(); tv.go(ctx.c.chapter.id, ctx.P.result); });
    cta.hidden = true;
    return {
      el: el('div', { class: 'sc-choose' }, [row, el('div', { class: 'sc-detailrow sc-detailrow--end' }, [cta])]),
      render: function () {
        each(items, function (it, i) {
          var on = ctx.selected === it;
          cards[i].classList.toggle('is-selected', on);
          cards[i].classList.toggle('is-preview', !on && ctx.preview === it);
          cards[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        cta.hidden = !ctx.selected;
      }
    };
  };

  /* Covers: a large texture viewer; tap a cover and it becomes your cover. */
  VISUALS.swatches = function (ctx) {
    var tv = ctx.tv, items = ctx.items;
    var img = el('img', { class: 'sc-viewer__img', alt: '', loading: 'lazy' });
    var badge = el('span', { class: 'sc-viewer__badge' });
    var cap = el('div', { class: 'sc-viewer__cap' });
    var viewer = el('figure', { class: 'sc-viewer' }, [img, badge, cap]);
    var list = el('div', { class: 'sc-swatches', role: 'group', 'aria-label': ctx.P.label || 'Cover' });
    var btns = items.map(function (it) {
      var b = el('button', { type: 'button', class: 'sc-swatch', 'aria-pressed': 'false', onclick: function () { ctx.pick(it); } }, [
        el('span', { class: 'sc-swatch__img', style: 'background-image:url("' + it.src + '")', 'aria-hidden': 'true' }),
        el('span', { class: 'sc-swatch__t' }, [el('strong', { text: it.short || it.title }), el('span', { text: it.tagline })])
      ]);
      list.appendChild(b);
      return b;
    });
    var cta = button(ctx.P.resultLabel || 'Your choice', 'sc-btn--solid', function () { tv.userAction(); tv.go(ctx.c.chapter.id, ctx.P.result); });
    cta.hidden = true;
    return {
      el: el('div', { class: 'sc-swatchrow' }, [viewer, el('div', { class: 'sc-swatchcol' }, [list, cta])]),
      render: function () {
        var f = ctx.focus || items[0];
        img.src = f.src;
        img.alt = f.alt || f.title;
        badge.textContent = ctx.selected ? 'Selected' : 'Preview';
        badge.classList.toggle('is-selected', !!ctx.selected);
        clear(cap);
        cap.appendChild(el('strong', { text: f.title }));
        cap.appendChild(el('span', { text: f.tagline }));
        each(items, function (it, i) {
          var on = ctx.selected === it;
          btns[i].classList.toggle('is-selected', on);
          btns[i].classList.toggle('is-preview', !on && ctx.preview === it);
          btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        cta.hidden = !ctx.selected;
      }
    };
  };

  /* Size: every size as a tap target, with the chosen one drawn to scale. */
  VISUALS.sizes = function (ctx) {
    var items = ctx.items;
    var grid = el('div', { class: 'sc-sizes', role: 'group', 'aria-label': ctx.P.label || 'Size' });
    var btns = items.map(function (it) {
      var b = el('button', { type: 'button', class: 'sc-size', 'aria-pressed': 'false', onclick: function () { ctx.pick(it); } }, [
        el('span', { class: 'sc-size__n', text: it.title }), el('span', { class: 'sc-size__d', text: it.dims })
      ]);
      grid.appendChild(b);
      return b;
    });
    var stage = el('div', { class: 'sc-printstage', 'aria-live': 'polite' });
    return {
      el: el('div', { class: 'sc-sizerow' }, [grid, stage]),
      render: function () {
        each(items, function (it, i) {
          var on = ctx.selected === it;
          btns[i].classList.toggle('is-selected', on);
          btns[i].classList.toggle('is-preview', !on && ctx.preview === it);
          btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        clear(stage);
        var f = ctx.focus;
        if (!f) { stage.appendChild(el('p', { class: 'sc-detail__hint', text: ctx.P.hint || 'Choose a size to see it drawn to scale.' })); return; }
        stage.appendChild(el('div', { class: 'sc-printbox' }, [footprint(f.w, f.l, 168)]));
        stage.appendChild(el('p', { class: 'sc-print__n', text: f.title }));
        stage.appendChild(el('p', { class: 'sc-print__d', text: f.dims }));
      }
    };
  };

  /* ================================================================== */
  /* Selections: result ("Your …")                                       */
  /* ================================================================== */

  scenes.result = function (c) {
    var P = c.p, tv = c.tv, root = c.root, key = P.option;
    var items = READERS[key](P.items, tv);
    var box = el('div', { class: 'sc-result' });
    root.appendChild(box);
    var goChoose = { chapter: c.chapter.id, panel: P.choose };

    function render() {
      clear(box);
      box.className = 'sc-result is-' + P.visual;
      var it = selectedOf(tv, key, items);
      if (!it) { box.appendChild(empty(tv, P.empty, goChoose)); return; }
      var change = button(P.changeLabel || 'Change', 'sc-btn--ghost', function () { tv.userAction(); tv.go(goChoose.chapter, goChoose.panel); });
      RESULTS[P.visual](tv, P, items, it, box, change);
    }
    render();
    return { update: render };
  };

  var RESULTS = {};

  RESULTS.firmness = function (tv, P, items, it, box, change) {
    var track = el('div', { class: 'sc-scale sc-scale--mini', 'aria-hidden': 'true' });
    each(items, function (x, i) {
      var span = x.hi != null ? x.hi - x.lo + 1 : 22;
      track.appendChild(el('span', { class: 'sc-seg sc-seg--mini' + (x === it ? ' is-selected' : ''), style: 'flex-grow:' + span }, [
        el('span', { class: 'sc-seg__n', text: x.title }), el('span', { class: 'sc-seg__kg', text: x.kg })
      ]));
    });
    box.appendChild(el('div', { class: 'sc-result__main' }, [
      el('p', { class: 'sc-kicker sc-kicker--dark', text: P.kicker }),
      el('h2', { class: 'sc-big', text: it.title }),
      el('p', { class: 'sc-result__fig', text: it.kg }),
      el('p', { class: 'sc-result__sub', text: it.st }),
      rich('p', 'sc-p sc-p--lg', it.body)
    ]));
    box.appendChild(el('aside', { class: 'sc-result__side' }, [
      track,
      P.note ? el('p', { class: 'sc-note', text: text($(P.note)) }) : null,
      change
    ]));
  };

  RESULTS.height = function (tv, P, items, it, box, change) {
    var cover = tv.product.coverAddsCm || 0;
    var max = Math.max.apply(Math, items.map(function (i) { return i.value; })) + cover;
    box.appendChild(el('div', { class: 'sc-result__art' }, [el('div', { class: 'sc-result__stage' }, [slabVisual(it.value, cover, max)])]));
    box.appendChild(el('div', { class: 'sc-result__main' }, [
      el('p', { class: 'sc-kicker sc-kicker--dark', text: P.kicker }),
      el('h2', { class: 'sc-big', text: it.cm + ' cm' }),
      el('p', { class: 'sc-result__sub', text: it.inch.replace(/^\s*cm\s*·\s*/i, '') }),
      el('h3', { class: 'sc-detail__t', text: it.title }),
      rich('p', 'sc-p sc-p--lg', it.body),
      cover ? el('p', { class: 'sc-note', text: '≈ ' + (it.value + cover) + ' cm with cover' }) : null,
      change
    ]));
  };

  RESULTS.cover = function (tv, P, items, it, box, change) {
    var facts = P.facts && $(P.facts), rows = [];
    if (facts) each($$('.b-irow', facts), function (r) { rows.push(el('dt', { text: text($('.b-ilab', r)) })); rows.push(el('dd', { text: text($('.b-ival', r)) })); });
    box.appendChild(el('figure', { class: 'sc-viewer sc-viewer--result' }, [
      el('img', { class: 'sc-viewer__img', src: it.src, alt: it.alt || it.title }),
      el('span', { class: 'sc-viewer__badge is-selected', text: 'Selected' })
    ]));
    box.appendChild(el('div', { class: 'sc-result__main' }, [
      el('p', { class: 'sc-kicker sc-kicker--dark', text: P.kicker }),
      el('h2', { class: 'sc-big sc-big--m', text: it.title }),
      el('p', { class: 'sc-result__sub', text: it.tagline }),
      el('h3', { class: 'sc-detail__t', text: it.menuName + ' — ' + it.menuTag }),
      rich('p', 'sc-p sc-p--lg', it.body),
      rows.length ? el('dl', { class: 'sc-facts sc-facts--compact' }, rows) : null,
      change
    ]));
  };

  /* ================================================================== */
  /* Covers: compare the four materials side by side                     */
  /* ================================================================== */

  scenes.compare = function (c) {
    var P = c.p, root = c.root, imgs = $$(P.images);
    var grid = el('div', { class: 'sc-compare' });
    each($$(P.items), function (m, i) {
      grid.appendChild(el('article', { class: 'sc-mat' }, [
        imgs[i] ? el('img', { class: 'sc-mat__img', src: imgs[i].getAttribute('src'), alt: imgs[i].getAttribute('alt') || '', loading: 'lazy' }) : null,
        el('h3', { class: 'sc-card__t', text: text($('strong', m)) }),
        el('p', { class: 'sc-card__s', text: text($('.b-cover-menu__tag', m)) }),
        rich('p', 'sc-card__p', $('.b-cbody-cover', m))
      ]));
    });
    root.appendChild(grid);
  };

  /* ================================================================== */
  /* 7-zone explorer                                                     */
  /* ================================================================== */

  scenes.zones = function (c) {
    var P = c.p, tv = c.tv, root = c.root;
    var head = readHead(P.head);
    if (head) root.appendChild(headBlock(head, 'sc-head--tight'));

    var d = $(P.details), paras = {};
    each(d ? blocks($('.d-body', d)) : [], function (b) {
      if (b.t !== 'p') return;
      var s = $('strong', b.n), m = s && text(s).match(/\(Z(\d)\)/);
      if (!m) return;
      var clone = b.n.cloneNode(true), first = $('strong', clone);
      first.parentNode.removeChild(first);
      var node = rich('p', 'sc-p sc-p--lg', clone);
      if (node.firstChild && node.firstChild.nodeType === 3) node.firstChild.nodeValue = node.firstChild.nodeValue.replace(/^\s*[—–-]\s*/, '');
      paras[m[1]] = node;
    });

    var zones = $$(P.items).map(function (z) {
      var code = text($(P.map.code, z)).replace(/\D/g, '');
      return { name: text($(P.map.name, z)), note: text($(P.map.note, z)), body: paras[code] };
    });

    /* The seven-zone drawing: the picture only, from the front page. */
    var art = el('div', { class: 'sc-zoneart', role: 'img', 'aria-label': P.label || 'Seven support zones, head to feet' });
    /* The string is our own static drawing; the HTML parser builds it as a
       real SVG tree (an imported XML node did not render in the shadow root). */
    if (tv.product.zonesSvg) art.innerHTML = tv.product.zonesSvg;
    root.appendChild(art);

    /* Every zone, head to feet, in the same order as the drawing. */
    var list = el('div', { class: 'sc-zonelist' });
    each(zones, function (z) {
      list.appendChild(el('article', { class: 'sc-zoneitem' }, [
        el('h3', { class: 'sc-card__t', text: z.name }),
        el('p', { class: 'sc-tag', text: z.note }),
        z.body
      ]));
    });

    var mtv = P.media && $(P.media);
    root.appendChild(el('div', { class: 'sc-zonerow' }, [list, mtv ? figure(tv, mtv) : null]));
  };

  /* ================================================================== */
  /* Warranty numerals                                                   */
  /* ================================================================== */

  scenes.numerals = function (c) {
    var P = c.p, root = c.root, M = P.map;
    var row = el('div', { class: 'sc-numerals' });
    each($$(P.items), function (n) {
      row.appendChild(el('article', { class: 'sc-numeral' + (/--gift/.test(n.className) ? ' is-dark' : '') }, [
        M.kicker && $(M.kicker, n) ? el('p', { class: 'sc-kicker sc-kicker--dark', text: text($(M.kicker, n)) }) : null,
        el('p', { class: 'sc-numeral__v', text: text($(M.value, n)) }),
        el('p', { class: 'sc-numeral__u', text: text($(M.unit, n)) }),
        rich('p', 'sc-numeral__p', $(M.text, n))
      ]));
    });
    var head = readHead(P.head);
    if (head) root.appendChild(headBlock(head, 'sc-head--tight'));
    root.appendChild(row);
  };

  /* ================================================================== */
  /* Your configuration                                                  */
  /* ================================================================== */

  scenes.summary = function (c) {
    var P = c.p, tv = c.tv, root = c.root, opts = tv.product.options;
    var data = {};
    each(['size', 'depth', 'firmness', 'cover'], function (k) { if (P.items[k]) data[k] = READERS[k](P.items[k], tv); });
    var cover = tv.product.coverAddsCm || 0;
    var maxDepth = data.depth ? Math.max.apply(Math, data.depth.map(function (i) { return i.value; })) + cover : 0;

    var statusEl = el('p', { class: 'sc-sum__state' }), grid = el('div', { class: 'sc-sum__grid' });
    var priceEl = el('p', { class: 'sc-sum__price' });
    var close = el('div', { class: 'sc-sum__close' }, [
      el('h3', { class: 'sc-sum__ct', text: text($(P.ctaTitle)) }),
      rich('p', 'sc-sum__cp', $(P.ctaText)),
      el('div', { class: 'sc-sum__sign' }, [tv.brandMark('ddtv-mark--sm')])
    ]);

    function visual(key, it) {
      if (key === 'cover') return el('span', { class: 'sc-sum__img', style: 'background-image:url("' + it.src + '")', 'aria-hidden': 'true' });
      if (key === 'depth') return el('span', { class: 'sc-sum__art', 'aria-hidden': 'true' }, [slabVisual(it.value, cover, maxDepth)]);
      if (key === 'size') return el('span', { class: 'sc-sum__art', 'aria-hidden': 'true' }, [footprint(it.w, it.l, 54)]);
      return el('span', { class: 'sc-sum__mark', 'aria-hidden': 'true' }, [el('span', { class: 'sc-meter' }, data.firmness.map(function (x, k) { return el('i', { class: k <= data.firmness.indexOf(it) ? 'on' : '' }); }))]);
    }
    function detailOf(key, it) {
      if (key === 'firmness') return it.kg + ' · ' + it.st;
      if (key === 'depth') return it.title + ' · ≈ ' + (it.value + cover) + ' cm with cover';
      if (key === 'cover') return it.tagline;
      return it.title;
    }

    function render(state) {
      state = state || tv.state();
      clear(grid);
      var open = 0;
      each(['size', 'depth', 'firmness', 'cover'], function (key) {
        if (!data[key]) return;
        var it = selectedOf(tv, key, data[key]), o = opts[key];
        if (!it) open++;
        var go = o.chapter + '/' + o.panel;
        grid.appendChild(el('div', { class: 'sc-sum__item' + (it ? '' : ' is-missing') }, [
          it ? visual(key, it) : el('span', { class: 'sc-sum__mark is-empty', 'aria-hidden': 'true' }),
          el('div', { class: 'sc-sum__body' }, [
            el('p', { class: 'sc-sum__k', text: o.label }),
            el('p', { class: 'sc-sum__v', text: it ? (key === 'size' ? it.title + ' · ' + it.dims : key === 'depth' ? it.cm + ' cm' : it.title) : 'Not chosen yet' }),
            it ? el('p', { class: 'sc-sum__d', text: detailOf(key, it) }) : null
          ]),
          el('button', { type: 'button', class: 'sc-btn sc-btn--ghost sc-btn--sm', 'data-go': go }, [it ? (P.changeLabel || 'Change') : (P.chooseLabel || 'Choose')])
        ]));
      });
      statusEl.textContent = open ? (open + (open === 1 ? ' choice' : ' choices') + ' still to make') : 'Every choice is made';
      statusEl.classList.toggle('is-done', !open);
      var pr = state.$price;
      clear(priceEl);
      priceEl.hidden = !pr;
      if (pr) {
        priceEl.appendChild(el('span', { class: 'sc-sum__pk', text: 'Price' }));
        priceEl.appendChild(el('b', { text: pr.current }));
        if (pr.compare) priceEl.appendChild(el('s', { text: pr.compare }));
      }
    }

    root.appendChild(el('div', { class: 'sc-sum' }, [
      el('div', { class: 'sc-sum__top' }, [el('h2', { class: 'sc-title sc-title--s', text: P.title }), statusEl, priceEl]),
      grid,
      close
    ]));
    render();
    return { update: render };
  };

  DDTV.extract = { text: text, blocks: blocks, topicsOf: topicsOf, readHead: readHead, summaryTitle: summaryTitle };
})(window);

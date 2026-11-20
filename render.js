/* Liten renderare för skissens mall: {{ hål }}, <sc-if>, <sc-for> och onClick/onChange. */
(function () {
  var HAL = /\{\{\s*([^}]+?)\s*\}\}/g;
  var ETT = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var TOMMA = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
  var komp = null, hanterare = [], vantar = false;

  function hamta(vag, scope) {
    vag = vag.trim();
    if (vag === 'true') return true;
    if (vag === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(vag)) return +vag;
    var v = scope, delar = vag.split('.');
    for (var i = 0; i < delar.length; i++) { if (v == null) return undefined; v = v[delar[i]]; }
    return v;
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fyll(str, scope) { return str.replace(HAL, function (m, p) { var v = hamta(p, scope); return v == null ? '' : String(v); }); }
  function ettHal(str) { var m = ETT.exec(str || ''); return m ? m[1] : null; }

  function barn(nod, scope) {
    var ut = '';
    for (var c = nod.firstChild; c; c = c.nextSibling) ut += nodHtml(c, scope);
    return ut;
  }
  function nodHtml(nod, scope) {
    if (nod.nodeType === 3) return esc(fyll(nod.nodeValue, scope));
    if (nod.nodeType !== 1) return '';
    var tag = nod.tagName.toLowerCase();
    if (tag === 'sc-if') return hamta(ettHal(nod.getAttribute('value')), scope) ? barn(nod, scope) : '';
    if (tag === 'sc-for') {
      var lista = hamta(ettHal(nod.getAttribute('list')), scope) || [], som = nod.getAttribute('as'), ut = '';
      for (var i = 0; i < lista.length; i++) { var sc = Object.assign({}, scope); sc[som] = lista[i]; ut += barn(nod, sc); }
      return ut;
    }
    var namn = nod.tagName.toLowerCase() === tag && nod.namespaceURI === 'http://www.w3.org/1999/xhtml' ? tag : nod.tagName;
    var ut = '<' + namn;
    for (var j = 0; j < nod.attributes.length; j++) {
      var at = nod.attributes[j], an = at.name;
      if (an.indexOf('hint-') === 0) continue;
      if (/^on[a-z]+$/i.test(an)) {
        var fn = hamta(ettHal(at.value) || '', scope);
        if (typeof fn === 'function') { hanterare.push(fn); ut += ' data-on-' + an.slice(2).toLowerCase() + '="' + (hanterare.length - 1) + '"'; }
        continue;
      }
      ut += ' ' + an + '="' + esc(fyll(at.value, scope)) + '"';
    }
    ut += '>';
    if (TOMMA[tag]) return ut;
    return ut + barn(nod, scope) + '</' + namn + '>';
  }

  function rita() {
    vantar = false;
    var mall = document.getElementById('mall').content;
    hanterare = [];
    var html = '<div id="app">' + barn(mall, komp.renderVals()) + '</div>';
    morphdom(document.getElementById('app'), html, {
      onBeforeElUpdated: function (fran, till) { return !fran.isEqualNode(till); }
    });
  }
  function schemalagg() { if (!vantar) { vantar = true; Promise.resolve().then(rita); } }

  window.DCLogic = function (props) { this.props = props || {}; this.state = {}; };
  window.DCLogic.prototype.setState = function (o) {
    Object.assign(this.state, typeof o === 'function' ? o(this.state) : o);
    schemalagg();
  };

  function anrop(attr, e) {
    var el = e.target.closest ? e.target.closest('[' + attr + ']') : null;
    if (!el) return false;
    var fn = hanterare[+el.getAttribute(attr)];
    if (fn) fn(e);
    return true;
  }

  window.starta = function (Klass) {
    komp = new Klass({});
    rita();
    var app = document.getElementById('app');
    document.addEventListener('click', function (e) {
      var traff = anrop('data-on-click', e);
      var a = e.target.closest ? e.target.closest('a[href="#"]') : null;
      if (a) e.preventDefault();
      return traff;
    });
    document.addEventListener('input', function (e) { if (e.target.type !== 'file') anrop('data-on-change', e); });
    document.addEventListener('change', function (e) { if (e.target.type === 'file' || e.target.tagName === 'SELECT') anrop('data-on-change', e); });
  };
})();

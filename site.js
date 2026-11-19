/* Atlas — site limpo do mapa.
   Abre o mapa do Cartógrafo (.json) e desenha aqui, sem mudar nada no arquivo. No modo mestre (?mestre no
   endereço) você cria os lugares do índice (número, nome e tipo), arrasta os círculos para o mapa e preenche a
   página de cada lugar: Arte · História e elenco · Mapa (imagens) · Catálogo/Cardápio. A legenda é formada
   pelos números colocados. Os tipos de lugar (nome, cor e ícone) são criados por você e viram sugestões; a
   legenda filtra os marcadores por tipo. Uma camada de áreas (que liga e desliga) marca os distritos com notas.
   Tudo fica salvo no navegador e sai num pacote (.zip) para publicar. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => (p || 'x') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const r1 = (v) => Math.round(v * 10) / 10;
  const debounce = (fn, ms) => { let t = null; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const RASCUNHO = 'atlas.lugares.v1', FILTRO = 'atlas.filtro.v1', CAMADA = 'atlas.areas.v1';
  const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const gravar = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };

  // ---------------- ícones e cores dos tipos de lugar ----------------
  const svgIc = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${d}"/></svg>`;
  const ICONES = [
    ['caneca', 'Caneca', 'M4.5 4h11v2.2h2.3A2.7 2.7 0 0 1 20.5 9v4.6a2.7 2.7 0 0 1-2.7 2.7h-2.3V20h-11zM15.5 8.4v5.7h2.1a.7.7 0 0 0 .7-.7V9.1a.7.7 0 0 0-.7-.7z'],
    ['cama', 'Cama', 'M2 5h2v8h18v6h-2v-2H4v2H2zM7.5 7.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM11 8h7.5a2.5 2.5 0 0 1 2.5 2.5V12H11z'],
    ['frasco', 'Poção', 'M9 2h6v2h-1v4.3l5.3 8.4A3.5 3.5 0 0 1 16.3 22H7.7a3.5 3.5 0 0 1-3-5.3L10 8.3V4H9zM8 15h8l-2.6-4.2h-2.8z'],
    ['moeda', 'Moedas', 'M8.5 2.5h7l-2 3.5h-3zM12 7c4.6 0 8.5 5 8.5 9.3 0 3.2-2.6 5.7-8.5 5.7s-8.5-2.5-8.5-5.7C3.5 12 7.4 7 12 7zm0 5.3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
    ['martelo', 'Martelo', 'M3.5 7.5 8.6 3l3 3-1.4 1.4L21 18.2 18.2 21 7.4 10.2 6 11.6z'],
    ['livro', 'Livro', 'M3 5c2.8-1.3 6-1.3 8 .5V20c-2-1.6-5.2-1.8-8-.6zM13 5.5c2-1.8 5.2-1.8 8-.5v14.4c-2.8-1.2-6-1-8 .6z'],
    ['templo', 'Templo', 'M12 2.5 21.5 7v2h-19V7zM4 10.5h3v7H4zM10.5 10.5h3v7h-3zM17 10.5h3v7h-3zM2.5 18.5h19v3h-19z'],
    ['chama', 'Chama', 'M12 2c.9 4.2 6.5 6.1 6.5 12a6.5 6.5 0 0 1-13 0c0-3.1 1.8-5.2 3-7.2.2 2.1 1.1 3.3 2.3 3.6-.4-3-.2-5.6 1.2-8.4z'],
    ['cura', 'Cura', 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z'],
    ['escudo', 'Escudo', 'M12 2l8.5 3.2v6.1c0 5.6-3.6 9.4-8.5 10.7C7.1 20.7 3.5 16.9 3.5 11.3V5.2z'],
    ['espada', 'Espada', 'M11 2h2l1 2.5V14h-4V4.5zM6 14h12v2H6zM11 16h2v3.5h-2zM12 19.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5z'],
    ['bandeira', 'Bandeira', 'M5 2h2v20H5zM8.5 3H20l-2.6 4.5L20 12H8.5z'],
    ['coroa', 'Coroa', 'M3 7.5l4.5 4L12 4.5l4.5 7 4.5-4L19.2 18H4.8zM4.8 19.5h14.4V22H4.8z'],
    ['chave', 'Chave', 'M7.5 4.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6zM12.5 8.3H22v2.9h-1.8v3h-2.9v-3h-4.8z'],
    ['caveira', 'Caveira', 'M12 2.5a8 8 0 0 0-8 8c0 2.7 1.3 4.8 3.2 6v3h2v-2h1.8v2h2v-2h1.8v2h2v-3c1.9-1.2 3.2-3.3 3.2-6a8 8 0 0 0-8-8zM8.6 9.2a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2zm6.8 0a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2z'],
    ['olho', 'Olho', 'M12 5C6.6 5 2.8 9.1 1.5 12c1.3 2.9 5.1 7 10.5 7s9.2-4.1 10.5-7C21.2 9.1 17.4 5 12 5zm0 2.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zm0 2.4a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z'],
    ['lua', 'Lua', 'M14.5 2.5a9.5 9.5 0 1 0 7 15.4A8 8 0 0 1 14.5 2.5z'],
    ['estrela', 'Estrela', 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z'],
    ['ancora', 'Âncora', 'M12 1.8a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2zm0 1.5a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM11 7h2v2h3.5v2H13v8.8c2.5-.4 4.4-2 5.1-4.3l-1.7.3 2.6-3.6 1.4 4.3-1.2-.5c-.9 3.6-4 6.2-7.2 6.2s-6.3-2.6-7.2-6.2l-1.2.5 1.4-4.3 2.6 3.6-1.7-.3c.7 2.3 2.6 3.9 5.1 4.3V11H7.5V9H11z'],
    ['barco', 'Barco', 'M11 2.5h1.6v11H11zM13.4 3.5l6.1 9.5h-6.1zM9.8 6 4.5 13h5.3zM2.5 14.5h19l-3.2 5.5H5.7z'],
    ['torre', 'Torre', 'M5.5 2.5h3v2h2v-2h3v2h2v-2h3v5.5l-2 2V20h2v2h-15v-2h2V10l-2-2zM10.5 20v-3.5a1.5 1.5 0 0 1 3 0V20z'],
    ['casa', 'Casa', 'M12 2.8 21.5 11h-2.8v10.2h-5V15h-3.4v6.2h-5V11H2.5z'],
    ['folha', 'Folha', 'M20.5 3C9.5 3 4.5 8.4 4.5 15c0 1.4.3 2.7.8 3.9L3 21.2l1.4 1.4 2.2-2.2c1.3.9 2.9 1.4 4.6 1.4 6.8 0 10.3-6.3 9.3-18.8z'],
    ['nota', 'Música', 'M9 3.5h11v12.8a3.2 3.2 0 1 1-1.8-2.9V7.6h-7.4v10.7a3.2 3.2 0 1 1-1.8-2.9z'],
    ['dado', 'Dado', 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2.8 2.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM12 10.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zm4.2 4.5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z'],
    ['pessoa', 'Pessoa', 'M12 12.2a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.2 0-9.5 2.8-9.5 6.3V22h19v-1.5c0-3.5-4.3-6.3-9.5-6.3z'],
    ['mapa', 'Mapa', 'M3 5.5 9 3l6 2.5L21 3v15.5L15 21l-6-2.5L3 21zM9 5.2v11.2l6 2.4V7.6z']
  ];
  const IC = {}; for (const [k, , d] of ICONES) IC[k] = svgIc(d);
  const CORES = ['#9b3d1d', '#2f5d8a', '#8a6a1f', '#6b4f9a', '#2f7a4b', '#b0306a', '#1f7f86', '#c0641a', '#5a6b2a', '#7a2230', '#3b4f6b', '#4d4a45'];
  // tipos fixos do site antigo: viram tipos normais quando algum lugar ainda usa
  const LEGADO = {
    taverna: ['Taverna / estalagem', '#9b3d1d', 'caneca', 'Cardápio'], emporio: ['Empório / loja', '#2f5d8a', 'frasco', 'Catálogo'],
    oficio: ['Ofício / serviço', '#8a6a1f', 'martelo', 'Serviços'], templo: ['Templo / santuário', '#6b4f9a', 'chama', ''],
    guilda: ['Guilda / facção', '#2f7a4b', 'escudo', ''], outro: ['Outro lugar', '#4d4a45', 'estrela', '']
  };
  const SEM = '_sem';
  const SEM_TIPO = { id: null, nome: 'Sem tipo', cor: '#5f5a52', icone: '', aba: '' };
  const ABAS = [['arte', 'Arte'], ['historia', 'História e elenco'], ['mapa', 'Mapa'], ['catalogo', '']];
  const CAMPOS_AREA = ['População', 'Governante', 'Facção dominante', 'Guarda', 'Comércio', 'Templos', 'Perigos', 'Rumores'];

  // ---------------- estado ----------------
  const S = {
    mestre: (() => { const q = location.search + location.hash; if (/[?&#]mestre=0\b/i.test(q)) { gravar('atlas.mestre', null); return false; } if (/[?&#]mestre\b/i.test(q)) return true; return ler('atlas.mestre') === '1'; })(),
    dados: null, origem: 'vazio', mapa: null, map: null, base: null, lod: null, marcas: null, marcadores: new Map(),
    aberto: null, aba: 'arte', arteSel: 0, colocando: null, empurrou: false,
    filtro: new Set((() => { try { const v = JSON.parse(ler(FILTRO) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } })()),
    verAreas: ler(CAMADA) !== '0', camadaAreas: null, areaAberta: null, desenho: null, edicao: null, ultimoTipo: null
  };

  // ---------------- armazenamento no navegador (imagens e o último mapa aberto) ----------------
  const BD = (() => {
    let db = null; const mem = new Map();
    const pronto = new Promise((ok) => {
      try {
        const r = indexedDB.open('atlas-lugares', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('imagens'); r.result.createObjectStore('mapa'); };
        r.onsuccess = () => { db = r.result; ok(); }; r.onerror = () => ok(); r.onblocked = () => ok();
      } catch (e) { ok(); }
    });
    const k = (s, key) => s + ':' + key;
    return {
      get: (s, key) => pronto.then(() => new Promise((ok) => {
        if (!db) return ok(mem.get(k(s, key)));
        try { const r = db.transaction(s).objectStore(s).get(key); r.onsuccess = () => ok(r.result); r.onerror = () => ok(undefined); } catch (e) { ok(mem.get(k(s, key))); }
      })),
      set: (s, key, val) => pronto.then(() => new Promise((ok) => {
        if (!db) { mem.set(k(s, key), val); return ok(); }
        try { const t = db.transaction(s, 'readwrite'); t.objectStore(s).put(val, key); t.oncomplete = () => ok(); t.onerror = () => { mem.set(k(s, key), val); ok(); }; } catch (e) { mem.set(k(s, key), val); ok(); }
      })),
      del: (s, key) => pronto.then(() => new Promise((ok) => {
        mem.delete(k(s, key)); if (!db) return ok();
        try { const t = db.transaction(s, 'readwrite'); t.objectStore(s).delete(key); t.oncomplete = () => ok(); t.onerror = () => ok(); } catch (e) { ok(); }
      }))
    };
  })();

  // imagens: no projeto ficam como "imagens/arquivo.jpg"; no navegador (ainda não publicadas) ou em data/ do site
  const urls = new Map();
  async function urlImg(ref) {
    if (!ref) return null;
    if (urls.has(ref)) return urls.get(ref);
    const b = await BD.get('imagens', ref);
    const u = b ? URL.createObjectURL(b) : 'data/' + ref;
    urls.set(ref, u); return u;
  }
  const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif' };
  async function guardarImagem(file) {
    let ext = ((file.name || '').match(/\.([a-z0-9]{2,5})$/i) || [])[1] || (file.type.split('/')[1] || 'png');
    ext = ext.toLowerCase().replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    const ref = 'imagens/' + uid('img') + '.' + ext;
    await BD.set('imagens', ref, file); urls.set(ref, URL.createObjectURL(file));
    return ref;
  }
  async function blobDe(ref) {
    const b = await BD.get('imagens', ref); if (b) return b;
    try { const r = await fetch('data/' + ref); if (r.ok) return await r.blob(); } catch (e) { /* sem rede */ }
    return null;
  }
  // coloca as imagens nos <img data-ref> depois de montar o HTML
  function hidratar(root) { for (const im of $$('img[data-ref]', root)) urlImg(im.dataset.ref).then((u) => { if (u) im.src = u; }); }
  function pedirImagens(multi) {
    return new Promise((ok) => {
      const inp = $('#f-imagem'); inp.multiple = !!multi; inp.value = '';
      inp.onchange = async () => { const out = []; for (const f of inp.files) out.push(await guardarImagem(f)); ok(out); };
      inp.click();
    });
  }

  // ---------------- dados: tipos, lugares e áreas ----------------
  const novoDados = () => ({ versao: 2, salvo_em: null, mapa: null, tipos: [], lugares: [], areas: [] });
  const corOk = (c, d) => (/^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c).toLowerCase() : d);
  function normTipo(t) {
    if (!t || !t.id) return null;
    return { id: String(t.id), nome: String(t.nome || '').trim() || 'Tipo', cor: corOk(t.cor, '#4d4a45'), icone: IC[t.icone] ? t.icone : '', aba: String(t.aba || '').trim() };
  }
  // listas de imagens grandes (elenco e mapa): cada uma com legenda e a opção "só para o mestre"
  const normImagens = (lst) => (Array.isArray(lst) ? lst : []).map((x) => (typeof x === 'string' ? { img: x, legenda: '', mestre: false } : { img: x && x.img, legenda: (x && x.legenda) || '', mestre: !!(x && x.mestre) })).filter((x) => x.img);
  function normLugar(p) {
    p = p || {};
    const o = {
      id: p.id || uid('l'), num: p.num === '' || p.num == null ? null : +p.num, nome: p.nome || '', tipo: p.tipo ? String(p.tipo) : null,
      x: p.x == null ? null : +p.x, y: p.y == null ? null : +p.y, secreto: !!p.secreto,
      arte: (p.arte || []).map((a) => (typeof a === 'string' ? { img: a, legenda: '' } : { img: a.img, legenda: a.legenda || '' })).filter((a) => a.img),
      historia: p.historia || '',
      elenco: (p.elenco || []).map((n) => ({ id: n.id || uid('n'), nome: n.nome || '', papel: n.papel || '', texto: n.texto || '', retrato: n.retrato || null, artes: (n.artes || []).filter(Boolean) })),
      elencoImagens: normImagens(p.elencoImagens),
      // mapa do lugar: uma ou mais imagens (o site antigo tinha uma só, em "img", com grade)
      mapa: (() => { const m = p.mapa || {}; return { imagens: normImagens(m.imagens || (m.img ? [m.img] : [])), notas: m.notas || '' }; })(),
      catalogo: Object.assign({ titulo: '', imagens: [], itens: [] }, p.catalogo || {})
    };
    o.catalogo.imagens = (o.catalogo.imagens || []).filter(Boolean);
    o.catalogo.itens = (o.catalogo.itens || []).map((i) => ({ nome: i.nome || '', preco: i.preco || '', texto: i.texto || '', secao: !!i.secao }));
    return o;
  }
  function normArea(a) {
    a = a || {};
    const pts = (Array.isArray(a.pts) ? a.pts : []).filter((q) => Array.isArray(q) && isFinite(q[0]) && isFinite(q[1])).map((q) => [r1(+q[0]), r1(+q[1])]);
    if (pts.length < 3) return null;
    return {
      id: a.id || uid('a'), nome: String(a.nome || '').trim(), cor: corOk(a.cor, '#8b3a1c'), pts, descricao: a.descricao || '',
      info: (Array.isArray(a.info) ? a.info : []).map((i) => ({ campo: String((i && i.campo) || ''), valor: String((i && i.valor) || '') })),
      notas: a.notas || '', secreto: !!a.secreto, distrito: a.distrito || null
    };
  }
  function normalizar(d) {
    const o = novoDados(); if (!d || typeof d !== 'object') return o;
    o.salvo_em = d.salvo_em || null; o.mapa = d.mapa || null;
    const ids = new Set();
    for (const t of (Array.isArray(d.tipos) ? d.tipos : []).map(normTipo)) if (t && !ids.has(t.id)) { ids.add(t.id); o.tipos.push(t); }
    o.lugares = (Array.isArray(d.lugares) ? d.lugares : []).map(normLugar);
    for (const [k, v] of Object.entries(LEGADO)) if (!ids.has(k) && o.lugares.some((p) => p.tipo === k)) { ids.add(k); o.tipos.push({ id: k, nome: v[0], cor: v[1], icone: v[2], aba: v[3] }); }
    for (const p of o.lugares) if (p.tipo && !ids.has(p.tipo)) p.tipo = null;
    o.areas = (Array.isArray(d.areas) ? d.areas : []).map(normArea).filter(Boolean);
    return o;
  }
  const acha = (id) => S.dados.lugares.find((p) => p.id === id);
  const porNumero = (a, b) => (a.num == null) - (b.num == null) || (a.num || 0) - (b.num || 0) || String(a.nome).localeCompare(String(b.nome));
  const proximoNumero = () => S.dados.lugares.reduce((m, p) => Math.max(m, p.num || 0), 0) + 1;
  const titulo = (p) => (p.nome || 'Lugar sem nome');
  // tipos
  const tipoPorId = (id) => (id && S.dados && S.dados.tipos.find((t) => t.id === id)) || null;
  const tipoDe = (p) => tipoPorId(p && p.tipo) || SEM_TIPO;
  const chaveTipo = (p) => (tipoPorId(p.tipo) ? p.tipo : SEM);
  const icone = (t) => (t && t.icone && IC[t.icone]) || '';
  const normNome = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const tipoPorNome = (nome) => { const n = normNome(nome); return n ? S.dados.tipos.find((t) => normNome(t.nome) === n) || null : null; };
  const abaPadrao = (nome) => (/tavern|estalag|pousad|hosped|\bbar\b|botequ|cervej|adega|vinho|restaur|cozinh|casa de ch|caf[eé]|padar|confeit/i.test(nome || '') ? 'Cardápio'
    : /servi[cç]|of[ií]cio|ferreir|alfaiat|curandeir|escriv|barbeir|estabul|estábul|oficina/i.test(nome || '') ? 'Serviços' : 'Catálogo');
  const abaDe = (p) => p.catalogo.titulo || tipoDe(p).aba || abaPadrao(tipoDe(p).nome);
  // ícone sugerido pelo nome de um tipo novo (dá para trocar)
  const PALPITES = [
    [/mercado negro|contraband|ladr[aãoõ]|submundo|covil|esconderijo/, 'chave'], [/casa de ch[aá]|caf[eé]|confeit/, 'caneca'],
    [/tavern|estalag|\bbar\b|botequ|cervej|adega|vinho|bebida|hidromel/, 'caneca'], [/pousad|hosped|hotel|albergue|dormit/, 'cama'],
    [/po[cç][aã]o|po[cç][oõ]es|alquim|botic|apotec|ervan/, 'frasco'], [/cura|curandeir|hospital|m[eé]dic|sanat|enferm/, 'cura'],
    [/loja|emp[oó]rio|mercad|com[eé]rcio|banco|c[aâ]mbio|feira|mercador|penhor/, 'moeda'], [/ferreir|ferrar|oficina|artes[aã]|of[ií]cio|forja|carpint|artífice|artifice/, 'martelo'],
    [/bibliot|livr|escola|academ|universid|arquiv|escrib/, 'livro'], [/templo|santu[aá]rio|igreja|capela|catedral|altar|mosteiro/, 'templo'],
    [/guarda|quartel|mil[ií]cia|forte\b|fortaleza|defesa/, 'escudo'], [/arma|armeir|espada|arena|duelo|gladiad/, 'espada'],
    [/guilda|fac[cç][aã]o|ordem|sede|irmandade|cl[aã]\b/, 'bandeira'], [/nobre|pal[aá]cio|castelo|governo|conselho|magistr|realeza/, 'coroa'],
    [/crime|segredo|cofre/, 'chave'], [/cemit|cripta|necr|tumba|mortos|morte/, 'caveira'],
    [/or[aá]culo|vidente|adivinh|mist[eé]rio|espi[aã]o/, 'olho'], [/bruxa|noite|culto|ocult|lua/, 'lua'], [/m[aá]gic|arcan|mago|feiti|encant/, 'estrela'],
    [/porto|cais|doca|capitania|marinh/, 'ancora'], [/barco|navio|pesca|barqueir|balsa/, 'barco'], [/torre|vigia|farol|observat/, 'torre'],
    [/druid|jardim|horta|bosque|floresta|erva|fazenda|s[ií]tio/, 'folha'], [/teatro|m[uú]sica|bardo|sal[aã]o|festa|baile|circo|dan[cç]a/, 'nota'],
    [/jogo|aposta|cassino|dado|azar/, 'dado'], [/padaria|forno|fundi|fogo|chama/, 'chama'], [/casa|resid|mans[aã]o|moradia/, 'casa'],
    [/mapa|cart[oó]graf|explor|aventur/, 'mapa'], [/contato|personagem|npc|pessoa|informante/, 'pessoa']
  ];
  const iconePadrao = (nome) => { const n = String(nome || '').toLowerCase(); for (const [re, k] of PALPITES) if (re.test(n)) return k; return ''; };
  const proximaCor = (usadas) => { const u = new Set(usadas.map((c) => String(c).toLowerCase())); return CORES.find((c) => !u.has(c)) || CORES[usadas.length % CORES.length]; };
  const visivel = (p) => !S.filtro.has(chaveTipo(p));
  const nomeLivre = (base) => { let n = base, k = 2; while (tipoPorNome(n)) n = base + ' ' + k++; return n; };
  // áreas
  const acharArea = (id) => S.dados.areas.find((a) => a.id === id);
  const areasVisiveis = () => S.dados.areas.filter((a) => !a.secreto || S.mestre);
  function dentro(q, pts) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > q[1]) !== (yj > q[1]) && q[0] < (xj - xi) * (q[1] - yi) / (yj - yi) + xi) c = !c; }
    return c;
  }
  // ponto para o nome da área: o centróide; se cair fora (área côncava), o meio do trecho mais largo naquela altura
  function centroArea(pts) {
    let A = 0, cx = 0, cy = 0; const n = pts.length;
    for (let i = 0; i < n; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n]; const f = x0 * y1 - x1 * y0; A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f; }
    const c = Math.abs(A) > 1e-9 ? [cx / (3 * A), cy / (3 * A)] : pts[0];
    if (dentro(c, pts)) return c;
    const y = c[1]; const xs = [];
    for (let i = 0; i < n; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n]; if ((y0 > y) !== (y1 > y)) xs.push(x0 + (y - y0) / (y1 - y0) * (x1 - x0)); }
    xs.sort((a, b) => a - b); let best = null;
    for (let i = 0; i + 1 < xs.length; i += 2) if (!best || xs[i + 1] - xs[i] > best[1] - best[0]) best = [xs[i], xs[i + 1]];
    return best ? [(best[0] + best[1]) / 2, y] : pts[0];
  }
  const temNotas = (a) => !!(a.descricao || a.info.some((i) => i.valor) || (S.mestre && a.notas));
  const fmtNum = (n) => Math.round(n).toLocaleString('pt-BR');

  function salvar() {
    if (!S.mestre) return;
    S.dados.salvo_em = new Date().toISOString();
    try { localStorage.setItem(RASCUNHO, JSON.stringify(S.dados)); S.origem = 'local'; }
    catch (e) { aviso('Não deu para salvar neste navegador (sem espaço?). Exporte o pacote para não perder nada.'); }
    selo();
  }
  const salvarLogo = debounce(salvar, 400);
  function lerRascunho() { try { const t = localStorage.getItem(RASCUNHO); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  async function lerJson(url) { try { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) return null; return await r.json(); } catch (e) { return null; } }
  const salvarFiltro = () => gravar(FILTRO, S.filtro.size ? JSON.stringify([...S.filtro]) : null);

  // ---------------- interface geral ----------------
  function aviso(txt, ms) { const t = $('#aviso'); t.textContent = txt; t.classList.add('on'); clearTimeout(aviso.t); aviso.t = setTimeout(() => t.classList.remove('on'), ms || 3200); }
  function carregando(txt) { const c = $('#carregando'); if (!txt) { c.hidden = true; return; } $('#carregando-txt').textContent = txt; c.hidden = false; }
  function modal(html) { const m = $('#modal'); const c = $('.cartao', m); c.onclick = c.oninput = c.onchange = c.onkeydown = null; c.innerHTML = html; m.classList.add('on'); return c; }
  function fecharModal() { $('#modal').classList.remove('on'); }
  function confirmar(titulo_, texto_, ok_, perigo) {
    return new Promise((res) => {
      const c = modal(`<h2>${esc(titulo_)}</h2><p>${texto_}</p><div class="rodape"><button class="bt leve" data-a="n">Cancelar</button><button class="bt ${perigo ? 'perigo' : 'forte'}" data-a="s">${esc(ok_)}</button></div>`);
      c.onclick = (e) => { const a = e.target.closest('[data-a]'); if (!a) return; fecharModal(); res(a.dataset.a === 's'); };
    });
  }
  function selo() {
    $('#selo-mestre').hidden = !S.mestre;
    const r = $('#selo-rascunho');
    if (!S.mestre) { r.hidden = true; return; }
    r.hidden = false;
    r.textContent = S.origem === 'local' ? 'rascunho salvo neste navegador' : S.origem === 'publicado' ? 'dados publicados (ainda sem rascunho)' : 'sem lugares ainda';
  }
  function dicaMapa(txt, acoes) {
    const d = $('#dica-mapa'); d.hidden = !txt; d.textContent = txt || '';
    for (const [rot, fn] of acoes || []) { const b = document.createElement('button'); b.className = 'bt mini leve'; b.textContent = rot; b.onclick = fn; d.append(' ', b); }
  }
  function circHTML(p, cls, attrs) {
    const t = tipoDe(p); const ic = icone(t);
    return `<div class="circ${p.secreto ? ' secreto' : ''}${cls ? ' ' + cls : ''}" style="--c:${t.cor}"${attrs || ''}><span>${esc(p.num == null ? '?' : p.num)}</span>${ic ? `<span class="ic">${ic}</span>` : ''}</div>`;
  }
  const pontoTipo = (t, cls) => `<span class="ponto${cls ? ' ' + cls : ''}" style="--c:${t.cor}">${icone(t)}</span>`;
  const gradeIcones = (sel) => `<button type="button" data-ic="" class="sem${!sel ? ' on' : ''}" title="Sem ícone">sem</button>` + ICONES.map(([k, n]) => `<button type="button" data-ic="${k}" class="${k === sel ? 'on' : ''}" title="${esc(n)}">${IC[k]}</button>`).join('');
  function texto(md) {
    const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\s)([^*]+?)\*/g, '$1<i>$2</i>');
    return String(md || '').replace(/\r/g, '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).map((b) => '<p>' + inline(esc(b)).replace(/\n/g, '<br>') + '</p>').join('');
  }
  const toque = () => !!(window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches);
  const celular = () => !!(window.matchMedia && matchMedia('(max-width: 760px)').matches);
  const digitando = (e) => { const t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); };

  // ---------------- mapa base ----------------
  const ll = (x, y) => L.latLng(-y, x);
  const xy = (l) => [l.lng, -l.lat];
  function iniciarMapa() {
    S.map = L.map('mapa', { crs: L.CRS.Simple, zoomControl: false, attributionControl: false, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 90, minZoom: -8, maxZoom: 6 });
    L.control.zoom({ position: 'bottomright', zoomInTitle: 'Aproximar', zoomOutTitle: 'Afastar' }).addTo(S.map);
    // camadas próprias: áreas (acima do mapa), nomes das áreas (abaixo dos círculos) e o desenho/edição (por cima de tudo)
    S.map.createPane('areas').style.zIndex = 420;
    S.map.createPane('rotulos').style.zIndex = 590;
    S.map.createPane('desenho').style.zIndex = 640;
    S.rendAreas = L.svg({ pane: 'areas', padding: 0.5 });
    S.rendDesenho = L.svg({ pane: 'desenho', padding: 0.5 });
    S.camadaAreas = L.layerGroup().addTo(S.map);
    S.marcas = L.layerGroup().addTo(S.map);
    S.map.on('zoomend', aplicarLod);
    S.map.on('click', (e) => {
      if (S.colocando) { colocar(S.colocando, xy(e.latlng)); pararColocar(); return; }
      if (S.desenho) addPonto(xy(e.latlng));
    });
    S.map.on('dblclick', () => { if (S.desenho) concluirDesenho(); });
    S.map.on('mousemove', (e) => { if (S.desenho) guiaDesenho(e.latlng); });
    // círculo do índice solto no mapa
    const el = $('#mapa');
    const ehLugar = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('text/plain') && !Array.from(e.dataTransfer.types || []).includes('Files');
    el.addEventListener('dragover', (e) => { if (!S.mestre || !ehLugar(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; el.classList.add('solta'); });
    el.addEventListener('dragleave', () => el.classList.remove('solta'));
    el.addEventListener('drop', (e) => {
      el.classList.remove('solta'); if (!S.mestre || !ehLugar(e)) return;
      const v = e.dataTransfer.getData('text/plain') || ''; if (!v.startsWith('lugar:')) return;
      e.preventDefault(); e.stopPropagation(); colocar(v.slice(6), xy(S.map.mouseEventToLatLng(e)));
    });
  }
  function aplicarLod() {
    if (!S.lod || !S.map) return;
    const precisa = Math.pow(2, S.map.getZoom()) > S.lod.ppm * 1.15;
    if (precisa && !S.lod.grupo.hasLayer(S.lod.vet)) S.lod.grupo.addLayer(S.lod.vet);
    if (!precisa && S.lod.grupo.hasLayer(S.lod.vet)) S.lod.grupo.removeLayer(S.lod.vet);
  }
  function mostrarMapa(m) {
    if (!S.map) iniciarMapa();
    if (S.base) { S.map.removeLayer(S.base); S.base = null; }
    S.lod = null; S.mapa = m;
    const b = L.latLngBounds(ll(0, m.H), ll(m.W, 0));
    const vet = L.imageOverlay(m.vetor, b, { interactive: false, className: 'base-vetor' });
    const grupo = L.layerGroup().addTo(S.map);
    if (m.raster) { grupo.addLayer(L.imageOverlay(m.raster, b, { interactive: false })); S.lod = { vet, grupo, ppm: m.ppm || 0.35 }; }
    else grupo.addLayer(vet);
    S.base = grupo;
    S.map.setMinZoom(-20); S.map.setMaxZoom(20);
    const z = S.map.getBoundsZoom(b, false);
    S.map.setMinZoom(z - 0.75); S.map.setMaxZoom(z + 6.5); S.map.setMaxBounds(b.pad(0.35));
    S.map.fitBounds(b, { animate: false });
    aplicarLod();
    $('#titulo').textContent = m.titulo || 'Atlas'; document.title = (m.titulo || 'Atlas') + ' — Atlas';
    $('#vazio').hidden = true;
    S.dados.mapa = { titulo: m.titulo || '', W: m.W, H: m.H };
    desenharMarcas(); desenharAreas();
  }
  function mostrarVazio() { $('#vazio').hidden = false; }
  function dimsSvg(txt) {
    const head = txt.slice(0, 4000);
    const vb = head.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/);
    const w = head.match(/<svg[^>]*\swidth="([\d.]+)/), h = head.match(/<svg[^>]*\sheight="([\d.]+)/);
    const t = txt.match(/<title>([^<]*)<\/title>/);
    return { W: vb ? +vb[1] : w ? +w[1] : 1000, H: vb ? +vb[2] : h ? +h[1] : 1000, titulo: t ? t[1] : '' };
  }
  function carregarImg(src) { return new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }); }
  async function rasterizar(url, W, H) {
    try {
      const k = Math.min(1, Math.sqrt(9e6 / (W * H))); const cw = Math.round(W * k), ch = Math.round(H * k);
      const img = new Image(); img.decoding = 'async'; img.src = url; await img.decode();
      const c = document.createElement('canvas'); c.width = cw; c.height = ch; c.getContext('2d').drawImage(img, 0, 0, cw, ch);
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
      return blob ? { blob, ppm: k } : null;
    } catch (e) { return null; } // aberto direto do disco: o navegador não deixa ler o desenho
  }
  async function carregarPublicado() {
    const info = (S.dados && S.dados.mapa) || {};
    // jogadores: começa só com a imagem de longe (data/mapa.jpg); o desenho vetorial (data/mapa.svg, bem mais
    // pesado) só é baixado quando a pessoa aproxima o mapa. Bom para o celular.
    if (!S.mestre && info.W && info.H) {
      const im = await carregarImg('data/mapa.jpg');
      if (im && im.naturalWidth) return { W: info.W, H: info.H, titulo: info.titulo || '', vetor: 'data/mapa.svg', raster: 'data/mapa.jpg', ppm: im.naturalWidth / info.W, origem: 'publicado' };
    }
    let svg = null;
    try { const r = await fetch('data/mapa.svg', { cache: 'no-cache' }); if (r.ok) svg = await r.text(); } catch (e) { /* aberto do disco */ }
    if (svg) {
      const d = dimsSvg(svg); const vetor = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      let raster = null, ppm = null, jpg = null;
      const im = await carregarImg('data/mapa.jpg');
      if (im) { raster = 'data/mapa.jpg'; ppm = im.naturalWidth / d.W; }
      else { const ras = await rasterizar(vetor, d.W, d.H); if (ras) { jpg = ras.blob; raster = URL.createObjectURL(jpg); ppm = ras.ppm; } }
      return { W: d.W, H: d.H, titulo: info.titulo || d.titulo, vetor, raster, ppm, svg, jpg, origem: 'publicado' };
    }
    // aberto direto do disco: as imagens carregam, o fetch não
    const im = await carregarImg('data/mapa.svg');
    if (im && im.naturalWidth) {
      const W = info.W || im.naturalWidth, H = info.H || im.naturalHeight; const jp = await carregarImg('data/mapa.jpg');
      return { W, H, titulo: info.titulo || '', vetor: 'data/mapa.svg', raster: jp ? 'data/mapa.jpg' : null, ppm: jp ? jp.naturalWidth / W : null, origem: 'publicado' };
    }
    let txt = null;
    try { const r = await fetch('data/mapa.json', { cache: 'no-cache' }); if (r.ok) txt = await r.text(); } catch (e) { /* nada */ }
    if (txt) return await desenharJson(txt, 'mapa.json', false);
    return null;
  }
  function mapaDoRegistro(r) {
    return { W: r.W, H: r.H, titulo: r.titulo, vetor: URL.createObjectURL(new Blob([r.svg], { type: 'image/svg+xml' })), raster: r.jpg ? URL.createObjectURL(r.jpg) : null, ppm: r.ppm, svg: r.svg, json: r.json, jpg: r.jpg, nome: r.nome, distritos: r.distritos || null, origem: 'local' };
  }

  // desenho do .json do Cartógrafo (no trabalhador, para a página não travar)
  let T = null; const pedidos = new Map(); let seq = 0;
  function trabalhador() {
    if (T) return T;
    const codigo = $('#nucleo').textContent + '\n;' + $('#trabalhador').textContent;
    T = new Worker(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));
    T.onmessage = (e) => {
      const m = e.data; const p = pedidos.get(m.id); if (!p) return;
      if (m.type === 'progresso') { carregando('Desenhando o mapa… ' + m.nome); return; }
      pedidos.delete(m.id); if (m.type === 'pronto') p.ok(m); else p.erro(new Error(m.mensagem || 'erro'));
    };
    T.onerror = (e) => { for (const p of pedidos.values()) p.erro(new Error(e.message || 'erro no desenho')); pedidos.clear(); T = null; };
    return T;
  }
  function desenharNoTrabalhador(prj) {
    return new Promise((ok, erro) => {
      const id = ++seq; pedidos.set(id, { ok, erro });
      trabalhador().postMessage({ type: 'desenhar', id, prj, opts: { fontsCSS: $('#fontes').textContent, texture: false, player: true, legend: false, numbers: false } });
    });
  }
  async function desenharJson(txt, nome, guardar) {
    let prj;
    try { prj = JSON.parse(txt); } catch (e) { aviso('Esse arquivo não é um .json válido.'); return null; }
    if (!prj || !prj.meta || !Array.isArray(prj.districts)) { aviso('Esse .json não parece um mapa do Cartógrafo.'); return null; }
    carregando('Desenhando o mapa…');
    let res;
    try { res = await desenharNoTrabalhador(prj); } catch (e) { carregando(null); aviso('Não deu para desenhar o mapa: ' + e.message.split('\n')[0], 6000); return null; }
    const svg = res.svg; const distritos = res.distritos || null;
    const W = prj.meta.width || 1000, H = prj.meta.height || 1000; const tit = prj.meta.title || 'Atlas';
    const vetor = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    carregando('Preparando a visão de longe…');
    const ras = await rasterizar(vetor, W, H);
    const m = { W, H, titulo: tit, vetor, raster: ras ? URL.createObjectURL(ras.blob) : null, ppm: ras ? ras.ppm : null, svg, json: txt, jpg: ras ? ras.blob : null, nome, distritos, origem: guardar ? 'local' : 'publicado' };
    if (guardar) await BD.set('mapa', 'local', { W, H, titulo: tit, svg, json: txt, jpg: m.jpg, ppm: m.ppm, nome, distritos, quando: Date.now() });
    carregando(null);
    return m;
  }
  async function abrirArquivoMapa(file) {
    const txt = await file.text();
    const m = await desenharJson(txt, file.name, S.mestre);
    if (!m) return;
    mostrarMapa(m); if (S.mestre) salvar();
    aviso('Mapa aberto: ' + (m.titulo || file.name) + '. O arquivo não foi alterado.');
  }

  // ---------------- círculos no mapa ----------------
  function iconeLugar(p) { return L.divIcon({ className: 'mk' + (S.aberto === p.id ? ' ativo' : ''), html: circHTML(p), iconSize: [34, 34], iconAnchor: [17, 17] }); }
  function desenharMarcas() {
    if (!S.map) return;
    S.marcas.clearLayers(); S.marcadores.clear();
    for (const p of S.dados.lugares) {
      if (p.x == null || p.y == null || (p.secreto && !S.mestre) || !visivel(p)) continue;
      const m = L.marker(ll(p.x, p.y), { icon: iconeLugar(p), draggable: S.mestre, keyboard: true, riseOnHover: true, title: (p.num != null ? p.num + '. ' : '') + titulo(p) });
      m.on('click', () => { if (S.colocando || S.desenho || S.edicao) return; abrirLugar(p.id); });
      m.on('dragend', () => { const q = xy(m.getLatLng()); p.x = r1(q[0]); p.y = r1(q[1]); salvar(); desenharLegenda(); desenharIndice(); if (S.areaAberta) desenharCartaoArea(); });
      m.addTo(S.marcas); S.marcadores.set(p.id, m);
    }
  }
  function colocar(id, q) {
    const p = acha(id); if (!p) return;
    if (S.mapa) { q = [Math.max(0, Math.min(S.mapa.W, q[0])), Math.max(0, Math.min(S.mapa.H, q[1]))]; }
    p.x = r1(q[0]); p.y = r1(q[1]);
    if (S.filtro.delete(chaveTipo(p))) salvarFiltro();
    salvar(); desenharMarcas(); desenharLegenda(); desenharIndice(); if (S.areaAberta) desenharCartaoArea();
    aviso(`Nº ${p.num == null ? '?' : p.num} colocado no mapa.`);
  }
  function comecarColocar(id) {
    const p = acha(id); if (!p || !S.map) return;
    if (S.desenho) cancelarDesenho(); if (S.edicao) cancelarEdicao();
    S.colocando = id; $('#mapa').classList.add('colocando');
    dicaMapa(`${toque() ? 'Toque' : 'Clique'} no mapa para colocar o nº ${p.num == null ? '?' : p.num} (${titulo(p)})`, [['Cancelar', pararColocar]]);
    desenharIndice();
  }
  function pararColocar() { S.colocando = null; $('#mapa').classList.remove('colocando'); dicaMapa(''); desenharIndice(); }
  function verNoMapa(id) {
    const p = acha(id); if (!p || p.x == null || !S.map) return;
    if (!visivel(p)) { S.filtro.delete(chaveTipo(p)); salvarFiltro(); desenharMarcas(); desenharLegenda(); desenharIndice(); }
    S.map.flyTo(ll(p.x, p.y), Math.max(S.map.getZoom(), S.map.getMinZoom() + 3), { duration: 0.6 });
    const m = S.marcadores.get(id); if (m) { const el = m.getElement(); if (el) { el.classList.add('ativo'); setTimeout(() => el.classList.remove('ativo'), 2200); } }
  }

  // ---------------- filtro por tipo ----------------
  function gruposTipo(lista) {
    const g = new Map();
    for (const t of S.dados.tipos) g.set(t.id, { chave: t.id, t, lugares: [] });
    g.set(SEM, { chave: SEM, t: SEM_TIPO, lugares: [] });
    for (const p of lista) g.get(chaveTipo(p)).lugares.push(p);
    return [...g.values()].filter((x) => x.lugares.length);
  }
  function alternarFiltro(chave) { if (S.filtro.has(chave)) S.filtro.delete(chave); else S.filtro.add(chave); salvarFiltro(); redesenharFiltro(); }
  function mostrarTipos(modo) {
    S.filtro.clear();
    if (modo === 'nenhum') { for (const t of S.dados.tipos) S.filtro.add(t.id); S.filtro.add(SEM); }
    else if (modo && modo !== 'todos') { for (const t of S.dados.tipos) if (t.id !== modo) S.filtro.add(t.id); if (modo !== SEM) S.filtro.add(SEM); }
    salvarFiltro(); redesenharFiltro();
  }
  function redesenharFiltro() { desenharMarcas(); desenharLegenda(); desenharIndice(); }

  // ---------------- legenda (formada pelos números colocados) ----------------
  function desenharLegenda() {
    const host = $('#legenda-corpo');
    const todos = S.dados.lugares.filter((p) => p.x != null && (!p.secreto || S.mestre)).sort(porNumero);
    const areas = S.verAreas ? areasVisiveis() : [];
    if (!S.mestre && !todos.length && !areasVisiveis().length && !desenharLegenda.feito) { $('#legenda').hidden = true; $('#b-legenda').classList.remove('on'); }
    desenharLegenda.feito = true;
    let h = '';
    if (!todos.length) h += `<p class="nada">${S.mestre ? 'A legenda se forma sozinha com os números que você coloca no mapa (botão <b>Lugares</b>).' : 'Nenhum lugar marcado ainda.'}</p>`;
    else {
      const grupos = gruposTipo(todos);
      if (grupos.length > 1 || S.filtro.size) {
        h += `<div class="filtro"><div class="filtro-topo"><b>Mostrar</b><button data-f="todos">todos</button>·<button data-f="nenhum">nenhum</button>${S.mestre ? '<span class="esp"></span><button data-f="tipos">editar tipos</button>' : ''}</div><div class="chips">` +
          grupos.map((g) => { const off = S.filtro.has(g.chave); return `<button class="chip${off ? ' off' : ''}" data-filtro="${esc(g.chave)}" aria-pressed="${!off}" title="${off ? 'Mostrar' : 'Esconder'}: ${esc(g.t.nome)} (duplo clique: só este tipo)">${pontoTipo(g.t)}<span>${esc(g.t.nome)}</span><small>${g.lugares.length}</small></button>`; }).join('') + '</div></div>';
      }
      const vis = grupos.filter((g) => !S.filtro.has(g.chave));
      for (const g of vis) {
        if (grupos.length > 1) h += `<h3>${pontoTipo(g.t)}${esc(g.t.nome)}</h3>`;
        h += '<ul>' + g.lugares.map((p) => `<li data-id="${esc(p.id)}" title="Abrir a página">${circHTML(p)}<span class="t">${esc(titulo(p))}${p.secreto ? ' <small>(secreto)</small>' : ''}</span></li>`).join('') + '</ul>';
      }
      const fora = todos.length - vis.reduce((s, g) => s + g.lugares.length, 0);
      if (fora) h += `<p class="nada">${fora} lugar${fora > 1 ? 'es escondidos' : ' escondido'} pelo filtro.</p>`;
    }
    if (areas.length) h += `<h3 class="sec-areas">Áreas</h3><ul class="areas">${areas.map((a) => `<li data-area="${esc(a.id)}" title="Ver a área e as notas"><span class="sw-area" style="--c:${a.cor}"></span><span class="t">${esc(a.nome || 'Área sem nome')}${a.secreto ? ' <small>(secreta)</small>' : ''}</span></li>`).join('')}</ul>`;
    host.innerHTML = h;
  }

  // ---------------- índice de lugares (modo mestre) ----------------
  function desenharIndice() {
    if (!S.mestre) return;
    const host = $('#lista'); const q = $('#busca').value.trim().toLowerCase();
    if (!S.dados.lugares.length) { host.innerHTML = '<li><span class="vazio-lista">Nenhum lugar ainda. Clique em <b>+ Novo lugar</b> para criar o primeiro número.</span></li>'; return; }
    const todos = S.dados.lugares.slice().sort(porNumero);
    const escondidos = todos.filter((p) => !visivel(p)).length;
    const arr = todos.filter((p) => visivel(p) && (!q || String(p.num).includes(q) || titulo(p).toLowerCase().includes(q) || tipoDe(p).nome.toLowerCase().includes(q)));
    let h = escondidos ? `<li class="aviso-filtro"><span>${escondidos} lugar${escondidos > 1 ? 'es escondidos' : ' escondido'} pelo filtro de tipos.</span><button data-a="sem-filtro">Mostrar todos</button></li>` : '';
    h += arr.map((p) => {
      const fora = p.x == null; const t = tipoDe(p);
      return `<li data-id="${esc(p.id)}" class="${S.colocando === p.id ? 'sel' : ''}">
        ${circHTML(p, 'pega' + (fora ? ' fora' : ''), ` draggable="true" title="${fora ? 'Arraste para o mapa (ou clique aqui e depois no mapa)' : 'Arraste para mudar de lugar (ou clique aqui e depois no mapa)'}"`)}
        <div class="nome" title="Abrir a página do lugar"><b>${esc(titulo(p))}</b><small>${esc(t.nome)} · ${fora ? 'fora do mapa' : 'no mapa'}${p.secreto ? ' · secreto' : ''}</small></div>
        <div class="acoes">${fora ? '' : '<button data-a="ver" title="Mostrar no mapa">⌖</button><button data-a="tirar" title="Tirar do mapa (o lugar continua no índice)">✕</button>'}<button data-a="editar" title="Número, nome e tipo">✎</button></div>
      </li>`;
    }).join('') || (escondidos ? '' : '<li><span class="vazio-lista">Nada encontrado.</span></li>');
    host.innerHTML = h;
  }

  // número, nome e tipo de um lugar (novo ou existente); o tipo é escolhido nas sugestões ou criado com nome, cor e ícone
  function editarDados(p) {
    const novo = !p;
    const t0 = novo ? tipoPorId(S.ultimoTipo) : tipoPorId(p.tipo);
    const st = { cor: t0 ? t0.cor : proximaCor(S.dados.tipos.map((t) => t.cor)), icone: t0 ? t0.icone : '', base: t0, corManual: false, icManual: false };
    const c = modal(`<h2>${novo ? 'Novo lugar' : 'Número, nome e tipo'}</h2>
      <label class="campo">Número no mapa<input id="m-num" type="number" min="0" step="1" value="${novo ? proximoNumero() : (p.num == null ? '' : p.num)}"></label>
      <label class="campo">Nome<input id="m-nome" type="text" value="${esc(novo ? '' : p.nome)}" autocomplete="off"></label>
      <div class="campo">Tipo
        <div class="sugestoes" id="m-sug"></div>
        <div class="tipo-ed"><span class="ponto grande" id="m-amostra"></span><input id="m-tipo" type="text" value="${esc(t0 ? t0.nome : '')}" placeholder="Nome do tipo (ex.: Taverna, Loja de magia)" autocomplete="off" spellcheck="false"><button type="button" class="bt-ic" id="m-ic" title="Ícone do tipo"></button></div>
        <div class="cores" id="m-cores">${CORES.map((x) => `<button type="button" class="sw" data-cor="${x}" style="background:${x}" title="Cor ${x}"></button>`).join('')}<label class="sw outra" title="Outra cor"><input id="m-cor" type="color" value="${st.cor}"></label></div>
        <div class="icones" id="m-icones" hidden>${gradeIcones(st.icone)}</div>
        <small class="dica-tipo" id="m-dica"></small>
      </div>
      <label class="chk"><input id="m-sec" type="checkbox"${!novo && p.secreto ? ' checked' : ''}> Secreto: só aparece no modo mestre e não vai para o pacote publicado</label>
      <p id="m-erro" style="color:#a33;margin:6px 0 0" hidden></p>
      <div class="rodape">${novo ? '' : '<button class="bt perigo" data-a="excluir">Excluir lugar</button><span class="esp"></span>'}<button class="bt leve" data-a="cancelar">Cancelar</button><button class="bt forte" data-a="ok">${novo ? 'Criar e colocar no mapa' : 'Salvar'}</button></div>`);
    const inTipo = $('#m-tipo', c);
    const pinta = () => {
      const t = tipoPorNome(inTipo.value); const nomeV = inTipo.value.trim(); const q = normNome(nomeV);
      const sug = $('#m-sug', c);
      sug.hidden = !S.dados.tipos.length;
      sug.innerHTML = S.dados.tipos.map((x) => `<button type="button" class="chip${t && t.id === x.id ? ' on' : ''}${q && !t && !normNome(x.nome).includes(q) ? ' apaga' : ''}" data-tipo="${esc(x.id)}" title="Usar o tipo ${esc(x.nome)}">${pontoTipo(x)}<span>${esc(x.nome)}</span></button>`).join('');
      const am = $('#m-amostra', c); am.style.setProperty('--c', st.cor); am.innerHTML = IC[st.icone] || '';
      const bi = $('#m-ic', c); bi.style.setProperty('--c', st.cor); bi.innerHTML = IC[st.icone] || '<span>ícone</span>';
      $('#m-cor', c).value = st.cor;
      $$('#m-cores .sw[data-cor]', c).forEach((b) => b.classList.toggle('on', b.dataset.cor === st.cor));
      $$('#m-icones [data-ic]', c).forEach((b) => b.classList.toggle('on', b.dataset.ic === st.icone));
      const outros = t ? S.dados.lugares.filter((x) => x.tipo === t.id && x !== p).length : 0;
      const mudou = t && (t.cor !== st.cor || t.icone !== st.icone);
      $('#m-dica', c).textContent = !nomeV ? (S.dados.tipos.length ? 'Escolha uma sugestão acima ou escreva o nome de um tipo novo e escolha a cor. Sem nome, o lugar fica sem tipo (cinza).' : 'Escreva o nome do tipo e escolha a cor (e um ícone, se quiser). O tipo fica como sugestão para os próximos lugares.')
        : t ? (mudou ? `A cor e o ícone novos valem para ${outros ? 'os ' + outros + ' outro(s) lugar(es) deste tipo também' : 'este tipo'}.` : `Tipo existente${outros ? ' · já usado em ' + outros + ' outro(s) lugar(es)' : ''}.`)
          : 'Tipo novo: ao salvar, ele fica como sugestão para os próximos lugares.';
    };
    const usar = (t) => { st.cor = t.cor; st.icone = t.icone; st.base = t; st.corManual = st.icManual = false; };
    pinta();
    inTipo.oninput = () => {
      const t = tipoPorNome(inTipo.value);
      if (t && t !== st.base) usar(t);
      else if (!t) {
        if (st.base) { st.base = null; if (!st.corManual) st.cor = proximaCor(S.dados.tipos.map((x) => x.cor)); }
        if (!st.icManual) st.icone = iconePadrao(inTipo.value);
      }
      pinta();
    };
    $('#m-cor', c).oninput = (e) => { st.cor = e.target.value.toLowerCase(); st.corManual = true; pinta(); };
    setTimeout(() => { if (!c.contains(document.activeElement)) $('#m-nome').focus(); }, 30);
    c.onkeydown = (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'color') { e.preventDefault(); $('[data-a="ok"]', c).click(); } };
    c.onclick = async (e) => {
      const sg = e.target.closest('[data-tipo]'); if (sg) { const t = tipoPorId(sg.dataset.tipo); if (t) { inTipo.value = t.nome; usar(t); pinta(); } return; }
      const sw = e.target.closest('.sw[data-cor]'); if (sw) { st.cor = sw.dataset.cor; st.corManual = true; pinta(); return; }
      const ic = e.target.closest('[data-ic]'); if (ic) { st.icone = ic.dataset.ic; st.icManual = true; $('#m-icones', c).hidden = true; pinta(); return; }
      if (e.target.closest('#m-ic')) { $('#m-icones', c).hidden = !$('#m-icones', c).hidden; return; }
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'cancelar') { fecharModal(); return; }
      if (a.dataset.a === 'excluir') { fecharModal(); excluirLugar(p.id); return; }
      const nv = $('#m-num').value.trim(); const num = nv === '' ? null : Math.round(+nv);
      const dup = num != null && S.dados.lugares.find((q) => q.num === num && q !== p);
      if (dup) { const er = $('#m-erro'); er.hidden = false; er.textContent = `O nº ${num} já é de "${titulo(dup)}". Escolha outro número.`; return; }
      const nomeT = inTipo.value.trim().replace(/\s+/g, ' ');
      let tipo = null;
      if (nomeT) {
        let t = tipoPorNome(nomeT);
        if (!t) { t = { id: uid('t'), nome: nomeT, cor: st.cor, icone: st.icone, aba: '' }; S.dados.tipos.push(t); }
        else { t.cor = st.cor; t.icone = st.icone; }
        tipo = t.id;
      }
      const alvo = p || normLugar({});
      alvo.num = num; alvo.nome = $('#m-nome').value.trim(); alvo.tipo = tipo; alvo.secreto = $('#m-sec').checked;
      S.ultimoTipo = tipo;
      if (S.filtro.delete(tipo || SEM)) salvarFiltro();
      if (novo) S.dados.lugares.push(alvo);
      fecharModal(); salvar(); desenharIndice(); desenharMarcas(); desenharLegenda();
      if (S.aberto) abrirLugar(S.aberto, S.aba, true);
      if (novo && S.map) comecarColocar(alvo.id);
    };
  }
  async function excluirLugar(id) {
    const p = acha(id); if (!p) return;
    if (!(await confirmar('Excluir o lugar?', `O nº ${esc(p.num == null ? '?' : p.num)} (${esc(titulo(p))}) sai do mapa, do índice e da legenda, com tudo o que estava na página dele.`, 'Excluir', true))) return;
    const refs = refsDe(p);
    S.dados.lugares = S.dados.lugares.filter((q) => q !== p);
    const usadas = new Set(S.dados.lugares.flatMap(refsDe));
    for (const r of refs) if (!usadas.has(r)) BD.del('imagens', r);
    if (S.aberto === id) fecharLugar();
    salvar(); desenharIndice(); desenharMarcas(); desenharLegenda(); if (S.areaAberta) desenharCartaoArea();
  }
  function refsDe(p) {
    const out = [];
    for (const a of p.arte) out.push(a.img);
    for (const n of p.elenco) { if (n.retrato) out.push(n.retrato); out.push(...n.artes); }
    for (const x of p.elencoImagens || []) out.push(x.img);
    for (const x of p.mapa.imagens) out.push(x.img);
    out.push(...p.catalogo.imagens);
    return out.filter(Boolean);
  }

  // ---------------- tipos de lugar (nome, cor, ícone e nome da 4ª aba) ----------------
  function gerenciarTipos() {
    const c = modal('');
    const redesenhaSite = debounce(() => { desenharMarcas(); desenharLegenda(); desenharIndice(); if (S.aberto) abrirLugar(S.aberto, S.aba, true); }, 200);
    const desenha = () => {
      const cont = (id) => S.dados.lugares.filter((p) => p.tipo === id).length;
      c.innerHTML = `<h2>Tipos de lugar</h2>
        <p class="dica-modal">O nome, a cor e o ícone de um tipo valem para todos os lugares dele. A <b>4ª aba</b> é o nome da última aba da página do lugar (Cardápio, Catálogo, Serviços…); em branco, o site escolhe pelo nome do tipo.</p>
        ${S.dados.tipos.length ? '<div class="tipos-cab"><span>Cor</span><span>Ícone</span><span>Nome</span><span>4ª aba</span><span title="Lugares deste tipo">Lug.</span><span></span></div>' : ''}
        <div class="lista-tipos">${S.dados.tipos.map((t, i) => `<div class="tipo-linha" data-i="${i}">
          <label class="sw cor-tipo" style="background:${t.cor}" title="Cor"><input type="color" data-f="cor" value="${t.cor}"></label>
          <button type="button" class="bt-ic" data-a="ic" title="Ícone" style="--c:${t.cor}">${icone(t) || '<span>—</span>'}</button>
          <input type="text" data-f="nome" value="${esc(t.nome)}" placeholder="Nome do tipo">
          <input type="text" data-f="aba" value="${esc(t.aba)}" placeholder="${esc(abaPadrao(t.nome))}" list="abas-sug" title="Nome da 4ª aba">
          <span class="n">${cont(t.id)}</span>
          <span class="ctl"><button type="button" data-a="sobe" title="Subir">▲</button><button type="button" data-a="desce" title="Descer">▼</button><button type="button" data-a="rem" title="Apagar o tipo">✕</button></span>
          <div class="icones" hidden>${gradeIcones(t.icone)}</div>
        </div>`).join('') || '<p class="nada">Nenhum tipo ainda. Os tipos nascem quando você cria um lugar (em <i>+ Novo lugar</i>) ou aqui em <i>+ Novo tipo</i>.</p>'}</div>
        <datalist id="abas-sug"><option value="Cardápio"><option value="Catálogo"><option value="Serviços"><option value="Preços"><option value="Mercadorias"></datalist>
        <div class="rodape"><button class="bt leve" data-a="novo">+ Novo tipo</button><span class="esp"></span><button class="bt forte" data-a="ok">Pronto</button></div>`;
    };
    desenha();
    c.oninput = (e) => {
      const f = e.target.dataset.f; const ln = e.target.closest('.tipo-linha'); if (!f || !ln) return;
      const t = S.dados.tipos[+ln.dataset.i]; if (!t) return;
      if (f === 'nome') {
        const v = e.target.value.trim().replace(/\s+/g, ' '); const outro = tipoPorNome(v); const ok = !!v && (!outro || outro === t);
        e.target.classList.toggle('erro', !ok); e.target.title = ok ? '' : (v ? 'Já existe um tipo com esse nome' : 'O tipo precisa de um nome');
        if (!ok) return;
        t.nome = v; const ab = $('input[data-f="aba"]', ln); if (ab) ab.placeholder = abaPadrao(v);
      } else if (f === 'aba') t.aba = e.target.value.trim();
      else if (f === 'cor') { t.cor = e.target.value.toLowerCase(); e.target.parentNode.style.background = t.cor; $('.bt-ic', ln).style.setProperty('--c', t.cor); }
      salvarLogo(); redesenhaSite();
    };
    c.onclick = async (e) => {
      const ln = e.target.closest('.tipo-linha'); const i = ln ? +ln.dataset.i : -1; const t = S.dados.tipos[i];
      const ic = e.target.closest('[data-ic]'); if (ic && t) { t.icone = ic.dataset.ic; salvar(); redesenhaSite(); desenha(); return; }
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'ok') { fecharModal(); return; }
      if (a === 'novo') {
        S.dados.tipos.push({ id: uid('t'), nome: nomeLivre('Tipo novo'), cor: proximaCor(S.dados.tipos.map((x) => x.cor)), icone: '', aba: '' }); salvar(); desenha();
        const ins = $$('.lista-tipos input[data-f="nome"]', c); const el = ins[ins.length - 1]; if (el) { el.focus(); el.select(); }
        return;
      }
      if (!t) return;
      if (a === 'ic') { const g = $('.icones', ln); g.hidden = !g.hidden; return; }
      if (a === 'sobe' || a === 'desce') { mover(S.dados.tipos, i, a === 'sobe' ? -1 : 1); salvar(); redesenhaSite(); desenha(); return; }
      if (a === 'rem') { await apagarTipo(t); gerenciarTipos(); }
    };
  }
  function apagarTipo(t) {
    return new Promise((res) => {
      const usados = S.dados.lugares.filter((p) => p.tipo === t.id); const outros = S.dados.tipos.filter((x) => x !== t);
      const c = modal(`<h2>Apagar o tipo "${esc(t.nome)}"?</h2>
        ${usados.length ? `<p>${usados.length} lugar${usados.length > 1 ? 'es usam' : ' usa'} este tipo. ${usados.length > 1 ? 'Eles passam' : 'Ele passa'} para:</p><label class="campo"><select id="t-dest"><option value="">Sem tipo</option>${outros.map((x) => `<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join('')}</select></label>` : '<p>Nenhum lugar usa este tipo.</p>'}
        <div class="rodape"><button class="bt leve" data-a="n">Cancelar</button><button class="bt perigo" data-a="s">Apagar o tipo</button></div>`);
      c.onclick = (e) => {
        const b = e.target.closest('[data-a]'); if (!b) return;
        if (b.dataset.a === 's') {
          const dest = ($('#t-dest') || {}).value || null;
          for (const p of usados) p.tipo = dest;
          S.dados.tipos = S.dados.tipos.filter((x) => x !== t); S.filtro.delete(t.id); salvarFiltro();
          if (S.ultimoTipo === t.id) S.ultimoTipo = null;
          salvar(); desenharMarcas(); desenharLegenda(); desenharIndice();
        }
        res();
      };
    });
  }

  // ---------------- áreas dos distritos (camada que liga e desliga) ----------------
  function alternarAreas(v) {
    S.verAreas = v == null ? !S.verAreas : !!v; gravar(CAMADA, S.verAreas ? '1' : '0');
    if (!S.verAreas) { if (S.desenho) cancelarDesenho(); if (S.edicao) cancelarEdicao(); fecharArea(); }
    desenharAreas(); desenharLegenda();
  }
  function desenharAreas() {
    const bt = $('#b-areas'); const vis = areasVisiveis();
    bt.hidden = !(S.mestre || vis.length); bt.classList.toggle('on', S.verAreas);
    bt.title = S.verAreas ? 'Esconder as áreas dos distritos' : 'Mostrar as áreas dos distritos (com notas)';
    if (!S.map) return;
    S.camadaAreas.clearLayers();
    if (S.verAreas) for (const a of vis) {
      if (S.edicao && S.edicao.id === a.id) continue;
      const ativo = S.areaAberta === a.id;
      const pg = L.polygon(a.pts.map((q) => ll(q[0], q[1])), { renderer: S.rendAreas, color: a.cor, weight: ativo ? 3.5 : 2.2, opacity: 0.95, dashArray: a.secreto ? '2 7' : '9 6', fillColor: a.cor, fillOpacity: ativo ? 0.24 : 0.12, className: 'area-pg' });
      pg.on('click', () => { if (S.colocando || S.desenho || S.edicao) return; abrirArea(a.id); });
      pg.addTo(S.camadaAreas);
      const c = centroArea(a.pts);
      const rot = L.marker(ll(c[0], c[1]), { pane: 'rotulos', keyboard: false, icon: L.divIcon({ className: 'rot-area' + (ativo ? ' ativo' : ''), html: `<span style="--c:${a.cor}">${esc(a.nome || 'Área')}${temNotas(a) ? ' <b title="Tem notas">✎</b>' : ''}</span>`, iconSize: [0, 0] }) });
      rot.on('click', (e) => {
        if (S.colocando) { colocar(S.colocando, xy(e.latlng)); pararColocar(); return; }
        if (S.desenho) { addPonto(xy(e.latlng)); return; }
        if (S.edicao) return;
        abrirArea(a.id);
      });
      rot.addTo(S.camadaAreas);
    }
    desenharFerramentas();
  }
  function desenharFerramentas() {
    const f = $('#ferr-areas'); if (!S.mestre || !S.map) { f.hidden = true; return; }
    if (S.desenho) {
      const n = S.desenho.pts.length;
      f.innerHTML = `<span class="rot">Nova área · ${n} ponto${n === 1 ? '' : 's'}</span><button class="bt mini leve" data-a="desfazer"${n ? '' : ' disabled'}>Desfazer ponto</button><button class="bt mini forte" data-a="concluir"${n >= 3 ? '' : ' disabled'}>Concluir</button><button class="bt mini leve" data-a="cancelar">Cancelar</button>`;
    } else if (S.edicao) {
      const a = acharArea(S.edicao.id);
      const sel = S.edicao.sel != null;
      f.innerHTML = `<span class="rot">Contorno: ${esc((a && a.nome) || 'área')}</span>${sel ? `<button class="bt mini perigo" data-a="apagar-ponto"${S.edicao.pts.length > 3 ? '' : ' disabled'}>Apagar ponto</button>` : ''}<button class="bt mini forte" data-a="ok-ed">Concluir</button><button class="bt mini leve" data-a="cancelar-ed">Cancelar</button>`;
    } else if (S.verAreas) {
      f.innerHTML = '<span class="rot">Áreas</span><button class="bt mini forte" data-a="desenhar">+ Desenhar área</button><button class="bt mini leve" data-a="distritos">Criar a partir dos distritos</button>';
    } else { f.hidden = true; return; }
    f.hidden = false;
  }
  function abrirArea(id) {
    const a = acharArea(id); if (!a || (a.secreto && !S.mestre)) return;
    S.areaAberta = id; $('#area').hidden = false;
    desenharCartaoArea(); desenharAreas();
  }
  function fecharArea() { if (!S.areaAberta && $('#area').hidden) return; S.areaAberta = null; $('#area').hidden = true; desenharAreas(); }
  function verArea(id) {
    const a = acharArea(id); if (!a || !S.map) return;
    if (!S.verAreas) alternarAreas(true);
    const baixo = celular() && !$('#area').hidden ? $('#area').getBoundingClientRect().height : 0;
    S.map.flyToBounds(L.latLngBounds(a.pts.map((q) => ll(q[0], q[1]))), { paddingTopLeft: [40, 50], paddingBottomRight: [40, 40 + baixo], duration: 0.6, maxZoom: S.map.getMaxZoom() - 3 });
  }
  const lugaresNaArea = (a) => S.dados.lugares.filter((p) => p.x != null && (!p.secreto || S.mestre) && dentro([p.x, p.y], a.pts)).sort(porNumero);
  function desenharCartaoArea() {
    const a = acharArea(S.areaAberta); if (!a) { fecharArea(); return; }
    const M = S.mestre; const corpo = $('#area-corpo');
    $('#area-tit').textContent = a.nome || 'Área sem nome'; $('#area').style.setProperty('--c', a.cor);
    let h = '';
    if (M) {
      h += `<div class="edit"><h4>Modo mestre · área${a.secreto ? ' secreta' : ''}</h4>
        <label class="campo">Nome<input id="ar-nome" type="text" value="${esc(a.nome)}" placeholder="Nome da área (ex.: Distrito Alto)" autocomplete="off"></label>
        <div class="campo">Cor<div class="cores">${CORES.map((x) => `<button type="button" class="sw${x === a.cor ? ' on' : ''}" data-cor="${x}" style="background:${x}" title="Cor ${x}"></button>`).join('')}<label class="sw outra" title="Outra cor"><input id="ar-cor" type="color" value="${a.cor}"></label></div></div>
        <label class="campo">Descrição (aparece para todos; linha em branco separa parágrafos)<textarea id="ar-desc" style="min-height:90px;font-size:16px">${esc(a.descricao)}</textarea></label>
        <div class="campo">Informações (aparecem para todos)
          <div class="info-ed">${a.info.map((i, k) => `<div class="linha-info"><input data-f="campo" data-k="${k}" value="${esc(i.campo)}" placeholder="Campo" list="ar-campos"><input data-f="valor" data-k="${k}" value="${esc(i.valor)}" placeholder="Valor"><button type="button" data-a="info-rem" data-k="${k}" title="Tirar">✕</button></div>`).join('')}</div>
          <datalist id="ar-campos">${CAMPOS_AREA.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>
          <div class="linha-bts"><button type="button" class="bt mini leve" data-a="info-add">+ Informação</button></div></div>
        <label class="campo">Notas do mestre (só no modo mestre; não vão para o pacote publicado)<textarea id="ar-notas" style="min-height:90px;font-size:16px">${esc(a.notas)}</textarea></label>
        <label class="chk"><input id="ar-sec" type="checkbox"${a.secreto ? ' checked' : ''}> Secreta: a área inteira só aparece no modo mestre</label>
        <div class="linha-bts"><button type="button" class="bt mini forte" data-a="contorno">Editar o contorno</button><button type="button" class="bt mini leve" data-a="ver">Ver no mapa</button><span class="esp"></span><button type="button" class="bt mini perigo" data-a="excluir">Excluir área</button></div></div>`;
    } else {
      if (a.descricao) h += `<div class="texto">${texto(a.descricao)}</div>`;
      const inf = a.info.filter((i) => i.campo || i.valor);
      if (inf.length) h += `<dl class="info">${inf.map((i) => `<dt>${esc(i.campo)}</dt><dd>${esc(i.valor)}</dd>`).join('')}</dl>`;
      if (!a.descricao && !inf.length) h += '<p class="nada">Ainda não há notas sobre esta área.</p>';
    }
    const lug = lugaresNaArea(a);
    if (lug.length) h += `<h3 class="sec-mini">Lugares nesta área</h3><ul class="lug-area">${lug.map((p) => `<li data-id="${esc(p.id)}" title="Abrir a página">${circHTML(p)}<span>${esc(titulo(p))}</span></li>`).join('')}</ul>`;
    if (!M) h += '<div class="linha-bts" style="margin-top:12px"><button type="button" class="bt mini leve" data-a="ver">Ver no mapa</button></div>';
    corpo.innerHTML = h;
    const atualiza = debounce(() => { desenharAreas(); desenharLegenda(); }, 250);
    const nm = $('#ar-nome'); if (nm) nm.oninput = () => { a.nome = nm.value; $('#area-tit').textContent = a.nome || 'Área sem nome'; salvarLogo(); atualiza(); };
    const cr = $('#ar-cor'); if (cr) cr.oninput = () => { a.cor = cr.value.toLowerCase(); $('#area').style.setProperty('--c', a.cor); $$('#area-corpo .sw[data-cor]').forEach((b) => b.classList.toggle('on', b.dataset.cor === a.cor)); salvarLogo(); atualiza(); };
    const ds = $('#ar-desc'); if (ds) ds.oninput = () => { a.descricao = ds.value; salvarLogo(); atualiza(); };
    const nt = $('#ar-notas'); if (nt) nt.oninput = () => { a.notas = nt.value; salvarLogo(); atualiza(); };
    const sc = $('#ar-sec'); if (sc) sc.onchange = () => { a.secreto = sc.checked; salvar(); desenharCartaoArea(); desenharAreas(); desenharLegenda(); };
    corpo.oninput = (e) => { const f = e.target.dataset.f; if (!f) return; const it = a.info[+e.target.dataset.k]; if (it) { it[f] = e.target.value; salvarLogo(); atualiza(); } };
    corpo.onclick = async (e) => {
      const li = e.target.closest('li[data-id]'); if (li) { abrirLugar(li.dataset.id); return; }
      const sw = e.target.closest('.sw[data-cor]'); if (sw && S.mestre) { a.cor = sw.dataset.cor; salvar(); desenharCartaoArea(); desenharAreas(); desenharLegenda(); return; }
      const b = e.target.closest('[data-a]'); if (!b) return; const ac = b.dataset.a;
      if (ac === 'ver') { verArea(a.id); return; }
      if (!S.mestre) return;
      if (ac === 'info-add') { a.info.push({ campo: '', valor: '' }); salvar(); desenharCartaoArea(); const ins = $$('#area-corpo .linha-info input[data-f="campo"]'); if (ins.length) ins[ins.length - 1].focus(); return; }
      if (ac === 'info-rem') { a.info.splice(+b.dataset.k, 1); salvar(); desenharCartaoArea(); desenharAreas(); return; }
      if (ac === 'contorno') { editarContorno(a.id); return; }
      if (ac === 'excluir') {
        if (!(await confirmar('Excluir a área?', `A área "${esc(a.nome || 'sem nome')}" sai do mapa, com as notas dela. O mapa em si não muda.`, 'Excluir', true))) return;
        S.dados.areas = S.dados.areas.filter((x) => x !== a); fecharArea(); salvar(); desenharAreas(); desenharLegenda();
      }
    };
  }
  // desenhar uma área nova: cliques marcam os cantos
  function comecarDesenho() {
    if (!S.map) return;
    if (S.colocando) pararColocar(); if (S.edicao) cancelarEdicao(); fecharArea();
    if (!S.verAreas) alternarAreas(true);
    S.desenho = { pts: [], grupo: L.layerGroup().addTo(S.map), guia: null };
    S.map.doubleClickZoom.disable(); $('#mapa').classList.add('desenhando');
    dicaMapa(toque() ? 'Toque no mapa para marcar os cantos da área · toque no primeiro ponto para fechar' : 'Clique no mapa para marcar os cantos da área · clique no primeiro ponto (ou dê duplo clique) para fechar · Backspace desfaz · Esc cancela');
    desenharFerramentas();
  }
  function addPonto(q) {
    const D = S.desenho; if (!D) return;
    const ult = D.pts[D.pts.length - 1];
    if (ult) { const a = S.map.latLngToContainerPoint(ll(ult[0], ult[1])), b = S.map.latLngToContainerPoint(ll(q[0], q[1])); if (a.distanceTo(b) < 5) return; }
    D.pts.push([r1(q[0]), r1(q[1])]); redesenharDesenho(); desenharFerramentas();
  }
  function redesenharDesenho() {
    const D = S.desenho; D.grupo.clearLayers(); D.guia = null;
    const lls = D.pts.map((q) => ll(q[0], q[1]));
    if (lls.length >= 3) L.polygon(lls, { renderer: S.rendDesenho, stroke: false, fillColor: '#8b3a1c', fillOpacity: 0.14, interactive: false }).addTo(D.grupo);
    if (lls.length >= 2) L.polyline(lls, { renderer: S.rendDesenho, color: '#8b3a1c', weight: 2.5, interactive: false }).addTo(D.grupo);
    D.pts.forEach((q, i) => {
      const c = L.circleMarker(ll(q[0], q[1]), { renderer: S.rendDesenho, radius: i === 0 ? 7.5 : 4.5, color: '#fff', weight: 2, fillColor: '#8b3a1c', fillOpacity: 1, interactive: i === 0, bubblingMouseEvents: false, className: i === 0 ? 'ponto-inicial' : '' });
      if (i === 0) c.on('click', () => { if (S.desenho && S.desenho.pts.length >= 3) concluirDesenho(); });
      c.addTo(D.grupo);
    });
  }
  function guiaDesenho(lat) {
    const D = S.desenho; if (!D || !D.pts.length) return;
    const a = D.pts[D.pts.length - 1]; const pts = [ll(a[0], a[1]), lat]; if (D.pts.length >= 2) pts.push(ll(D.pts[0][0], D.pts[0][1]));
    if (!D.guia) D.guia = L.polyline(pts, { renderer: S.rendDesenho, color: '#8b3a1c', weight: 1.5, dashArray: '5 6', interactive: false }).addTo(D.grupo);
    else D.guia.setLatLngs(pts);
  }
  function desfazerPonto() { const D = S.desenho; if (!D || !D.pts.length) return; D.pts.pop(); redesenharDesenho(); desenharFerramentas(); }
  function cancelarDesenho() {
    const D = S.desenho; if (!D) return;
    S.map.removeLayer(D.grupo); S.desenho = null; S.map.doubleClickZoom.enable(); $('#mapa').classList.remove('desenhando'); dicaMapa(''); desenharFerramentas();
  }
  function concluirDesenho() {
    const D = S.desenho; if (!D) return;
    if (D.pts.length < 3) { aviso('Marque pelo menos 3 pontos para fechar a área.'); return; }
    const a = normArea({ id: uid('a'), nome: 'Área ' + (S.dados.areas.length + 1), cor: proximaCor(S.dados.areas.map((x) => x.cor)), pts: D.pts });
    cancelarDesenho(); S.dados.areas.push(a); salvar(); desenharLegenda(); abrirArea(a.id);
    setTimeout(() => { const i = $('#ar-nome'); if (i) { i.focus(); i.select(); } }, 60);
  }
  // mudar o contorno: arrastar os pontos, arrastar os pontos do meio para criar outro, duplo clique apaga
  function editarContorno(id) {
    const a = acharArea(id); if (!a || !S.map) return;
    if (S.desenho) cancelarDesenho(); if (S.colocando) pararColocar(); if (S.edicao) cancelarEdicao();
    if (!S.verAreas) alternarAreas(true);
    // no celular o cartão da área cobre metade do mapa: sai durante a edição e volta no fim
    const reabrir = celular() && S.areaAberta === id; if (reabrir) fecharArea();
    S.edicao = { id, pts: a.pts.map((q) => q.slice()), grupo: L.layerGroup().addTo(S.map), sel: null, reabrir };
    S.map.doubleClickZoom.disable();
    desenharAreas(); redesenharEdicao();
    dicaMapa(toque() ? 'Arraste os pontos para mudar o contorno · arraste um ponto pequeno (no meio de um lado) para criar outro · toque num ponto e depois em Apagar ponto' : 'Arraste os pontos para mudar o contorno · arraste um ponto pequeno (no meio de um lado) para criar outro · duplo clique num ponto (ou clique e Apagar ponto) apaga · Enter conclui · Esc cancela');
  }
  function redesenharEdicao() {
    const E = S.edicao; if (!E) return; const a = acharArea(E.id); if (!a) { cancelarEdicao(); return; }
    E.grupo.clearLayers();
    const lls = () => E.pts.map((q) => ll(q[0], q[1]));
    const pg = L.polygon(lls(), { renderer: S.rendDesenho, color: a.cor, weight: 2.5, fillColor: a.cor, fillOpacity: 0.2, interactive: false }).addTo(E.grupo);
    const n = E.pts.length;
    E.pts.forEach((q, i) => {
      const tam = toque() ? 22 : 14;
      const m = L.marker(ll(q[0], q[1]), { pane: 'desenho', draggable: true, keyboard: false, icon: L.divIcon({ className: 'alca' + (E.sel === i ? ' sel' : ''), iconSize: [tam, tam] }) });
      m.on('drag', (ev) => { E.pts[i] = xy(ev.target.getLatLng()); pg.setLatLngs(lls()); });
      m.on('dragend', () => { E.pts[i] = [r1(E.pts[i][0]), r1(E.pts[i][1])]; E.sel = i; redesenharEdicao(); });
      m.on('click', () => { E.sel = E.sel === i ? null : i; redesenharEdicao(); });
      m.on('dblclick', () => { E.sel = i; apagarPonto(); });
      m.addTo(E.grupo);
      const r = E.pts[(i + 1) % n]; const mid = [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2]; let k = -1;
      const tm = toque() ? 16 : 11;
      const mm = L.marker(ll(mid[0], mid[1]), { pane: 'desenho', draggable: true, keyboard: false, icon: L.divIcon({ className: 'alca meio', iconSize: [tm, tm] }) });
      mm.on('dragstart', () => { k = i + 1; E.pts.splice(k, 0, mid.slice()); E.sel = null; });
      mm.on('drag', (ev) => { if (k >= 0) { E.pts[k] = xy(ev.target.getLatLng()); pg.setLatLngs(lls()); } });
      mm.on('dragend', () => { if (k >= 0) { E.pts[k] = [r1(E.pts[k][0]), r1(E.pts[k][1])]; E.sel = k; } redesenharEdicao(); });
      mm.addTo(E.grupo);
    });
    desenharFerramentas();
  }
  function apagarPonto() {
    const E = S.edicao; if (!E || E.sel == null) return;
    if (E.pts.length <= 3) { aviso('A área precisa de pelo menos 3 pontos.'); return; }
    E.pts.splice(E.sel, 1); E.sel = null; redesenharEdicao();
  }
  function fimEdicao() { const E = S.edicao; if (!E) return; S.map.removeLayer(E.grupo); S.edicao = null; S.map.doubleClickZoom.enable(); dicaMapa(''); desenharFerramentas(); if (E.reabrir) setTimeout(() => abrirArea(E.id), 0); }
  function concluirEdicao() {
    const E = S.edicao; if (!E) return; const a = acharArea(E.id);
    if (a) a.pts = E.pts.map((q) => [r1(q[0]), r1(q[1])]);
    fimEdicao(); salvar(); desenharAreas(); if (S.areaAberta) desenharCartaoArea(); aviso('Contorno salvo.');
  }
  function cancelarEdicao() { if (!S.edicao) return; fimEdicao(); desenharAreas(); }
  // áreas a partir dos distritos do .json do Cartógrafo (contorno, nome, notas e população)
  async function projetoDoMapa() {
    let txt = S.mapa && S.mapa.json;
    if (!txt) { try { const r = await fetch('data/mapa.json', { cache: 'no-cache' }); if (r.ok) txt = await r.text(); } catch (e) { /* aberto do disco */ } }
    if (!txt) return null;
    try { const j = JSON.parse(txt); return j && Array.isArray(j.districts) ? j : null; } catch (e) { return null; }
  }
  async function popsDoMapa() {
    const m = new Map(); let lst = S.mapa && S.mapa.distritos;
    if (!lst && S.mapa && S.mapa.origem === 'publicado') lst = await lerJson('data/distritos.json');
    for (const d of Array.isArray(lst) ? lst : []) if (d && d.id) m.set(d.id, d);
    return m;
  }
  async function dialogoDistritos() {
    carregando('Lendo os distritos do mapa…'); const prj = await projetoDoMapa(); const pops = await popsDoMapa(); carregando(null);
    if (!prj) { aviso('Não achei o .json do mapa. Abra o mapa do Cartógrafo (Abrir mapa) e tente de novo.', 6000); return; }
    const ds = prj.districts.filter((d) => !d.hidden && Array.isArray(d.poly) && d.poly.length >= 3);
    if (!ds.length) { aviso('Esse mapa não tem distritos.'); return; }
    const ja = new Set(S.dados.areas.map((a) => a.distrito).filter(Boolean));
    const c = modal(`<h2>Áreas a partir dos distritos</h2>
      <p>Cada distrito marcado vira uma área com o contorno desenhado no Cartógrafo (dá para ajustar depois em <i>Editar o contorno</i>). As notas do distrito no Cartógrafo entram nas <b>notas do mestre</b> da área${pops.size ? ', e a população entra nas informações' : ''}. O mapa não muda.</p>
      <div class="lista-dist">${ds.map((d) => { const j = ja.has(d.id); const p = pops.get(d.id); return `<label class="chk"><input type="checkbox" value="${esc(d.id)}"${j ? ' disabled' : ' checked'}><span>${esc(d.name || d.id)}${p && p.pop ? ` <small>· ${fmtNum(p.pop)} hab.</small>` : ''}${j ? ' <small>(já tem área)</small>' : ''}</span></label>`; }).join('')}</div>
      <div class="linha-bts"><button class="bt mini leve" data-a="todos">Marcar todos</button><button class="bt mini leve" data-a="nenhum">Desmarcar todos</button></div>
      <div class="rodape"><button class="bt leve" data-a="cancelar">Cancelar</button><button class="bt forte" data-a="ok">Criar as áreas</button></div>`);
    c.onclick = (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'todos' || a === 'nenhum') { $$('.lista-dist input:not(:disabled)', c).forEach((i) => { i.checked = a === 'todos'; }); return; }
      if (a === 'cancelar') { fecharModal(); return; }
      const ids = new Set($$('.lista-dist input:checked', c).map((i) => i.value)); fecharModal();
      if (!ids.size) return;
      let n = 0; const usadas = S.dados.areas.map((x) => x.cor);
      for (const d of ds) {
        if (!ids.has(d.id)) continue;
        const p = pops.get(d.id); const cor = proximaCor(usadas); usadas.push(cor);
        const notas = [d.notes, d.inspiracao ? 'Inspiração: ' + d.inspiracao : ''].filter(Boolean).join('\n\n');
        const ar = normArea({ id: uid('a'), nome: d.name || d.id, cor, pts: d.poly, info: p && p.pop ? [{ campo: 'População', valor: '≈ ' + fmtNum(p.pop) }] : [], notas, distrito: d.id });
        if (ar) { S.dados.areas.push(ar); n++; }
      }
      salvar(); if (!S.verAreas) alternarAreas(true); else { desenharAreas(); desenharLegenda(); }
      aviso(`${n} área${n > 1 ? 's criadas' : ' criada'} a partir dos distritos. Clique numa área para escrever as notas.`, 5000);
    };
  }

  // ---------------- página do lugar ----------------
  function abrirLugar(id, aba, doHash) {
    const p = acha(id); if (!p || (p.secreto && !S.mestre)) return;
    if (S.aberto !== id) S.arteSel = 0;
    S.aberto = id; S.aba = aba || (S.aba && $('#lugar').hidden === false ? S.aba : 'arte');
    const t = tipoDe(p);
    $('#lugar-topo').innerHTML = `${circHTML(p)}<div class="tit"><div class="tipo">${t.id ? esc(t.nome) : ''}${p.secreto ? (t.id ? ' · ' : '') + 'secreto' : ''}</div><h2>${esc(titulo(p))}</h2></div>
      ${p.x != null ? '<button class="bt leve" data-a="ver" title="Ver no mapa"><span class="ic-bt">⌖</span><span class="txt">Ver no mapa</span></button>' : ''}${S.mestre ? '<button class="bt leve" data-a="dados" title="Número, nome e tipo"><span class="ic-bt">✎</span><span class="txt">Número, nome e tipo</span></button>' : ''}<button class="bt redondo leve x" data-a="fechar" title="Fechar (Esc)">×</button>`;
    $('#lugar-abas').innerHTML = ABAS.map(([k, n], i) => `<button role="tab" data-aba="${k}" class="${S.aba === k ? 'on' : ''}"><span class="n">${i + 1}</span>${k === 'catalogo' ? esc(abaDe(p)) : k === 'historia' ? 'História<span class="longo"> e elenco</span>' : esc(n)}</button>`).join('');
    $('#lugar').hidden = false;
    desenharAba();
    for (const [lid, m] of S.marcadores) { const el = m.getElement(); if (el) el.classList.toggle('ativo', lid === id); }
    if (!doHash) {
      const h = '#lugar-' + encodeURIComponent(p.num != null ? p.num : p.id);
      if (location.hash !== h) {
        // a primeira página aberta entra no histórico (Voltar fecha); as seguintes só trocam o endereço
        if (S.empurrou && /^#lugar-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search + h);
        else { history.pushState(null, '', location.pathname + location.search + h); S.empurrou = true; }
      }
    }
  }
  function fecharLugar(semHistorico) {
    if ($('#lugar').hidden) return;
    $('#lugar').hidden = true; S.aberto = null;
    for (const m of S.marcadores.values()) { const el = m.getElement(); if (el) el.classList.remove('ativo'); }
    if (!semHistorico && /^#lugar-/.test(location.hash)) { if (S.empurrou) { S.empurrou = false; history.back(); } else history.replaceState(null, '', location.pathname + location.search); }
  }
  function rotear() {
    const m = location.hash.match(/^#lugar-(.+)$/);
    if (m) {
      const k = decodeURIComponent(m[1]);
      const p = S.dados.lugares.find((q) => String(q.num) === k) || acha(k);
      if (p && (!p.secreto || S.mestre)) { abrirLugar(p.id, null, true); return; }
    }
    if (S.aberto) { S.empurrou = false; fecharLugar(true); }
  }
  function vazioAba(tit, txt, botoes) { return `<div class="vazio-aba"><h3>${esc(tit)}</h3><p>${txt}</p>${botoes ? '<div class="linha-bts" style="justify-content:center">' + botoes + '</div>' : ''}</div>`; }
  function desenharAba() {
    const p = acha(S.aberto); if (!p) return;
    const corpo = $('#lugar-corpo'); corpo.scrollTop = 0; corpo.onclick = corpo.oninput = corpo.onchange = null;
    $$('#lugar-abas button').forEach((b) => b.classList.toggle('on', b.dataset.aba === S.aba));
    const ab = $('#lugar-abas button.on'); if (ab && ab.scrollIntoView) ab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (S.aba === 'arte') abaArte(p, corpo);
    else if (S.aba === 'historia') abaHistoria(p, corpo);
    else if (S.aba === 'mapa') abaMapa(p, corpo);
    else abaCatalogo(p, corpo);
    hidratar(corpo);
  }
  const mover = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; };

  // 1) arte
  function abaArte(p, corpo) {
    const M = S.mestre;
    if (!p.arte.length) { corpo.innerHTML = vazioAba('Arte do lugar', 'A arte deste lugar ainda não foi colocada.', M ? '<button class="bt forte" data-a="add-arte">Adicionar imagens</button>' : ''); }
    else {
      const i = Math.min(S.arteSel, p.arte.length - 1); S.arteSel = i; const a = p.arte[i];
      let h = `<div class="largo"><div class="arte-principal"><img data-ref="${esc(a.img)}" alt="${esc(a.legenda || titulo(p))}" data-a="lupa" data-leg="${esc(a.legenda)}"></div>`;
      if (a.legenda) h += `<p class="legenda-img">${esc(a.legenda)}</p>`;
      if (p.arte.length > 1 || M) {
        h += '<div class="miniaturas">' + p.arte.map((x, k) => `<div class="mini${k === i ? ' on' : ''}"><img data-ref="${esc(x.img)}" alt="" data-a="sel" data-i="${k}">${M ? `<div class="ctl-img"><button data-a="esq" data-i="${k}" title="Mover para a esquerda">◀</button><button data-a="dir" data-i="${k}" title="Mover para a direita">▶</button><button data-a="rem" data-i="${k}" title="Tirar esta imagem">✕</button></div>` : ''}</div>`).join('') + '</div>';
      }
      if (M) h += `<div class="edit"><h4>Modo mestre · arte</h4><label class="campo">Legenda da imagem selecionada<input id="arte-leg" type="text" value="${esc(a.legenda)}"></label><div class="linha-bts"><button class="bt forte mini" data-a="add-arte">Adicionar imagens</button></div></div>`;
      corpo.innerHTML = h + '</div>';
      const leg = $('#arte-leg'); if (leg) leg.oninput = () => { a.legenda = leg.value; salvarLogo(); };
    }
    corpo.onclick = async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return; const k = +b.dataset.i;
      if (b.dataset.a === 'lupa') return abrirLupa(b.dataset.ref || $('img', b) && $('img', b).dataset.ref, b.dataset.leg);
      if (b.dataset.a === 'sel') { S.arteSel = k; return desenharAba(); }
      if (!S.mestre) return;
      if (b.dataset.a === 'add-arte') { const refs = await pedirImagens(true); if (!refs.length) return; p.arte.push(...refs.map((img) => ({ img, legenda: '' }))); S.arteSel = p.arte.length - refs.length; salvar(); return desenharAba(); }
      if (b.dataset.a === 'esq') { mover(p.arte, k, -1); S.arteSel = Math.max(0, k - 1); }
      if (b.dataset.a === 'dir') { mover(p.arte, k, 1); S.arteSel = Math.min(p.arte.length - 1, k + 1); }
      if (b.dataset.a === 'rem') { p.arte.splice(k, 1); S.arteSel = Math.max(0, Math.min(S.arteSel, p.arte.length - 1)); }
      salvar(); desenharAba();
    };
  }

  // 2) história e elenco
  function abaHistoria(p, corpo) {
    const M = S.mestre; let h = '<div class="largo">';
    if (M) h += `<div class="edit"><h4>Modo mestre · história</h4><label class="campo">Breve história (linha em branco separa parágrafos; **negrito** e *itálico*)<textarea id="h-txt">${esc(p.historia)}</textarea></label></div>`;
    else if (p.historia) h += `<div class="texto">${texto(p.historia)}</div>`;
    else h += vazioAba('História', 'A história deste lugar ainda não foi escrita.', '');
    h += '<h3 class="sec-tit">Elenco</h3>';
    const imgs = p.elencoImagens; const imgsVis = M ? imgs : imgs.filter((x) => !x.mestre);
    if (!p.elenco.length && !imgsVis.length) h += M ? '<p class="dica" style="margin:0 0 10px">Os personagens do lugar (retrato, nome, papel e um pouco sobre cada um) e, se quiser, imagens com o elenco, como páginas inteiras com os personagens.</p>' : '<p class="dica" style="margin:0">O elenco deste lugar ainda não foi apresentado.</p>';
    h += '<div class="elenco">' + p.elenco.map((n, k) => `<article class="npc" data-k="${k}">
        <div class="retrato" data-a="lupa-npc" data-k="${k}">${n.retrato ? `<img data-ref="${esc(n.retrato)}" alt="${esc(n.nome)}">` : IC.pessoa}</div>
        ${M ? '' : `<div class="inf"><b>${esc(n.nome || 'Personagem')}</b>${n.papel ? `<i>${esc(n.papel)}</i>` : ''}${n.texto ? `<p>${esc(n.texto)}</p>` : ''}</div>`}
        ${n.artes.length ? '<div class="artes">' + n.artes.map((r, j) => `<img data-ref="${esc(r)}" alt="" data-a="lupa-arte" data-k="${k}" data-j="${j}">`).join('') + '</div>' : ''}
        ${M ? `<div class="edit"><label class="campo">Nome<input data-f="nome" data-k="${k}" value="${esc(n.nome)}"></label><label class="campo">Papel no lugar<input data-f="papel" data-k="${k}" value="${esc(n.papel)}"></label><label class="campo">Sobre<textarea data-f="texto" data-k="${k}" style="min-height:70px;font-size:15px">${esc(n.texto)}</textarea></label>
          <div class="linha-bts"><button class="bt mini leve" data-a="retrato" data-k="${k}">${n.retrato ? 'Trocar retrato' : 'Retrato'}</button>${n.retrato ? `<button class="bt mini leve" data-a="sem-retrato" data-k="${k}">Sem retrato</button>` : ''}<button class="bt mini leve" data-a="add-arte-npc" data-k="${k}">+ Arte</button>${n.artes.length ? `<button class="bt mini leve" data-a="rem-arte-npc" data-k="${k}" title="Tira a última arte">− Arte</button>` : ''}</div>
          <div class="linha-bts" style="margin-top:6px"><button class="bt mini leve" data-a="npc-esq" data-k="${k}" title="Antes">◀</button><button class="bt mini leve" data-a="npc-dir" data-k="${k}" title="Depois">▶</button><span class="esp"></span><button class="bt mini perigo" data-a="npc-rem" data-k="${k}">Tirar</button></div></div>` : ''}
      </article>`).join('') + '</div>';
    // imagens do elenco (páginas inteiras): clique abre em tela cheia; as marcadas só aparecem para o mestre
    h += figurasHTML(imgs, 'pag-elenco', 'Elenco');
    if (M) h += '<div class="linha-bts" style="margin-top:14px"><button class="bt forte" data-a="npc-add">+ Personagem</button><button class="bt leve" data-a="pag-add">+ Imagens do elenco</button></div>' +
      (imgs.length ? '' : '<p class="dica" style="margin:6px 0 0">Imagens do elenco: páginas inteiras com os personagens. Se a imagem tiver segredos, marque <b>Só para o mestre</b>: ela não aparece para os jogadores nem vai para o pacote publicado.</p>');
    corpo.innerHTML = h + '</div>';
    const ta = $('#h-txt'); if (ta) ta.oninput = () => { p.historia = ta.value; salvarLogo(); };
    corpo.oninput = (e) => {
      if (inputFiguras(e, imgs)) return;
      const f = e.target.dataset.f; if (!f) return; const n = p.elenco[+e.target.dataset.k]; if (!n) return; n[f] = e.target.value; salvarLogo();
    };
    corpo.onchange = (e) => { changeFiguras(e, imgs); };
    corpo.onclick = async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return; const k = +b.dataset.k; const n = p.elenco[k];
      if (b.dataset.a === 'lupa-npc') { if (n && n.retrato) abrirLupa(n.retrato, n.nome); return; }
      if (b.dataset.a === 'lupa-arte') { abrirLupa(n.artes[+b.dataset.j], n.nome); return; }
      if (await cliqueFiguras(b, imgs)) return;
      if (!S.mestre) return;
      const a = b.dataset.a;
      if (a === 'npc-add') { p.elenco.push({ id: uid('n'), nome: '', papel: '', texto: '', retrato: null, artes: [] }); }
      else if (a === 'retrato') { const r = await pedirImagens(false); if (!r.length) return; n.retrato = r[0]; }
      else if (a === 'sem-retrato') n.retrato = null;
      else if (a === 'add-arte-npc') { const r = await pedirImagens(true); if (!r.length) return; n.artes.push(...r); }
      else if (a === 'rem-arte-npc') n.artes.pop();
      else if (a === 'npc-esq') mover(p.elenco, k, -1);
      else if (a === 'npc-dir') mover(p.elenco, k, 1);
      else if (a === 'npc-rem') { if (!(await confirmar('Tirar o personagem?', `${esc(n.nome || 'Este personagem')} sai do elenco deste lugar.`, 'Tirar', true))) return; p.elenco.splice(k, 1); }
      else return;
      salvar(); desenharAba();
    };
  }

  // lista de imagens grandes (elenco e mapa): legenda, ordem e "só para o mestre"; clique abre em tela cheia
  function figurasHTML(imgs, cls, alt) {
    const M = S.mestre; const vis = M ? imgs : imgs.filter((x) => !x.mestre); if (!vis.length) return '';
    return `<div class="paginas pag-imgs ${cls}${M ? ' mestre' : ''}">` + vis.map((x) => { const j = imgs.indexOf(x); return `<figure class="pag${x.mestre ? ' so-mestre' : ''}">
        ${M && x.mestre ? '<span class="selo-img">só para o mestre</span>' : ''}<img data-ref="${esc(x.img)}" alt="${esc(x.legenda || alt)}" data-a="lupa-pag" data-j="${j}">
        ${!M && x.legenda ? `<figcaption>${esc(x.legenda)}</figcaption>` : ''}
        ${M ? `<div class="ctl-pag"><input type="text" data-fp="legenda" data-j="${j}" value="${esc(x.legenda)}" placeholder="Legenda (opcional)"><label class="chk"><input type="checkbox" data-fp="mestre" data-j="${j}"${x.mestre ? ' checked' : ''}> Só para o mestre</label><span class="ctl-img"><button data-a="pag-esq" data-j="${j}" title="Antes">◀</button><button data-a="pag-dir" data-j="${j}" title="Depois">▶</button><button data-a="pag-rem" data-j="${j}" title="Tirar esta imagem">✕</button></span></div>` : ''}
      </figure>`; }).join('') + '</div>';
  }
  function inputFiguras(e, imgs) { if (e.target.dataset.fp !== 'legenda') return false; const x = imgs[+e.target.dataset.j]; if (x) { x.legenda = e.target.value; salvarLogo(); } return true; }
  function changeFiguras(e, imgs) { if (e.target.dataset.fp !== 'mestre') return false; const x = imgs[+e.target.dataset.j]; if (x) { x.mestre = e.target.checked; salvar(); desenharAba(); } return true; }
  async function cliqueFiguras(b, imgs) {
    const a = b.dataset.a; const j = +b.dataset.j;
    if (a === 'lupa-pag') { const x = imgs[j]; if (x) abrirLupa(x.img, x.legenda); return true; }
    if (!S.mestre || !/^pag-/.test(a)) return false;
    if (a === 'pag-add') { const r = await pedirImagens(true); if (!r.length) return true; imgs.push(...r.map((img) => ({ img, legenda: '', mestre: false }))); }
    else if (a === 'pag-esq') mover(imgs, j, -1);
    else if (a === 'pag-dir') mover(imgs, j, 1);
    else if (a === 'pag-rem') imgs.splice(j, 1);
    else return false;
    salvar(); desenharAba(); return true;
  }

  // 3) mapa do lugar: uma ou mais imagens (battlemap, andares, porão…)
  function abaMapa(p, corpo) {
    const M = S.mestre; const g = p.mapa; const imgs = g.imagens;
    const lista = figurasHTML(imgs, 'pag-mapa', 'Mapa do lugar');
    let h = '<div class="largo">';
    h += lista || vazioAba('Mapa do lugar', 'O mapa deste lugar ainda não foi colocado.', M ? '<button class="bt forte" data-a="pag-add">Adicionar imagens do mapa</button>' : '');
    if (M && lista) h += '<div class="linha-bts" style="margin-top:14px;justify-content:center"><button class="bt forte" data-a="pag-add">+ Imagens do mapa</button></div>';
    if (M) h += `<div class="edit"><h4>Modo mestre · mapa</h4><p class="dica" style="margin:0 0 8px">Uma ou mais imagens (battlemap, andares, porão…), na ordem em que devem aparecer. Clique numa imagem para ver em tela cheia. <b>Só para o mestre</b> esconde a imagem dos jogadores (por exemplo, a versão com as portas secretas).</p>
      <label class="campo">Notas do mestre (não aparecem para os jogadores nem vão para o pacote publicado)<textarea id="mp-notas" style="min-height:70px;font-size:15px">${esc(g.notas)}</textarea></label></div>`;
    corpo.innerHTML = h + '</div>';
    const nt = $('#mp-notas'); if (nt) nt.oninput = () => { g.notas = nt.value; salvarLogo(); };
    corpo.oninput = (e) => { inputFiguras(e, imgs); };
    corpo.onchange = (e) => { changeFiguras(e, imgs); };
    corpo.onclick = async (e) => { const b = e.target.closest('[data-a]'); if (b) await cliqueFiguras(b, imgs); };
  }

  // 4) catálogo / cardápio
  function abaCatalogo(p, corpo) {
    const M = S.mestre; const c = p.catalogo; const nome = abaDe(p); const padrao = tipoDe(p).aba || abaPadrao(tipoDe(p).nome);
    let h = '<div class="largo">';
    if (M) h += `<div class="edit"><h4>Modo mestre · ${esc(nome.toLowerCase())}</h4><label class="campo">Nome da aba<input id="c-tit" type="text" value="${esc(c.titulo)}" placeholder="${esc(padrao)}"></label>
      <div class="linha-bts"><button class="bt mini forte" data-a="c-img">+ Páginas (imagens)</button><button class="bt mini leve" data-a="c-item">+ Item</button><button class="bt mini leve" data-a="c-secao">+ Seção</button></div></div>`;
    if (!c.imagens.length && !c.itens.length) h += vazioAba(nome, 'O conteúdo desta aba ainda não foi colocado.', '');
    if (c.imagens.length) h += '<div class="paginas">' + c.imagens.map((r, k) => `<div><img data-ref="${esc(r)}" alt="${esc(nome)}" data-a="lupa" data-k="${k}">${M ? `<div class="ctl-img"><button data-a="ci-esq" data-k="${k}">◀</button><button data-a="ci-dir" data-k="${k}">▶</button><button data-a="ci-rem" data-k="${k}">✕</button></div>` : ''}</div>`).join('') + '</div>';
    if (c.itens.length) {
      h += `<table class="tabela"><thead><tr><th>Item</th><th style="text-align:right">Preço</th><th>Descrição</th>${M ? '<th></th>' : ''}</tr></thead><tbody>`;
      h += c.itens.map((it, k) => {
        const ctl = M ? `<td class="ctl"><button data-a="it-sobe" data-k="${k}" title="Subir">▲</button><button data-a="it-desce" data-k="${k}" title="Descer">▼</button><button data-a="it-rem" data-k="${k}" title="Tirar">✕</button></td>` : '';
        if (it.secao) return M ? `<tr class="secao"><td colspan="3"><input data-f="nome" data-k="${k}" value="${esc(it.nome)}" placeholder="Nome da seção"></td>${ctl}</tr>` : `<tr class="secao"><td colspan="3">${esc(it.nome)}</td></tr>`;
        if (M) return `<tr><td><input data-f="nome" data-k="${k}" value="${esc(it.nome)}" placeholder="Item"></td><td class="preco"><input data-f="preco" data-k="${k}" value="${esc(it.preco)}" placeholder="0 po" style="text-align:right;width:110px"></td><td><input data-f="texto" data-k="${k}" value="${esc(it.texto)}" placeholder="Descrição"></td>${ctl}</tr>`;
        return `<tr><td>${esc(it.nome)}</td><td class="preco">${esc(it.preco)}</td><td>${esc(it.texto)}</td></tr>`;
      }).join('') + '</tbody></table>';
    }
    corpo.innerHTML = h + '</div>';
    const ti = $('#c-tit'); if (ti) ti.oninput = () => { c.titulo = ti.value; salvarLogo(); const bt = $('#lugar-abas [data-aba="catalogo"]'); if (bt) bt.lastChild.textContent = abaDe(p); };
    corpo.oninput = (e) => { const f = e.target.dataset.f; if (!f) return; const it = c.itens[+e.target.dataset.k]; if (it) { it[f] = e.target.value; salvarLogo(); } };
    corpo.onclick = async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return; const k = +b.dataset.k; const a = b.dataset.a;
      if (a === 'lupa') return abrirLupa(c.imagens[k], nome);
      if (!S.mestre) return;
      if (a === 'c-img') { const r = await pedirImagens(true); if (!r.length) return; c.imagens.push(...r); }
      else if (a === 'c-item') c.itens.push({ nome: '', preco: '', texto: '', secao: false });
      else if (a === 'c-secao') c.itens.push({ nome: '', preco: '', texto: '', secao: true });
      else if (a === 'ci-esq') mover(c.imagens, k, -1); else if (a === 'ci-dir') mover(c.imagens, k, 1);
      else if (a === 'ci-rem') c.imagens.splice(k, 1);
      else if (a === 'it-sobe') mover(c.itens, k, -1); else if (a === 'it-desce') mover(c.itens, k, 1);
      else if (a === 'it-rem') c.itens.splice(k, 1);
      else return;
      salvar(); desenharAba();
      if (a === 'c-item' || a === 'c-secao') { const ins = $$('#lugar-corpo input[data-f="nome"]'); if (ins.length) ins[ins.length - 1].focus(); }
    };
  }

  // ---------------- lupa (imagem em tela cheia) ----------------
  async function abrirLupa(ref, leg) {
    if (!ref) return; const u = await urlImg(ref);
    const box = $('#lupa'); $('.lupa-img', box).innerHTML = `<img src="${esc(u)}" alt="">`; $('.lupa-leg', box).textContent = leg || '';
    box.hidden = false;
    const im = $('img', box); im.onclick = () => im.classList.toggle('grande');
  }
  const fecharLupa = () => { $('#lupa').hidden = true; };

  // ---------------- pacote (.zip) ----------------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function fazerZip(arquivos) {
    const enc = new TextEncoder(); const partes = [], centrais = []; let off = 0;
    const d = new Date(); const dt = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1); const dd = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of arquivos) {
      const nm = enc.encode(f.nome); const crc = crc32(f.dados); const n = f.dados.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
      h.setUint32(14, crc, true); h.setUint32(18, n, true); h.setUint32(22, n, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      partes.push(h.buffer, nm, f.dados);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
      c.setUint32(16, crc, true); c.setUint32(20, n, true); c.setUint32(24, n, true); c.setUint16(28, nm.length, true); c.setUint32(38, 0, true); c.setUint32(42, off, true);
      centrais.push(c.buffer, nm);
      off += 30 + nm.length + n;
    }
    const tamC = centrais.reduce((s, b) => s + b.byteLength, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, arquivos.length, true); e.setUint16(10, arquivos.length, true); e.setUint32(12, tamC, true); e.setUint32(16, off, true);
    return new Blob([...partes, ...centrais, e.buffer], { type: 'application/zip' });
  }
  async function lerZip(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf); let e = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('arquivo .zip inválido');
    const n = dv.getUint16(e + 10, true); let q = dv.getUint32(e + 16, true); const out = new Map(); const dec = new TextDecoder();
    for (let k = 0; k < n; k++) {
      if (dv.getUint32(q, true) !== 0x02014b50) break;
      const met = dv.getUint16(q + 10, true), csz = dv.getUint32(q + 20, true), nl = dv.getUint16(q + 28, true), xl = dv.getUint16(q + 30, true), cl = dv.getUint16(q + 32, true), lo = dv.getUint32(q + 42, true);
      const nome = dec.decode(u8.subarray(q + 46, q + 46 + nl)); q += 46 + nl + xl + cl;
      if (nome.endsWith('/')) continue;
      const ini = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true); const bruto = u8.subarray(ini, ini + csz);
      let bytes = null;
      if (met === 0) bytes = bruto;
      else if (met === 8 && typeof DecompressionStream !== 'undefined') bytes = new Uint8Array(await new Response(new Blob([bruto]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      if (bytes) out.set(nome, bytes);
    }
    return out;
  }
  function baixar(blob, nome) { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
  // dados do pacote: o dos jogadores vai sem os secretos e sem as notas do mestre; a cópia do mestre vai com tudo
  function pacoteDados(mestreCopia) {
    const lugares = S.dados.lugares.filter((p) => mestreCopia || !p.secreto).map((p) => (mestreCopia ? p : Object.assign({}, p, { mapa: { imagens: p.mapa.imagens.filter((x) => !x.mestre), notas: '' }, elencoImagens: p.elencoImagens.filter((x) => !x.mestre) })));
    const areas = S.dados.areas.filter((a) => mestreCopia || !a.secreto).map((a) => (mestreCopia ? a : Object.assign({}, a, { notas: '' })));
    const usados = new Set(lugares.map((p) => p.tipo).filter(Boolean));
    const tipos = S.dados.tipos.filter((t) => mestreCopia || usados.has(t.id));
    return { versao: 2, salvo_em: new Date().toISOString(), mapa: S.dados.mapa, tipos, lugares, areas };
  }
  // imagem mais leve para a web: WebP com até 4096 px no lado maior. GIF, SVG e WebP ficam como estão, e a original
  // também fica quando o WebP não sai bem menor (ou quando o navegador não sabe gerar WebP)
  async function imagemLeve(blob, ref) {
    if (!blob || /gif|svg|webp/i.test(blob.type || '') || /\.(gif|svg|webp)$/i.test(ref || '')) return null;
    try {
      const bmp = await createImageBitmap(blob);
      const k = Math.min(1, 4096 / Math.max(bmp.width, bmp.height)); const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(bmp, 0, 0, w, h); if (bmp.close) bmp.close();
      const out = await new Promise((r) => c.toBlob(r, 'image/webp', 0.85));
      return out && out.type === 'image/webp' && out.size < blob.size * 0.9 ? out : null;
    } catch (e) { return null; }
  }
  // troca as referências das imagens (num pacote já copiado) pelas versões leves
  function trocarRefs(dados, troca) {
    const t = (r) => troca.get(r) || r;
    for (const p of dados.lugares) {
      for (const a of p.arte) a.img = t(a.img);
      for (const n of p.elenco) { if (n.retrato) n.retrato = t(n.retrato); n.artes = n.artes.map(t); }
      for (const x of p.elencoImagens || []) x.img = t(x.img);
      for (const x of p.mapa.imagens) x.img = t(x.img);
      p.catalogo.imagens = p.catalogo.imagens.map(t);
    }
  }
  // mapa.json do pacote para publicar: sem o que está marcado como secreto no Cartógrafo (prédios, túneis, rótulos…)
  // e sem as notas e descrições do mestre (os jogadores veem o mapa pelo mapa.svg; o .json só serve ao mestre)
  function mapaPublico(txt) {
    let d; try { d = JSON.parse(txt); } catch (e) { return null; }
    if (!d || typeof d !== 'object') return null;
    const sec = new Set((d.landmarks || []).filter((l) => l && l.secret).map((l) => l.id));
    for (const k of Object.keys(d)) if (Array.isArray(d[k])) d[k] = d[k].filter((x) => !(x && typeof x === 'object' && (x.secret || (x.lm && sec.has(x.lm)))));
    for (const k of ['landmarks', 'districts', 'neighborhoods', 'terrain', 'labels', 'roads', 'plazas', 'piers', 'grounds']) {
      for (const x of d[k] || []) if (x && typeof x === 'object') { delete x.desc; delete x.notes; delete x.inspiracao; }
    }
    if (d.meta && typeof d.meta === 'object') delete d.meta.notes;
    return JSON.stringify(d);
  }
  function exportar() {
    const temMapa = !!(S.mapa && (S.mapa.svg || S.mapa.json || S.mapa.origem === 'publicado'));
    const nsec = S.dados.lugares.filter((p) => p.secreto).length + S.dados.areas.filter((a) => a.secreto).length;
    const c = modal(`<h2>Exportar o pacote do site</h2>
      <p>O pacote traz a pasta <b>data</b> com os lugares, os tipos e as áreas (<code>lugares.json</code>) e as imagens. Para publicar, descompacte o pacote e envie a pasta <b>data</b> para o site, por cima da antiga (no GitHub, arraste a pasta, não o .zip).</p>
      <p style="font-size:14px;color:var(--tinta2)">O pacote para publicar não leva os lugares e as áreas secretos, as notas do mestre, as imagens marcadas como só para o mestre, nem o que é secreto ou anotação no mapa do Cartógrafo.</p>
      <label class="chk"><input id="x-mapa" type="checkbox"${temMapa ? ' checked' : ' disabled'}> Incluir o mapa (mapa.json, mapa.svg, mapa.jpg e a população dos distritos)</label>
      <label class="chk"><input id="x-leve" type="checkbox" checked> Imagens mais leves para a web (WebP, carregam bem mais rápido; as originais continuam neste navegador)</label>
      <label class="chk"><input id="x-sec" type="checkbox"> Cópia do mestre: com ${nsec ? 'os ' + nsec + ' secreto(s) e ' : ''}as notas do mestre (guarde, não publique)</label>
      <div class="rodape"><button class="bt leve" data-a="cancelar">Cancelar</button><button class="bt forte" data-a="ok">Baixar o pacote</button></div>`);
    // a cópia do mestre é para guardar: por padrão vai com as imagens originais
    $('#x-sec').onchange = (e) => { $('#x-leve').checked = !e.target.checked; };
    c.onclick = async (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'cancelar') { fecharModal(); return; }
      const comMapa = $('#x-mapa').checked, comSec = $('#x-sec').checked, leve = $('#x-leve').checked; fecharModal();
      carregando('Montando o pacote…');
      try {
        const enc = new TextEncoder(); const dados = JSON.parse(JSON.stringify(pacoteDados(comSec)));
        const arquivos = [];
        const faltam = []; const refs = [...new Set(dados.lugares.flatMap(refsDe))]; const troca = new Map(); const usados = new Set(refs); let k = 0;
        for (const r of refs) {
          let b = await blobDe(r); k++;
          if (!b) { faltam.push(r); continue; }
          let nome = r;
          if (leve) {
            carregando(`Deixando as imagens mais leves… ${k} de ${refs.length}`);
            const o = await imagemLeve(b, r);
            if (o) {
              const base = r.replace(/\.[a-z0-9]+$/i, ''); nome = base + '.webp';
              for (let i = 2; usados.has(nome); i++) nome = base + '-' + i + '.webp';
              usados.add(nome); b = o; troca.set(r, nome);
            }
          }
          arquivos.push({ nome: 'data/' + nome, dados: new Uint8Array(await b.arrayBuffer()) });
        }
        carregando('Montando o pacote…');
        if (troca.size) trocarRefs(dados, troca);
        arquivos.unshift({ nome: 'data/lugares.json', dados: enc.encode(JSON.stringify(dados, null, 1)) });
        if (comMapa && S.mapa) {
          let svg = S.mapa.svg, json = S.mapa.json, jpg = S.mapa.jpg, dist = S.mapa.distritos;
          if (!svg) { try { const r = await fetch('data/mapa.svg'); if (r.ok) svg = await r.text(); } catch (er) { /* nada */ } }
          if (!json) { try { const r = await fetch('data/mapa.json'); if (r.ok) json = await r.text(); } catch (er) { /* nada */ } }
          if (!jpg) { try { const r = await fetch('data/mapa.jpg'); if (r.ok) jpg = await r.blob(); } catch (er) { /* nada */ } }
          if (!dist && S.mapa.origem === 'publicado') dist = await lerJson('data/distritos.json');
          if (json && !comSec) json = mapaPublico(json);
          if (json) arquivos.push({ nome: 'data/mapa.json', dados: enc.encode(json) });
          if (svg) arquivos.push({ nome: 'data/mapa.svg', dados: enc.encode(svg) });
          if (jpg) arquivos.push({ nome: 'data/mapa.jpg', dados: new Uint8Array(await jpg.arrayBuffer()) });
          if (dist) arquivos.push({ nome: 'data/distritos.json', dados: enc.encode(JSON.stringify(dist)) });
        }
        baixar(fazerZip(arquivos), comSec ? 'atlas-dados-MESTRE.zip' : 'atlas-dados.zip');
        carregando(null);
        const mb = arquivos.reduce((s, f) => s + f.dados.length, 0) / 1048576;
        const muitos = arquivos.length > 98 ? ` São ${arquivos.length} arquivos: pelo navegador o GitHub aceita até 100 por envio, então envie a pasta data/imagens em duas vezes.` : '';
        aviso(faltam.length ? `Pacote baixado, mas ${faltam.length} imagem(ns) não foram encontradas neste navegador.` : comSec ? `Cópia do mestre baixada (${mb.toFixed(1)} MB): guarde, não publique.` : `Pacote baixado (${arquivos.length} arquivos, ${mb.toFixed(1)} MB): descompacte e envie a pasta data para o site.${muitos}`, 9000);
      } catch (er) { carregando(null); aviso('Não deu para montar o pacote: ' + er.message, 6000); }
    };
  }
  async function importar(file) {
    try {
      if (/\.zip$/i.test(file.name) || /zip/.test(file.type)) {
        carregando('Lendo o pacote…');
        const ent = await lerZip(await file.arrayBuffer()); const dec = new TextDecoder();
        const achaFim = (suf) => { for (const [k, v] of ent) if (k === suf || k.endsWith('/' + suf)) return v; return null; };
        const lj = achaFim('lugares.json');
        let n = 0;
        for (const [k, v] of ent) {
          const m = k.match(/(?:^|\/)(imagens\/[^/]+)$/); if (!m) continue;
          const ext = (m[1].split('.').pop() || '').toLowerCase();
          await BD.set('imagens', m[1], new Blob([v], { type: MIME[ext] || 'application/octet-stream' })); urls.delete(m[1]); n++;
        }
        const msvg = achaFim('mapa.svg');
        if (msvg) {
          const svg = dec.decode(msvg); const d = dimsSvg(svg); const mj = achaFim('mapa.json'); const mjpg = achaFim('mapa.jpg'); const md = achaFim('distritos.json');
          const reg = { W: d.W, H: d.H, titulo: d.titulo, svg, json: mj ? dec.decode(mj) : null, jpg: mjpg ? new Blob([mjpg], { type: 'image/jpeg' }) : null, ppm: null, nome: file.name, distritos: null, quando: Date.now() };
          if (md) { try { reg.distritos = JSON.parse(dec.decode(md)); } catch (er) { /* nada */ } }
          if (lj) { try { const t = JSON.parse(dec.decode(lj)); if (t.mapa && t.mapa.titulo) reg.titulo = t.mapa.titulo; } catch (er) { /* nada */ } }
          if (reg.jpg) { const im = await carregarImg(URL.createObjectURL(reg.jpg)); if (im) reg.ppm = im.naturalWidth / d.W; }
          await BD.set('mapa', 'local', reg); mostrarMapa(mapaDoRegistro(reg));
        }
        if (lj) { S.dados = normalizar(JSON.parse(dec.decode(lj))); salvar(); }
        carregando(null);
        if (!lj && !msvg && !n) { aviso('Esse .zip não tem lugares, imagens nem mapa do Atlas.'); return; }
        desenharTudo(); aviso(`Pacote importado: ${lj ? S.dados.lugares.length + ' lugar(es), ' + S.dados.areas.length + ' área(s), ' : ''}${n} imagem(ns)${msvg ? ' e o mapa' : ''}.`, 5000);
        return;
      }
      const txt = await file.text(); let j;
      try { j = JSON.parse(txt); } catch (er) { aviso('Esse arquivo não é um .json válido.'); return; }
      if (j && Array.isArray(j.lugares)) { S.dados = normalizar(j); salvar(); desenharTudo(); aviso(`${S.dados.lugares.length} lugar(es) e ${S.dados.areas.length} área(s) importado(s).`); return; }
      if (j && j.meta && Array.isArray(j.districts)) { await abrirArquivoMapa(file); return; }
      aviso('Esse .json não é nem um mapa do Cartógrafo nem um lugares.json.');
    } catch (er) { carregando(null); aviso('Não deu para importar: ' + er.message, 6000); }
  }
  function desenharTudo() {
    desenharMarcas(); desenharAreas(); desenharLegenda(); desenharIndice(); selo();
    if (S.areaAberta) { if (acharArea(S.areaAberta)) desenharCartaoArea(); else fecharArea(); }
    if (S.aberto) { if (acha(S.aberto)) abrirLugar(S.aberto, S.aba, true); else fecharLugar(true); }
  }

  // ---------------- abrir mapa / ajuda ----------------
  async function dialogoMapa() {
    const loc = await BD.get('mapa', 'local');
    const c = modal(`<h2>Mapa</h2>
      <p>O mapa vem do <b>Cartógrafo</b>: escolha o arquivo <b>.json</b> e ele é desenhado aqui (leva alguns segundos). O arquivo não é alterado; mudanças no mapa continuam sendo feitas no Cartógrafo. Os círculos e as áreas ficam onde estão.</p>
      <p style="color:var(--tinta2);font-size:14px">Mapa atual: <b>${esc((S.mapa && (S.mapa.titulo || S.mapa.nome)) || 'nenhum')}</b>${S.mapa ? (S.mapa.origem === 'local' ? ' (aberto neste navegador)' : ' (publicado no site)') : ''}.</p>
      <div class="rodape">${loc ? '<button class="bt leve" data-a="pub">Voltar ao mapa publicado</button>' : ''}<button class="bt leve" data-a="cancelar">Fechar</button><button class="bt forte" data-a="abrir">Escolher o arquivo .json</button></div>`);
    c.onclick = async (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return; fecharModal();
      if (a.dataset.a === 'abrir') $('#f-mapa').click();
      if (a.dataset.a === 'pub') { await BD.del('mapa', 'local'); carregando('Carregando o mapa publicado…'); const m = await carregarPublicado(); carregando(null); if (m) mostrarMapa(m); else { aviso('Não há mapa publicado neste site.'); mostrarVazio(); } }
    };
  }
  function ajuda() {
    modal(`<h2>Como usar</h2>
      <p><b>Para todos:</b> clique num círculo do mapa, ou num nome da legenda, para abrir a página do lugar: <i>Arte</i>, <i>História e elenco</i>, <i>Mapa</i> e <i>Cardápio/Catálogo</i>. Esc ou × fecha. Na legenda, os botões de cada tipo mostram ou escondem os círculos daquele tipo (duplo clique mostra só ele). O botão <i>Áreas</i> liga e desliga a camada com as áreas dos distritos; clique numa área para ler as notas.</p>
      <p><b>No celular:</b> aproxime e afaste com dois dedos; toque nos círculos e nas áreas. No modo mestre, para pôr um lugar no mapa, toque no círculo do índice e depois no mapa.</p>
      <p><b>Modo mestre:</b> use o botão <i>Entrar no modo mestre</i> aqui embaixo, ou abra o endereço do site com <code>?mestre</code> no fim. Ele só vale neste navegador: o que você faz aqui não muda o site publicado até você exportar e publicar.</p>
      <ol>
        <li><b>Mapa:</b> em <i>Abrir mapa</i>, escolha o <b>.json</b> do Cartógrafo. O site só desenha; o mapa se muda no Cartógrafo.</li>
        <li><b>Lugares:</b> em <i>+ Novo lugar</i>, dê o número, o nome e o tipo. O tipo é seu: escreva o nome, escolha a cor (e um ícone, se quiser); ele vira sugestão para os próximos. Em <i>Tipos</i> você renomeia, muda a cor e o ícone ou apaga. Arraste o círculo do índice até o mapa (ou clique no círculo e depois no mapa). No mapa, arraste para mover; no índice, ✕ tira do mapa.</li>
        <li><b>Legenda:</b> ela se forma sozinha com os números colocados, agrupada por tipo.</li>
        <li><b>Página:</b> abra o lugar e preencha as abas: imagens da arte, a história, os personagens (retrato e artes) e as imagens do elenco (páginas inteiras), as imagens do mapa (battlemap, andares…) e o cardápio ou catálogo (imagens das páginas e/ou uma tabela com itens e preços). Nas imagens do elenco e do mapa, <i>Só para o mestre</i> esconde a imagem dos jogadores.</li>
        <li><b>Áreas:</b> com a camada ligada, use <i>+ Desenhar área</i> (clique nos cantos; clique no primeiro ponto para fechar) ou <i>Criar a partir dos distritos</i>. Na área: nome, cor, descrição, informações, notas do mestre e <i>Editar o contorno</i>. O mapa não muda.</li>
        <li><b>Publicar:</b> tudo fica salvo neste navegador. Em <i>Exportar</i>, baixe o pacote, copie a pasta <b>data</b> dele para a pasta do site e publique. Secretos e notas do mestre só vão na cópia do mestre.</li>
      </ol>
      <div class="rodape"><button class="bt leve" data-a="modo">${S.mestre ? 'Sair do modo mestre' : 'Entrar no modo mestre'}</button><button class="bt forte" data-a="ok">Entendi</button></div>`).onclick = (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return; fecharModal();
      if (a.dataset.a === 'modo') { gravar('atlas.mestre', S.mestre ? null : '1'); location.href = location.pathname + (S.mestre ? '?mestre=0' : '?mestre'); }
    };
  }

  // ---------------- eventos ----------------
  function ligar() {
    $('#b-ajuda').onclick = ajuda;
    $('#b-legenda').onclick = () => { const l = $('#legenda'); l.hidden = !l.hidden; $('#b-legenda').classList.toggle('on', !l.hidden); };
    $('#b-fecha-legenda').onclick = () => { $('#legenda').hidden = true; $('#b-legenda').classList.remove('on'); };
    $('#b-areas').onclick = () => alternarAreas();
    $('#b-fecha-area').onclick = fecharArea;
    const leg = $('#legenda-corpo');
    leg.onclick = (e) => {
      const f = e.target.closest('[data-filtro]');
      if (f) { clearTimeout(leg.t); const k = f.dataset.filtro; leg.t = setTimeout(() => alternarFiltro(k), 230); return; }
      const ff = e.target.closest('[data-f]'); if (ff) { if (ff.dataset.f === 'tipos') gerenciarTipos(); else mostrarTipos(ff.dataset.f); return; }
      const ar = e.target.closest('li[data-area]'); if (ar) { abrirArea(ar.dataset.area); verArea(ar.dataset.area); return; }
      const li = e.target.closest('li[data-id]'); if (li) abrirLugar(li.dataset.id);
    };
    leg.ondblclick = (e) => { const f = e.target.closest('[data-filtro]'); if (!f) return; clearTimeout(leg.t); mostrarTipos(f.dataset.filtro); };
    $('#ferr-areas').onclick = (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'desenhar') comecarDesenho(); else if (a === 'distritos') dialogoDistritos();
      else if (a === 'desfazer') desfazerPonto(); else if (a === 'concluir') concluirDesenho(); else if (a === 'cancelar') cancelarDesenho();
      else if (a === 'ok-ed') concluirEdicao(); else if (a === 'cancelar-ed') cancelarEdicao(); else if (a === 'apagar-ponto') apagarPonto();
    };
    $('#b-abrir').onclick = dialogoMapa; $('#b-abrir2').onclick = () => $('#f-mapa').click();
    $('#f-mapa').onchange = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) abrirArquivoMapa(f); };
    $('#b-importar').onclick = () => $('#f-importar').click();
    $('#f-importar').onchange = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importar(f); };
    $('#b-exportar').onclick = exportar;
    $('#b-lugares').onclick = () => { const i = $('#indice'); i.hidden = !i.hidden; $('#b-lugares').classList.toggle('on', !i.hidden); };
    $('#b-novo').onclick = () => editarDados(null);
    $('#b-tipos').onclick = gerenciarTipos;
    $('#busca').oninput = desenharIndice;
    const lista = $('#lista');
    lista.addEventListener('dragstart', (e) => { const li = e.target.closest('li[data-id]'); if (!li) return; e.dataTransfer.setData('text/plain', 'lugar:' + li.dataset.id); e.dataTransfer.effectAllowed = 'move'; });
    lista.onclick = (e) => {
      if (e.target.closest('[data-a="sem-filtro"]')) { mostrarTipos('todos'); return; }
      const li = e.target.closest('li[data-id]'); if (!li) return; const id = li.dataset.id;
      const b = e.target.closest('button[data-a]');
      if (b) {
        if (b.dataset.a === 'ver') verNoMapa(id);
        else if (b.dataset.a === 'editar') editarDados(acha(id));
        else if (b.dataset.a === 'tirar') { const p = acha(id); p.x = p.y = null; salvar(); desenharMarcas(); desenharLegenda(); desenharIndice(); if (S.areaAberta) desenharCartaoArea(); }
        return;
      }
      if (e.target.closest('.circ')) { if (S.colocando === id) pararColocar(); else comecarColocar(id); return; }
      if (e.target.closest('.nome')) abrirLugar(id);
    };
    $('#lugar-topo').onclick = (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'fechar') fecharLugar();
      else if (b.dataset.a === 'ver') { const id = S.aberto; fecharLugar(); setTimeout(() => verNoMapa(id), 60); }
      else if (b.dataset.a === 'dados') editarDados(acha(S.aberto));
    };
    $('#lugar-abas').onclick = (e) => { const b = e.target.closest('[data-aba]'); if (!b) return; S.aba = b.dataset.aba; desenharAba(); };
    $('#lupa').onclick = (e) => { if (e.target.closest('.lupa-x') || e.target.id === 'lupa' || e.target.classList.contains('lupa-img')) fecharLupa(); };
    $('#modal').onclick = (e) => { if (e.target.id === 'modal') fecharModal(); };
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!$('#lupa').hidden) return fecharLupa();
        if ($('#modal').classList.contains('on')) return fecharModal();
        if (!$('#lugar').hidden) return fecharLugar();
        if (S.desenho) return cancelarDesenho();
        if (S.edicao) return cancelarEdicao();
        if (S.colocando) return pararColocar();
        if (S.areaAberta) return fecharArea();
        return;
      }
      if (digitando(e) || $('#modal').classList.contains('on') || !$('#lugar').hidden) return;
      if (e.key === 'Enter' && S.desenho) { e.preventDefault(); concluirDesenho(); }
      else if (e.key === 'Enter' && S.edicao) { e.preventDefault(); concluirEdicao(); }
      else if ((e.key === 'Backspace' || e.key === 'Delete') && S.desenho) { e.preventDefault(); desfazerPonto(); }
      else if ((e.key === 'Backspace' || e.key === 'Delete') && S.edicao && S.edicao.sel != null) { e.preventDefault(); apagarPonto(); }
    });
    window.addEventListener('hashchange', rotear);
    window.addEventListener('popstate', () => { S.empurrou = false; });
    // arquivo solto na janela: .json do mapa (ou lugares) e .zip do pacote
    window.addEventListener('dragover', (e) => { if (Array.from(e.dataTransfer.types || []).includes('Files')) e.preventDefault(); });
    window.addEventListener('drop', (e) => {
      const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return; e.preventDefault();
      if (!S.mestre && S.mapa) { aviso('Para trocar o mapa ou importar lugares, use o modo mestre (?mestre no endereço).'); return; }
      if (/\.zip$/i.test(f.name)) importar(f); else if (/\.json$/i.test(f.name)) (S.mestre ? importar(f) : abrirArquivoMapa(f));
    });
  }

  // ---------------- início ----------------
  async function iniciar() {
    S.dados = novoDados();
    for (const el of $$('.mestre')) el.hidden = !S.mestre;
    if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) { $('#legenda').hidden = true; }
    $('#b-legenda').classList.toggle('on', !$('#legenda').hidden);
    if (S.mestre) { $('#indice').hidden = false; $('#b-lugares').classList.add('on'); }
    ligar();
    carregando('Carregando o mapa…');
    const pub = await lerJson('data/lugares.json');
    const rasc = S.mestre ? lerRascunho() : null;
    if (rasc) {
      S.dados = normalizar(rasc); S.origem = 'local';
      if (pub && pub.salvo_em && rasc.salvo_em && pub.salvo_em > rasc.salvo_em) setTimeout(() => aviso('Atenção: o site publicado tem lugares mais novos que o rascunho deste navegador. Para usá-los, importe o pacote publicado.', 8000), 800);
    } else if (pub) { S.dados = normalizar(pub); S.origem = 'publicado'; }
    let m = null;
    if (S.mestre) { const loc = await BD.get('mapa', 'local'); if (loc && loc.svg) m = mapaDoRegistro(loc); }
    if (!m) m = await carregarPublicado();
    carregando(null);
    if (m) mostrarMapa(m); else mostrarVazio();
    desenharAreas(); desenharLegenda(); desenharIndice(); selo(); rotear();
  }
  window.ATLAS = {
    S, abrirLugar, fecharLugar, colocar, exportar, importar, editarDados, novoDados, normalizar, fazerZip, lerZip,
    gerenciarTipos, mostrarTipos, alternarFiltro, alternarAreas, abrirArea, fecharArea, comecarDesenho, concluirDesenho, editarContorno, concluirEdicao, dialogoDistritos, pacoteDados,
    imagemLeve, mapaPublico
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

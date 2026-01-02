// PRO · NEO — same engine, cleaner UI, accent switcher
const $ = s=>document.querySelector(s); const $$ = s=>Array.from(document.querySelectorAll(s));
const STORE_LOCAL = "warehouse_spreadsheets_extra";
const STORE_VIEWS = "warehouse_saved_views";
const THEME_KEY = "warehouse_theme_neo";
const ACCENT_KEY = "warehouse_accent_neo";
const PAGE_SIZE = 18;

const state = {
  rows: [], filtered: [],
  filters: { q:"", category:"", owner:"", tag:"" },
  embed: true, compact:false, sort:"updated_desc",
  page: 1, selected: new Set(),
};

function normalize(s){ return (s||"").toString().toLowerCase().trim(); }
function uniq(arr){ return Array.from(new Set(arr)).filter(Boolean); }

function detectEmbeddable(url){
  try{
    const u = new URL(url);
    if(u.hostname.includes('docs.google.com') && u.pathname.includes('/spreadsheets/')){
      if(!u.pathname.endsWith('/preview')){ u.pathname = u.pathname.split('/edit')[0] + '/preview'; u.search='rm=minimal'; }
      return u.toString();
    }
  }catch(e){}
  return null;
}
function fmtDate(s){ if(!s) return '-'; const d=new Date(s); if(isNaN(d)) return '-'; return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'2-digit'}); }
function iconFor(r){ try{const u=new URL(r.link); if(u.hostname.includes('docs.google.com')) return '📗'; if(u.hostname.includes('sharepoint.com')||u.hostname.includes('1drv.ms')) return '📘'; if(u.pathname.endsWith('.xlsx')||u.pathname.endsWith('.xls')) return '📈';}catch(e){} return '📄'; }

async function loadData(){
  const base = await fetch('data/spreadsheets.json').then(r=>r.json()).catch(()=>({items:[]}));
  const local = JSON.parse(localStorage.getItem(STORE_LOCAL) || '[]');
  const merged = [...base.items, ...local].map((x,i)=>({ id:x.id||('row'+i), tags:(x.tags||[]), ...x }));
  state.rows = merged;
  renderFacets(); applyFilters();
  $('#year').textContent = new Date().getFullYear();
}

function renderFacets(){
  // owner
  const owners = uniq(state.rows.map(r=>r.owner));
  $('#ownerFilter').innerHTML = '<option value="">Semua</option>' + owners.map(o=>`<option>${o}</option>`).join('');

  // categories
  const catCounts = Object.create(null);
  for(const r of state.rows){ const k=r.category||'Umum'; catCounts[k]=(catCounts[k]||0)+1; }
  const cats = Object.keys(catCounts).sort((a,b)=>a.localeCompare(b));
  $('#categoryChips').innerHTML = ['Semua', ...cats].map(cat=>{
    const val = cat==='Semua'?'':cat; const count = cat==='Semua'?state.rows.length:catCounts[cat];
    const active = normalize(val)===normalize(state.filters.category) ? 'active' : '';
    return `<button class="chip ${active}" data-cat="${val}">${cat} (${count})</button>`;
  }).join('');
  $$('#categoryChips .chip').forEach(el=> el.addEventListener('click', e=>{
    const v = e.currentTarget.getAttribute('data-cat')||''; state.filters.category = v; state.page=1; applyFilters();
  }));

  // tags
  const tags = uniq(state.rows.flatMap(r=>r.tags||[]));
  $('#tagChips').innerHTML = tags.map(t=>{
    const active = normalize(t)===normalize(state.filters.tag) ? 'active' : '';
    return `<button class="chip ${active}" data-tag="${t}">#${t}</button>`;
  }).join('');
  $$('#tagChips .chip').forEach(el=> el.addEventListener('click', e=>{
    const v = e.currentTarget.getAttribute('data-tag')||''; state.filters.tag = (state.filters.tag===v?'':v); state.page=1; applyFilters();
  }));
}

function updateSummary(){
  $('#totalCount').textContent = state.rows.length;
  $('#categoryCount').textContent = new Set(state.rows.map(r=>r.category).filter(Boolean)).size;
  $('#ownerCount').textContent = new Set(state.rows.map(r=>r.owner).filter(Boolean)).size;
  $('#tagCount').textContent = new Set(state.rows.flatMap(r=>r.tags||[])).size;
}

function sortRows(list){
  const by = state.sort;
  if(by==='title_asc') list.sort((a,b)=>a.title.localeCompare(b.title));
  if(by==='title_desc') list.sort((a,b)=>b.title.localeCompare(a.title));
  if(by==='updated_desc') list.sort((a,b)=> new Date(b.updated_at||0) - new Date(a.updated_at||0));
  return list;
}

function applyFilters(){
  const q=normalize(state.filters.q), cat=normalize(state.filters.category), owner=normalize(state.filters.owner), tag=normalize(state.filters.tag);
  let list = state.rows.filter(r=>{
    const blob = normalize([r.title,r.description,r.category,r.owner,(r.tags||[]).join(' '),r.link].join(' '));
    const okQ = !q || blob.includes(q);
    const okC = !cat || normalize(r.category)===cat;
    const okO = !owner || normalize(r.owner)===owner;
    const okT = !tag || (r.tags||[]).map(normalize).includes(tag);
    return okQ && okC && okO && okT;
  });
  list = sortRows(list);
  state.filtered = list;
  state.selected.clear();
  renderPage();
  updateSummary();
}

function drawCard(r, compact){
  const tags = (r.tags||[]).map(t=>`<span class="badge2">#${t}</span>`).join('');
  return `<article class="card${compact?' compact':''}" data-id="${r.id}">
    <div class="meta">
      <span>${iconFor(r)}</span>
      <span class="badge2">${r.category||'Umum'}</span>
      ${r.owner?`<span class="badge2">👤 ${r.owner}</span>`:''}
      ${r.updated_at?`<span class="badge2">🗓 ${fmtDate(r.updated_at)}</span>`:''}
      ${tags}
    </div>
    <label class="sel"><input type="checkbox" data-id="${r.id}"/> pilih</label>
    <h3 class="title">${r.title}</h3>
    <p class="desc">${r.description||''}</p>
    <a class="link" href="${r.link}" target="_blank" rel="noopener">${r.link}</a>
    <div class="actions-row">
      <button class="btn primary openBtn" data-link="${r.link}">Buka</button>
      <button class="btn" data-copy="${r.link}">Salin</button>
    </div>
  </article>`;
}

function renderPage(){
  const size = 18;
  const start = (state.page-1)*size;
  const pageItems = state.filtered.slice(start, start+size);
  $('#cards').innerHTML = pageItems.map(r=> drawCard(r, state.compact)).join('') || `<div class="card"><p class="desc">Tidak ada hasil.</p></div>`;

  $$('.openBtn').forEach(btn => btn.addEventListener('click', e=>{
    const url = e.currentTarget.getAttribute('data-link');
    const embed = detectEmbeddable(url);
    if($('#embedToggle').checked && embed){ $('#previewFrame').src=embed; $('#modal').setAttribute('aria-hidden','false'); }
    else { window.open(url,'_blank','noopener'); }
  }));
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async e=>{
    const url = e.currentTarget.getAttribute('data-copy');
    try{ await navigator.clipboard.writeText(url); e.currentTarget.textContent='Disalin ✓'; setTimeout(()=> e.currentTarget.textContent='Salin', 1200); }catch(err){ alert('Gagal menyalin'); }
  }));
  $$('input[type="checkbox"][data-id]').forEach(ch => ch.addEventListener('change', e=>{
    const id = e.currentTarget.getAttribute('data-id');
    if(e.currentTarget.checked) state.selected.add(id); else state.selected.delete(id);
    $('#selCount').textContent = `${state.selected.size} dipilih`;
  }));
  renderPager();
  $('#selCount').textContent = `${state.selected.size} dipilih`;
}

function renderPager(){
  const pages = Math.ceil(state.filtered.length / 18) || 1;
  state.page = Math.min(state.page, pages);
  const p = $('#pager');
  if(pages<=1){ p.innerHTML=''; return; }
  const btn = (n, lab)=>`<button class="btn ${n===state.page?'primary':''}" data-p="${n}">${lab||n}</button>`;
  const items = [];
  items.push(btn(Math.max(1,state.page-1),'‹'));
  for(let i=1;i<=pages;i++){ if(i===1 || i===pages || Math.abs(i-state.page)<=1) items.push(btn(i)); else if(items.at(-1)!=='…') items.push('…'); }
  items.push(btn(Math.min(pages,state.page+1),'›'));
  p.innerHTML = items.join('');
  $$('#pager button[data-p]').forEach(b=> b.addEventListener('click', e=>{ state.page = parseInt(e.currentTarget.getAttribute('data-p'),10); renderPage(); }));
}

// Saved views
function listViews(){ return JSON.parse(localStorage.getItem(STORE_VIEWS) || '[]'); }
function renderViews(){
  const views = listViews();
  $('#views').innerHTML = views.map(v=>`<div class="row">
    <button class="btn small" data-view="${encodeURIComponent(v.name)}">${v.name}</button>
    <button class="btn small ghost" data-del="${encodeURIComponent(v.name)}">hapus</button>
  </div>`).join('') || '<small class="muted">Belum ada tampilan tersimpan.</small>';
  $$('#views [data-view]').forEach(b=> b.addEventListener('click', e=>{
    const name = decodeURIComponent(e.currentTarget.getAttribute('data-view'));
    const v = listViews().find(x=>x.name===name); if(!v) return;
    state.filters = {...v.filters}; state.sort=v.sort; state.compact=v.compact; state.page=1;
    $('#ownerFilter').value = state.filters.owner||''; $('#sortSelect').value = state.sort;
    applyFilters();
  }));
  $$('#views [data-del]').forEach(b=> b.addEventListener('click', e=>{
    const name = decodeURIComponent(e.currentTarget.getAttribute('data-del'));
    const rest = listViews().filter(v=>v.name!==name); localStorage.setItem(STORE_VIEWS, JSON.stringify(rest)); renderViews();
  }));
}
function saveView(){ const name = prompt('Nama tampilan:'); if(!name) return;
  const view = { name, filters:{...state.filters}, sort:state.sort, compact:state.compact };
  const views = listViews().filter(v=>v.name!==name); views.push(view); localStorage.setItem(STORE_VIEWS, JSON.stringify(views)); renderViews();
}

// Theme & accent
function setTheme(mode){ document.documentElement.setAttribute('data-theme', mode); localStorage.setItem(THEME_KEY, mode); }
function setAccent(val){ document.documentElement.setAttribute('data-accent', val); localStorage.setItem(ACCENT_KEY, val); }

function init(){
  // theme + accent
  const savedTheme = localStorage.getItem(THEME_KEY); if(savedTheme) setTheme(savedTheme);
  const savedAccent = localStorage.getItem(ACCENT_KEY); if(savedAccent){ setAccent(savedAccent); $('#accentSelect').value = savedAccent; }

  // controls
  $('#searchInput').addEventListener('input', e=>{ state.filters.q = e.target.value; state.page=1; applyFilters(); });
  $('#ownerFilter').addEventListener('change', e=>{ state.filters.owner = e.target.value; state.page=1; applyFilters(); });
  $('#sortSelect').addEventListener('change', e=>{ state.sort = e.target.value; state.page=1; applyFilters(); });
  $('#embedToggle').addEventListener('change', ()=>{});
  $('#compactToggle').addEventListener('change', ()=>{ state.compact = $('#compactToggle').checked; renderPage(); });
  $('#addBtn').addEventListener('click', promptAdd);
  $('#bulkOpenBtn').addEventListener('click', bulkOpen);
  $('#bulkCopyBtn').addEventListener('click', bulkCopy);
  $('#clearFiltersBtn').addEventListener('click', ()=>{ state.filters={q:'',category:'',owner:'',tag:''}; state.page=1; $('#searchInput').value=''; $('#ownerFilter').value=''; applyFilters(); });
  $('#saveViewBtn').addEventListener('click', saveView);
  $('#resetViewBtn').addEventListener('click', ()=>{ localStorage.removeItem(STORE_VIEWS); renderViews(); });
  $('#themeToggle').addEventListener('click', ()=> setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'));
  $('#accentSelect').addEventListener('change', e=> setAccent(e.target.value));

  // keyboard
  window.addEventListener('keydown', (e)=>{
    if(e.key==='/' && !/input|textarea/i.test(document.activeElement.tagName)){ e.preventDefault(); $('#searchInput').focus(); }
  });

  renderViews();
  loadData();

  // Modal
  $('#modalClose').addEventListener('click', ()=>{ $('#modal').setAttribute('aria-hidden','true'); $('#previewFrame').src='about:blank'; });
  $('#modal').addEventListener('click', (e)=>{ if(e.target.id==='modal') $('#modalClose').click(); });
}

function promptAdd(){
  const title = prompt('Judul:');
  if(!title) return;
  const link = prompt('URL spreadsheet:');
  if(!link) return;
  const category = prompt('Kategori (opsional):') || '';
  const owner = prompt('Owner (opsional):') || '';
  const tags = (prompt('Tags dipisahkan koma (opsional):')||'').split(',').map(x=>x.trim()).filter(Boolean);
  const item = { id:'local_'+Date.now(), title, link, category, owner, tags, description:'(ditambahkan lokal)', updated_at: new Date().toISOString() };
  const extra = JSON.parse(localStorage.getItem(STORE_LOCAL)||'[]'); extra.push(item);
  localStorage.setItem(STORE_LOCAL, JSON.stringify(extra));
  state.rows.push(item); renderFacets(); applyFilters();
}

function bulkOpen(){ const ids=[...state.selected]; const map=new Map(state.filtered.map(r=>[r.id,r])); ids.forEach(id=>{ const r=map.get(id); if(r) window.open(r.link,'_blank','noopener'); }); }
async function bulkCopy(){ const ids=[...state.selected]; const map=new Map(state.filtered.map(r=>[r.id,r])); const links=ids.map(id=>map.get(id)?.link).filter(Boolean).join('\n'); await navigator.clipboard.writeText(links); alert('Link terpilih disalin.'); }

document.addEventListener('DOMContentLoaded', init);

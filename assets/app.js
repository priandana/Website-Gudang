// PRO features: URL sync, saved views, pagination, import/export, multi-select, PWA, theme toggle
const $ = s=>document.querySelector(s); const $$ = s=>Array.from(document.querySelectorAll(s));
const STORE_LOCAL = "warehouse_spreadsheets_extra";
const STORE_VIEWS = "warehouse_saved_views";
const THEME_KEY = "warehouse_theme_pro";
const PAGE_SIZE = 18;

const state = {
  rows: [], filtered: [],
  filters: { q:"", category:"", owner:"", tag:"" },
  embed: true, compact:false, sort:"updated_desc",
  page: 1, selected: new Set(),
  deferredPrompt: null,
};

function normalize(s){ return (s||"").toString().toLowerCase().trim(); }
function uniq(arr){ return Array.from(new Set(arr)).filter(Boolean); }

function urlSync(push=true){
  const p = new URLSearchParams();
  for(const [k,v] of Object.entries(state.filters)){ if(v) p.set(k,v); }
  if(state.sort!=="updated_desc") p.set("sort", state.sort);
  if(state.page>1) p.set("page", String(state.page));
  if($('#embedToggle') && !$('#embedToggle').checked) p.set("embed","0");
  if($('#compactToggle') && $('#compactToggle').checked) p.set("compact","1");
  const qs = p.toString();
  const url = qs ? `?${qs}` : location.pathname;
  if(push) history.replaceState(null, "", url);
}

function readURL(){
  const p = new URLSearchParams(location.search);
  state.filters.q = p.get("q")||"";
  state.filters.category = p.get("category")||"";
  state.filters.owner = p.get("owner")||"";
  state.filters.tag = p.get("tag")||"";
  state.sort = p.get("sort")||"updated_desc";
  state.page = parseInt(p.get("page")||"1",10);
  state.embed = p.get("embed")!=="0";
  state.compact = p.get("compact")==="1";
}

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
  renderFacetAndFilters();
  applyFilters();
  $('#year').textContent = new Date().getFullYear();
}

function renderFacetAndFilters(){
  // Owners
  const owners = uniq(state.rows.map(r=>r.owner));
  $('#ownerFilter').innerHTML = '<option value="">Semua</option>' + owners.map(o=>`<option>${o}</option>`).join('');
  $('#ownerFilter').value = state.filters.owner;

  // Categories + counts
  const catCounts = Object.create(null);
  for(const r of state.rows){ const k = r.category||'Umum'; catCounts[k] = (catCounts[k]||0)+1; }
  const catKeys = Object.keys(catCounts).sort((a,b)=>a.localeCompare(b));
  $('#categoryChips').innerHTML = ['Semua', ...catKeys].map(cat=>{
    const val = cat==='Semua'?'':cat;
    const active = normalize(val) === normalize(state.filters.category) ? 'active' : '';
    const count = cat==='Semua' ? state.rows.length : catCounts[cat];
    return `<button class="chip ${active}" data-cat="${val}">${cat} (${count})</button>`;
  }).join('');

  $$('#categoryChips .chip').forEach(el=> el.addEventListener('click', e=>{
    const val = e.currentTarget.getAttribute('data-cat')||''; state.filters.category = val; state.page=1; applyFilters();
  }));

  // Tags
  const tags = uniq(state.rows.flatMap(r=>(r.tags||[])));
  $('#tagChips').innerHTML = tags.map(t=>{
    const active = normalize(t)===normalize(state.filters.tag) ? 'active':'';
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
  urlSync();
}

function renderPage(){
  const start = (state.page-1)*PAGE_SIZE;
  const pageItems = state.filtered.slice(start, start+PAGE_SIZE);
  const el = $('#cards');
  el.innerHTML = pageItems.map(r=> cardHTML(r)).join('') || `<div class="card"><p class="desc">Tidak ada hasil.</p></div>`;
  // Wire
  $$('.openBtn').forEach(btn => btn.addEventListener('click', e=>{
    const url = e.currentTarget.getAttribute('data-link');
    const embed = detectEmbeddable(url);
    if($('#embedToggle').checked && embed){ $('#previewFrame').src=embed; $('#modal').setAttribute('aria-hidden','false'); }
    else { window.open(url,'_blank','noopener'); }
  }));
  $$('input[type="checkbox"][data-id]').forEach(ch => ch.addEventListener('change', e=>{
    const id = e.currentTarget.getAttribute('data-id');
    if(e.currentTarget.checked) state.selected.add(id); else state.selected.delete(id);
    $('#selCount').textContent = `${state.selected.size} dipilih`;
  }));
  $('#compactToggle').checked = state.compact;
  $$('.card').forEach(c=> state.compact ? c.classList.add('compact') : c.classList.remove('compact'));
  renderPager();
  $('#selCount').textContent = `${state.selected.size} dipilih`;
}

function cardHTML(r){
  const sel = state.selected.has(r.id) ? 'checked' : '';
  const tags = (r.tags||[]).map(t=>`<span class="badge">#${t}</span>`).join('');
  return `<article class="card${state.compact?' compact':''}" data-id="${r.id}">
    <div class="meta">
      <span>${iconFor(r)}</span>
      <span class="badge">${r.category||'Umum'}</span>
      ${r.owner?`<span class="badge">👤 ${r.owner}</span>`:''}
      ${r.updated_at?`<span class="badge">🗓 ${fmtDate(r.updated_at)}</span>`:''}
      ${tags}
    </div>
    <label class="sel"><input type="checkbox" data-id="${r.id}" ${sel}/> pilih</label>
    <h3 class="title">${r.title}</h3>
    <p class="desc">${r.description||''}</p>
    <a class="link" href="${r.link}" target="_blank" rel="noopener">${r.link}</a>
    <div class="actions-row">
      <button class="btn primary openBtn" data-link="${r.link}">Buka</button>
      <button class="btn" data-copy="${r.link}" onclick="navigator.clipboard.writeText('${r.link}').then(()=>this.textContent='Disalin ✓',()=>alert('Gagal menyalin'))">Salin</button>
    </div>
  </article>`;
}

function renderPager(){
  const pages = Math.ceil(state.filtered.length / PAGE_SIZE) || 1;
  state.page = Math.min(state.page, pages);
  const p = $('#pager');
  if(pages<=1){ p.innerHTML=''; return; }
  const btn = (n, lab)=>`<button class="btn ${n===state.page?'primary':''}" data-p="${n}">${lab||n}</button>`;
  const items = [];
  items.push(btn(Math.max(1,state.page-1),'‹'));
  for(let i=1;i<=pages;i++){ if(i===1 || i===pages || Math.abs(i-state.page)<=1) items.push(btn(i)); else if(items.at(-1)!=='…') items.push('…'); }
  items.push(btn(Math.min(pages,state.page+1),'›'));
  p.innerHTML = items.join('');
  $$('#pager button[data-p]').forEach(b=> b.addEventListener('click', e=>{ state.page = parseInt(e.currentTarget.getAttribute('data-p'),10); renderPage(); urlSync(); }));
}

// Saved Views
function listViews(){ return JSON.parse(localStorage.getItem(STORE_VIEWS) || '[]'); }
function saveCurrentView(){
  const name = prompt('Nama tampilan (mis. Outbound - A-Z):');
  if(!name) return;
  const view = { name, filters: {...state.filters}, sort: state.sort, compact: state.compact };
  const views = listViews().filter(v=>v.name!==name);
  views.push(view);
  localStorage.setItem(STORE_VIEWS, JSON.stringify(views));
  renderViews();
}
function renderViews(){
  const views = listViews();
  $('#views').innerHTML = views.map(v=>`<div class="view-item">
    <button class="btn small" data-view="${encodeURIComponent(v.name)}">${v.name}</button>
    <button class="btn small ghost" data-del="${encodeURIComponent(v.name)}">hapus</button>
  </div>`).join('') || '<small class="muted">Belum ada tampilan tersimpan.</small>';
  $$('#views [data-view]').forEach(b=> b.addEventListener('click', e=>{
    const name = decodeURIComponent(e.currentTarget.getAttribute('data-view'));
    const v = listViews().find(x=>x.name===name); if(!v) return;
    state.filters = {...v.filters}; state.sort=v.sort; state.compact=v.compact; state.page=1;
    $('#ownerFilter').value = state.filters.owner||'';
    $('#sortSelect').value = state.sort;
    applyFilters();
  }));
  $$('#views [data-del]').forEach(b=> b.addEventListener('click', e=>{
    const name = decodeURIComponent(e.currentTarget.getAttribute('data-del'));
    const rest = listViews().filter(v=>v.name!==name);
    localStorage.setItem(STORE_VIEWS, JSON.stringify(rest));
    renderViews();
  }));
}

// Import/Export
function csvToRows(text){
  // naive CSV: split by newline, comma; handle simple quotes
  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows = [];
  for(const line of lines){
    const parts = []; let cur=''; let q=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch=='"'){ q=!q; continue; }
      if(ch==',' && !q){ parts.push(cur); cur=''; continue; }
      cur+=ch;
    }
    parts.push(cur);
    const [title,link,category,owner,tags,description,updated_at] = parts.map(x=>x.trim());
    rows.push({ id:'imp_'+Date.now()+Math.random().toString(16).slice(2), title, link, category, owner, tags:(tags?tags.split('|').map(s=>s.trim()):[]), description, updated_at });
  }
  return rows;
}
function rowsToCSV(arr){
  const esc = s=> '"'+(s||'').replaceAll('"','""')+'"';
  const head = ['title','link','category','owner','tags','description','updated_at'];
  const lines = [head.join(',')];
  for(const r of arr){
    lines.push([esc(r.title), esc(r.link), esc(r.category), esc(r.owner), esc((r.tags||[]).join('|')), esc(r.description||''), esc(r.updated_at||'')].join(','));
  }
  return lines.join('\n');
}

function importFile(){
  const f = $('#filePicker').files[0]; if(!f) return alert('Pilih file JSON atau CSV terlebih dulu.');
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      let items=[];
      if(f.name.endsWith('.json')){
        const parsed = JSON.parse(reader.result);
        items = parsed.items || parsed;
      }else{
        items = csvToRows(reader.result);
      }
      const extra = JSON.parse(localStorage.getItem(STORE_LOCAL) || '[]');
      items = items.map(x=>({ id: x.id || 'imp_'+Date.now()+Math.random().toString(16).slice(2), ...x }));
      const merged = [...extra, ...items];
      localStorage.setItem(STORE_LOCAL, JSON.stringify(merged));
      alert(`Import berhasil: ${items.length} item ditambahkan (lokal).`);
      state.rows.push(...items);
      renderFacetAndFilters(); applyFilters();
    }catch(err){ alert('Gagal import: '+err.message); }
  };
  reader.readAsText(f);
}
function exportJSON(){ const blob = new Blob([JSON.stringify({items:state.filtered}, null, 2)], {type:'application/json'}); downloadBlob(blob,'spreadsheets_filtered.json'); }
function exportCSV(){ const blob = new Blob([rowsToCSV(state.filtered)], {type:'text/csv'}); downloadBlob(blob,'spreadsheets_filtered.csv'); }
function downloadBlob(blob, name){ const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000); }

// Bulk actions
function bulkOpen(){ const ids=[...state.selected]; const map=new Map(state.filtered.map(r=>[r.id,r])); ids.forEach(id=>{ const r=map.get(id); if(r) window.open(r.link,'_blank','noopener'); }); }
async function bulkCopy(){ const ids=[...state.selected]; const map=new Map(state.filtered.map(r=>[r.id,r])); const links=ids.map(id=>map.get(id)?.link).filter(Boolean).join('\n'); await navigator.clipboard.writeText(links); alert('Link terpilih disalin.'); }

// Add (local)
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
  state.rows.push(item); renderFacetAndFilters(); applyFilters();
}

// Theme
function setTheme(mode){ document.documentElement.setAttribute('data-theme', mode); localStorage.setItem(THEME_KEY, mode); }
function initTheme(){ const saved = localStorage.getItem(THEME_KEY); if(saved) setTheme(saved); }

// PWA
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); state.deferredPrompt = e; $('#installBtn').hidden=false; });
async function installApp(){ if(!state.deferredPrompt) return; state.deferredPrompt.prompt(); const choice = await state.deferredPrompt.userChoice; state.deferredPrompt=null; $('#installBtn').hidden=true; }

// Keyboard shortcuts
function initShortcuts(){
  window.addEventListener('keydown', (e)=>{
    if(e.key==='/' && !/input|textarea/i.test(document.activeElement.tagName)){ e.preventDefault(); $('#searchInput').focus(); }
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); $('#searchInput').focus(); }
  });
}

function init(){
  readURL();
  initTheme();
  // Controls
  $('#searchInput').value = state.filters.q||'';
  $('#searchInput').addEventListener('input', e=>{ state.filters.q = e.target.value; state.page=1; applyFilters(); });
  $('#ownerFilter').addEventListener('change', e=>{ state.filters.owner = e.target.value; state.page=1; applyFilters(); });
  $('#sortSelect').value = state.sort;
  $('#sortSelect').addEventListener('change', e=>{ state.sort = e.target.value; state.page=1; applyFilters(); });
  $('#embedToggle').checked = state.embed;
  $('#embedToggle').addEventListener('change', ()=>{ state.embed = $('#embedToggle').checked; urlSync(); });
  $('#compactToggle').checked = state.compact;
  $('#compactToggle').addEventListener('change', ()=>{ state.compact = $('#compactToggle').checked; renderPage(); urlSync(); });
  $('#addBtn').addEventListener('click', promptAdd);
  $('#bulkOpenBtn').addEventListener('click', bulkOpen);
  $('#bulkCopyBtn').addEventListener('click', bulkCopy);
  $('#clearFiltersBtn').addEventListener('click', ()=>{ state.filters={q:'',category:'',owner:'',tag:''}; state.page=1; $('#searchInput').value=''; $('#ownerFilter').value=''; applyFilters(); });
  $('#saveViewBtn').addEventListener('click', saveCurrentView);
  $('#resetViewBtn').addEventListener('click', ()=>{ localStorage.removeItem(STORE_VIEWS); renderViews(); });
  $('#importBtn').addEventListener('click', importFile);
  $('#exportJSONBtn').addEventListener('click', exportJSON);
  $('#exportCSVBtn').addEventListener('click', exportCSV);
  $('#themeToggle').addEventListener('click', ()=> setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'));
  $('#installBtn').addEventListener('click', installApp);
  initShortcuts();
  renderViews();
  loadData();
  // Modal
  $('#modalClose').addEventListener('click', ()=>{ $('#modal').setAttribute('aria-hidden','true'); $('#previewFrame').src='about:blank'; });
  $('#modal').addEventListener('click', (e)=>{ if(e.target.id==='modal') $('#modalClose').click(); });
  // Service worker
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('/sw.js').catch(()=>{}); }
}

document.addEventListener('DOMContentLoaded', init);

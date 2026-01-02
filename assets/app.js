// Simple portal for warehouse spreadsheets
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  rows: [],           // merged from data + localStorage additions
  filtered: [],
  filters: { q: "", category: "", owner: "" },
  embed: true,
};

const STORAGE_KEY = "warehouse_spreadsheets_extra";

function normalize(str){ return (str||'').toString().toLowerCase().trim(); }

function detectEmbeddable(url){
  try{
    const u = new URL(url);
    // Google Sheets
    if(u.hostname.includes('docs.google.com') && u.pathname.includes('/spreadsheets/')){
      // Prefer /preview for cleaner UI
      if(!u.pathname.endsWith('/preview')){
        const path = u.pathname.split('/edit')[0] + '/preview';
        u.pathname = path;
        u.search = 'rm=minimal';
      }
      return u.toString();
    }
    // Microsoft Excel online share links
    if(u.hostname.includes('1drv.ms') || u.hostname.includes('sharepoint.com')){
      return url; // embedding varies; open in new tab is safer
    }
  }catch(e){}
  return null;
}

function fmtDate(s){
  if(!s) return '-';
  const d = new Date(s);
  if(isNaN(d)) return '-';
  return d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'2-digit' });
}

async function loadData(){
  const base = await fetch('data/spreadsheets.json').then(r=>r.json()).catch(()=>({items:[]}));
  const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const merged = [...base.items, ...local];
  state.rows = merged.map((x, i) => ({ id: x.id || 'row'+i, ...x }));
  renderFilters();
  applyFilters();
  updateSummary();
}

function updateSummary(){
  $('#totalCount').textContent = state.rows.length;
  $('#categoryCount').textContent = new Set(state.rows.map(r=>r.category).filter(Boolean)).size;
  $('#ownerCount').textContent = new Set(state.rows.map(r=>r.owner).filter(Boolean)).size;
  $('#year').textContent = new Date().getFullYear();
}

function renderFilters(){
  const cats = Array.from(new Set(state.rows.map(r=>r.category).filter(Boolean))).sort();
  const owners = Array.from(new Set(state.rows.map(r=>r.owner).filter(Boolean))).sort();
  const catSel = $('#categoryFilter'), ownerSel = $('#ownerFilter');
  catSel.innerHTML = '<option value="">Semua</option>' + cats.map(c=>`<option>${c}</option>`).join('');
  ownerSel.innerHTML = '<option value="">Semua</option>' + owners.map(o=>`<option>${o}</option>`).join('');
}

function applyFilters(){
  const q = normalize(state.filters.q);
  const cat = normalize(state.filters.category);
  const owner = normalize(state.filters.owner);
  const list = state.rows.filter(r => {
    const blob = normalize([r.title, r.description, r.category, r.owner, r.link].join(' '));
    const okQ = !q || blob.includes(q);
    const okC = !cat || normalize(r.category) === cat;
    const okO = !owner || normalize(r.owner) === owner;
    return okQ && okC && okO;
  });
  state.filtered = list;
  drawCards();
}

function iconFor(r){
  try{
    const u = new URL(r.link);
    if(u.hostname.includes('docs.google.com')) return '📗';
    if(u.hostname.includes('sharepoint.com') || u.hostname.includes('1drv.ms')) return '📘';
    if(u.pathname.endsWith('.xlsx') || u.pathname.endsWith('.xls')) return '📈';
  }catch(e){}
  return '📄';
}

function drawCards(){
  const el = $('#cards');
  if(!state.filtered.length){
    el.innerHTML = `<div class="card"><p class="desc">Tidak ada hasil. Coba ubah kata kunci atau filter.</p></div>`;
    return;
  }
  el.innerHTML = state.filtered.map(r => `
    <article class="card" data-id="${r.id}">
      <div class="meta"><span class="icons">${iconFor(r)}</span>
        <span class="badge">${r.category || 'Umum'}</span>
        ${r.owner ? `<span class="badge">Owner: ${r.owner}</span>`:''}
        ${r.updated_at ? `<span class="badge" title="Terakhir diperbarui">${fmtDate(r.updated_at)}</span>`:''}
      </div>
      <h3 class="title">${r.title}</h3>
      <p class="desc">${r.description || ''}</p>
      <a class="link" href="${r.link}" target="_blank" rel="noopener">${r.link}</a>
      <div class="actions-row">
        <button class="btn primary openBtn" data-link="${r.link}">Buka</button>
        <button class="btn copy" data-copy="${r.link}">Salin Link</button>
      </div>
    </article>
  `).join('');

  // Wire actions
  $$('.openBtn').forEach(btn => btn.addEventListener('click', e => {
    const url = e.currentTarget.getAttribute('data-link');
    const embed = detectEmbeddable(url);
    if($('#embedToggle').checked && embed){
      $('#previewFrame').src = embed;
      $('#modal').setAttribute('aria-hidden','false');
    }else{
      window.open(url, '_blank', 'noopener');
    }
  }));
  $$('.copy').forEach(btn => btn.addEventListener('click', async e => {
    const url = e.currentTarget.getAttribute('data-copy');
    try{
      await navigator.clipboard.writeText(url);
      e.currentTarget.textContent = 'Disalin ✓';
      setTimeout(()=> e.currentTarget.textContent = 'Salin Link', 1200);
    }catch(err){
      alert('Gagal menyalin.');
    }
  }));
}

function promptAdd(){
  const title = prompt('Judul spreadsheet:');
  if(!title) return;
  const link = prompt('Tempel URL spreadsheet:');
  if(!link) return;
  const category = prompt('Kategori (opsional, mis. Stok, Inbound, Outbound):') || '';
  const owner = prompt('Owner (opsional):') || '';
  const item = { id: 'local_'+Date.now(), title, link, category, owner, description:'(ditambahkan lokal)', updated_at: new Date().toISOString() };
  const extra = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  extra.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(extra));
  state.rows.push(item);
  renderFilters();
  applyFilters();
  updateSummary();
}

function initModal(){
  $('#modalClose').addEventListener('click', ()=>{
    $('#modal').setAttribute('aria-hidden','true');
    $('#previewFrame').src = 'about:blank';
  });
  $('#modal').addEventListener('click', (e)=>{
    if(e.target.id === 'modal'){
      $('#modalClose').click();
    }
  });
}

function init(){
  $('#searchInput').addEventListener('input', (e)=>{ state.filters.q = e.target.value; applyFilters(); });
  $('#categoryFilter').addEventListener('change', (e)=>{ state.filters.category = e.target.value; applyFilters(); });
  $('#ownerFilter').addEventListener('change', (e)=>{ state.filters.owner = e.target.value; applyFilters(); });
  $('#embedToggle').addEventListener('change', ()=>{});
  $('#addBtn').addEventListener('click', promptAdd);
  initModal();
  loadData();
}

document.addEventListener('DOMContentLoaded', init);

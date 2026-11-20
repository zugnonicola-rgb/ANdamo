(() => {
  'use strict';
  const MAP_PROVIDER = 'leaflet';
  const ANCONA_VIEW = { lat: 43.6068, lon: 13.5187, zoom: 13 };
  const state = {
    stops: [], lines: [], stopById: new Map(), lineByCode: new Map(),
    selectedStop: null, selectedLine: null, activeTab: 'map',
    favorites: loadFavorites(), markers: new Map(), mapMovingTimer: null
  };
  const $ = (id) => document.getElementById(id);
  const topbar = $('topbar'), bottomNav = $('bottomNav'), sheet = $('bottomSheet');
  const sheetContent = $('sheetContent'), statusText = $('statusText');
  let mapAdapter;

  function loadFavorites() {
    try { return JSON.parse(localStorage.getItem('andamo-favorites') || '{"stops":[],"lines":[]}'); }
    catch (_) { return { stops: [], lines: [] }; }
  }
  function saveFavorites() { localStorage.setItem('andamo-favorites', JSON.stringify(state.favorites)); }
  function toast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function natural(a,b) { return a.localeCompare(b,'it',{numeric:true,sensitivity:'base'}); }

  class LeafletMapProvider {
    constructor(container) {
      this.map = L.map(container, { zoomControl: true, preferCanvas: true }).setView([ANCONA_VIEW.lat, ANCONA_VIEW.lon], ANCONA_VIEW.zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
      this.layer = L.layerGroup().addTo(this.map);
      this.markers = new Map();
      this.map.on('movestart zoomstart', () => {
        topbar.classList.add('hidden-ui'); bottomNav.classList.add('hidden-ui');
        clearTimeout(state.mapMovingTimer);
      });
      this.map.on('moveend zoomend', () => {
        clearTimeout(state.mapMovingTimer);
        state.mapMovingTimer = setTimeout(() => {
          if (state.activeTab === 'map') { topbar.classList.remove('hidden-ui'); bottomNav.classList.remove('hidden-ui'); }
        }, 500);
      });
    }
    addStops(stops) {
      stops.forEach(stop => {
        const marker = L.circleMarker([stop.lat, stop.lon], {
          radius: 5, color: '#ffffff', weight: 1.5, fillColor: '#1688b5', fillOpacity: .95
        }).addTo(this.layer);
        marker.on('click', () => showStop(stop.id));
        this.markers.set(stop.id, marker);
      });
    }
    focusStop(stop, zoom = 16) {
      this.map.setView([stop.lat, stop.lon], Math.max(this.map.getZoom(), zoom), { animate: true });
      const marker = this.markers.get(stop.id);
      if (marker) { marker.setStyle({ radius: 8, fillColor: '#ffd56b', color: '#fff', weight: 3 }); }
    }
    setLineStops(ids) {
      const active = new Set(ids);
      this.markers.forEach((marker, id) => {
        const on = active.has(id);
        marker.setStyle({ opacity: on ? 1 : .14, fillOpacity: on ? .95 : .12, radius: on ? 6 : 4 });
      });
    }
    resetStyles() {
      this.markers.forEach(marker => marker.setStyle({ opacity: 1, fillOpacity: .95, radius: 5, fillColor: '#1688b5', color: '#fff', weight: 1.5 }));
    }
    fitStops(ids) {
      const coords = ids.map(id => state.stopById.get(id)).filter(Boolean).map(s => [s.lat,s.lon]);
      if (coords.length) this.map.fitBounds(coords, { padding: [45,45], maxZoom: 15, animate: true });
    }
    locate() {
      this.map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
    }
  }
  const MapProvider = {
    create(container) {
      if (MAP_PROVIDER === 'leaflet') return new LeafletMapProvider(container);
      throw new Error('Provider cartografico non disponibile');
    }
  };

  function showStop(id) {
    const stop = state.stopById.get(id); if (!stop) return;
    state.selectedStop = id; state.selectedLine = null; state.activeTab = 'map';
    mapAdapter.resetStyles(); mapAdapter.focusStop(stop);
    const saved = state.favorites.stops.includes(id);
    sheet.classList.remove('hidden');
    sheetContent.innerHTML = `
      <div class="stop-title-row"><div><span class="eyebrow">FERMATA</span><h2>${esc(stop.name || 'Fermata senza nome')}</h2></div>
      <button class="favorite-button ${saved?'saved':''}" id="toggleStopFavorite" aria-label="Salva fermata">${saved?'★':'☆'}</button></div>
      <p class="sheet-subtitle">${stop.lines.length} ${stop.lines.length===1?'linea associata':'linee associate'}</p>
      <div class="section-label">Linee che fermano qui</div>
      <div class="line-chips">${stop.lines.map(code=>`<button class="line-chip" data-line="${esc(code)}">${esc(code)}</button>`).join('') || '<span class="sheet-subtitle">Nessuna linea associata nel dataset.</span>'}</div>
      <p class="sheet-subtitle" style="margin-top:14px">Orari in fermata e dati LIVE non sono ancora disponibili in questa versione.</p>`;
    $('toggleStopFavorite').addEventListener('click', () => toggleFavorite('stops', id));
    sheetContent.querySelectorAll('[data-line]').forEach(b => b.addEventListener('click', () => showLine(b.dataset.line)));
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab==='map'));
  }

  function showLines() {
    state.activeTab='lines'; state.selectedLine=null; state.selectedStop=null;
    mapAdapter.resetStyles(); sheet.classList.remove('hidden');
    const lines=state.lines.slice().sort((a,b)=>natural(a.code,b.code));
    sheetContent.innerHTML=`<div class="panel-header"><h2>Linee</h2><span>${lines.length} servizi nell'area</span></div>
      <div class="line-list">${lines.map(line=>`<button class="line-row" data-code="${esc(line.code)}">
      <span class="line-code">${esc(line.code)}</span><span class="line-copy"><strong>${esc(line.description || 'Linea '+line.code)}</strong><small>${line.stopCount} fermate associate</small></span><span class="line-count">›</span></button>`).join('')}</div>
      <p class="sheet-subtitle">Sono inclusi i servizi ATMA che presentano fermate nell'area geografica selezionata, compresi alcuni collegamenti extraurbani e speciali.</p>`;
    sheetContent.querySelectorAll('[data-code]').forEach(b=>b.addEventListener('click',()=>showLine(b.dataset.code)));
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab==='lines'));
    topbar.classList.remove('hidden-ui'); bottomNav.classList.remove('hidden-ui');
  }

  function showLine(code) {
    const line=state.lineByCode.get(code); if(!line) return;
    state.activeTab='lines'; state.selectedLine=code; state.selectedStop=null;
    mapAdapter.setLineStops(line.stopIds); mapAdapter.fitStops(line.stopIds);
    sheet.classList.remove('hidden');
    const saved=state.favorites.lines.includes(code);
    const stopRows=line.stopIds.map(id=>state.stopById.get(id)).filter(Boolean).sort((a,b)=>natural(a.name,b.name));
    sheetContent.innerHTML=`<div class="stop-title-row"><div><span class="eyebrow">LINEA ATMA</span><h2>${esc(code)}</h2></div>
      <button class="favorite-button ${saved?'saved':''}" id="toggleLineFavorite" aria-label="Salva linea">${saved?'★':'☆'}</button></div>
      <p class="sheet-subtitle">${esc(line.description || 'Servizio ATMA')} · ${line.stopCount} fermate</p>
      <div class="section-label">Fermate associate</div>
      <div class="stop-list">${stopRows.map(s=>`<button class="stop-row" data-stop="${esc(s.id)}"><span class="stop-dot"></span><span><strong>${esc(s.name)}</strong><small>${esc(s.lines.join(' · '))}</small></span></button>`).join('')}</div>
      <p class="sheet-subtitle">Il tracciato stradale e gli orari per direzione saranno integrati in un passaggio successivo, dopo la ricostruzione dei percorsi.</p>`;
    $('toggleLineFavorite').addEventListener('click',()=>toggleFavorite('lines',code));
    sheetContent.querySelectorAll('[data-stop]').forEach(b=>b.addEventListener('click',()=>showStop(b.dataset.stop)));
    topbar.classList.remove('hidden-ui'); bottomNav.classList.remove('hidden-ui');
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab==='lines'));
  }

  function showFavorites() {
    state.activeTab='favorites'; state.selectedLine=null; state.selectedStop=null; mapAdapter.resetStyles();
    sheet.classList.remove('hidden');
    const stops=state.favorites.stops.map(id=>state.stopById.get(id)).filter(Boolean);
    const lines=state.favorites.lines.map(code=>state.lineByCode.get(code)).filter(Boolean);
    sheetContent.innerHTML=`<div class="panel-header"><h2>Preferiti</h2><span>${stops.length+lines.length} salvati</span></div>
      <div class="section-label">Le mie fermate</div>
      <div class="favorite-list">${stops.length?stops.map(s=>`<button class="favorite-row" data-stop="${esc(s.id)}"><span class="line-code">⌖</span><span class="line-copy"><strong>${esc(s.name)}</strong><small>${esc(s.lines.join(' · '))}</small></span>›</button>`).join(''):'<p class="sheet-subtitle">Non hai ancora salvato fermate.</p>'}</div>
      <div class="section-label">Le mie linee</div>
      <div class="favorite-list">${lines.length?lines.map(l=>`<button class="favorite-row" data-code="${esc(l.code)}"><span class="line-code">${esc(l.code)}</span><span class="line-copy"><strong>${esc(l.description||'Linea '+l.code)}</strong><small>${l.stopCount} fermate</small></span>›</button>`).join(''):'<p class="sheet-subtitle">Non hai ancora salvato linee.</p>'}</div>`;
    sheetContent.querySelectorAll('[data-stop]').forEach(b=>b.addEventListener('click',()=>showStop(b.dataset.stop)));
    sheetContent.querySelectorAll('[data-code]').forEach(b=>b.addEventListener('click',()=>showLine(b.dataset.code)));
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab==='favorites'));
    topbar.classList.remove('hidden-ui'); bottomNav.classList.remove('hidden-ui');
  }

  function toggleFavorite(type, value) {
    const arr=state.favorites[type]; const i=arr.indexOf(value);
    if(i>=0) arr.splice(i,1); else arr.push(value);
    saveFavorites(); toast(i>=0?'Rimosso dai preferiti':'Aggiunto ai preferiti');
    if(type==='stops' && state.selectedStop) showStop(value);
    else if(type==='lines' && state.selectedLine) showLine(value);
    else showFavorites();
  }

  function renderSearch(query) {
    const box=$('searchResults'); const q=query.trim().toLocaleLowerCase('it');
    $('clearSearch').hidden=!query;
    if(!q){box.hidden=true;return;}
    const stopResults=state.stops.filter(s=>s.name.toLocaleLowerCase('it').includes(q)||s.lines.some(l=>l.toLocaleLowerCase('it')===q)).slice(0,7);
    const lineResults=state.lines.filter(l=>l.code.toLocaleLowerCase('it').includes(q)||l.description.toLocaleLowerCase('it').includes(q)).slice(0,5);
    const html=[
      ...stopResults.map(s=>`<button class="search-result" data-stop="${esc(s.id)}"><span class="result-icon">⌖</span><span class="result-copy"><strong>${esc(s.name)}</strong><small>Fermata · Linee ${esc(s.lines.join(', '))}</small></span></button>`),
      ...lineResults.map(l=>`<button class="search-result" data-code="${esc(l.code)}"><span class="result-icon">${esc(l.code)}</span><span class="result-copy"><strong>Linea ${esc(l.code)}</strong><small>${esc(l.description)}</small></span></button>`)
    ].join('');
    box.innerHTML=html||'<p class="sheet-subtitle" style="padding:12px">Nessun risultato trovato.</p>';
    box.hidden=false;
    box.querySelectorAll('[data-stop]').forEach(b=>b.addEventListener('click',()=>{box.hidden=true;$('searchInput').blur();showStop(b.dataset.stop)}));
    box.querySelectorAll('[data-code]').forEach(b=>b.addEventListener('click',()=>{box.hidden=true;$('searchInput').blur();showLine(b.dataset.code)}));
  }

  async function init() {
    try {
      const [stopsRes,linesRes,metaRes]=await Promise.all([
        fetch('data/stops.json'),fetch('data/lines.json'),fetch('data/metadata.json')
      ]);
      if(!stopsRes.ok||!linesRes.ok) throw new Error('Dati non raggiungibili');
      [state.stops,state.lines]=await Promise.all([stopsRes.json(),linesRes.json()]);
      const metadata=metaRes.ok?await metaRes.json():null;
      state.stops.forEach(s=>state.stopById.set(s.id,s));
      state.lines.forEach(l=>state.lineByCode.set(l.code,l));
      mapAdapter=MapProvider.create('map'); mapAdapter.addStops(state.stops);
      statusText.textContent=`${state.stops.length} fermate`;
      if(metadata) $('statusText').title=`Dati statici ATMA · validità ${metadata.datasetValidFrom} – ${metadata.datasetValidTo}`;
      $('searchInput').addEventListener('input',e=>renderSearch(e.target.value));
      $('clearSearch').addEventListener('click',()=>{$('searchInput').value='';renderSearch('');$('searchInput').focus()});
      $('themeButton').addEventListener('click',toggleTheme);
      $('locateButton').addEventListener('click',()=>mapAdapter.locate());
      document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{
        const tab=b.dataset.tab;
        if(tab==='map'){state.activeTab='map';state.selectedLine=null;state.selectedStop=null;mapAdapter.resetStyles();sheet.classList.add('hidden');document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x===b));topbar.classList.remove('hidden-ui');bottomNav.classList.remove('hidden-ui')}
        if(tab==='lines') showLines();
        if(tab==='favorites') showFavorites();
      }));
      applyTheme();
    } catch(err) {
      statusText.textContent='Errore nel caricamento dei dati';
      sheetContent.innerHTML='<div class="sheet-intro"><h1>Non riesco a caricare le fermate.</h1><p>Controlla la connessione e ricarica la pagina.</p></div>';
      console.error(err);
    }
  }
  function applyTheme() {
    const saved=localStorage.getItem('andamo-theme')||'system';
    const dark=saved==='dark'||(saved==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('dark',dark);
  }
  function toggleTheme() {
    const dark=document.body.classList.contains('dark');
    localStorage.setItem('andamo-theme',dark?'light':'dark'); applyTheme();
  }
  window.ANdamoMap = {
    setView(lat,lon,zoom){ if(mapAdapter) mapAdapter.map.setView([lat,lon],zoom); },
    focusStop(id){ if(mapAdapter&&state.stopById.has(id)) showStop(id); },
    getCoordinates(){ return 'WGS84 latitude/longitude'; },
    provider: MAP_PROVIDER
  };
  init();
})();
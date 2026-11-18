(() => {
  "use strict";

  const ANCONA = [43.6158, 13.5189];
  const map = L.map("map", { zoomControl: false, attributionControl: false }).setView(ANCONA, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.control.zoom({ position: "topright" }).addTo(map);

  const $ = (id) => document.getElementById(id);
  const sheet = $("bottomSheet");
  const sheetContent = $("sheetContent");
  const scrim = $("scrim");
  const nav = $("bottomNav");
  const toast = $("toast");
  let toastTimer;
  let moveTimer;
  let userMarker = null;
  let selectedPanel = "map";
  let sheetExpanded = false;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function openSheet(panel, expanded = false) {
    selectedPanel = panel;
    sheetExpanded = expanded;
    sheet.classList.add("open");
    sheet.classList.toggle("expanded", expanded);
    scrim.classList.add("visible");
    nav.classList.remove("hidden");
    renderPanel(panel);
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.panel === panel);
    });
  }

  function closeSheet() {
    sheet.classList.remove("open", "expanded");
    scrim.classList.remove("visible");
    selectedPanel = "map";
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.panel === "map");
    });
  }

  function renderPanel(panel) {
    if (panel === "lines") {
      sheetContent.innerHTML = `
        <h2 class="panel-title">Linee autobus</h2>
        <p class="panel-copy">Qui troverai l'elenco delle linee urbane, con colore, direzione e percorso sulla mappa.</p>
        <div class="empty-state"><div class="empty-emoji">🚌</div><strong>Stiamo preparando le linee</strong><span class="panel-copy">Prima di mostrarle importeremo i dati ufficiali Conerobus, così non troverai linee o fermate inventate.</span></div>`;
    } else if (panel === "favorites") {
      sheetContent.innerHTML = `
        <h2 class="panel-title">I tuoi preferiti</h2>
        <p class="panel-copy">Ritrova rapidamente le fermate e le linee che utilizzi più spesso.</p>
        <div class="empty-state"><div class="empty-emoji">⭐</div><strong>Ancora nessun preferito</strong><span class="panel-copy">Quando collegheremo le fermate e le linee potrai salvarle qui e riordinarle.</span></div>`;
    } else if (panel === "settings") {
      const current = localStorage.getItem("andamo-theme") || "auto";
      sheetContent.innerHTML = `
        <h2 class="panel-title">Impostazioni</h2>
        <div class="settings-row"><span>Tema</span><select id="themeSelect" aria-label="Tema"><option value="auto">Automatico</option><option value="light">Chiaro</option><option value="dark">Scuro</option></select></div>
        <div class="settings-row"><span>Versione</span><strong>0.1 · Base iniziale</strong></div>
        <div class="settings-row"><span>Orari</span><strong>Non ancora caricati</strong></div>
        <p class="panel-copy" style="margin-top:14px">ANdamo è in costruzione. I dati del servizio verranno collegati dopo la verifica delle fonti ufficiali.</p>`;
      const select = $("themeSelect");
      select.value = current;
      select.addEventListener("change", () => setTheme(select.value));
    } else {
      sheetContent.innerHTML = `
        <div class="welcome-card">
          <div class="welcome-icon">☀️</div>
          <div><div class="eyebrow">Benvenuto su ANdamo</div><h1>La città, in movimento.</h1><p>Stiamo preparando la rete delle fermate e gli orari ufficiali di Ancona.</p></div>
        </div>
        <div class="data-note"><span class="note-icon">i</span><span>Questa è la prima base dell'app: la mappa è navigabile, ma non contiene ancora fermate o corse inventate.</span></div>`;
    }
  }

  function setTheme(theme) {
    localStorage.setItem("andamo-theme", theme);
    const dark = theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.body.classList.toggle("dark", dark);
    showToast(theme === "auto" ? "Tema automatico" : theme === "dark" ? "Tema scuro" : "Tema chiaro");
  }

  const savedTheme = localStorage.getItem("andamo-theme") || "auto";
  setTheme(savedTheme);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if ((localStorage.getItem("andamo-theme") || "auto") === "auto") setTheme("auto");
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const panel = item.dataset.panel;
      if (panel === "map") {
        closeSheet();
        return;
      }
      openSheet(panel);
    });
  });

  $("settingsButton").addEventListener("click", () => openSheet("settings"));
  $("scrim").addEventListener("click", closeSheet);
  $("sheetHandle").addEventListener("click", () => {
    if (!sheet.classList.contains("open")) {
      openSheet(selectedPanel, false);
    } else {
      sheetExpanded = !sheetExpanded;
      sheet.classList.toggle("expanded", sheetExpanded);
    }
  });

  $("locateButton").addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      showToast("La posizione non è supportata da questo dispositivo");
      return;
    }
    showToast("Ricerca della tua posizione…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = [position.coords.latitude, position.coords.longitude];
        map.setView(point, 16, { animate: true });
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.circleMarker(point, {
          radius: 8, color: "#ffffff", weight: 3, fillColor: "#1688aa", fillOpacity: 1
        }).addTo(map).bindPopup("Ti trovi qui");
        showToast("Posizione aggiornata");
      },
      () => showToast("Non riesco ad accedere alla posizione. Controlla i permessi di Safari."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });

  const searchInput = $("searchInput");
  const clearSearch = $("clearSearch");
  const searchHint = $("searchHint");
  searchInput.addEventListener("input", () => {
    clearSearch.hidden = searchInput.value.length === 0;
    searchHint.classList.toggle("visible", searchInput.value.trim().length > 0);
  });
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    clearSearch.hidden = true;
    searchHint.classList.remove("visible");
    searchInput.blur();
  });
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && searchInput.value.trim()) {
      showToast("La ricerca sarà attivata con i dati ufficiali delle fermate");
      searchInput.blur();
    }
  });

  map.on("movestart", () => {
    if (!sheet.classList.contains("open")) nav.classList.add("hidden");
  });
  map.on("moveend", () => {
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      if (!sheet.classList.contains("open")) nav.classList.remove("hidden");
    }, 1500);
  });

  // Rende la mappa adattabile quando il pannello viene aperto o chiuso.
  const observer = new ResizeObserver(() => map.invalidateSize());
  observer.observe(document.querySelector(".app-shell"));
  setTimeout(() => map.invalidateSize(), 250);
})();

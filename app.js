/* ANdamo 0.3
   Coordinate system: WGS84 (latitude/longitude).
   Map rendering is isolated in MapProvider so the tile source can be changed
   without changing stops, routes or other geographic data.
*/
(() => {
  "use strict";

  const ANCONA_CENTER = [43.6158, 13.5189]; // WGS84
  const MAP_PROVIDER = {
    name: "OpenStreetMap",
    tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      subdomains: "abc",
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  };

  const MapProvider = {
    create(element, center) {
      const map = L.map(element, {
        center,
        zoom: 14,
        zoomControl: false,
        scrollWheelZoom: true
      });
      L.tileLayer(MAP_PROVIDER.tileUrl, MAP_PROVIDER.options).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      return map;
    }
  };

  const map = MapProvider.create("map", ANCONA_CENTER);
  let movementTimer;
  let activePanel = null;

  const $ = (id) => document.getElementById(id);
  const topbar = $("topbar");
  const searchWrap = $("searchWrap");
  const bottomNav = $("bottomNav");
  const searchInput = $("searchInput");
  const searchResults = $("searchResults");
  const clearSearch = $("clearSearch");

  function setPanel(panelId) {
    document.querySelectorAll(".sheet").forEach(panel => panel.hidden = panel.id !== panelId);
    activePanel = panelId || null;
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.dataset.panel === (panelId || "mapPanel"));
    });
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.panel;
      setPanel(id === "mapPanel" ? null : id);
    });
  });
  document.querySelectorAll(".close-sheet").forEach(button => {
    button.addEventListener("click", () => setPanel(null));
  });
  $("settingsButton").addEventListener("click", () => setPanel("settingsPanel"));

  function onMapMovement() {
    document.body.classList.add("map-moving");
    clearTimeout(movementTimer);
    movementTimer = setTimeout(() => document.body.classList.remove("map-moving"), 500);
  }
  map.on("movestart zoomstart", onMapMovement);
  map.on("moveend zoomend", onMapMovement);

  // Search UI is ready for the future stops/lines index; no fake results are shown.
  searchInput.addEventListener("input", () => {
    clearSearch.hidden = !searchInput.value;
    searchResults.hidden = true;
    searchResults.replaceChildren();
  });
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    clearSearch.hidden = true;
    searchResults.hidden = true;
    searchInput.focus();
  });

  $("themeSelect").addEventListener("change", (event) => applyTheme(event.target.value));
  function applyTheme(mode) {
    const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.body.classList.toggle("dark", dark);
    try { localStorage.setItem("andamo-theme", mode); } catch (_) {}
  }
  try {
    const savedTheme = localStorage.getItem("andamo-theme") || "system";
    $("themeSelect").value = savedTheme;
    applyTheme(savedTheme);
  } catch (_) { applyTheme("system"); }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if ($("themeSelect").value === "system") applyTheme("system");
  });

  $("locateButton").addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("La geolocalizzazione non è supportata da questo dispositivo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const userCoordinates = [position.coords.latitude, position.coords.longitude];
        map.setView(userCoordinates, 16, { animate: true });
        setPanel(null);
      },
      () => alert("Non è stato possibile ottenere la posizione. Controlla i permessi del browser."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });

  // Exposed for later data import: every point remains [lat, lon] in WGS84.
  window.ANdamoMap = {
    map,
    provider: MAP_PROVIDER.name,
    addStop(stop) {
      if (!Number.isFinite(stop.lat) || !Number.isFinite(stop.lon)) return null;
      return L.marker([stop.lat, stop.lon]).addTo(map);
    },
    addRoute(coordinates, options = {}) {
      if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
      return L.polyline(coordinates.map(point => [point.lat, point.lon]), options).addTo(map);
    },
    setView(lat, lon, zoom = 15) {
      map.setView([lat, lon], zoom);
    }
  };
})();
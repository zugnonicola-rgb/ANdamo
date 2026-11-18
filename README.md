# ANdamo

ANdamo è una web app in sviluppo per consultare il trasporto pubblico urbano di Ancona.

## Versione 0.1

Questa prima base comprende:
- mappa interattiva centrata su Ancona tramite Leaflet e OpenStreetMap;
- interfaccia mobile;
- ricerca predisposta;
- pannelli Linee, Preferiti e Impostazioni;
- geolocalizzazione su richiesta;
- tema automatico, chiaro e scuro.

**Attenzione:** in questa versione non sono ancora caricati fermate, linee, orari o dati LIVE. Verranno aggiunti solo dopo aver verificato e importato fonti ufficiali.

## Pubblicazione

Il progetto è pensato per GitHub Pages. Le librerie Leaflet e i caratteri web vengono caricati da CDN e la mappa usa i tile standard di OpenStreetMap. L'uso dei tile è soggetto alla relativa policy.

## Struttura

- `index.html` — struttura dell'interfaccia
- `style.css` — grafica e layout
- `app.js` — interazioni e inizializzazione mappa
- `manifest.json` — metadati PWA

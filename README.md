# ANdamo — versione 0.3

Prima base PWA per esplorare la mappa di Ancona.

## Pubblicazione su GitHub Pages
Carica nella cartella principale del repository questi file:
- `index.html`
- `style.css`
- `app.js`
- `manifest.json`
- `README.md`

Sovrascrivi i file con lo stesso nome e lascia invariati gli altri file del repository.

## Novità della 0.3
- Ripristinata la cartografia OpenStreetMap, senza API key.
- Separato il fornitore cartografico (`MapProvider`) dalla logica dell'app.
- Coordinate geografiche mantenute in WGS84 (latitudine/longitudine), indipendenti dal fornitore della mappa.
- Conservate le correzioni per iOS: input di ricerca a 16 px, pannelli superiori/inferiori che si nascondono durante il movimento e ricompaiono dopo 500 ms.
- Controlli zoom posizionati più in basso per non sovrapporsi al pulsante impostazioni.
- Tema automatico/chiaro/scuro e geolocalizzazione.

## Stato dei dati
Questa versione è ancora una base dell'interfaccia: non contiene ancora l'elenco ufficiale delle fermate, le linee, gli orari o dati LIVE. Non mostra quindi bus o orari simulati.

## Coordinate e cartografia
Tutte le coordinate vengono gestite come WGS84, nel formato `[latitudine, longitudine]` per Leaflet. Cambiare il provider delle mappe non richiede di convertire le coordinate dei dati.

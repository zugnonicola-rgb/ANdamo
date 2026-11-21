# ANdamo – versione 0.5 (struttura e mappa)

Questa versione aggiorna la visualizzazione delle fermate e prepara l’app a ricevere dati verificati.

## Migliorie della mappa
- Fermate principali a zoom città.
- Fermate secondarie da zoom intermedio.
- Tutte le fermate da zoom ravvicinato (livello 16+).
- Marcatori piccoli e discreti, con evidenza della fermata selezionata.
- I marcatori non pertinenti alla linea selezionata vengono attenuati.

## Struttura
- `index.html`, `style.css`, `app.js`: applicazione.
- `data/stops.json`, `data/lines.json`, `data/metadata.json`: contenitori dati, al momento vuoti.

## Pubblicazione
La cartella `data` deve restare nella root del sito. Non inserire dati ATMA o altri dati di terzi finché i relativi termini di riutilizzo non sono stati verificati.

Mappa base: © OpenStreetMap contributors.

# ANdamo – versione 0.6

Aggiornamento dell'esperienza mappa e dei pannelli, basato sulla versione 0.5.

## Novità della versione 0.6
- Rimossa la schermata permanente «IN SVILUPPO» quando i contenitori dati sono vuoti.
- All'apertura viene ripristinata l'ultima vista della mappa salvata sul dispositivo.
- Se il browser ha già concesso l'autorizzazione alla geolocalizzazione, la mappa si centra automaticamente sulla posizione corrente.
- Il pulsante posizione continua a permettere la localizzazione manuale.
- Zoom iniziale leggermente più ravvicinato rispetto alla versione 0.5.
- Schede inferiori chiudibili con il pulsante X o trascinando verso il basso la maniglia.
- Barra superiore resa trasparente e barra di ricerca flottante sopra la mappa.

## Struttura e dati
- `index.html`, `style.css`, `app.js`: applicazione.
- `data/stops.json`, `data/lines.json`, `data/metadata.json`: contenitori dati.
- In questo pacchetto i file `stops.json` e `lines.json` sono vuoti: non vengono visualizzate fermate o percorsi reali e la ricerca non può restituire risultati di trasporto.

## Geolocalizzazione e vista mappa
- La posizione GPS automatica viene usata soltanto se l'autorizzazione risulta già concessa dal browser.
- Se non è disponibile, viene ripristinata l'ultima vista salvata (centro e zoom), inclusi gli spostamenti conseguenti a una ricerca/selezione.
- La posizione e lo zoom vengono memorizzati localmente nel browser.

## Pubblicazione e dati di terzi
La cartella `data` deve restare nella root del sito. Non inserire dati ATMA o altri dati di terzi finché i relativi termini di riutilizzo non sono stati verificati.

Mappa base: © OpenStreetMap contributors.

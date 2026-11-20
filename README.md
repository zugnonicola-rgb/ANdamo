# ANdamo · versione 0.4

Questa versione introduce le prime fermate reali sulla mappa e il collegamento fermata-linea.

## Contenuto
- `index.html`, `style.css`, `app.js`: applicazione web.
- `data/stops.json`: 891 fermate selezionate dall'area geografica intorno ad Ancona.
- `data/lines.json`: 65 linee/servizi ATMA che hanno fermate nell'area.
- `data/metadata.json`: provenienza, validità e limiti dei dati.
- Coordinate geografiche WGS84 (latitudine/longitudine).
- Leaflet è isolato dietro un piccolo adattatore `MapProvider`: il modello dati non dipende dal fornitore della mappa.

## Avvio
Caricare i file nella root del repository GitHub Pages, mantenendo la cartella `data/`.
Aprire la pagina tramite GitHub Pages. Non usare l'apertura diretta del file `index.html` in locale: il browser può bloccare il caricamento JSON tramite `fetch`.

## Cosa funziona
- Mappa OpenStreetMap.
- Visualizzazione delle fermate.
- Ricerca per nome fermata e codice/descrizione linea.
- Scheda fermata con linee associate.
- Elenco linee e relative fermate associate.
- Preferiti salvati sul dispositivo.
- Tema chiaro/scuro.

## Cosa non è ancora incluso
- Tracciati stradali reali delle linee (non vengono inventati collegando le fermate in linea retta).
- Orari dettagliati per ogni fermata.
- Posizioni LIVE dei bus e ritardi in tempo reale.
- Ricerca indirizzi e pianificazione viaggio.

## Fonte e periodo
Dataset `IT-ITI3-ATMA_L1`, NeTEx livello 1, Regione Marche / RAP Marche, operatore ATMA.
Timestamp di pubblicazione nel file: 9 luglio 2026, ore 11:59:41.
Validità dichiarata nel file: 1 luglio – 31 dicembre 2026.

La selezione di 891 fermate usa un rettangolo geografico (vedi `data/metadata.json`), NON il confine amministrativo ufficiale del Comune di Ancona. I 65 servizi includono anche collegamenti extraurbani e speciali che hanno fermate nell'area.

## Nota importante sulla licenza dei dati
Nel file XML ricevuto non è presente una dichiarazione di licenza e la scheda NAP consultata descrive il contenuto e il formato ma non espone una licenza di riutilizzo. Per questo motivo, prima di rendere pubblici su GitHub i file derivati in `data/`, occorre verificare le condizioni di riutilizzo con il titolare dei dati. La disponibilità al download non equivale automaticamente a una licenza aperta.

Attribuzione della fonte: Regione Marche – RAP Marche / ATMA, dataset NeTEx `IT-ITI3-ATMA_L1`, scaricato dal National Access Point italiano.

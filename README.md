# AthenaZoom Desk · versione 2

AthenaZoom Desk è una PWA didattica ispirata alle presentazioni zoomabili, ma pensata come tavolo di costruzione per lezioni, mappe concettuali e percorsi narrativi.

## Le due modalità

### 1. Costruzione
Serve per preparare il percorso.

Puoi:

- aggiungere schede di testo;
- inserire immagini;
- inserire PDF;
- inserire documenti Word/PowerPoint/Excel o file generici;
- inserire link web;
- spostare gli oggetti trascinandoli;
- usare lo zoom e il movimento libero dello spazio;
- creare connettori tra gli oggetti;
- personalizzare connettori per colore, spessore e stile;
- modificare titolo, testo, colore, icona e dimensione degli oggetti;
- costruire un percorso di proiezione ordinato.

### 2. Proiezione
Serve per fare lezione.

Puoi:

- seguire il percorso con Avanti / Indietro;
- tornare alla vista generale;
- muoverti liberamente nello spazio;
- usare pinch/zoom su iPad;
- cliccare/toccare un oggetto per ingrandirlo;
- aprire immagini, PDF, documenti e link.

## Uso su iPad

Apri `index.html` da Safari o carica la cartella su GitHub Pages / server web.

Per usarla come PWA:

1. apri la pagina in Safari;
2. tocca Condividi;
3. scegli “Aggiungi alla schermata Home”.

Nota: i file vengono salvati nel browser. Se inserisci PDF o immagini molto pesanti, Safari può superare il limite di salvataggio locale. Per uso didattico conviene usare immagini ottimizzate e PDF non enormi.

## Salvataggio

- Il progetto viene salvato automaticamente nel browser.
- Il pulsante **Salva** forza il salvataggio.
- Il pulsante **Esporta** crea un file `.athenazoom.json` con contenuti e file incorporati.
- Il pulsante **Importa** ricarica un progetto esportato.

## Pubblicazione

La cartella può essere pubblicata così com'è su:

- GitHub Pages;
- Netlify;
- server scolastico;
- cartella locale servita da un piccolo server web.

Per la PWA completa è meglio aprirla da server web, non da semplice `file://`, perché il service worker funziona solo via HTTP/HTTPS.

## File principali

- `index.html` — struttura dell'app;
- `styles.css` — grafica e layout iPad/desktop;
- `app.js` — logica del desk, zoom, editor, proiezione;
- `data.js` — progetto dimostrativo iniziale;
- `manifest.webmanifest` — configurazione PWA;
- `service-worker.js` — cache offline base.

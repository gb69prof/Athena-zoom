# AthenaZoom

Prima versione di una lavagna narrativa zoomabile, pensata per lezioni in stile Prezi ma integrabile nelle PWA didattiche.

## Avvio rapido

Apri `index.html` nel browser. Per usare pienamente la modalità PWA/offline conviene pubblicare la cartella su GitHub Pages o su un piccolo server locale.

## Modifica contenuti

I contenuti sono nel file `data.js`.

Campi principali di ogni nodo:

- `id`: identificativo unico
- `title`: titolo del nodo
- `subtitle`: frase breve visibile sulla mappa
- `icon`: emoji o simbolo
- `x`, `y`: posizione nel canvas
- `scale`: livello di zoom quando il nodo viene aperto
- `rotate`: inclinazione grafica della scheda
- `kicker`: etichetta nella scheda laterale
- `body`: testo di approfondimento
- `media`: immagini, video YouTube o audio
- `actions`: pulsanti verso altri nodi o link esterni

## Pubblicazione su GitHub Pages

1. Carica la cartella in un repository.
2. Vai in Settings → Pages.
3. Seleziona il branch principale e la cartella root.
4. Apri il link generato.

## Prossimi sviluppi sensati

- editor visuale per creare nodi cliccando sulla mappa;
- importazione immagini di sfondo;
- modalità studente/docente separata;
- salvataggio su Google Drive;
- quiz dentro i nodi;
- esportazione come pacchetto PWA per una singola lezione.

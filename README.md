# GRIGIO

*Ogni giorno è lunedì. · Every day is Monday.*

Horror psicologico su routine, apatia e depressione — e sulle piccole crepe da cui entra la luce.
Italiano e inglese · browser (computer e telefono) · Windows.

## Struttura

| Percorso | Cosa contiene |
|---|---|
| `src/index.html` | **Sorgente del gioco** (leggibile). Si modifica solo questo. |
| `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` | Versione **pubblicata** (offuscata), generata da `npm run build`. Non modificarla a mano. |
| `electron/main.js` | App desktop per Windows. |
| `assets/` | Icona (PNG + `icon.ico`). |
| `itch/` | Copertina, banner, screenshot, descrizioni e impostazioni per itch.io. |
| `tools/` | Script di build. |

## Comandi

```bash
npm install
npm run build        # src -> dist/web (offuscato, font incorporati) + copia nella radice per il sito
npm run win          # eseguibile Windows -> build/GRIGIO-windows.zip
npm run itch         # pacchetto completo -> build/GRIGIO-itch.zip
npm run check-i18n   # controlla che ogni testo italiano abbia la traduzione inglese
npm run icons        # rigenera l'icona (serve Playwright)
npm run shots        # rigenera screenshot, copertina e banner (serve Playwright, dopo build)
```

Ogni push su `main` che tocca il gioco avvia GitHub Actions, che ricostruisce tutto e pubblica
`GRIGIO-itch.zip`, `GRIGIO-windows.zip` e `GRIGIO-web.zip` nella pagina **Releases**.

## Traduzione

I testi si scrivono in italiano nel sorgente. La traduzione inglese è nel dizionario `EN`
(chiave = frase italiana esatta). Per le frasi con valori variabili si usa `L('italiano', 'english')`.
Dopo aver cambiato o aggiunto una frase: `npm run check-i18n`.

## Protezione

La versione pubblicata è offuscata (nomi e testi cifrati, codice che si autodifende), blocca tasto
destro, F12, Ctrl+Shift+I/J/C, Ctrl+U/S, selezione e copia, e si svuota se vengono aperti gli
strumenti per sviluppatori. Nell'app Windows gli strumenti per sviluppatori sono disattivati.
È un deterrente forte, ma nessuna protezione lato browser è assoluta: chi è molto determinato può
comunque estrarre il codice.

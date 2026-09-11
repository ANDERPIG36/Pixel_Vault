# Pixel Vault

Applicazione full-stack per la gestione di un negozio di videogiochi: catalogo, magazzino, vendite e bilancio.

## Struttura del progetto

Il frontend è diviso in **4 pagine**, come richiesto:

- `frontend/index.html` — **Database Giochi**: aggiungi, modifica ed elimina videogiochi. I generi non sono più un campo di testo libero ma una lista gestibile (aggiungi/rimuovi tag), sul modello dei generi di Steam.
- `frontend/magazzino.html` — **Magazzino**: mostra le scorte per piattaforma, segnala i giochi sotto la soglia di riordino e apre una finestra d'ordine (quantità + prezzo di acquisto) collegata al bilancio.
- `frontend/vendite.html` — **Vendite**: cerca i giochi per titolo/genere, mostra la disponibilità per piattaforma (disponibile / non disponibile), vende con calcolo automatico dello sconto e scala le scorte in tempo reale; se un gioco è esaurito propone subito il riordino.
- `frontend/bilancio.html` — **Bilancio**: totale vendite, totale acquisti, bilancio netto e cronologia completa dei due movimenti.

Il backend (`backend/PixelVault.Api`) è un'API .NET/MongoDB con un controller per ciascuna area (`GamesController`, `GenresController`, `SalesController`, `RestockController`, `BalanceController`), tutti collegati allo stesso database tramite `Services/MongoDbContext.cs`.

## Come avviare il progetto

1. Assicurati di avere un'istanza MongoDB raggiungibile (di default `mongodb://localhost:27017`, configurabile in `appsettings.json`).
2. Avvia il backend:
   ```
   cd backend/PixelVault.Api
   dotnet restore
   dotnet run
   ```
   Al primo avvio la lista generi viene popolata automaticamente con dei valori di base (GDR, Azione, Open World, Sport, ecc.), modificabili in seguito dalla pagina Database Giochi.
3. Apri `frontend/index.html` nel browser (l'URL dell'API è configurato in `frontend/js/api.js`, di default `http://localhost:5201/api`).

## Logica principale

- **Vendita**: scala automaticamente le copie della piattaforma scelta e calcola l'incasso applicando lo sconto attivo sul gioco.
- **Riordino**: aumenta automaticamente le copie della piattaforma scelta e registra la spesa (quantità × prezzo di acquisto).
- **Bilancio**: `bilancio netto = totale incassato dalle vendite − totale speso negli acquisti`.
- **Soglia di riordino**: ogni gioco ha un valore `sogliaRiordino` (default 3); quando una piattaforma scende a quel livello o sotto, il gioco viene segnalato come "da riordinare" nel Database Giochi e in Magazzino.

---
Progetto di Matteo Marian Lavric &amp; Andrea Arinci

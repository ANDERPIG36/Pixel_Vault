// URL del Backend C#
const API_URL = 'http://localhost:5201/api/games';

// Attende che la pagina sia completamente caricata
document.addEventListener('DOMContentLoaded', () => {
  caricaCatalogo();

  // Listener sul Form di Inserimento/Modifica
  const formInserimento = document.getElementById('add-game-form');
  formInserimento.addEventListener('submit', gestisciSalvataggioGioco);

  // Listener sul Form di Ricerca
  const formRicerca = document.getElementById('search-form');
  formRicerca.addEventListener('submit', gestisciRicerca);

  // Listener sul Reset dei filtri
  const btnReset = document.getElementById('reset-filters');
  btnReset.addEventListener('click', () => caricaCatalogo());
});

// --- 1. RECUPERA E MOSTRA I GIOCHI (GET) ---
async function caricaCatalogo(queryFiltri = '') {
  const tableBody = document.getElementById('games-table-body');
  
  try {
    const response = await fetch(`${API_URL}${queryFiltri}`);
    if (!response.ok) throw new Error('Errore durante la risposta del server');
    
    const giochi = await response.json();
    stampaTabella(giochi);
  } catch (error) {
    console.error('Errore durante il caricamento:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--danger)">
          Impossibile caricare i dati dal server backend.
        </td>
      </tr>`;
  }
}

// --- 2. MOSTRA I DATI NELLA TABELLA HTML ---
function stampaTabella(giochi) {
  const tableBody = document.getElementById('games-table-body');
  tableBody.innerHTML = '';

  if (giochi.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nessun videogioco trovato.</td></tr>';
    return;
  }

  giochi.forEach(gioco => {
    // Gestione ID MongoDB / C#
    const gameId = gioco.id || gioco._id;

    // Calcolo totale scorte partendo dall'oggetto scortePerPiattaforma
    const scorte = gioco.scortePerPiattaforma || {};
    const totaleScorte = Object.values(scorte).reduce((acc, val) => acc + (val || 0), 0);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${gioco.titolo}</strong></td>
      <td>${gioco.sviluppatore || 'N/D'}</td>
      <td>${gioco.generi ? gioco.generi.join(', ') : 'N/D'}</td>
      <td>€ ${gioco.prezzo.toFixed(2)}</td>
      <td>${gioco.valutazione ? gioco.valutazione : 'N/D'}</td>
      <td>${totaleScorte} pz</td>
      <td>
        <button class="btn btn-warning" onclick="preparaModifica('${gameId}')">Modifica</button>
        <button class="btn btn-danger" onclick="eliminaGioco('${gameId}')">Elimina</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// --- 3. RECUPERA GIOCO PER MODIFICA E POPOLA IL FORM ---
async function preparaModifica(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Impossibile recuperare i dettagli del gioco');

    const gioco = await response.json();

    // Imposta l'ID nel campo nascosto
    document.getElementById('game-id').value = gioco.id || gioco._id;

    // Popola i campi principali del form
    document.getElementById('titolo').value = gioco.titolo || '';
    document.getElementById('sviluppatore').value = gioco.sviluppatore || '';
    
    if (gioco.dataUscita) {
      document.getElementById('dataUscita').value = gioco.dataUscita.split('T')[0];
    } else {
      document.getElementById('dataUscita').value = '';
    }

    document.getElementById('prezzo').value = gioco.prezzo || 0;
    document.getElementById('scontoPercentuale').value = gioco.scontoPercentuale || 0;
    document.getElementById('valutazione').value = gioco.valutazione || 0;
    document.getElementById('generi').value = gioco.generi ? gioco.generi.join(', ') : '';

    // Gestione scorte con controllo sia sulle chiavi vecchie (con spazi) che nuove
    const scorte = gioco.scortePerPiattaforma || gioco.ScortePerPiattaforma || {};
    
    document.getElementById('stock-pc').value = 
      scorte.PC ?? scorte.pc ?? 0;

    document.getElementById('stock-ps5').value = 
      scorte.PS5 ?? scorte.ps5 ?? 0;

    document.getElementById('stock-xbox').value = 
      scorte.XboxSeriesX ?? scorte["Xbox Series X"] ?? scorte.Xbox ?? 0;

    document.getElementById('stock-switch').value = 
      scorte.Switch ?? scorte["Nintendo Switch"] ?? 0;

    // Aggiorna l'interfaccia visiva per la modifica
    document.getElementById('form-title').innerText = 'Modifica Videogioco';
    document.getElementById('btn-save').innerText = 'Aggiorna Videogioco';
    document.getElementById('btn-cancel').style.display = 'inline-block';

    document.getElementById('add-game-section').scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Errore durante il recupero del gioco:', error);
    alert('Impossibile caricare i dati per la modifica.');
  }
}

// --- 4. SALVA O AGGIORNA IL GIOCO (POST / PUT) ---
async function gestisciSalvataggioGioco(e) {
  e.preventDefault();

  const id = document.getElementById('game-id').value;
  const isModifica = id !== "";

  const generiInput = document.getElementById('generi').value;
  const generiArray = generiInput ? generiInput.split(',').map(g => g.trim()) : [];

  const giocoData = {
    id: isModifica ? id : null,
    titolo: document.getElementById('titolo').value,
    sviluppatore: document.getElementById('sviluppatore').value,
    dataUscita: document.getElementById('dataUscita').value || null,
    prezzo: parseFloat(document.getElementById('prezzo').value),
    scontoPercentuale: parseInt(document.getElementById('scontoPercentuale').value) || 0,
    valutazione: parseFloat(document.getElementById('valutazione').value) || 0,
    generi: generiArray,
    scortePerPiattaforma: {
      "PC": parseInt(document.getElementById('stock-pc').value) || 0,
      "PS5": parseInt(document.getElementById('stock-ps5').value) || 0,
      "XboxSeriesX": parseInt(document.getElementById('stock-xbox').value) || 0,
      "Switch": parseInt(document.getElementById('stock-switch').value) || 0
    }
  };

  const url = isModifica ? `${API_URL}/${id}` : API_URL;
  const method = isModifica ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(giocoData)
    });

    if (response.ok) {
      alert(isModifica ? 'Videogioco aggiornato con successo!' : 'Videogioco salvato con successo!');
      annullaModifica();
      caricaCatalogo();
    } else {
      alert('Errore durante il salvataggio del videogioco.');
    }
  } catch (error) {
    console.error('Errore di invio:', error);
    alert('Impossibile comunicare con il server.');
  }
}

// --- 5. ANNULLA MODIFICA E RESETTA IL FORM ---
function annullaModifica() {
  document.getElementById('add-game-form').reset();
  document.getElementById('game-id').value = '';
  document.getElementById('form-title').innerText = 'Inserisci Nuovo Videogioco';
  document.getElementById('btn-save').innerText = 'Salva in Database';
  document.getElementById('btn-cancel').style.display = 'none';
}

// --- 6. FILTRA I GIOCHI ---
function gestisciRicerca(e) {
  e.preventDefault();
  const titolo = document.getElementById('search-title').value.toLowerCase();
  const genere = document.getElementById('filter-genre').value;
  const piattaforma = document.getElementById('filter-platform').value;

  const params = new URLSearchParams();
  if (titolo) params.append('titolo', titolo);
  if (genere) params.append('genere', genere);
  if (piattaforma) params.append('piattaforma', piattaforma);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  caricaCatalogo(queryString);
}

// --- 7. ELIMINA UN GIOCO (DELETE) ---
async function eliminaGioco(id) {
  if (!confirm('Sei sicuro di voler eliminare questo videogioco dal catalogo?')) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (response.ok) {
      caricaCatalogo();
    } else {
      alert('Errore durante l\'eliminazione.');
    }
  } catch (error) {
    console.error('Errore durante l\'eliminazione:', error);
  }
}
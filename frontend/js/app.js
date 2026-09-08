// URL del Backend C# (da adeguare in base al porta usata dal vostro server ASP.NET Core)
const API_URL = 'http://localhost:5000/api/games';

// Attende che la pagina sia completamente caricata
document.addEventListener('DOMContentLoaded', () => {
  caricaCatalogo();

  // Listener sul Form di Inserimento
  const formInserimento = document.getElementById('add-game-form');
  formInserimento.addEventListener('submit', gestisciInserimentoGioco);

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
    // Calcolo totale scorte partendo dall'oggetto scortePerPiattaforma
    const scorte = gioco.scortePerPiattaforma || {};
    const totaleScorte = Object.values(scorte).reduce((acc, val) => acc + val, 0);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${gioco.titolo}</strong></td>
      <td>${gioco.sviluppatore || 'N/D'}</td>
      <td>${gioco.generi ? gioco.generi.join(', ') : 'N/D'}</td>
      <td>€ ${gioco.prezzo.toFixed(2)}</td>
      <td>${gioco.valutazione ? gioco.valutazione : 'N/D'}</td>
      <td>${totaleScorte} pz</td>
      <td>
        <button class="btn btn-danger" onclick="eliminaGioco('${gioco.id || gioco._id}')">
          Elimina
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// --- 3. CREA UN NUOVO GIOCO (POST) ---
async function gestisciInserimentoGioco(e) {
  e.preventDefault();

  // Conversione della stringa generi in un array
  const generiInput = document.getElementById('generi').value;
  const generiArray = generiInput ? generiInput.split(',').map(g => g.trim()) : [];

  // Costruzione dell'oggetto corrispondente al modello MongoDB / C#
  const nuovoGioco = {
    titolo: document.getElementById('titolo').value,
    sviluppatore: document.getElementById('sviluppatore').value,
    dataUscita: document.getElementById('dataUscita').value || null,
    prezzo: parseFloat(document.getElementById('prezzo').value),
    scontoPercentuale: parseInt(document.getElementById('scontoPercentuale').value) || 0,
    valutazione: parseFloat(document.getElementById('valutazione').value) || 0,
    generi: generiArray,
    scortePerPiattaforma: {
      PC: parseInt(document.getElementById('stock-pc').value) || 0,
      PS5: parseInt(document.getElementById('stock-ps5').value) || 0,
      XboxSeriesX: parseInt(document.getElementById('stock-xbox').value) || 0,
      Switch: parseInt(document.getElementById('stock-switch').value) || 0
    },
    copieVendute: 0,
    richiedeRestock: false
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuovoGioco)
    });

    if (response.ok) {
      alert('Videogioco salvato con successo!');
      document.getElementById('add-game-form').reset();
      caricaCatalogo(); // Aggiorna la tabella senza ricaricare la pagina
    } else {
      alert('Errore durante il salvataggio del videogioco.');
    }
  } catch (error) {
    console.error('Errore di invio:', error);
    alert('Impossibile comunicare con il server.');
  }
}

// --- 4. FILTRA I GIOCHI ---
function gestisciRicerca(e) {
  e.preventDefault();
  const titolo = document.getElementById('search-title').value.toLowerCase();
  const genere = document.getElementById('filter-genre').value;
  const piattaforma = document.getElementById('filter-platform').value;

  // Costruzione parametri di query string (es. ?titolo=elden&genere=GDR)
  const params = new URLSearchParams();
  if (titolo) params.append('titolo', titolo);
  if (genere) params.append('genere', genere);
  if (piattaforma) params.append('piattaforma', piattaforma);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  caricaCatalogo(queryString);
}

// --- 5. ELIMINA UN GIOCO (DELETE) ---
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
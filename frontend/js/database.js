// --- PAGINA DATABASE GIOCHI ---
const GAMES_URL = `${API_BASE}/games`;
const GENRES_URL = `${API_BASE}/genres`;

let generiDisponibili = [];      // lista generi caricata dal server
let generiSelezionati = new Set(); // generi scelti per il gioco che si sta salvando

document.addEventListener('DOMContentLoaded', () => {
  caricaGeneri();
  caricaCatalogo();

  document.getElementById('add-game-form').addEventListener('submit', gestisciSalvataggioGioco);
  document.getElementById('search-form').addEventListener('submit', gestisciRicerca);
  document.getElementById('reset-filters').addEventListener('click', () => caricaCatalogo());
  document.getElementById('btn-cancel').addEventListener('click', annullaModifica);
  document.getElementById('btn-add-genre').addEventListener('click', aggiungiNuovoGenere);
});

// --- GENERI (lista prefatta, gestibile come i tag di Steam) ---
async function caricaGeneri() {
  try {
    generiDisponibili = await recuperaGeneri();
    disegnaChipGeneri();
    popolaSelectGeneri();
  } catch (error) {
    console.error('Errore nel caricamento dei generi:', error);
    document.getElementById('genre-chip-list').innerHTML =
      '<span style="color: var(--danger);">Impossibile caricare i generi.</span>';
  }
}

function disegnaChipGeneri() {
  const contenitore = document.getElementById('genre-chip-list');
  contenitore.innerHTML = '';

  if (generiDisponibili.length === 0) {
    contenitore.innerHTML = '<span style="color: var(--text-muted);">Nessun genere in lista. Aggiungine uno qui sotto.</span>';
    return;
  }

  generiDisponibili.forEach(genere => {
    const chip = document.createElement('span');
    chip.className = 'genre-chip' + (generiSelezionati.has(genere.nome) ? ' selected' : '');
    chip.dataset.nome = genere.nome;
    chip.innerHTML = `${genere.nome} <span class="remove-genre" title="Rimuovi dalla lista generi">&times;</span>`;

    // Click sul testo -> seleziona/deseleziona il genere per il gioco corrente
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-genre')) return;
      if (generiSelezionati.has(genere.nome)) {
        generiSelezionati.delete(genere.nome);
      } else {
        generiSelezionati.add(genere.nome);
      }
      disegnaChipGeneri();
    });

    // Click sulla "x" -> rimuove il genere dalla lista master (con conferma)
    chip.querySelector('.remove-genre').addEventListener('click', () => rimuoviGenere(genere));

    contenitore.appendChild(chip);
  });
}

function popolaSelectGeneri() {
  const select = document.getElementById('filter-genre');
  const valoreAttuale = select.value;
  select.innerHTML = '<option value="">Tutti i generi</option>';
  generiDisponibili.forEach(genere => {
    const opzione = document.createElement('option');
    opzione.value = genere.nome;
    opzione.textContent = genere.nome;
    select.appendChild(opzione);
  });
  select.value = valoreAttuale;
}

async function aggiungiNuovoGenere() {
  const input = document.getElementById('new-genre-name');
  const nome = input.value.trim();
  if (!nome) return;

  try {
    const risposta = await fetch(GENRES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome })
    });

    if (risposta.status === 409) {
      alert('Questo genere è già presente nella lista.');
      return;
    }
    if (!risposta.ok) throw new Error('Errore durante il salvataggio del genere');

    input.value = '';
    await caricaGeneri();
  } catch (error) {
    console.error('Errore aggiunta genere:', error);
    alert('Impossibile aggiungere il genere.');
  }
}

async function rimuoviGenere(genere) {
  if (!confirm(`Rimuovere "${genere.nome}" dalla lista generi? (Non modifica i giochi già salvati)`)) return;

  try {
    const risposta = await fetch(`${GENRES_URL}/${genere.id}`, { method: 'DELETE' });
    if (!risposta.ok) throw new Error('Errore durante la rimozione del genere');

    generiSelezionati.delete(genere.nome);
    await caricaGeneri();
  } catch (error) {
    console.error('Errore rimozione genere:', error);
    alert('Impossibile rimuovere il genere.');
  }
}

// --- CATALOGO (GET) ---
async function caricaCatalogo(queryFiltri = '') {
  const tableBody = document.getElementById('games-table-body');

  try {
    const response = await fetch(`${GAMES_URL}${queryFiltri}`);
    if (!response.ok) throw new Error('Errore durante la risposta del server');

    const giochi = await response.json();
    stampaTabella(giochi);
  } catch (error) {
    console.error('Errore durante il caricamento:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center" style="color: var(--danger)">
          Impossibile caricare i dati dal server backend.
        </td>
      </tr>`;
  }
}

function stampaTabella(giochi) {
  const tableBody = document.getElementById('games-table-body');
  tableBody.innerHTML = '';

  if (giochi.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Nessun videogioco trovato.</td></tr>';
    return;
  }

  giochi.forEach(gioco => {
    const gameId = gioco.id || gioco._id;
    const scorteTotali = totaleScorte(gioco);
    const daRiordinare = servePerRiordino(gioco);

    const row = document.createElement('tr');
    if (daRiordinare) row.classList.add('row-reorder');

    row.innerHTML = `
      <td><strong>${gioco.titolo}</strong></td>
      <td>${gioco.sviluppatore || 'N/D'}</td>
      <td>${gioco.generi && gioco.generi.length ? gioco.generi.join(', ') : 'N/D'}</td>
      <td>${formattaEuro(gioco.prezzo)}${gioco.scontoPercentuale ? ` <span class="badge badge-warning">-${gioco.scontoPercentuale}%</span>` : ''}</td>
      <td>${gioco.valutazione ? gioco.valutazione : 'N/D'}</td>
      <td>${scorteTotali} pz</td>
      <td>${daRiordinare
          ? '<span class="badge badge-warning">Da riordinare</span>'
          : '<span class="badge badge-success">Scorte OK</span>'}</td>
      <td>
        <button class="btn btn-warning btn-small" onclick="preparaModifica('${gameId}')">Modifica</button>
        <button class="btn btn-danger" onclick="eliminaGioco('${gameId}')">Elimina</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// --- RECUPERA GIOCO PER MODIFICA ---
async function preparaModifica(id) {
  try {
    const response = await fetch(`${GAMES_URL}/${id}`);
    if (!response.ok) throw new Error('Impossibile recuperare i dettagli del gioco');

    const gioco = await response.json();

    document.getElementById('game-id').value = gioco.id || gioco._id;
    document.getElementById('titolo').value = gioco.titolo || '';
    document.getElementById('sviluppatore').value = gioco.sviluppatore || '';
    document.getElementById('dataUscita').value = gioco.dataUscita ? gioco.dataUscita.split('T')[0] : '';
    document.getElementById('prezzo').value = gioco.prezzo ?? '';
    document.getElementById('scontoPercentuale').value = gioco.scontoPercentuale ?? '';
    document.getElementById('valutazione').value = gioco.valutazione ?? '';
    document.getElementById('sogliaRiordino').value = gioco.sogliaRiordino ?? '';

    generiSelezionati = new Set(gioco.generi || []);
    disegnaChipGeneri();

    const scorte = gioco.scortePerPiattaforma || {};
    document.getElementById('stock-pc').value = scorte.PC ?? '';
    document.getElementById('stock-ps5').value = scorte.PS5 ?? '';
    document.getElementById('stock-xbox').value = scorte.XboxSeriesX ?? '';
    document.getElementById('stock-switch').value = scorte.Switch ?? '';

    document.getElementById('form-title').innerText = 'Modifica Videogioco';
    document.getElementById('btn-save').innerText = 'Aggiorna Videogioco';
    document.getElementById('btn-cancel').style.display = 'inline-block';

    document.getElementById('add-game-section').scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('Errore durante il recupero del gioco:', error);
    alert('Impossibile caricare i dati per la modifica.');
  }
}

// --- SALVA O AGGIORNA IL GIOCO (POST / PUT) ---
async function gestisciSalvataggioGioco(e) {
  e.preventDefault();

  const id = document.getElementById('game-id').value;
  const isModifica = id !== "";

  const giocoData = {
    id: isModifica ? id : null,
    titolo: document.getElementById('titolo').value,
    sviluppatore: document.getElementById('sviluppatore').value,
    dataUscita: document.getElementById('dataUscita').value || null,
    prezzo: parseFloat(document.getElementById('prezzo').value) || 0,
    scontoPercentuale: parseInt(document.getElementById('scontoPercentuale').value) || 0,
    valutazione: parseFloat(document.getElementById('valutazione').value) || 0,
    sogliaRiordino: parseInt(document.getElementById('sogliaRiordino').value),
    generi: Array.from(generiSelezionati),
    scortePerPiattaforma: {
      "PC": parseInt(document.getElementById('stock-pc').value) || 0,
      "PS5": parseInt(document.getElementById('stock-ps5').value) || 0,
      "XboxSeriesX": parseInt(document.getElementById('stock-xbox').value) || 0,
      "Switch": parseInt(document.getElementById('stock-switch').value) || 0
    }
  };

  if (Number.isNaN(giocoData.sogliaRiordino)) giocoData.sogliaRiordino = 3;

  const url = isModifica ? `${GAMES_URL}/${id}` : GAMES_URL;
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

// --- ANNULLA MODIFICA ---
function annullaModifica() {
  document.getElementById('add-game-form').reset();
  document.getElementById('game-id').value = '';
  generiSelezionati.clear();
  disegnaChipGeneri();
  document.getElementById('form-title').innerText = 'Inserisci Nuovo Videogioco';
  document.getElementById('btn-save').innerText = 'Salva in Database';
  document.getElementById('btn-cancel').style.display = 'none';
}

// --- FILTRA CATALOGO ---
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

// --- ELIMINA GIOCO ---
async function eliminaGioco(id) {
  if (!confirm('Sei sicuro di voler eliminare questo videogioco dal catalogo?')) return;

  try {
    const response = await fetch(`${GAMES_URL}/${id}`, { method: 'DELETE' });
    if (response.ok) {
      caricaCatalogo();
    } else {
      alert('Errore durante l\'eliminazione.');
    }
  } catch (error) {
    console.error('Errore durante l\'eliminazione:', error);
  }
}

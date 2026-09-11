// --- PAGINA MAGAZZINO ---
const GAMES_URL = `${API_BASE}/games`;
const RESTOCK_URL = `${API_BASE}/restock`;

document.addEventListener('DOMContentLoaded', () => {
  popolaSelectPiattaformaRiordino();
  caricaMagazzino();

  document.getElementById('restock-modal-close').addEventListener('click', chiudiModaleRiordino);
  document.getElementById('restock-form').addEventListener('submit', confermaRiordino);
});

function popolaSelectPiattaformaRiordino() {
  const select = document.getElementById('restock-platform');
  select.innerHTML = '';
  PIATTAFORME.forEach(p => {
    const opzione = document.createElement('option');
    opzione.value = p.chiave;
    opzione.textContent = p.etichetta;
    select.appendChild(opzione);
  });
}

async function caricaMagazzino() {
  const tableBody = document.getElementById('warehouse-table-body');
  try {
    const risposta = await fetch(GAMES_URL);
    if (!risposta.ok) throw new Error('Errore nel recupero del magazzino');
    const giochi = await risposta.json();
    disegnaTabellaMagazzino(giochi);
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--danger)">Impossibile caricare il magazzino.</td></tr>`;
  }
}

function disegnaTabellaMagazzino(giochi) {
  const tableBody = document.getElementById('warehouse-table-body');
  tableBody.innerHTML = '';

  if (giochi.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nessun videogioco nel database.</td></tr>';
    return;
  }

  giochi.forEach(gioco => {
    const gameId = gioco.id || gioco._id;
    const soglia = gioco.sogliaRiordino ?? 3;
    const scorte = gioco.scortePerPiattaforma || {};
    const daRiordinare = servePerRiordino(gioco);

    const righePiattaforme = PIATTAFORME.map(p => {
      const quantita = scorte[p.chiave] || 0;
      const bassa = quantita <= soglia;
      return `
        <div class="platform-stock-line">
          <span>${p.etichetta}</span>
          <span>
            ${quantita} pz
            ${bassa ? '<span class="badge badge-warning">Riordina</span>' : ''}
          </span>
        </div>`;
    }).join('');

    const row = document.createElement('tr');
    if (daRiordinare) row.classList.add('row-reorder');

    row.innerHTML = `
      <td><strong>${gioco.titolo}</strong></td>
      <td>${righePiattaforme}</td>
      <td>${totaleScorte(gioco)} pz</td>
      <td>${daRiordinare
          ? '<span class="badge badge-warning">Da riordinare</span>'
          : '<span class="badge badge-success">Scorte OK</span>'}</td>
      <td><button class="btn btn-primary btn-small" onclick='apriModaleRiordino(${JSON.stringify(gameId)}, ${JSON.stringify(gioco.titolo)})'>Riordina</button></td>
    `;
    tableBody.appendChild(row);
  });
}

function apriModaleRiordino(gameId, titolo) {
  document.getElementById('restock-game-id').value = gameId;
  document.getElementById('restock-game-title').value = titolo;
  document.getElementById('restock-quantity').value = '';
  document.getElementById('restock-price').value = '';
  document.getElementById('restock-message').textContent = '';
  document.getElementById('restock-message').className = 'form-message';
  document.getElementById('restock-modal').classList.add('open');
}

function chiudiModaleRiordino() {
  document.getElementById('restock-modal').classList.remove('open');
}

async function confermaRiordino(e) {
  e.preventDefault();
  const messaggio = document.getElementById('restock-message');

  const richiesta = {
    gameId: document.getElementById('restock-game-id').value,
    piattaforma: document.getElementById('restock-platform').value,
    quantita: parseInt(document.getElementById('restock-quantity').value) || 0,
    prezzoUnitarioAcquisto: parseFloat(document.getElementById('restock-price').value) || 0
  };

  try {
    const risposta = await fetch(RESTOCK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(richiesta)
    });

    if (!risposta.ok) {
      const testoErrore = await risposta.text();
      messaggio.textContent = testoErrore || 'Errore durante il riordino.';
      messaggio.className = 'form-message error';
      return;
    }

    messaggio.textContent = 'Ordine registrato: scorte aggiornate e spesa aggiunta al bilancio.';
    messaggio.className = 'form-message success';

    await caricaMagazzino();
    setTimeout(chiudiModaleRiordino, 1200);
  } catch (error) {
    console.error(error);
    messaggio.textContent = 'Impossibile comunicare con il server.';
    messaggio.className = 'form-message error';
  }
}

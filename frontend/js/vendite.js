// --- PAGINA VENDITE ---
const SALES_CATALOG_URL = `${API_BASE}/sales/catalogo`;
const SALES_URL = `${API_BASE}/sales`;
const RESTOCK_URL = `${API_BASE}/restock`;

let ultimoGiocoSelezionato = null; // usato per calcolare l'anteprima prezzo nel modale vendita

document.addEventListener('DOMContentLoaded', () => {
  popolaGeneriRicerca();
  caricaCatalogoVendita();

  document.getElementById('sales-search-form').addEventListener('submit', gestisciRicercaVendita);
  document.getElementById('sales-reset-filters').addEventListener('click', () => caricaCatalogoVendita());

  document.getElementById('sale-modal-close').addEventListener('click', () => chiudiModale('sale-modal'));
  document.getElementById('sale-form').addEventListener('submit', confermaVendita);
  document.getElementById('sale-quantity').addEventListener('input', aggiornaAnteprimaPrezzo);

  document.getElementById('quick-restock-modal-close').addEventListener('click', () => chiudiModale('quick-restock-modal'));
  document.getElementById('quick-restock-form').addEventListener('submit', confermaRiordinoRapido);
});

async function popolaGeneriRicerca() {
  try {
    const generi = await recuperaGeneri();
    const select = document.getElementById('sales-filter-genre');
    generi.forEach(genere => {
      const opzione = document.createElement('option');
      opzione.value = genere.nome;
      opzione.textContent = genere.nome;
      select.appendChild(opzione);
    });
  } catch (error) {
    console.error('Errore caricamento generi per la ricerca vendite:', error);
  }
}

async function caricaCatalogoVendita(queryFiltri = '') {
  const tableBody = document.getElementById('sales-table-body');
  try {
    const risposta = await fetch(`${SALES_CATALOG_URL}${queryFiltri}`);
    if (!risposta.ok) throw new Error('Errore nel recupero del catalogo vendita');
    const giochi = await risposta.json();
    disegnaTabellaVendita(giochi);
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `<tr><td colspan="3" class="text-center" style="color: var(--danger)">Impossibile caricare i giochi.</td></tr>`;
  }
}

function disegnaTabellaVendita(giochi) {
  const tableBody = document.getElementById('sales-table-body');
  tableBody.innerHTML = '';

  if (giochi.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Nessun videogioco trovato.</td></tr>';
    return;
  }

  giochi.forEach(gioco => {
    const gameId = gioco.id || gioco._id;
    const scorte = gioco.scortePerPiattaforma || {};

    const righePiattaforme = PIATTAFORME.map(p => {
      const quantita = scorte[p.chiave] || 0;
      const disponibile = quantita > 0;
      const azione = disponibile
        ? `<button class="btn btn-success btn-small" onclick='apriModaleVendita(${JSON.stringify(gameId)}, ${JSON.stringify(gioco.titolo)}, ${JSON.stringify(p.chiave)}, ${JSON.stringify(p.etichetta)}, ${quantita})'>Vendi</button>`
        : `<button class="btn btn-warning btn-small" onclick='apriModaleRiordinoRapido(${JSON.stringify(gameId)}, ${JSON.stringify(gioco.titolo)}, ${JSON.stringify(p.chiave)}, ${JSON.stringify(p.etichetta)})'>Riordina</button>`;

      return `
        <div class="platform-stock-line">
          <span>${p.etichetta} — ${disponibile ? `${quantita} pz` : 'esaurito'}
            ${disponibile ? '<span class="badge badge-success">Disponibile</span>' : '<span class="badge badge-danger">Non disponibile</span>'}
          </span>
          <span>${azione}</span>
        </div>`;
    }).join('');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${gioco.titolo}</strong><br><span style="color: var(--text-muted); font-size: 0.8rem;">${(gioco.generi || []).join(', ') || 'N/D'}</span></td>
      <td>${formattaEuro(gioco.prezzo)}${gioco.scontoPercentuale ? ` <span class="badge badge-warning">-${gioco.scontoPercentuale}%</span>` : ''}</td>
      <td>${righePiattaforme}</td>
    `;
    tableBody.appendChild(row);
  });
}

function gestisciRicercaVendita(e) {
  e.preventDefault();
  const titolo = document.getElementById('sales-search-title').value;
  const genere = document.getElementById('sales-filter-genre').value;
  const soloDisponibili = document.getElementById('sales-only-available').value;

  const params = new URLSearchParams();
  if (titolo) params.append('titolo', titolo);
  if (genere) params.append('genere', genere);
  if (soloDisponibili) params.append('soloDisponibili', soloDisponibili);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  caricaCatalogoVendita(queryString);
}

function chiudiModale(id) {
  document.getElementById(id).classList.remove('open');
}

// --- MODALE VENDITA ---
function apriModaleVendita(gameId, titolo, piattaformaChiave, piattaformaEtichetta, scortaDisponibile) {
  ultimoGiocoSelezionato = { scortaDisponibile };

  document.getElementById('sale-game-id').value = gameId;
  document.getElementById('sale-platform').value = piattaformaChiave;
  document.getElementById('sale-game-title').value = titolo;
  document.getElementById('sale-platform-label').value = piattaformaEtichetta;
  document.getElementById('sale-quantity').value = '';
  document.getElementById('sale-quantity').max = scortaDisponibile;
  document.getElementById('sale-quantity-label').textContent = `Quantità (disponibili: ${scortaDisponibile})`;
  document.getElementById('sale-price-preview').textContent = '';
  document.getElementById('sale-message').textContent = '';
  document.getElementById('sale-message').className = 'form-message';

  document.getElementById('sale-modal').classList.add('open');
}

function aggiornaAnteprimaPrezzo() {
  // Anteprima semplice basata sulla quantità inserita (il calcolo definitivo, con sconto, avviene lato server)
  const quantita = parseInt(document.getElementById('sale-quantity').value) || 0;
  const anteprima = document.getElementById('sale-price-preview');
  anteprima.textContent = quantita > 0
    ? `Verranno vendute ${quantita} copie. Il totale (sconto incluso) verrà calcolato automaticamente.`
    : '';
}

async function confermaVendita(e) {
  e.preventDefault();
  const messaggio = document.getElementById('sale-message');

  const richiesta = {
    gameId: document.getElementById('sale-game-id').value,
    piattaforma: document.getElementById('sale-platform').value,
    quantita: parseInt(document.getElementById('sale-quantity').value) || 0
  };

  try {
    const risposta = await fetch(SALES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(richiesta)
    });

    if (!risposta.ok) {
      const testoErrore = await risposta.text();
      messaggio.textContent = testoErrore || 'Errore durante la vendita.';
      messaggio.className = 'form-message error';
      return;
    }

    const vendita = await risposta.json();
    messaggio.textContent = `Vendita registrata: ${formattaEuro(vendita.totaleIncassato)} aggiunti al bilancio.`;
    messaggio.className = 'form-message success';

    await caricaCatalogoVendita();
    setTimeout(() => chiudiModale('sale-modal'), 1200);
  } catch (error) {
    console.error(error);
    messaggio.textContent = 'Impossibile comunicare con il server.';
    messaggio.className = 'form-message error';
  }
}

// --- MODALE RIORDINO RAPIDO (gioco esaurito) ---
function apriModaleRiordinoRapido(gameId, titolo, piattaformaChiave, piattaformaEtichetta) {
  document.getElementById('qr-game-id').value = gameId;
  document.getElementById('qr-platform').value = piattaformaChiave;
  document.getElementById('qr-game-title').value = titolo;
  document.getElementById('qr-platform-label').value = piattaformaEtichetta;
  document.getElementById('qr-quantity').value = '';
  document.getElementById('qr-price').value = '';
  document.getElementById('quick-restock-message').textContent = '';
  document.getElementById('quick-restock-message').className = 'form-message';

  document.getElementById('quick-restock-modal').classList.add('open');
}

async function confermaRiordinoRapido(e) {
  e.preventDefault();
  const messaggio = document.getElementById('quick-restock-message');

  const richiesta = {
    gameId: document.getElementById('qr-game-id').value,
    piattaforma: document.getElementById('qr-platform').value,
    quantita: parseInt(document.getElementById('qr-quantity').value) || 0,
    prezzoUnitarioAcquisto: parseFloat(document.getElementById('qr-price').value) || 0
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

    messaggio.textContent = 'Ordine registrato: il gioco è di nuovo disponibile.';
    messaggio.className = 'form-message success';

    await caricaCatalogoVendita();
    setTimeout(() => chiudiModale('quick-restock-modal'), 1200);
  } catch (error) {
    console.error(error);
    messaggio.textContent = 'Impossibile comunicare con il server.';
    messaggio.className = 'form-message error';
  }
}

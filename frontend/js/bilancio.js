// --- PAGINA BILANCIO ---
const BALANCE_URL = `${API_BASE}/balance`;

document.addEventListener('DOMContentLoaded', caricaBilancio);

async function caricaBilancio() {
  try {
    const risposta = await fetch(BALANCE_URL);
    if (!risposta.ok) throw new Error('Errore nel recupero del bilancio');
    const dati = await risposta.json();

    disegnaRiepilogo(dati);
    disegnaCronologiaVendite(dati.vendite || []);
    disegnaCronologiaAcquisti(dati.acquisti || []);
  } catch (error) {
    console.error(error);
    document.getElementById('sales-history-body').innerHTML =
      '<tr><td colspan="6" class="text-center" style="color: var(--danger)">Impossibile caricare il bilancio.</td></tr>';
    document.getElementById('purchases-history-body').innerHTML =
      '<tr><td colspan="6" class="text-center" style="color: var(--danger)">Impossibile caricare il bilancio.</td></tr>';
  }
}

function disegnaRiepilogo(dati) {
  document.getElementById('summary-sales').textContent = formattaEuro(dati.totaleVendite);
  document.getElementById('summary-purchases').textContent = formattaEuro(dati.totaleAcquisti);

  const netEl = document.getElementById('summary-net');
  netEl.textContent = formattaEuro(dati.bilancioNetto);
  netEl.classList.remove('value-positive', 'value-negative');
  netEl.classList.add(dati.bilancioNetto >= 0 ? 'value-positive' : 'value-negative');
}

function disegnaCronologiaVendite(vendite) {
  const tbody = document.getElementById('sales-history-body');
  tbody.innerHTML = '';

  if (vendite.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nessuna vendita registrata.</td></tr>';
    return;
  }

  vendite.forEach(v => {
    const riga = document.createElement('tr');
    riga.innerHTML = `
      <td>${formattaData(v.data)}</td>
      <td>${v.titoloGioco}</td>
      <td>${etichettaPiattaforma(v.piattaforma)}</td>
      <td>${v.quantita}</td>
      <td>${v.scontoPercentuale ? `-${v.scontoPercentuale}%` : '—'}</td>
      <td><strong>${formattaEuro(v.totaleIncassato)}</strong></td>
    `;
    tbody.appendChild(riga);
  });
}

function disegnaCronologiaAcquisti(acquisti) {
  const tbody = document.getElementById('purchases-history-body');
  tbody.innerHTML = '';

  if (acquisti.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nessun acquisto registrato.</td></tr>';
    return;
  }

  acquisti.forEach(a => {
    const riga = document.createElement('tr');
    riga.innerHTML = `
      <td>${formattaData(a.data)}</td>
      <td>${a.titoloGioco}</td>
      <td>${etichettaPiattaforma(a.piattaforma)}</td>
      <td>${a.quantita}</td>
      <td>${formattaEuro(a.prezzoUnitarioAcquisto)}</td>
      <td><strong>${formattaEuro(a.totaleSpeso)}</strong></td>
    `;
    tbody.appendChild(riga);
  });
}

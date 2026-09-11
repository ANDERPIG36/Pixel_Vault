// --- CONFIGURAZIONE API CONDIVISA ---
// Base URL del backend C#. Le singole risorse vengono aggiunte dalle pagine (games, genres, sales, restock, balance).
const API_BASE = 'http://localhost:5201/api';

// Nomi "puliti" delle piattaforme usate ovunque nel frontend, mappati sulla chiave salvata nel dizionario scortePerPiattaforma
const PIATTAFORME = [
  { chiave: 'PC', etichetta: 'PC' },
  { chiave: 'PS5', etichetta: 'PS5' },
  { chiave: 'XboxSeriesX', etichetta: 'Xbox Series X' },
  { chiave: 'Switch', etichetta: 'Nintendo Switch' }
];

function etichettaPiattaforma(chiave) {
  const trovata = PIATTAFORME.find(p => p.chiave === chiave);
  return trovata ? trovata.etichetta : chiave;
}

// Somma tutte le copie di un gioco su tutte le piattaforme
function totaleScorte(gioco) {
  const scorte = gioco.scortePerPiattaforma || {};
  return Object.values(scorte).reduce((acc, val) => acc + (val || 0), 0);
}

// Un gioco è "da riordinare" se almeno una piattaforma è sotto la soglia impostata sul gioco stesso
function servePerRiordino(gioco) {
  const scorte = gioco.scortePerPiattaforma || {};
  const soglia = gioco.sogliaRiordino ?? 3;
  return Object.values(scorte).some(val => (val || 0) <= soglia);
}

function formattaEuro(valore) {
  const numero = Number(valore) || 0;
  return `€ ${numero.toFixed(2)}`;
}

function formattaData(valoreData) {
  if (!valoreData) return 'N/D';
  const data = new Date(valoreData);
  if (Number.isNaN(data.getTime())) return 'N/D';
  return data.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Recupera la lista generi (usata dal database giochi e dai filtri di ricerca/vendita)
async function recuperaGeneri() {
  const risposta = await fetch(`${API_BASE}/genres`);
  if (!risposta.ok) throw new Error('Impossibile recuperare la lista generi.');
  return risposta.json();
}

// Evidenzia il link di navigazione della pagina corrente
function evidenziaNavAttiva() {
  const paginaCorrente = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === paginaCorrente);
  });
}

document.addEventListener('DOMContentLoaded', evidenziaNavAttiva);

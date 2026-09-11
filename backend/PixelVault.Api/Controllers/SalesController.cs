using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using PixelVault.Api.Models;
using PixelVault.Api.Services;

namespace PixelVault.Api.Controllers
{
    // Pagina "Vendite": ricerca giochi (disponibili e non), registra vendite e scala automaticamente
    // le scorte del magazzino, aggiungendo l'incasso (al netto dello sconto) al bilancio.
    [ApiController]
    [Route("api/[controller]")]
    public class SalesController : ControllerBase
    {
        private readonly IMongoCollection<Game> _gamesCollection;
        private readonly IMongoCollection<Sale> _salesCollection;

        public SalesController(MongoDbContext context)
        {
            _gamesCollection = context.Games;
            _salesCollection = context.Sales;
        }

        // GET: api/sales/catalogo
        // Cerca i giochi per titolo/genere/piattaforma; mostra sia i disponibili che i non disponibili,
        // segnalati come tali dal frontend tramite le scorte per piattaforma.
        [HttpGet("catalogo")]
        public async Task<ActionResult<List<Game>>> GetCatalogoVendita(
            [FromQuery] string? titolo,
            [FromQuery] string? genere,
            [FromQuery] string? piattaforma,
            [FromQuery] bool? soloDisponibili)
        {
            var filterBuilder = Builders<Game>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(titolo))
            {
                filter &= filterBuilder.Regex("titolo", new BsonRegularExpression(titolo, "i"));
            }

            if (!string.IsNullOrWhiteSpace(genere))
            {
                filter &= filterBuilder.Regex("generi", new BsonRegularExpression(genere, "i"));
            }

            if (!string.IsNullOrWhiteSpace(piattaforma))
            {
                filter &= filterBuilder.Exists($"scortePerPiattaforma.{piattaforma}");
            }

            var giochi = await _gamesCollection.Find(filter).SortBy(g => g.Titolo).ToListAsync();

            if (soloDisponibili == true)
            {
                giochi = giochi.Where(g => g.ScortePerPiattaforma.Values.Any(scorta => scorta > 0)).ToList();
            }

            return Ok(giochi);
        }

        // GET: api/sales  -> cronologia vendite (usata anche dalla pagina Bilancio)
        [HttpGet]
        public async Task<ActionResult<List<Sale>>> GetStorico()
        {
            var vendite = await _salesCollection.Find(_ => true).SortByDescending(v => v.Data).ToListAsync();
            return Ok(vendite);
        }

        // POST: api/sales
        // Registra una vendita: verifica le scorte, le scala, calcola il totale applicando lo sconto attivo sul gioco.
        [HttpPost]
        public async Task<ActionResult<Sale>> Vendi([FromBody] VenditaRequest richiesta)
        {
            if (richiesta.Quantita <= 0)
            {
                return BadRequest("La quantità deve essere maggiore di zero.");
            }

            var gioco = await _gamesCollection.Find(g => g.Id == richiesta.GameId).FirstOrDefaultAsync();
            if (gioco == null)
            {
                return NotFound("Videogioco non trovato.");
            }

            gioco.ScortePerPiattaforma.TryGetValue(richiesta.Piattaforma, out int scortaAttuale);
            if (scortaAttuale < richiesta.Quantita)
            {
                return BadRequest($"Scorte insufficienti per {richiesta.Piattaforma}. Disponibili: {scortaAttuale}.");
            }

            // Scala le copie vendute dal magazzino
            gioco.ScortePerPiattaforma[richiesta.Piattaforma] = scortaAttuale - richiesta.Quantita;
            await _gamesCollection.ReplaceOneAsync(g => g.Id == gioco.Id, gioco);

            decimal moltiplicatoreSconto = 1 - (decimal)gioco.ScontoPercentuale / 100m;
            decimal totale = Math.Round(richiesta.Quantita * gioco.Prezzo * moltiplicatoreSconto, 2);

            var vendita = new Sale
            {
                GameId = gioco.Id!,
                TitoloGioco = gioco.Titolo,
                Piattaforma = richiesta.Piattaforma,
                Quantita = richiesta.Quantita,
                PrezzoUnitario = gioco.Prezzo,
                ScontoPercentuale = gioco.ScontoPercentuale,
                TotaleIncassato = totale,
                Data = DateTime.UtcNow
            };

            await _salesCollection.InsertOneAsync(vendita);

            return Ok(vendita);
        }
    }
}

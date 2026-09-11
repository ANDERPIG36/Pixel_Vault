using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PixelVault.Api.Models;
using PixelVault.Api.Services;

namespace PixelVault.Api.Controllers
{
    // Pagina "Magazzino": gestisce i riordini (acquisti) e aumenta automaticamente le scorte,
    // aggiungendo la spesa al bilancio.
    [ApiController]
    [Route("api/[controller]")]
    public class RestockController : ControllerBase
    {
        private readonly IMongoCollection<Game> _gamesCollection;
        private readonly IMongoCollection<Restock> _restockCollection;

        public RestockController(MongoDbContext context)
        {
            _gamesCollection = context.Games;
            _restockCollection = context.Restocks;
        }

        // GET: api/restock -> cronologia acquisti (usata anche dalla pagina Bilancio)
        [HttpGet]
        public async Task<ActionResult<List<Restock>>> GetStorico()
        {
            var acquisti = await _restockCollection.Find(_ => true).SortByDescending(a => a.Data).ToListAsync();
            return Ok(acquisti);
        }

        // POST: api/restock
        // Registra un riordino: aumenta le scorte per la piattaforma indicata e calcola la spesa totale.
        [HttpPost]
        public async Task<ActionResult<Restock>> Riordina([FromBody] RiordinoRequest richiesta)
        {
            if (richiesta.Quantita <= 0)
            {
                return BadRequest("La quantità deve essere maggiore di zero.");
            }

            if (richiesta.PrezzoUnitarioAcquisto < 0)
            {
                return BadRequest("Il prezzo di acquisto non può essere negativo.");
            }

            var gioco = await _gamesCollection.Find(g => g.Id == richiesta.GameId).FirstOrDefaultAsync();
            if (gioco == null)
            {
                return NotFound("Videogioco non trovato.");
            }

            gioco.ScortePerPiattaforma.TryGetValue(richiesta.Piattaforma, out int scortaAttuale);
            gioco.ScortePerPiattaforma[richiesta.Piattaforma] = scortaAttuale + richiesta.Quantita;
            await _gamesCollection.ReplaceOneAsync(g => g.Id == gioco.Id, gioco);

            decimal totale = Math.Round(richiesta.Quantita * richiesta.PrezzoUnitarioAcquisto, 2);

            var acquisto = new Restock
            {
                GameId = gioco.Id!,
                TitoloGioco = gioco.Titolo,
                Piattaforma = richiesta.Piattaforma,
                Quantita = richiesta.Quantita,
                PrezzoUnitarioAcquisto = richiesta.PrezzoUnitarioAcquisto,
                TotaleSpeso = totale,
                Data = DateTime.UtcNow
            };

            await _restockCollection.InsertOneAsync(acquisto);

            return Ok(acquisto);
        }
    }
}

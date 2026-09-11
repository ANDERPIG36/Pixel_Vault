using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using PixelVault.Api.Models;
using PixelVault.Api.Services;

namespace PixelVault.Api.Controllers
{
    // Pagina "Database Giochi": permette di aggiungere, modificare ed eliminare i videogiochi del catalogo.
    [ApiController]
    [Route("api/[controller]")]
    public class GamesController : ControllerBase
    {
        private readonly IMongoCollection<Game> _gamesCollection;

        public GamesController(MongoDbContext context)
        {
            _gamesCollection = context.Games;
        }

        // GET: api/games
        // Recupera tutti i giochi, con filtri opzionali per titolo, genere e piattaforma (con scorte > 0)
        [HttpGet]
        public async Task<ActionResult<List<Game>>> Get([FromQuery] string? titolo, [FromQuery] string? genere, [FromQuery] string? piattaforma)
        {
            try
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
                    filter &= filterBuilder.Gt($"scortePerPiattaforma.{piattaforma}", 0);
                }

                var giochi = await _gamesCollection.Find(filter).SortBy(g => g.Titolo).ToListAsync();
                return Ok(giochi);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante il recupero dei dati: {ex.Message}");
            }
        }

        // GET: api/games/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Game>> GetById(string id)
        {
            try
            {
                var gioco = await _gamesCollection.Find(g => g.Id == id).FirstOrDefaultAsync();

                if (gioco == null)
                {
                    return NotFound("Videogioco non trovato.");
                }

                return Ok(gioco);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante il recupero del gioco: {ex.Message}");
            }
        }

        // POST: api/games
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Game newGame)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                newGame.Id = null; // l'ID lo assegna sempre MongoDB
                await _gamesCollection.InsertOneAsync(newGame);

                return CreatedAtAction(nameof(GetById), new { id = newGame.Id }, newGame);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante il salvataggio: {ex.Message}");
            }
        }

        // PUT: api/games/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Game updatedGame)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var game = await _gamesCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

                if (game is null)
                {
                    return NotFound("Videogioco non trovato per l'aggiornamento.");
                }

                updatedGame.Id = game.Id;
                await _gamesCollection.ReplaceOneAsync(x => x.Id == id, updatedGame);

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante l'aggiornamento: {ex.Message}");
            }
        }

        // DELETE: api/games/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var result = await _gamesCollection.DeleteOneAsync(g => g.Id == id);

                if (result.DeletedCount == 0)
                {
                    return NotFound("Videogioco non trovato.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante l'eliminazione: {ex.Message}");
            }
        }
    }
}

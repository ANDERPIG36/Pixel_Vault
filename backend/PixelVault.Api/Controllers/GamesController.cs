using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using PixelVault.Api.Models;

namespace PixelVault.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GamesController : ControllerBase
    {
        private readonly IMongoCollection<Game> _gamesCollection;

        public GamesController(IConfiguration configuration)
        {
            // Legge i parametri di connessione dal file appsettings.json
            var connectionString = configuration.GetSection("MongoDB:ConnectionString").Value 
                                   ?? "mongodb://localhost:27017";
            var databaseName = configuration.GetSection("MongoDB:DatabaseName").Value 
                               ?? "PixelVault";

            var client = new MongoClient(connectionString);
            var database = client.GetDatabase(databaseName);
            
            // Collega la raccolta 'games' su MongoDB
            _gamesCollection = database.GetCollection<Game>("games");
        }

        // GET: api/games
        // Permette di recuperare tutti i giochi, con filtri opzionali per titolo, genere e piattaforma (con scorte > 0)
        [HttpGet]
        public async Task<ActionResult<List<Game>>> Get([FromQuery] string? titolo, [FromQuery] string? genere, [FromQuery] string? piattaforma)
        {
            try
            {
                var filterBuilder = Builders<Game>.Filter;
                var filter = filterBuilder.Empty;

                // 1. Filtro per Titolo (case-insensitive)
                if (!string.IsNullOrWhiteSpace(titolo))
                {
                    filter &= filterBuilder.Regex("titolo", new BsonRegularExpression(titolo, "i"));
                }

                // 2. Filtro per Genere (case-insensitive)
                if (!string.IsNullOrWhiteSpace(genere))
                {
                    filter &= filterBuilder.Regex("generi", new BsonRegularExpression(genere, "i"));
                }

                // 3. Filtro per Piattaforma: mostra solo se le scorte per quella piattaforma sono > 0
                if (!string.IsNullOrWhiteSpace(piattaforma))
                {
                    // Mappa le opzioni del <select> HTML alle chiavi esatte usate nel dizionario C# / MongoDB
                    string fieldKey = piattaforma switch
                    {
                        "Xbox Series X" => "XboxSeriesX",
                        "Nintendo Switch" => "Switch",
                        _ => piattaforma // Per "PC" e "PS5" la chiave coincide
                    };

                    // Controlla se la quantità nel dizionario scortePerPiattaforma è maggiore di 0
                    filter &= filterBuilder.Gt($"scortePerPiattaforma.{fieldKey}", 0);
                }

                var giochi = await _gamesCollection.Find(filter).ToListAsync();
                return Ok(giochi);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante il recupero dei dati: {ex.Message}");
            }
        }

        // GET: api/games/{id}
        // Recupera un singolo gioco tramite il suo ID univoco
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
        // Riceve i dati dal form e salva un nuovo videogioco su MongoDB
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Game newGame)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Inserisce il nuovo oggetto nel database (MongoDB assegna automaticamente l'ID)
                await _gamesCollection.InsertOneAsync(newGame);
                
                return CreatedAtAction(nameof(GetById), new { id = newGame.Id }, newGame);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante il salvataggio: {ex.Message}");
            }
        }

        // PUT: api/games/{id}
        // Aggiorna un videogioco dal database tramite il suo ID univoco
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Game updatedGame)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Recupera il gioco esistente per verificare che esista
                var game = await _gamesCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

                if (game is null)
                {
                    return NotFound("Videogioco non trovato per l'aggiornamento.");
                }

                // Mantiene lo stesso ID dell'oggetto originale
                updatedGame.Id = game.Id;

                // Sostituisce il documento in MongoDB
                await _gamesCollection.ReplaceOneAsync(x => x.Id == id, updatedGame);

                return NoContent(); // 204 No Content (operazione riuscita)
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante l'aggiornamento: {ex.Message}");
            }
        }

        // DELETE: api/games/{id}
        // Elimina un videogioco dal database tramite il suo ID univoco
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

                return NoContent(); // 204 No Content
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Errore durante l'eliminazione: {ex.Message}");
            }
        }
    }
}
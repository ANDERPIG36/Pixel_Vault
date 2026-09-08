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
        // Permette di recuperare tutti i giochi, con filtri opzionali per titolo e genere
        [HttpGet]
        public async Task<ActionResult<List<Game>>> Get([FromQuery] string? titolo, [FromQuery] string? genere, [FromQuery] string? piattaforma)
        {
            try
            {
                var filterBuilder = Builders<Game>.Filter;
                var filter = filterBuilder.Empty;

                // Filtro per Titolo (ricerca parziale e case-insensitive)
                if (!string.IsNullOrWhiteSpace(titolo))
                {
                    filter &= filterBuilder.Regex("titolo", new BsonRegularExpression(titolo, "i"));
                }

                // Filtro per Genere
                if (!string.IsNullOrWhiteSpace(genere))
                {
                    filter &= filterBuilder.AnyEq("generi", genere);
                }

                // Filtro per Piattaforma
                if (!string.IsNullOrWhiteSpace(piattaforma))
                {
                    filter &= filterBuilder.AnyEq("piattaforme", piattaforma);
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
            var gioco = await _gamesCollection.Find(g => g.Id == id).FirstOrDefaultAsync();

            if (gioco == null)
            {
                return NotFound("Videogioco non trovato.");
            }

            return Ok(gioco);
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
    }
}
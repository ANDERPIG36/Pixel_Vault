using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PixelVault.Api.Models;
using PixelVault.Api.Services;

namespace PixelVault.Api.Controllers
{
    // Lista generi prefatta e gestibile (aggiungi/rimuovi), sul modello dei tag di Steam.
    // Usata dal form del database giochi e dai filtri di ricerca/vendita.
    [ApiController]
    [Route("api/[controller]")]
    public class GenresController : ControllerBase
    {
        private readonly IMongoCollection<Genre> _genresCollection;

        public GenresController(MongoDbContext context)
        {
            _genresCollection = context.Genres;
        }

        // GET: api/genres
        [HttpGet]
        public async Task<ActionResult<List<Genre>>> Get()
        {
            var generi = await _genresCollection.Find(_ => true).SortBy(g => g.Nome).ToListAsync();
            return Ok(generi);
        }

        // POST: api/genres  -> aggiunge un nuovo genere alla lista
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Genre nuovoGenere)
        {
            if (string.IsNullOrWhiteSpace(nuovoGenere.Nome))
            {
                return BadRequest("Il nome del genere è obbligatorio.");
            }

            var nomePulito = nuovoGenere.Nome.Trim();
            var esistente = await _genresCollection
                .Find(g => g.Nome.ToLower() == nomePulito.ToLower())
                .FirstOrDefaultAsync();

            if (esistente != null)
            {
                return Conflict("Questo genere è già presente nella lista.");
            }

            var genere = new Genre { Nome = nomePulito };
            await _genresCollection.InsertOneAsync(genere);

            return CreatedAtAction(nameof(Get), new { id = genere.Id }, genere);
        }

        // DELETE: api/genres/{id} -> rimuove un genere dalla lista
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _genresCollection.DeleteOneAsync(g => g.Id == id);

            if (result.DeletedCount == 0)
            {
                return NotFound("Genere non trovato.");
            }

            return NoContent();
        }
    }
}

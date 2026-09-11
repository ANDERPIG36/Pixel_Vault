using MongoDB.Driver;
using PixelVault.Api.Models;

namespace PixelVault.Api.Services
{
    /// <summary>
    /// Punto unico di accesso al database MongoDB: espone le collezioni usate dai controller.
    /// Registrato come singleton in Program.cs così ogni controller riceve la stessa connessione
    /// invece di aprirne una propria (com'era prima).
    /// </summary>
    public class MongoDbContext
    {
        public IMongoCollection<Game> Games { get; }
        public IMongoCollection<Genre> Genres { get; }
        public IMongoCollection<Sale> Sales { get; }
        public IMongoCollection<Restock> Restocks { get; }

        public MongoDbContext(IConfiguration configuration)
        {
            var connectionString = configuration.GetSection("MongoDB:ConnectionString").Value
                                   ?? "mongodb://localhost:27017";
            var databaseName = configuration.GetSection("MongoDB:DatabaseName").Value
                               ?? "PixelVault";

            var client = new MongoClient(connectionString);
            var database = client.GetDatabase(databaseName);

            Games = database.GetCollection<Game>("games");
            Genres = database.GetCollection<Genre>("genres");
            Sales = database.GetCollection<Sale>("sales");
            Restocks = database.GetCollection<Restock>("restocks");
        }

        /// <summary>
        /// Popola la lista generi con dei valori di base se è vuota (solo al primo avvio).
        /// Se MongoDB non è ancora raggiungibile, non blocca l'avvio dell'app: stampa solo un avviso
        /// (il seeding verrà ritentato automaticamente al prossimo riavvio del server).
        /// </summary>
        public async Task SeedGenresAsync()
        {
            try
            {
                var count = await Genres.CountDocumentsAsync(FilterDefinition<Genre>.Empty);
                if (count > 0) return;

                var generiBase = new[]
                {
                    "GDR", "Azione", "Open World", "Sport", "Avventura",
                    "Strategia", "Simulazione", "Corse", "Puzzle", "Horror", "Indie"
                };

                var documenti = generiBase.Select(nome => new Genre { Nome = nome });
                await Genres.InsertManyAsync(documenti);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Avviso] Impossibile inizializzare la lista generi: {ex.Message}");
                Console.WriteLine("[Avviso] Verifica che MongoDB sia in esecuzione (es. 'sudo systemctl start mongod' oppure 'mongod' da terminale) e riavvia l'app.");
            }
        }
    }
}

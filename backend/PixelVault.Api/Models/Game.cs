using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace PixelVault.Api.Models
{
    /// <summary>
    /// Rappresenta un videogioco nel database. Le scorte sono divise per piattaforma;
    /// la soglia di riordino determina quando una piattaforma viene segnalata come "da riordinare".
    /// </summary>
    [BsonIgnoreExtraElements] // ignora eventuali campi rimasti nei vecchi documenti (es. "piattaforme") non più usati dal modello
    public class Game
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("titolo")]
        [JsonPropertyName("titolo")]
        public string Titolo { get; set; } = string.Empty;

        [BsonElement("sviluppatore")]
        [JsonPropertyName("sviluppatore")]
        public string? Sviluppatore { get; set; }

        [BsonElement("dataUscita")]
        [JsonPropertyName("dataUscita")]
        public string? DataUscita { get; set; }

        [BsonElement("generi")]
        [JsonPropertyName("generi")]
        public List<string> Generi { get; set; } = new();

        [BsonElement("prezzo")]
        [JsonPropertyName("prezzo")]
        public decimal Prezzo { get; set; }

        [BsonElement("scontoPercentuale")]
        [JsonPropertyName("scontoPercentuale")]
        public int ScontoPercentuale { get; set; } = 0;

        [BsonElement("valutazione")]
        [JsonPropertyName("valutazione")]
        public double Valutazione { get; set; } = 0.0;

        // Copie disponibili per piattaforma, es. { "PC": 5, "PS5": 2 }
        [BsonElement("scortePerPiattaforma")]
        [JsonPropertyName("scortePerPiattaforma")]
        public Dictionary<string, int> ScortePerPiattaforma { get; set; } = new();

        // Sotto questa soglia (per singola piattaforma) il gioco viene segnalato "da riordinare"
        [BsonElement("sogliaRiordino")]
        [JsonPropertyName("sogliaRiordino")]
        public int SogliaRiordino { get; set; } = 3;
    }
}

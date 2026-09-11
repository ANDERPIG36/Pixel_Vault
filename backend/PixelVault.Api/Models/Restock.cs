using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace PixelVault.Api.Models
{
    /// <summary>
    /// Registra un acquisto/riordino di copie: quantità, prezzo di acquisto unitario e totale speso.
    /// Ogni riordino aumenta automaticamente le scorte del gioco corrispondente.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class Restock
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("gameId")]
        [JsonPropertyName("gameId")]
        public string GameId { get; set; } = string.Empty;

        [BsonElement("titoloGioco")]
        [JsonPropertyName("titoloGioco")]
        public string TitoloGioco { get; set; } = string.Empty;

        [BsonElement("piattaforma")]
        [JsonPropertyName("piattaforma")]
        public string Piattaforma { get; set; } = string.Empty;

        [BsonElement("quantita")]
        [JsonPropertyName("quantita")]
        public int Quantita { get; set; }

        [BsonElement("prezzoUnitarioAcquisto")]
        [JsonPropertyName("prezzoUnitarioAcquisto")]
        public decimal PrezzoUnitarioAcquisto { get; set; }

        [BsonElement("totaleSpeso")]
        [JsonPropertyName("totaleSpeso")]
        public decimal TotaleSpeso { get; set; }

        [BsonElement("data")]
        [JsonPropertyName("data")]
        public DateTime Data { get; set; } = DateTime.UtcNow;
    }
}

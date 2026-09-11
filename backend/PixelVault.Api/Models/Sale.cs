using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace PixelVault.Api.Models
{
    /// <summary>
    /// Registra una vendita effettuata: quantità, piattaforma, sconto applicato e totale incassato.
    /// Ogni vendita scala automaticamente le scorte del gioco corrispondente.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class Sale
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

        [BsonElement("prezzoUnitario")]
        [JsonPropertyName("prezzoUnitario")]
        public decimal PrezzoUnitario { get; set; }

        [BsonElement("scontoPercentuale")]
        [JsonPropertyName("scontoPercentuale")]
        public int ScontoPercentuale { get; set; }

        [BsonElement("totaleIncassato")]
        [JsonPropertyName("totaleIncassato")]
        public decimal TotaleIncassato { get; set; }

        [BsonElement("data")]
        [JsonPropertyName("data")]
        public DateTime Data { get; set; } = DateTime.UtcNow;
    }
}

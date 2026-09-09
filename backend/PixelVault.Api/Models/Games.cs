using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace PixelVault.Api.Models
{
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

        [BsonElement("piattaforme")]
        [JsonPropertyName("piattaforme")]
        public List<string> Piattaforme { get; set; } = new();

        [BsonElement("prezzo")]
        [JsonPropertyName("prezzo")]
        public decimal Prezzo { get; set; }

        [BsonElement("scontoPercentuale")]
        [JsonPropertyName("scontoPercentuale")]
        public int ScontoPercentuale { get; set; } = 0;

        [BsonElement("valutazione")]
        [JsonPropertyName("valutazione")]
        public double Valutazione { get; set; } = 0.0;

        [BsonElement("scortePerPiattaforma")]
        [JsonPropertyName("scortePerPiattaforma")]
        public Dictionary<string, int> ScortePerPiattaforma { get; set; } = new();
    }
}
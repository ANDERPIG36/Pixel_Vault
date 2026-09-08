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
        public string Titolo { get; set; } = string.Empty;

        [BsonElement("sviluppatore")]
        public string? Sviluppatore { get; set; }

        [BsonElement("dataUscita")]
        public string? DataUscita { get; set; }

        [BsonElement("generi")]
        public List<string> Generi { get; set; } = new();

        [BsonElement("piattaforme")]
        public List<string> Piattaforme { get; set; } = new();

        [BsonElement("prezzo")]
        public decimal Prezzo { get; set; }

        [BsonElement("scontoPercentuale")]
        public int ScontoPercentuale { get; set; } = 0;

        [BsonElement("valutazione")]
        public double Valutazione { get; set; } = 0.0;
    }
}
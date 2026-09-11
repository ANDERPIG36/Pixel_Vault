using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace PixelVault.Api.Models
{
    /// <summary>
    /// Voce della lista generi gestibile dall'utente (aggiunta/rimozione), sul modello dei tag di Steam.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class Genre
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("nome")]
        [JsonPropertyName("nome")]
        public string Nome { get; set; } = string.Empty;
    }
}

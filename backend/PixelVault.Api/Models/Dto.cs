namespace PixelVault.Api.Models
{
    /// <summary>Richiesta inviata dalla pagina Vendite per registrare una vendita.</summary>
    public class VenditaRequest
    {
        public string GameId { get; set; } = string.Empty;
        public string Piattaforma { get; set; } = string.Empty;
        public int Quantita { get; set; } = 1;
    }

    /// <summary>Richiesta inviata dalla pagina Magazzino per registrare un riordino/acquisto.</summary>
    public class RiordinoRequest
    {
        public string GameId { get; set; } = string.Empty;
        public string Piattaforma { get; set; } = string.Empty;
        public int Quantita { get; set; } = 1;
        public decimal PrezzoUnitarioAcquisto { get; set; }
    }

    /// <summary>Risposta aggregata per la pagina Bilancio: totali e cronologia completa.</summary>
    public class BilancioResponse
    {
        public decimal TotaleVendite { get; set; }
        public decimal TotaleAcquisti { get; set; }
        public decimal BilancioNetto { get; set; }
        public int NumeroVendite { get; set; }
        public int NumeroAcquisti { get; set; }
        public List<Sale> Vendite { get; set; } = new();
        public List<Restock> Acquisti { get; set; } = new();
    }
}

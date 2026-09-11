using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PixelVault.Api.Models;
using PixelVault.Api.Services;

namespace PixelVault.Api.Controllers
{
    // Pagina "Bilancio": mostra il totale vendite, il totale acquisti/riordini, il bilancio netto
    // e la cronologia completa di entrambi i movimenti.
    [ApiController]
    [Route("api/[controller]")]
    public class BalanceController : ControllerBase
    {
        private readonly IMongoCollection<Sale> _salesCollection;
        private readonly IMongoCollection<Restock> _restockCollection;

        public BalanceController(MongoDbContext context)
        {
            _salesCollection = context.Sales;
            _restockCollection = context.Restocks;
        }

        // GET: api/balance
        [HttpGet]
        public async Task<ActionResult<BilancioResponse>> GetBilancio()
        {
            var vendite = await _salesCollection.Find(_ => true).SortByDescending(v => v.Data).ToListAsync();
            var acquisti = await _restockCollection.Find(_ => true).SortByDescending(a => a.Data).ToListAsync();

            decimal totaleVendite = vendite.Sum(v => v.TotaleIncassato);
            decimal totaleAcquisti = acquisti.Sum(a => a.TotaleSpeso);

            var risposta = new BilancioResponse
            {
                TotaleVendite = totaleVendite,
                TotaleAcquisti = totaleAcquisti,
                BilancioNetto = totaleVendite - totaleAcquisti,
                NumeroVendite = vendite.Count,
                NumeroAcquisti = acquisti.Count,
                Vendite = vendite,
                Acquisti = acquisti
            };

            return Ok(risposta);
        }
    }
}

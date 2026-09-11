using PixelVault.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Aggiungi i servizi per i Controller API
builder.Services.AddControllers();

// Registra il context Mongo come singleton: tutti i controller condividono la stessa connessione
builder.Services.AddSingleton<MongoDbContext>();

// ABILITA CORS: Permette al frontend (le 4 pagine HTML) di comunicare con il server C#
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Popola la lista generi con dei valori di base al primo avvio, se è vuota
using (var scope = app.Services.CreateScope())
{
    var mongoContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    await mongoContext.SeedGenresAsync();
}

app.UseHttpsRedirection();

// APPLICA LA POLICY CORS
app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();

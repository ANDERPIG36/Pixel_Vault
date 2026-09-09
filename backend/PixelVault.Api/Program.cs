var builder = WebApplication.CreateBuilder(args);

// Aggiungi i servizi per i Controller API
builder.Services.AddControllers();

// ABILITA CORS: Permette al file index.html di comunicare con il server C#
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

app.UseHttpsRedirection();

// APPLICA LA POLICY CORS
app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
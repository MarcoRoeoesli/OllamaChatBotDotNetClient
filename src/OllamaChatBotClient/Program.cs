using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
                         {
                             options.AddPolicy("AllowAll",
                                               policy =>
                                               {
                                                   policy.AllowAnyOrigin()
                                                         .AllowAnyMethod()
                                                         .AllowAnyHeader();
                                               });
                         });
// Add services if needed
builder.Services.AddControllers();

var app = builder.Build();

// Enable serving static files
app.UseStaticFiles();

app.UseCors("AllowAll");
// Configure routing
app.UseRouting();

app.UseAuthorization();

app.UseEndpoints(endpoints =>
                 {
                     endpoints.MapControllers();

                     // Serve index.html from the root URL
                     endpoints.MapGet("/", async context =>
                                           {
                                               context.Response.ContentType = "text/html";
                                               await context.Response.SendFileAsync("wwwroot/index.html");
                                           });
                 });

app.Run();
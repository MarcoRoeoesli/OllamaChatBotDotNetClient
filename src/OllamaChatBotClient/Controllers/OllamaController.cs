using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using System.Web;
using Newtonsoft.Json;
using OllamaChatBotClient;

[Route("api/ollama")]
[ApiController]
public class OllamaController : ControllerBase
{
    private readonly HttpClient httpClient = new HttpClient();

    private readonly string ollamaHost;

    public OllamaController(IConfiguration configuration)
    {
        this.ollamaHost = configuration.GetSection("AppConfig")["OllamaHost"];
    }

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB file size limit
    public async Task Generate()
    {
        string ollamaUrl = $"{this.ollamaHost}/api/generate";

        // ✅ Log request content type (for debugging)
        Console.WriteLine($"Received request with content type: {Request.ContentType}");

        var form = await Request.ReadFormAsync(); // ✅ Explicitly read form data
        var message = form["message"].ToString(); // Get user message

        // ✅ Log received message
        Console.WriteLine($"Received message: {message}");

        StringBuilder fileContents = new StringBuilder();

        // ✅ Log the number of files received
        Console.WriteLine($"Number of files received: {form.Files.Count}");

        if (form.Files.Count > 0)
        {
            foreach (var file in form.Files)
            {
                Console.WriteLine($"Processing file: {file.FileName}, Size: {file.Length} bytes");

                if (file.Length > 0)
                {
                    // ✅ Use `using` instead of `await using` for `StreamReader`
                    using var reader = new StreamReader(file.OpenReadStream());
                    string firstLine = await reader.ReadLineAsync();
                    fileContents.AppendLine($"File: {file.FileName}\n{firstLine}");
                }
            }
        }

        string finalPrompt = !string.IsNullOrEmpty(fileContents.ToString())
                                 ? $"{message}\n\n{fileContents}"
                                 : message;

        // ✅ Log final prompt before sending to Ollama
        Console.WriteLine($"Final prompt: {finalPrompt}");

        var requestObj = new OllamaRequest
                         {
                             Prompt = finalPrompt
                         };

        // Serialize request to JSON
        string jsonRequest = JsonConvert.SerializeObject(requestObj);

        // Create HTTP request
        var request = new HttpRequestMessage(HttpMethod.Post, ollamaUrl)
                      {
                          Content = new StringContent(jsonRequest, Encoding.UTF8, "application/json")
                      };

        using var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
        Response.ContentType = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";

        await using var responseStream = await response.Content.ReadAsStreamAsync();
        await using var writer = new StreamWriter(Response.Body, Encoding.UTF8, leaveOpen: true);

        var buffer = new byte[1024];
        int bytesRead;
        while ((bytesRead = await responseStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
        {
            string chunk = Encoding.UTF8.GetString(buffer, 0, bytesRead);
            await writer.WriteAsync(chunk);
            await writer.FlushAsync();
            await Response.Body.FlushAsync();
        }
    }
}
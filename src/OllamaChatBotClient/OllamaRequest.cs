using Newtonsoft.Json;

namespace OllamaChatBotClient;

public class OllamaRequest
{
    [JsonProperty("model")] public string Model { get; set; } = "deepseek-r1";

    [JsonProperty("prompt")] public string Prompt { get; set; }

    [JsonProperty("stream")] public bool Stream { get; set; } = true;
}
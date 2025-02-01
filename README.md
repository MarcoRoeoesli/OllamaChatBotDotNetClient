# Ollama Chat Bot .Net Client

---

# Ollama Chat Bot Client - User Manual

Welcome to the Ollama Chat Bot Client! This guide will walk you through the steps to set up and use the chat application with the Deepseek R1 model hosted on Ollama.

---

## Prerequisites

Before using the chat client, ensure the following prerequisites are met:

1. **Ollama Installation**:
   - Download and install Ollama from the official website:  
     [Ollama Download for Windows](https://ollama.com/download/windows).

2. **.NET 9 Runtime**:
   - Install the .NET 9 Runtime for Windows x64:  
     [Download .NET 9 Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/9.0).

---

## Step 1: Install and Run Ollama

1. **Open Command Prompt**:
   - Press `Windows + R`, type `cmd`, and press Enter to open a Command Prompt.

2. **Download and Start Deepseek R1 Model**:
   - Run the following command to download and start the Deepseek R1 model:
     ```bash
     ollama run deepseek-r1
     ```
   - **Note**: Deepseek R1 is a Large Language Model (LLM) hosted on Ollama. Ollama supports other models as well, but Deepseek R1 is required for this chat client.

3. **Verify Ollama is Running**:
   - Once the model is ready, Ollama will run on port `11434` by default. You can verify this by opening your browser and navigating to:
     ```
     http://localhost:11434
     ```

---

## Step 2: Set Up the Chat Client

### Running Ollama and Chat Client on the Same Machine

1. **Start the Chat Client**:
   - Run the `OllamaChatBotClient.exe` file.
   - Open your browser and navigate to:
     ```
     http://localhost:5000
     ```

2. **Start Chatting**:
   - The chat interface will load, and you can start interacting with the Deepseek R1 model.

---

### Running Ollama and Chat Client on Different Machines

1. **Configure Ollama to Bind to All IPs**:
   - If Ollama is running on a different machine, you need to configure it to bind to all IP addresses (not just `localhost`).
   - Set the following environment variable on the machine running Ollama:
     - **Variable Name**: `OLLAMA_HOST`
     - **Value**: `0.0.0.0`

2. **Update Chat Client Configuration**:
   - Open the `app.settings` file in the chat client.
   - Update the `OllamaUrl` to point to the IP address or hostname of the machine running Ollama. For example:
     ```json
     "OllamaUrl": "http://<Ollama-Machine-IP>:11434"
     ```

3. **Start the Chat Client**:
   - Run the `OllamaChatBotClient.exe` file.
   - Open your browser and navigate to:
     ```
     http://localhost:5000
     ```

---

## Step 3: Using the Chat Interface

1. **Input Your Message**:
   - Type your message in the input box at the bottom of the chat interface and press **Send**.

2. **Upload Files (Optional)**:
   - You can upload files by clicking the file input button. The chat will process the file content.

3. **Cancel Generation**:
   - If the model is taking too long to respond, you can click the **Cancel** button to stop the generation.

---

## Troubleshooting

### Ollama Not Running
- Ensure Ollama is installed and the Deepseek R1 model is downloaded and running.
- Verify Ollama is accessible at `http://localhost:11434`.

### Chat Client Not Connecting
- If the chat client cannot connect to Ollama:
  - Ensure Ollama is running and accessible.
  - Check the `app.settings` file for the correct `OllamaUrl`.
  - If running on different machines, ensure the `OLLAMA_HOST` environment variable is set correctly.

### .NET Runtime Missing
- If the chat client fails to start, ensure the .NET 9 Runtime is installed. Download it from:  
  [Download .NET 9 Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/9.0).

---

## Additional Notes

- **Other Models**: Ollama supports multiple models. You can switch to a different model by running:
  ```bash
  ollama run <model-name>

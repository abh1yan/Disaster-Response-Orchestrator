# DISASTER RESPONSE ORCHESTRATOR

This is a Node.js-based CLI tool that simulates a multi-agent disaster response system using Azure AI Agents. It analyzes map data and supports real-time user interaction during emergencies like earthquakes and wildfires.

## 🧠 What It Does

- **Crisis Context Agent**: Accepts a disaster type and a map image. It analyzes user position relative to hazard markers and gives personalized, urgent risk context.
- **User Query Agent**: After context is set, it takes user questions from CLI, checks if they're relevant to disaster safety, and provides direct, actionable responses.

## 📁 Folder Structure

```
DISASTER-RESPONSE-ORCHESTRATOR/
├── .env                       # Your Azure Project connection string
├── index.js                  # Main working orchestrator code
├── index0.js                 # (Optional) earlier test version
├── package.json              # Node.js config
├── maps/
│   └── # Example map images
└── node_modules/             # Dependencies
```

## ⚙️ Setup Instructions

### 1. Install dependencies
```bash
npm install 
```

### 2. Create `.env` file
```env
PROJECT_CONNECTION_STRING=your-azure-project-connection-string
```

### 3. Run the project
```bash
node index.js
```

## 💡 How It Works (CLI Flow)

1. You provide:
   - Map image path (e.g., `image:maps/456.jpeg`)
   - Disaster type (e.g., wildfire)

2. The assistant replies with your situational risk context.

3. You can then type safety-related queries:
```bash
   You: should I run outside?
   Assistant (User Query): [Evaluates your environment and replies]
```

4. Exit the interaction anytime:
```bash
   You: exit
```

## 🛠️ Tech Stack

- Node.js
- Azure AI Projects SDK
- GPT-4o Mini
- Readline (for CLI)
- dotenv

## ✅ Notes

- Two agents run in sequence: one sets the context, the other handles real-time queries.
- All communication happens through the terminal (CLI).

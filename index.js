import { AIProjectsClient, MessageStreamEvent, RunStreamEvent } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import dotenv from 'dotenv';
import readline from 'readline';
import fs from "fs";
import path from "path";

dotenv.config();

const connectionString = process.env.PROJECT_CONNECTION_STRING;
const model = "gpt-4o-mini";

if (!connectionString) {
  throw new Error("Please set the PROJECT_CONNECTION_STRING environment variable.");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const client = AIProjectsClient.fromConnectionString(
    connectionString,
    new DefaultAzureCredential(),
  );

  const agent1 = await client.agents.createAgent(model, {
    name: "Personalized Crisis Context Agent, Analyze the map image and assess the user's location relative to disaster markers (e.g., hazard zones, safe zones, user location, terrain).",
    instructions: "You are provided with an image of a map and the type of disaster. The map contains various markers, including hazard zones, safe zones, the user’s location pin, and terrain features. Assess the user’s location in relation to these markers and summarize the user's personal risk context based on the specific disaster type. For example, if the disaster is an earthquake and the user is near coastal waters, advise them to move to higher ground; if it is a large fire, urge the user to act quickly and provide appropriate safety guidance. Your response should initiate and hydrate the user thread with relevant situational context and advisory. Communicate clearly, concisely, and with appropriate urgency based on the severity of the situation to support informed and immediate user action. Keep it concise.",
  });

  const thread = await client.agents.createThread();

  // Get user input for map image and disaster type
  const imagePath = await new Promise(resolve => rl.question('Enter image path (e.g., image:C:/map.jpeg): ', resolve));
  const disasterType = await new Promise(resolve => rl.question('Enter disaster type (e.g., earthquake, wildfire): ', resolve));

  const fileStream = fs.createReadStream(imagePath.replace('image:', '').trim());
  const fileName = path.basename(imagePath);
  const imageFile = await client.agents.uploadFile(
    fileStream,
    'assistants',
    { fileName }
  );

  await client.agents.createMessage(thread.id, {
    role: "user",
    content: [
      { type: 'text', text: `Disaster Type: ${disasterType}` },
      { type: 'image_file', image_file: { file_id: imageFile.id, detail: 'high' } }
    ],
  });

  const streamEventMessages = await client.agents.createRun(thread.id, agent1.id).stream();
  let assistantReply = '';

  for await (const eventMessage of streamEventMessages) {
    if (eventMessage.event === MessageStreamEvent.ThreadMessageDelta) {
      const messageDelta = eventMessage.data;
      messageDelta.delta.content.forEach((contentPart) => {
        if (contentPart.type === "text") {
          assistantReply += contentPart.text.value || '';
        }
      });
    }
  }

  console.log(`Assistant (Crisis Context): ${assistantReply}`);

  const agent2 = await client.agents.createAgent(model, {
    name: "User Query Agent",
    instructions: "As the User Query Agent of the Disaster Response Orchestrator, evaluate all user queries for relevance. Your role requires unemotional, action-oriented communication only. If a query is not relevant to disaster response, safety, or situational awareness, politely refuse to respond. You should respond to user queries by assessing the context and asking relevant questions to better understand the user’s surroundings, such as whether they are indoors, outdoors, in a high-rise, or another specific environment. For example, if a user asks if they should hide under a table during an earthquake, you should inquire further to assess whether that action is appropriate or if they should consider moving outside. Then, provide a tailored action plan, advising against certain actions, like avoiding lifts in a high-rise, and suggest safer alternatives. You should also offer safe zone navigation based on map markers, directing users to safe areas during events like wildfires, while providing necessary advisories. Prioritize real-time situational updates, suggest alternative safe routes, and offer actions based on current conditions, such as weather or structural integrity. Encourage users to stay updated on local alerts and provide ongoing support as the situation evolves, ensuring a comprehensive and adaptive approach to safety.",
  });

  while (true) {
    const userInput = await new Promise(resolve => rl.question('You: ', resolve));

    if (userInput.trim().toLowerCase() === 'exit') {
      console.log('Exiting...');
      break;
    }

    await client.agents.createMessage(thread.id, {
      role: "user",
      content: [
        { type: "text", text: userInput }
      ]
    });

    const streamEventMessages2 = await client.agents.createRun(thread.id, agent2.id).stream();
    let assistantReply2 = '';

    for await (const eventMessage of streamEventMessages2) {
      if (eventMessage.event === MessageStreamEvent.ThreadMessageDelta) {
        const messageDelta = eventMessage.data;
        messageDelta.delta.content.forEach((contentPart) => {
          if (contentPart.type === "text") {
            assistantReply2 += contentPart.text.value || '';
          }
        });
      }
    }

    console.log(`Assistant (User Query): ${assistantReply2}`);
  }

  await client.agents.deleteAgent(agent1.id);
  await client.agents.deleteAgent(agent2.id);
  rl.close();
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});

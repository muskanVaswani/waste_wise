import { GoogleGenAI, Type } from "@google/genai";
import { AgentType } from "../types";

// Helper to get client (assumes process.env.API_KEY is available)
const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY not found in environment");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- SYSTEM PROMPTS ---

const PROMPTS = {
  ORCHESTRATOR: `You are the Orchestrator for WasteWise, a multi-agent sustainability system. 
  Your job is to:
  1. Analyze the user's input to determine their intent (Identify, Reuse, Compost, Recycle, Impact).
  2. If the user uploads an image, assume they want to CLASSIFY it first.
  3. If the user asks for locations, delegate to LOCAL_RESOURCE.
  4. If the user asks for creative ideas, delegate to REUSE_SPECIALIST.
  5. If the user asks about rotting, soil, or organic breakdown, delegate to COMPOST_EXPERT.
  6. Otherwise, answer generally or ask for clarification.
  
  Keep responses concise and helpful. Guide them to the next step.`,

  CLASSIFIER: `You are a specialized Waste Classification Agent.
  Analyze the image or text provided. 
  Identify the main waste item(s).
  Categorize them into: Organic (Compostable), Recyclable (Paper/Plastic/Glass/Metal), Hazardous, or Landfill.
  Provide a very brief description of the material composition.`,

  REUSE_SPECIALIST: `You are a DIY and Upcycling Expert.
  Suggest 3 creative, practical reuse ideas for the specific waste item identified.
  Format as a clean list. Include difficulty level (Easy/Medium/Hard).`,

  COMPOST_EXPERT: `You are a Composting Expert.
  Determine if the item is "Green" (Nitrogen-rich) or "Brown" (Carbon-rich).
  Advise on how to prepare it for the bin (e.g., chop smaller, wash).
  Warn about any pests or issues (e.g., meat/dairy restrictions).`,

  IMPACT_ANALYST: `You are an Environmental Impact Analyst.
  Estimate the carbon footprint saved by diverting this item from the landfill.
  Use rough estimates but make them sound encouraging (e.g., "Recycling this saves enough energy to power a lightbulb for 4 hours").`
};

// --- API FUNCTIONS ---

export const classifyImage = async (base64Image: string, mimeType: string) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: PROMPTS.CLASSIFIER }
      ]
    }
  });
  return response.text;
};

export const getAgentResponse = async (
  agent: AgentType,
  history: { role: string; content: string }[],
  currentInput: string,
  contextData?: string
) => {
  const ai = getAiClient();
  
  // Construct a prompt that includes the agent's persona and relevant context
  let systemInstruction = PROMPTS[agent as keyof typeof PROMPTS] || PROMPTS.ORCHESTRATOR;
  
  if (contextData) {
    systemInstruction += `\n\nCONTEXT FROM PREVIOUS AGENTS: ${contextData}`;
  }

  // Convert history for Gemini
  // Note: Gemini history format is 'user' | 'model'.
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: { systemInstruction },
    history: formattedHistory
  });

  const response = await chat.sendMessage({ message: currentInput });
  return response.text;
};

export const findRecyclingCenters = async (query: string, location?: { lat: number; lng: number }) => {
  const ai = getAiClient();
  
  const toolConfig: any = {
    tools: [{ googleMaps: {} }],
  };

  if (location) {
    toolConfig.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find recycling centers or donation spots for: ${query}. Return a list of specific places nearby.`,
    config: toolConfig
  });

  const text = response.text;
  const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  return { text, grounding };
};

export const determineAgentIntent = async (input: string, hasImage: boolean): Promise<AgentType> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `User Input: "${input}"
    Has Image: ${hasImage}
    
    You are the router for a waste management system. Analyze the input and select the best Agent ID.
    
    Rules:
    1. If Has Image = true, ALWAYS return 'CLASSIFIER'.
    2. If user mentions specific food scraps (e.g., "onion peels", "banana", "egg shells", "leftovers", "fruit", "vegetable"), return 'COMPOST_EXPERT'.
    3. If user explicitly asks for "ideas", "diy", "crafts", return 'REUSE_SPECIALIST'.
    4. If user asks "where to recycle", "location", "center", "pickup", "drop off", return 'LOCAL_RESOURCE'.
    5. If user asks about "impact", "carbon", "environment", return 'IMPACT_ANALYST'.
    6. For general greetings or unclear inputs, return 'ORCHESTRATOR'.

    Available Agents:
    - CLASSIFIER
    - REUSE_SPECIALIST
    - COMPOST_EXPERT
    - LOCAL_RESOURCE
    - IMPACT_ANALYST
    - ORCHESTRATOR
    
    Return ONLY the Agent ID.`,
  });

  const text = response.text.trim().toUpperCase();
  // Basic validation
  const validAgents = ['CLASSIFIER', 'REUSE_SPECIALIST', 'COMPOST_EXPERT', 'LOCAL_RESOURCE', 'IMPACT_ANALYST', 'ORCHESTRATOR'];
  return validAgents.find(a => text.includes(a)) as AgentType || 'ORCHESTRATOR';
};
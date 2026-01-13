// server/services/difyService.ts

import axios from "axios";

const DIFY_API = process.env.DIFY_API_URL; 
const DIFY_KEY = process.env.DIFY_API_KEY; 

export const difyService = {
  async generate(prompt: string): Promise<string> {
    if (!DIFY_API || !DIFY_KEY) {
      console.error("Dify API configuration missing");
      throw new Error("Serviço de IA não configurado corretamente.");
    }

    const response = await axios.post(
      `${DIFY_API}/chat-messages`,
      {
        inputs: {},
        query: prompt,
        user: "user-1",
        response_mode: "blocking",
      },
      {
        headers: {
          Authorization: `Bearer ${DIFY_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data?.answer || "";
    return text.trim();
  },
};

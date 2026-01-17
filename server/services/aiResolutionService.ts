import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config/env.js'; // Corrigido para .js

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function getResolutionFromAI(questionText: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especialista em resolver questões de concurso. Forneça uma resolução clara e direta para a questão apresentada."
        },
        {
          role: "user",
          content: questionText
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("Error fetching resolution from OpenAI:", error);
    return null;
  }
}

// server/services/aiResolutionService.ts

import { difyService } from "./difyService";

export const aiResolutionService = {
  async generateResolution(questionText: string): Promise<string> {
    const prompt = `
Você é um médico especialista.
Explique detalhadamente a resolução da seguinte questão de residência:

"${questionText}"

Explique o raciocínio clínico, diagnóstico diferencial e o porquê da resposta correta.
    `;

    const result = await difyService.generate(prompt);

    return result;
  }
};

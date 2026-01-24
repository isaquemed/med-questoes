// server/services/difyService.ts
import axios from "axios";
const DIFY_API = process.env.DIFY_API_URL;
const DIFY_KEY = process.env.DIFY_API_KEY;
export const difyService = {
    async generate(prompt) {
        if (!DIFY_API || !DIFY_KEY) {
            console.error("Dify API configuration missing");
            throw new Error("Serviço de IA não configurado corretamente.");
        }
        try {
            const response = await axios.post(`${DIFY_API}/chat-messages`, {
                inputs: {},
                query: prompt,
                user: "med-questoes-user",
                response_mode: "streaming", // Alterado para streaming
                conversation_id: "",
            }, {
                headers: {
                    Authorization: `Bearer ${DIFY_KEY}`,
                    "Content-Type": "application/json",
                },
                responseType: "stream", // Necessário para ler o fluxo
            });
            return new Promise((resolve, reject) => {
                let fullAnswer = "";
                response.data.on("data", (chunk) => {
                    const lines = chunk.toString().split("\n");
                    for (const line of lines) {
                        if (line.startsWith("data:")) {
                            try {
                                const data = JSON.parse(line.slice(5));
                                // No modo Agent, o texto vem no campo 'answer'
                                if (data.event === "message" || data.event === "agent_message") {
                                    fullAnswer += data.answer || "";
                                }
                                // Quando o evento for 'message_end', terminamos
                                if (data.event === "message_end") {
                                    resolve(fullAnswer.trim());
                                }
                            }
                            catch (e) {
                                // Ignora linhas que não são JSON válido
                            }
                        }
                    }
                });
                response.data.on("error", (err) => {
                    reject(err);
                });
            });
        }
        catch (error) {
            console.error("Erro ao conectar com Dify Agent");
            throw new Error("Erro na comunicação com o Agente de IA.");
        }
    },
};

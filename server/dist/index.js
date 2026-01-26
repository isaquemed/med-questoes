import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';
import filtersRoutes from "./routes/filters.js";
import questionsRoutes from "./routes/questions.js";
import resolutionsRoutes from "./routes/resolutions.js";
import userAnswersRoutes from "./routes/userAnswers.js";
import authRoutes from "./routes/auth.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/logger.js";
import logger from "./middleware/logger.js";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// LOG DE INICIALIZAÇÃO
console.log("Iniciando servidor...");
console.log("Diretório atual (__dirname):", __dirname);
// O diretório 'dist' está na raiz do projeto, e este arquivo compilado está em server/dist/index.js
const clientBuildPath = path.resolve(__dirname, '../../dist');
console.log("Caminho do build do cliente:", clientBuildPath);
// Middlewares de segurança e utilitários
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:", "https://use.typekit.net"],
            imgSrc: ["'self'", "data:", "blob:", "https:*"],
            connectSrc: ["'self'", "https:*"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());
// Aplicar logging e rate limiting
app.use(requestLogger);
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);
// Rotas da API
app.use("/api/filters", filtersRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/resolutions", resolutionsRoutes);
app.use("/api/user-answers", userAnswersRoutes);
app.use("/api/auth", authRoutes);
// Servir arquivos estáticos
app.use(express.static(clientBuildPath));
// Rota de fallback para o SPA (React)
app.get("*", (req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Erro ao enviar index.html:", err);
            res.status(500).send("Erro ao carregar o site. Verifique se o build do frontend foi concluído.");
        }
    });
});
// Tratamento de erro global
app.use((err, req, res, next) => {
    console.error("ERRO NÃO TRATADO:", err);
    res.status(500).json({ error: "Erro interno do servidor", details: err.message });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`Backend rodando na porta ${PORT}`);
    logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

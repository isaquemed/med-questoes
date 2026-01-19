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

// Middleware de Log de Requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rotas da API
app.use("/api/filters", filtersRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/resolutions", resolutionsRoutes);
app.use("/api/user-answers", userAnswersRoutes);

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("ERRO NÃO TRATADO:", err);
  res.status(500).json({ error: "Erro interno do servidor", details: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

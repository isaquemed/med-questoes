import "dotenv/config"; 
import express from "express";
import cors from "cors";
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';
import filtersRoutes from "./routes/filters.js";
import questionsRoutes from "./routes/questions.js";
import resolutionsRoutes from "./routes/resolutions.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O diretório 'dist' está na raiz do projeto, e este arquivo está em server/dist/index.js
// __dirname é /home/ubuntu/project/server/dist
const clientBuildPath = path.resolve(__dirname, '../../dist');

app.use(express.static(clientBuildPath));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:", "https://use.typekit.net"],
        imgSrc: ["'self'", "data:", "blob:"], // Adicionado 'blob:' para imagens
        connectSrc: ["'self'"], 
      },
    },
  } )
);

app.use(cors());
app.use(express.json());

// Rotas da API
app.use("/api/filters", filtersRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/resolutions", resolutionsRoutes);

// Servir o app do cliente para todas as outras rotas
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});

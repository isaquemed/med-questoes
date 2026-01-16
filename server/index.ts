import "dotenv/config"; 
import express from "express";
import cors from "cors";
import helmet from 'helmet';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

import filtersRoutes from "./routes/filters";
import questionsRoutes from "./routes/questions";
import resolutionsRoutes from "./routes/resolutions";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientBuildPath = path.join(__dirname, '..', 'dist'); 
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Permite carregar recursos da mesma origem
        scriptSrc: ["'self'"], // Permite scripts da mesma origem
        styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"], // Permite estilos da mesma origem, Google Fonts e estilos inline
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:", "https://use.typekit.net"], // << A LINHA MAIS IMPORTANTE PARA O SEU ERRO
        imgSrc: ["'self'", "data:"], // Permite imagens da mesma origem e data URIs
        connectSrc: ["'self'"], // Permite conexões (API calls ) para a mesma origem
      },
    },
  })
);

app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/filters", filtersRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/resolutions", resolutionsRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});

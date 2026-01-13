import "dotenv/config"; 
import express from "express";
import cors from "cors";

import filtersRoutes from "./routes/filters";
import questionsRoutes from "./routes/questions";
import resolutionsRoutes from "./routes/resolutions";

const app = express();

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

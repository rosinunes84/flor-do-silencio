// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import checkoutRoutes from "./routes/checkout.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rotas
app.use("/checkout", checkoutRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

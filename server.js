// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import checkoutRouter from "./routes/checkoutRouter.js"; // ajuste se seu arquivo tiver outro nome

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // importante para ler JSON do body

// Rotas
app.use("/checkout", checkoutRouter);

// Rota raiz apenas para teste
app.get("/", (req, res) => {
  res.send("Servidor rodando!");
});

// Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

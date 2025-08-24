import express from "express";
import dotenv from "dotenv";
import checkoutRouter from "./routes/checkoutRouter.js";

dotenv.config();

const app = express();
app.use(express.json());

// Verifica token
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.error("❌ ERRO: MERCADO_PAGO_ACCESS_TOKEN não encontrado no .env");
  process.exit(1);
}

// Rotas
app.use("/checkout", checkoutRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

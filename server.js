import express from "express";
import dotenv from "dotenv";
import checkoutRouter from "./routes/checkoutRouter.js";

// Carrega variáveis do .env
dotenv.config();

const app = express();
app.use(express.json());

// Rota principal de checkout
app.use("/checkout", checkoutRouter);

// Verificação se a variável foi carregada
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.error("❌ ERRO: MERCADO_PAGO_ACCESS_TOKEN não encontrado no .env");
  process.exit(1); // Força parar o servidor para evitar rodar sem token
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

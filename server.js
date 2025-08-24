// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Importa a função de criar pagamento
const { createPayment } = require("./routes/createPayment");

// Rota para criar pagamento via Mercado Pago
app.post("/createPayment", createPayment);

// Rota de status simples
app.get("/status", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend rodando 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

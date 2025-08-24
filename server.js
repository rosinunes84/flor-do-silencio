require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import routers
const checkoutRouter = require("./routes/checkoutRouter");
const { createPayment } = require("./routes/createPayment");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ==========================
// Status do servidor
// ==========================
app.get("/status", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend rodando 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ==========================
// Cálculo de frete simulado
// ==========================
app.post("/shipping/calculate", async (req, res) => {
  const { zipCode, items } = req.body;

  if (!zipCode || !items?.length) {
    return res.status(400).json({ error: "CEP e itens obrigatórios" });
  }

  try {
    // Simulação de frete fixo
    const simulatedShipping = {
      name: "Sedex Simulado",
      price: 22.90,
      delivery_time: 5, // dias úteis
    };

    res.json([simulatedShipping]);
  } catch (error) {
    console.error("❌ Erro ao calcular frete:", error);
    res.status(500).json({ error: "Erro interno do servidor", details: error.message });
  }
});

// ==========================
// Rotas de checkout
// ==========================
app.use("/checkout", checkoutRouter);

// Rota direta para criar pagamento via backend
app.post("/payment/create", createPayment);

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

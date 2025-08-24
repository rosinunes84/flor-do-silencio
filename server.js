require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mercadopago = require("mercadopago");

const app = express();
const PORT = process.env.PORT || 4000;

// ==========================
// Configuração do Mercado Pago SDK 3.x
// ==========================
mercadopago.access_token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

// ==========================
// Middlewares
// ==========================
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
app.post("/shipping/calculate", (req, res) => {
  const { cepDestino, itens } = req.body;

  if (!cepDestino || !itens?.length) {
    return res.status(400).json({ error: "CEP e itens obrigatórios" });
  }

  // Simulação de frete fixo
  const simulatedShipping = {
    name: "Sedex Simulado",
    price: 22.9,
    delivery_time: 5, // dias úteis
  };

  res.json([simulatedShipping]);
});

// ==========================
// Criação de preferência no Mercado Pago
// ==========================
app.post("/mercadopago/create-preference", async (req, res) => {
  const { items, payer, shipping } = req.body;

  if (!items?.length || !payer) {
    return res.status(400).json({ error: "Itens e dados do comprador obrigatórios" });
  }

  try {
    const preference = {
      items: items.map((item) => ({
        title: item.title || item.name,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: Number(item.unit_price || item.amount || 0),
      })),
      payer: {
        name: payer.name || "Cliente Teste",
        email: payer.email,
      },
      shipments: {
        cost: Number(shipping?.cost || 0),
        mode: "not_specified",
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pedidos`,
        failure: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pedidos`,
        pending: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pedidos`,
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);

    if (!response || !response.body || !response.body.init_point) {
      throw new Error("Não foi possível gerar link de pagamento");
    }

    res.json({ payment_url: response.body.init_point });
  } catch (error) {
    console.error("❌ Erro ao criar pedido:", error);
    res.status(500).json({
      error: "Erro ao criar pedido",
      details: error.message,
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));

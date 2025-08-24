require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mercadopago = require("mercadopago"); // versão nova 3.x

const app = express();
const PORT = process.env.PORT || 4000;

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
  const { zipCode, items } = req.body;

  if (!zipCode || !items?.length) {
    return res.status(400).json({ error: "CEP e itens obrigatórios" });
  }

  const simulatedShipping = {
    name: "Sedex Simulado",
    price: 22.9,
    delivery_time: 5,
  };

  res.json([simulatedShipping]);
});

// ==========================
// Criação de preferência no Mercado Pago
// ==========================
app.post("/mercadopago/create-preference", async (req, res) => {
  try {
    const { items, payer, shipping } = req.body;

    if (!items?.length || !payer) {
      return res.status(400).json({ error: "Itens e dados do comprador obrigatórios" });
    }

    // Criação da preferência usando o SDK 3.x
    const response = await mercadopago.preferences.create({
      items: items.map(item => ({
        title: item.title || item.name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price || 0),
        currency_id: "BRL",
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
    }, {
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
    });

    res.json({ payment_url: response.body.init_point });
  } catch (err) {
    console.error("Erro Mercado Pago:", err);
    res.status(500).json({ error: "Erro ao criar pedido", details: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));

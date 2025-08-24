require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
const PORT = process.env.PORT || 4000;

// ==========================
// Configuração do Mercado Pago
// ==========================
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

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
      price: 22.9,
      delivery_time: 5, // dias úteis
    };

    res.json([simulatedShipping]);
  } catch (error) {
    console.error("❌ Erro ao calcular frete:", error);
    res.status(500).json({ error: "Erro interno do servidor", details: error.message });
  }
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
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: items.map((item) => ({
          title: item.title || item.name,
          quantity: item.quantity,
          currency_id: "BRL",
          unit_price: Number(item.unit_price || item.amount || 0),
        })),
        payer: {
          name: payer.name,
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
      },
    });

    if (!response || !response.id || !response.init_point) {
      throw new Error("Não foi possível gerar link de pagamento");
    }

    res.json({ payment_url: response.init_point });
  } catch (error) {
    console.error("❌ Erro Mercado Pago:", error);
    res.status(500).json({
      error: "Erro ao criar pedido no Mercado Pago",
      details: error.message,
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));

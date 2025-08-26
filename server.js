// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 📌 Rota de checkout com AbacatePay
app.post("/checkout", async (req, res) => {
  try {
    const { customer, items, shipping, paymentMethod, card } = req.body;

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Monta payload para AbacatePay
    const body = {
      payer: {
        name: customer.name,
        email: customer.email,
        cpf_cnpj: customer.cpf,
        phone: customer.phone,
      },
      items: items.map(i => ({
        title: i.name,
        quantity: i.quantity,
        unit_price: i.amount,
      })),
      shipping: {
        name: shipping?.name || "Entrega",
        amount: shipping?.amount || 0,
        estimated_days: shipping?.estimatedDays || 0,
      },
      payment: {
        method: paymentMethod || "pix", // pix ou card
        ...(paymentMethod === "card" && card ? {
          card_number: card.number,
          card_holder: card.holder,
          card_expiration: card.expiration,
          card_cvv: card.cvv,
        } : {}),
      },
      callback_urls: {
        success: `${process.env.FRONTEND_URL}/checkout/success`,
        failure: `${process.env.FRONTEND_URL}/checkout/failure`,
      },
    };

    // Chamada para API AbacatePay
    const response = await fetch("https://api.abacatepay.com/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Erro ao criar checkout" });
    }

    // Retorna link de pagamento / QRCode (PIX)
    res.json({
      payment_url: data.payment_url,
      qr_code: data.qr_code || null,
    });

  } catch (error) {
    console.error("Erro no checkout:", error);
    res.status(500).json({ error: "Erro ao criar pagamento", details: error.message });
  }
});

// 📌 Rota de cálculo de frete
app.post("/shipping/calculate", async (req, res) => {
  try {
    const { cep } = req.body;
    if (!cep) return res.status(400).json({ error: "CEP obrigatório" });

    // Simulação de opções de frete
    const shippingOptions = [
      { id: 1, name: "PAC", price: 20, estimatedDays: 5 },
      { id: 2, name: "SEDEX", price: 40, estimatedDays: 2 },
    ];

    res.json(shippingOptions);
  } catch (error) {
    console.error("Erro no cálculo de frete:", error);
    res.status(500).json({ error: "Não foi possível calcular o frete", details: error.message });
  }
});

// 📌 Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

// routes/checkoutRoutes.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const router = express.Router();

// Criar checkout com AbacatePay
router.post("/", async (req, res) => {
  try {
    const { customer, items, shipping, paymentMethod, card } = req.body;

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Monta o payload para AbacatePay
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

    // Requisição para AbacatePay
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

    // Retorna link de pagamento para o frontend
    res.json({
      payment_url: data.payment_url,
      qr_code: data.qr_code || null, // para PIX
    });

  } catch (error) {
    console.error("Erro AbacatePay:", error);
    res.status(500).json({ error: "Erro interno no servidor", details: error.message });
  }
});

export default router;

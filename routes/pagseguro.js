const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const PAGSEGURO_URL = "https://sandbox.api.pagseguro.com"; // Produção: https://api.pagseguro.com
const PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN;

// Criar checkout (Pix ou Cartão)
router.post("/checkout", async (req, res) => {
  try {
    const { customer, items, shipping, paymentMethod } = req.body;

    // Definição dos métodos permitidos
    let paymentRequest = {
      customer: {
        name: customer.name,
        email: customer.email,
        tax_id: customer.cpf,
        phones: [
          {
            country: "55",
            area: customer.phone.substring(0, 2),
            number: customer.phone.substring(2),
            type: "MOBILE",
          },
        ],
      },
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_amount: item.amount, // valor em centavos
      })),
      shipping: {
        address: {
          street: shipping.street,
          number: shipping.number,
          complement: shipping.complement || "",
          locality: shipping.neighborhood,
          city: shipping.city,
          region_code: shipping.state,
          country: "BRA",
          postal_code: shipping.postalCode,
        },
        amount: shipping.amount, // valor em centavos
      },
    };

    // Escolha entre Pix ou Cartão
    if (paymentMethod === "pix") {
      paymentRequest.charges = [
        {
          amount: {
            value: items.reduce(
              (acc, item) => acc + item.amount * item.quantity,
              0
            ) + shipping.amount,
            currency: "BRL",
          },
          payment_method: {
            type: "PIX",
          },
        },
      ];
    } else if (paymentMethod === "card") {
      const { card } = req.body; // dados do cartão devem vir no body

      paymentRequest.charges = [
        {
          amount: {
            value: items.reduce(
              (acc, item) => acc + item.amount * item.quantity,
              0
            ) + shipping.amount,
            currency: "BRL",
          },
          payment_method: {
            type: "CREDIT_CARD",
            installments: 1,
            capture: true,
            card: {
              number: card.number,
              exp_month: card.exp_month,
              exp_year: card.exp_year,
              security_code: card.security_code,
              holder: {
                name: card.holder_name,
              },
            },
          },
        },
      ];
    } else {
      return res
        .status(400)
        .json({ error: "Método de pagamento inválido (use pix ou card)" });
    }

    const response = await fetch(`${PAGSEGURO_URL}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAGSEGURO_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentRequest),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Erro no checkout:", error);
    res.status(500).json({ error: "Erro ao processar checkout" });
  }
});

module.exports = router;

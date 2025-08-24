const express = require("express");
const mercadopago = require("mercadopago");

const router = express.Router();

// Configura Mercado Pago
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

/**
 * Rota de checkout
 * Recebe: customer, items, shipping
 * Retorna: init_point (link de checkout Mercado Pago)
 */
router.post("/checkout", async (req, res) => {
  try {
    const { customer, items, shipping } = req.body;

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente obrigatórios" });
    }

    const mpItems = items.map(item => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: parseFloat(item.amount),
      currency_id: "BRL",
    }));

    if (shipping?.amount > 0) {
      mpItems.push({
        title: "Frete",
        quantity: 1,
        unit_price: parseFloat(shipping.amount),
        currency_id: "BRL",
      });
    }

    const preference = {
      items: mpItems,
      payer: {
        name: customer.name,
        email: customer.email,
        phone: { area_code: customer.phone.slice(0, 2), number: customer.phone.slice(2) },
        address: {
          zip_code: customer.zipCode.replace(/\D/g, ""),
          street_name: customer.address.split(",")[0] || "Rua Teste",
          street_number: customer.address.split(",")[1]?.trim() || "S/N",
          neighborhood: customer.address.split(",")[1]?.trim() || "Bairro",
          city: customer.city || "Cidade",
          federal_unit: customer.state || "UF",
        },
      },
      back_urls: {
        success: `${process.env.API_URL}/checkout/success`,
        failure: `${process.env.API_URL}/checkout/failure`,
        pending: `${process.env.API_URL}/checkout/pending`,
      },
      auto_return: "approved",
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }],
        installments: 1
      },
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({ init_point: response.body.init_point, id: response.body.id });
  } catch (error) {
    console.error("Erro no checkout Mercado Pago:", error);
    res.status(500).json({ error: "Erro ao processar checkout", details: error.message });
  }
});

module.exports = router;

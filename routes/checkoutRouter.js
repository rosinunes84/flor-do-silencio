const express = require("express");
const mercadopago = require("mercadopago");

mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

const router = express.Router();

// Rota para criar checkout
router.post("/checkout", async (req, res) => {
  try {
    const { customer, items, shipping, paymentMethod } = req.body;

    if (!items?.length || !customer?.name || !customer?.email) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Prepara os itens para a preferência
    const preferenceItems = items.map(item => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: parseFloat(item.amount),
      currency_id: "BRL"
    }));

    // Adiciona frete como item separado, se houver
    if (shipping?.amount && shipping.amount > 0) {
      preferenceItems.push({
        title: "Frete",
        quantity: 1,
        unit_price: parseFloat(shipping.amount),
        currency_id: "BRL"
      });
    }

    // Monta a preferência
    const preference = {
      items: preferenceItems,
      payer: {
        name: customer.name,
        surname: customer.name.split(" ").slice(1).join(" ") || "Cliente",
        email: customer.email,
        identification: {
          type: "CPF",
          number: customer.cpf || "00000000000"
        },
        phone: {
          area_code: customer.phone?.substring(0, 2) || "11",
          number: customer.phone?.substring(2) || "999999999"
        },
        address: {
          zip_code: customer.zipCode || "00000000",
          street_name: customer.address || "Rua Teste",
          street_number: "S/N",
          neighborhood: "Bairro",
          city: customer.city || "Cidade",
          federal_unit: customer.state || "UF"
        }
      },
      back_urls: {
        success: process.env.API_URL + "/success",
        failure: process.env.API_URL + "/failure",
        pending: process.env.API_URL + "/pending"
      },
      auto_return: "approved",
      payment_methods: {
        installments: 1,
        excluded_payment_types: []
      },
      external_reference: `order_${Date.now()}`
    };

    const response = await mercadopago.preferences.create(preference);

    return res.json({ payment_url: response.body.init_point });

  } catch (error) {
    console.error("Erro no checkout Mercado Pago:", error);
    return res.status(500).json({ error: "Erro ao processar checkout", details: error.message });
  }
});

module.exports = router;

const express = require("express");
const mercadopago = require("mercadopago");
const router = express.Router();

// Configura o token de acesso do Mercado Pago (versão 2.x)
mercadopago.configurations = { access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN };

// Rota para criar checkout
router.post("/checkout", async (req, res) => {
  try {
    const { customer, items, shipping, paymentMethod, card } = req.body;

    if (!items?.length || !customer) {
      return res.status(400).json({ error: "Itens e dados do cliente são obrigatórios" });
    }

    // Calcula total
    const totalValue =
      items.reduce((acc, item) => acc + item.amount * item.quantity, 0) +
      (shipping?.amount || 0);

    // Monta preference para Mercado Pago
    const preference = {
      items: items.map((item) => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: item.amount,
      })),
      payer: {
        name: customer.name,
        email: customer.email,
        phone: {
          area_code: customer.phone.substring(0, 2),
          number: customer.phone.substring(2),
        },
        identification: {
          type: "CPF",
          number: customer.cpf,
        },
        address: {
          zip_code: customer.zipCode,
          street_name: customer.address.split(",")[0] || "Rua Teste",
          street_number: customer.address.split(",")[1]?.trim() || "S/N",
          neighborhood: customer.address.split(",")[1]?.trim() || "Bairro",
          city: customer.city || "Cidade",
          federal_unit: customer.state || "UF",
        },
      },
      shipments: {
        cost: shipping?.amount || 0,
        mode: "not_specified",
        receiver_address: {
          zip_code: customer.zipCode,
          street_name: customer.address.split(",")[0] || "Rua Teste",
          street_number: customer.address.split(",")[1]?.trim() || "S/N",
          neighborhood: customer.address.split(",")[1]?.trim() || "Bairro",
          city: customer.city || "Cidade",
          federal_unit: customer.state || "UF",
        },
      },
      payment_methods: {
        installments: 1,
        excluded_payment_types: [],
      },
      external_reference: `${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      back_urls: {
        success: process.env.API_URL + "/success",
        failure: process.env.API_URL + "/failure",
        pending: process.env.API_URL + "/pending",
      },
      auto_return: "approved",
    };

    // Se for cartão de crédito, adiciona detalhes
    if (paymentMethod === "card" && card) {
      preference.payment_methods.excluded_payment_types = [];
      // Observação: Mercado Pago captura cartão via frontend, aqui só geramos a preference
    }

    const response = await mercadopago.preferences.create(preference);

    res.json({ payment_url: response.body.init_point });
  } catch (error) {
    console.error("Erro no checkout Mercado Pago:", error);
    res.status(500).json({ error: "Erro ao processar checkout", details: error.message });
  }
});

module.exports = router;

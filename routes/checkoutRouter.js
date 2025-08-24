const express = require("express");
const router = express.Router();
const mercadopago = require("mercadopago");

// Configura Access Token (funciona nesta versão)
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

router.post("/", async (req, res) => {
  try {
    const { items, payer } = req.body;

    const preference = {
      items: items.map(item => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price)
      })),
      payer: {
        name: payer.name,
        email: payer.email
      },
      back_urls: {
        success: "https://seusite.com/success",
        failure: "https://seusite.com/failure",
        pending: "https://seusite.com/pending"
      },
      auto_return: "approved",
      payment_methods: {
        installments: 1,
        excluded_payment_types: []
      }
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({ init_point: response.response.init_point });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar preferência de pagamento" });
  }
});

module.exports = router;

import express from "express";
import mercadopago from "mercadopago";

const router = express.Router();

// Configuração do Mercado Pago
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.error("⚠️ MERCADO_PAGO_ACCESS_TOKEN não definido no .env!");
  process.exit(1);
}

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

router.post("/", async (req, res) => {
  try {
    const { items, payer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items inválidos ou ausentes" });
    }

    const preference = {
      items: items.map(item => ({
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: "BRL"
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
      notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL || "",
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }]
      }
    };

    const response = await mercadopago.preferences.create(preference);

    return res.json({ init_point: response.response.init_point, id: response.response.id });
  } catch (error) {
    console.error("Erro ao criar preferência Mercado Pago:", error);
    return res.status(500).json({ error: "Erro ao criar preferência de pagamento" });
  }
});

export default router;

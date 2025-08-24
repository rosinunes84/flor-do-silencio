import express from "express";
import mercadopago from "mercadopago";

const router = express.Router();

// Configura o Mercado Pago
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

router.post("/", async (req, res) => {
  try {
    const { items, payer } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Items inválidos" });
    }

    const preference = {
      items: items.map(item => ({
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: "BRL",
      })),
      payer: {
        name: payer.name,
        email: payer.email,
      },
      back_urls: {
        success: "https://seusite.com/success",
        failure: "https://seusite.com/failure",
        pending: "https://seusite.com/pending",
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({ init_point: response.response.init_point, id: response.response.id });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    res.status(500).json({ error: "Erro ao criar preferência Mercado Pago" });
  }
});

export default router;

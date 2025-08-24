import express from "express";
import mercadopago from "mercadopago";

const router = express.Router();

// Configura token do Mercado Pago (versão 2.x)
mercadopago.configurations = { access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN };

// Criar preferência de pagamento
router.post("/create_preference", async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items inválidos" });
    }

    const preference = {
      items: items.map(item => ({
        title: item.title,
        quantity: Number(item.quantity),
        currency_id: "BRL",
        unit_price: Number(item.unit_price),
      })),
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
    res.status(500).json({ error: "Erro ao criar preferência" });
  }
});

export default router;

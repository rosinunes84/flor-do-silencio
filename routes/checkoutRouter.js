import express from "express";
import mercadopago from "mercadopago";

const router = express.Router();

// Configura Mercado Pago com access token do .env
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.error("❌ ERRO: MERCADO_PAGO_ACCESS_TOKEN não definido no .env");
  process.exit(1);
}

mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

// Rota de criação de preferência
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
        unit_price: Number(item.unit_price),
        currency_id: "BRL",
      })),
      back_urls: {
        success: "https://seusite.com/success",
        failure: "https://seusite.com/failure",
        pending: "https://seusite.com/pending",
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);
    return res.json({ init_point: response.body.init_point, id: response.body.id });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    return res.status(500).json({ error: "Erro ao criar preferência" });
  }
});

export default router;

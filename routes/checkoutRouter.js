import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";

const router = express.Router();

// Configuração Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

// Criar preferência de pagamento
router.post("/create_preference", async (req, res) => {
  try {
    const body = {
      items: [
        {
          title: req.body.title,
          quantity: Number(req.body.quantity),
          currency_id: "BRL",
          unit_price: Number(req.body.price),
        },
      ],
      back_urls: {
        success: "http://localhost:3000/success",
        failure: "http://localhost:3000/failure",
        pending: "http://localhost:3000/pending",
      },
      auto_return: "approved",
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    res.json({ id: result.id });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    res.status(500).json({ error: "Erro ao criar preferência" });
  }
});

export default router;

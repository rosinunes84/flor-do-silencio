import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mercadopago from 'mercadopago';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Configura Mercado Pago com o access token do .env
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.error('⚠️ MERCADO_PAGO_ACCESS_TOKEN não está definido no .env!');
  process.exit(1);
}
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

app.post('/create_preference', async (req, res) => {
  try {
    const { items } = req.body;

    // Validação simples dos itens
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items inválidos ou ausentes' });
    }

    // Valida cada item
    for (const item of items) {
      if (
        !item.title ||
        typeof item.title !== 'string' ||
        !item.quantity ||
        isNaN(Number(item.quantity)) ||
        !item.unit_price ||
        isNaN(Number(item.unit_price))
      ) {
        return res.status(400).json({ error: 'Item com dados inválidos' });
      }
    }

    const preference = {
      items: items.map(item => ({
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: 'BRL',
      })),
      back_urls: {
        success: "https://seusite.com/success",
        failure: "https://seusite.com/failure",
        pending: "https://seusite.com/pending",
      },
      auto_return: 'approved', // redireciona automaticamente se aprovado
      notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL || '', // opcional para webhook
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }], // opcional: excluir boleto, por exemplo
      },
    };

    const response = await mercadopago.preferences.create(preference);

    return res.json({
      init_point: response.body.init_point,
      id: response.body.id,
    });
  } catch (error) {
    console.error('Erro ao criar preferência Mercado Pago:', error);
    res.status(500).json({ error: 'Erro ao criar preferência Mercado Pago' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});

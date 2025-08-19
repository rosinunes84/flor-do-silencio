const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createPayment } = require('./routes/createPayment'); // sua rota PagSeguro

const app = express();

// CORS configurado para seu domínio próprio
app.use(cors({
  origin: 'https://www.flordosilencio.com.br', // domínio do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Rota de pagamento via PagSeguro
app.post('/create-payment', createPayment);

// Rota de cálculo de frete
app.post('/shipping/calculate', async (req, res) => {
  try {
    const { cep } = req.body;

    // Lógica de frete simulada (ajuste conforme API real)
    res.json({
      cost: 25,        // valor do frete em reais
      delivery_time: 5 // prazo de entrega em dias
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao calcular frete' });
  }
});

// Exporta como Cloud Function
exports.api = functions.https.onRequest(app);

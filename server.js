require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createPayment } = require('./routes/createPayment'); // rota PagSeguro

const app = express();

// Permitir CORS do frontend (Netlify ou qualquer origem para teste)
app.use(cors({
  origin: '*', // ou 'https://seu-dominio.netlify.app'
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Rota de pagamento via PagSeguro
app.post('/create-payment', createPayment);

// Rota de cálculo de frete
app.post('/shipping/calculate', async (req, res) => {
  try {
    const { cep } = req.body;

    // Mantendo lógica de frete já existente
    res.json({
      cost: 25,       // valor do frete em reais
      delivery_time: 5 // prazo de entrega em dias
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao calcular frete' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

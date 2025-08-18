const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Permitir CORS do Netlify ou de qualquer origem (para teste)
app.use(cors({
  origin: '*', // ou 'https://venerable-starship-ce2e3a.netlify.app'
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Exemplo da rota de pagamento
app.post('/create-payment', async (req, res) => {
  try {
    // Aqui você processa o pagamento com PagSeguro ou outro gateway
    // Exemplo de resposta:
    res.json({
      payment_url: 'https://pagseguro.uol.com.br/checkout/…' // URL do checkout
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar pagamento' });
  }
});

// Rota de cálculo de frete
app.post('/shipping/calculate', async (req, res) => {
  try {
    const { cep } = req.body;
    // lógica de cálculo de frete
    res.json({ cost: 25, delivery_time: 5 });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao calcular frete' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

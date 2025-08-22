const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// ==========================
// Rota de status (saúde do servidor)
// ==========================
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend rodando no Render 🚀',
    timestamp: new Date().toISOString()
  });
});

// ==========================
// Rota de cálculo de frete (MelhorEnvio)
// ==========================
app.post('/shipping/calculate', async (req, res) => {
  const { zipCode, items } = req.body;
  if (!zipCode || !items?.length) {
    return res.status(400).json({ error: 'CEP e itens obrigatórios' });
  }

  try {
    const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`
      },
      body: JSON.stringify({
        from: { postal_code: process.env.SENDER_CEP },
        to: { postal_code: zipCode },
        products: items.map(item => ({
          name: item.name || 'Produto',
          quantity: item.quantity,
          price: item.salePrice || 0,
          weight: item.weight || 1,
          length: item.length || 20,
          height: item.height || 5,
          width: item.width || 15
        }))
      })
    });

    const data = await response.json();
    if (!data || !data[0]) {
      return res.status(500).json({ error: 'Não foi possível calcular o frete' });
    }

    const option = data[0];
    res.json({ shippingCost: option.price, deliveryTime: option.delivery_time });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao calcular o frete' });
  }
});

// ==========================
// Rota de criação de ordem no PagSeguro (corrigida)
// ==========================
app.post('/pagseguro/create_order', async (req, res) => {
  const { items, customer, shipping } = req.body;
  if (!items?.length || !customer) {
    return res.status(400).json({ error: 'Itens e dados do cliente obrigatórios' });
  }

  try {
    const formData = new URLSearchParams();

    // Itens do pedido
    items.forEach((item, i) => {
      formData.append(`itemId${i + 1}`, item.id);
      formData.append(`itemDescription${i + 1}`, item.name);
      formData.append(`itemAmount${i + 1}`, parseFloat(item.amount).toFixed(2));
      formData.append(`itemQuantity${i + 1}`, item.quantity);
    });

    // Frete
    if (shipping && shipping.cost > 0) {
      formData.append(`itemId${items.length + 1}`, 'frete');
      formData.append(`itemDescription${items.length + 1}`, 'Frete');
      formData.append(`itemAmount${items.length + 1}`, parseFloat(shipping.cost).toFixed(2));
      formData.append(`itemQuantity${items.length + 1}`, 1);
      formData.append('shippingType', shipping.type || 3); // Adicionado shippingType
    }

    // Dados do cliente
    formData.append('email', process.env.PAGSEGURO_EMAIL);
    formData.append('token', process.env.PAGSEGURO_TOKEN);
    formData.append('currency', 'BRL');
    formData.append('reference', Date.now().toString());
    formData.append('senderName', customer.name);
    formData.append('senderEmail', customer.email);
    formData.append('senderPhone', customer.phone.replace(/\D/g,''));
    formData.append('shippingAddressStreet', customer.address);
    formData.append('shippingAddressNumber', 'S/N');
    formData.append('shippingAddressDistrict', customer.address.split(',')[1] || 'Bairro');
    formData.append('shippingAddressPostalCode', customer.zipCode.replace(/\D/g,''));
    formData.append('shippingAddressCity', customer.city || 'Cidade');
    formData.append('shippingAddressState', customer.state || 'UF');
    formData.append('shippingAddressCountry', 'BRA');

    // Requisição PagSeguro
    const response = await fetch('https://ws.pagseguro.uol.com.br/v2/checkout', {
      method: 'POST',
      body: formData.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const text = await response.text();
    const checkoutCodeMatch = text.match(/<code>(.*)<\/code>/);
    const checkoutUrl = checkoutCodeMatch
      ? `https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCodeMatch[1]}`
      : null;

    res.json({ payment_url: checkoutUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar pedido no PagSeguro' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

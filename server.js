// server.js
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
// Rota de cálculo de frete (produção com MelhorEnvio)
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
        'Authorization': `Bearer ${process.env.MELHOR_ENVIOS_TOKEN}`
      },
      body: JSON.stringify({
        from: { postal_code: process.env.SENDER_CEP },
        to: { postal_code: zipCode },
        products: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.salePrice,
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

    // Retornar a primeira opção de frete (ou você pode mapear todas)
    const option = data[0];
    res.json({ shippingCost: option.price, deliveryTime: option.delivery_time });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao calcular o frete' });
  }
});

// ==========================
// Rota de criação de ordem no PagSeguro
// ==========================
app.post('/pagseguro/create_order', async (req, res) => {
  const { items, customer, shipping, paymentMethod } = req.body;

  if (!items?.length || !customer) {
    return res.status(400).json({ error: 'Itens e dados do cliente obrigatórios' });
  }

  try {
    const orderResponse = await fetch('https://api.pagseguro.com/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAGSEGURO_TOKEN}`
      },
      body: JSON.stringify({
        customer: {
          name: customer.name,
          email: customer.email,
          tax_id: customer.cpf || '',
          phones: [{
            country: '55',
            area: customer.phone.slice(0, 2),
            number: customer.phone.slice(2),
            type: 'MOBILE'
          }]
        },
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_amount: Math.round(item.salePrice * 100)
        })),
        shipping: {
          address: {
            street: customer.address,
            number: customer.number || 'S/N',
            complement: customer.complement || '',
            locality: customer.district || '',
            city: customer.city,
            region_code: customer.state,
            country: 'BRA',
            postal_code: customer.zipCode
          },
          amount: shipping ? Math.round(shipping.cost * 100) : 0
        }
      })
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error(orderData);
      return res.status(500).json({ error: 'Erro ao criar ordem', details: orderData });
    }

    const chargeResponse = await fetch('https://api.pagseguro.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAGSEGURO_TOKEN}`
      },
      body: JSON.stringify({
        reference_id: orderData.id,
        description: 'Pagamento Flor do Silêncio',
        amount: {
          value: orderData.amount.value,
          currency: 'BRL'
        },
        payment_method: paymentMethod
      })
    });

    const chargeData = await chargeResponse.json();

    if (!chargeResponse.ok) {
      console.error(chargeData);
      return res.status(500).json({ error: 'Erro ao criar cobrança', details: chargeData });
    }

    res.json({
      payment_url: chargeData.payment?.link || chargeData.payment?.url,
      chargeId: chargeData.id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar pagamento no PagSeguro' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

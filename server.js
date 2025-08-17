// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// ==========================
// Rota de cálculo de frete (Melhor Envio)
// ==========================
app.post('/shipping/calculate', async (req, res) => {
  const { zipCode, items } = req.body;

  if (!zipCode || !items || !items.length) {
    return res.status(400).json({ error: 'CEP e itens são obrigatórios' });
  }

  try {
    // Montar peso total, dimensões e valor total do pedido
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0); // em kg
    const totalValue = items.reduce((sum, item) => sum + (item.salePrice || 0) * item.quantity, 0);

    // Chamada à API do Melhor Envio
    const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MELHOR_ENVIOS_TOKEN}`
      },
      body: JSON.stringify({
        from: {
          postal_code: process.env.SENDER_CEP // CEP da loja
        },
        to: {
          postal_code: zipCode
        },
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

    if (!data || !data.results || !data.results[0]) {
      return res.status(500).json({ error: 'Não foi possível calcular o frete' });
    }

    // Retornar o valor do frete e prazo de entrega estimado
    const shippingCost = data.results[0].price;
    const deliveryTime = data.results[0].delivery_time; // em dias

    res.json({ shippingCost, deliveryTime });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao calcular o frete' });
  }
});

// ==========================
// Rota de criação de pagamento PagSeguro
// ==========================
app.post('/pagseguro/create_order', async (req, res) => {
  const { items, customer } = req.body;

  if (!items || !items.length || !customer) {
    return res.status(400).json({ error: 'Itens e dados do cliente são obrigatórios' });
  }

  try {
    const pagSeguroResponse = await fetch('https://ws.pagseguro.uol.com.br/v2/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml; charset=ISO-8859-1'
      },
      body: `<checkout>
        <currency>BRL</currency>
        ${items.map((item, i) => `
          <item>
            <id>${i + 1}</id>
            <description>${item.name}</description>
            <amount>${item.salePrice.toFixed(2)}</amount>
            <quantity>${item.quantity}</quantity>
          </item>
        `).join('')}
        <sender>
          <name>${customer.name}</name>
          <email>${customer.email}</email>
          <phone>
            <areaCode>${customer.phone.slice(0,2)}</areaCode>
            <number>${customer.phone.slice(2)}</number>
          </phone>
        </sender>
        <shipping>
          <address>
            <street>${customer.address}</street>
            <number>${customer.number || 'S/N'}</number>
            <complement>${customer.complement || ''}</complement>
            <district>${customer.district || ''}</district>
            <postalCode>${customer.zipCode}</postalCode>
            <city>${customer.city}</city>
            <state>${customer.state}</state>
            <country>BRA</country>
          </address>
          <type>1</type>
        </shipping>
      </checkout>`,
    });

    const text = await pagSeguroResponse.text();
    res.send(text);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar pedido no PagSeguro' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

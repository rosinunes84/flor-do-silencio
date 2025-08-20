const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Rota cálculo de frete Melhor Envio
app.post('/shipping/calculate', async (req, res) => {
  const { zipCode, items } = req.body;
  if (!zipCode || !items?.length) return res.status(400).json({ error: 'CEP e itens obrigatórios' });

  try {
    const response = await axios.post(
      'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
      {
        from: { postal_code: process.env.SENDER_CEP },
        to: { postal_code: zipCode },
        products: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.salePrice,
          weight: item.weight || 0.3,
          length: item.length || 20,
          height: item.height || 5,
          width: item.width || 15
        }))
      },
      { headers: { Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}` } }
    );

    if (!response.data || !response.data[0]) return res.status(500).json({ error: 'Não foi possível calcular frete' });

    const option = response.data[0];
    res.json({ shippingCost: option.price, deliveryTime: option.delivery_time });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao calcular frete' });
  }
});

// Rota criar ordem no PagSeguro
app.post('/pagseguro/create_order', async (req, res) => {
  try {
    const { items, customer, shipping, orderId } = req.body;

    const email = process.env.PAGSEGURO_EMAIL;
    const token = process.env.PAGSEGURO_TOKEN;

    const itemsPayload = items.map((item, index) => ({
      itemId: item.id,
      itemDescription: item.name,
      itemAmount: (item.salePrice * 100).toFixed(0),
      itemQuantity: item.quantity
    }));

    if (shipping?.cost) {
      itemsPayload.push({
        itemId: `frete-${orderId}`,
        itemDescription: 'Frete',
        itemAmount: (shipping.cost * 100).toFixed(0),
        itemQuantity: 1
      });
    }

    const formData = new URLSearchParams();
    itemsPayload.forEach((item, index) => {
      formData.append(`itemId${index+1}`, item.itemId);
      formData.append(`itemDescription${index+1}`, item.itemDescription);
      formData.append(`itemAmount${index+1}`, item.itemAmount);
      formData.append(`itemQuantity${index+1}`, item.itemQuantity);
    });

    formData.append('email', email);
    formData.append('token', token);
    formData.append('currency', 'BRL');
    formData.append('reference', orderId);
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

    const pagSeguroResp = await axios.post('https://ws.pagseguro.uol.com.br/v2/checkout', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const match = pagSeguroResp.data.match(/<code>(.*)<\/code>/);
    const checkoutUrl = match ? `https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code=${match[1]}` : null;

    res.json({ checkoutUrl });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao criar pagamento PagSeguro' });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

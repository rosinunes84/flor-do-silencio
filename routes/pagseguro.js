const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/pagseguroController');

router.post('/create_payment', createPayment);

module.exports = router;

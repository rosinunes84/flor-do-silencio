const express = require("express");
const { calcPrecoPrazo } = require("correios-brasil");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { cepOrigem, cepDestino, peso, comprimento, altura, largura, diametro, servico } = req.body;

    if (!cepOrigem || !cepDestino || !peso) {
      return res.status(400).json({ error: "cepOrigem, cepDestino e peso são obrigatórios" });
    }

    const response = await calcPrecoPrazo({
      nCdEmpresa: "",
      sDsSenha: "",
      nCdServico: servico || ["04014","04510"], // SEDEX e PAC
      sCepOrigem: cepOrigem.replace(/\D/g,""),
      sCepDestino: cepDestino.replace(/\D/g,""),
      nVlPeso: peso,
      nCdFormato: 1,
      nVlComprimento: comprimento || 20,
      nVlAltura: altura || 5,
      nVlLargura: largura || 15,
      nVlDiametro: diametro || 0,
      sCdMaoPropria: "N",
      nVlValorDeclarado: 0,
      sCdAvisoRecebimento: "N"
    });

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao calcular frete" });
  }
});

module.exports = router;

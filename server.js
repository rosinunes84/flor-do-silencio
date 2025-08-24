import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import checkoutRouter from "./routes/checkoutRouter.js";
import freteRouter from "./routes/freteRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/checkout", checkoutRouter);
app.use("/api/frete", freteRouter);

app.get("/", (req, res) => {
  res.send("Backend da loja virtual rodando!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

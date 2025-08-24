import express from "express";
import dotenv from "dotenv";
import checkoutRouter from "./routes/checkoutRouter.js"; // <-- nome correto
import freteRouter from "./routes/freteRouter.js";

dotenv.config();

const app = express();
app.use(express.json());

// Rotas
app.use("/checkout", checkoutRouter);
app.use("/frete", freteRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

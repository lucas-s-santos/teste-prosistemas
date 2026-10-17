import express from 'express';
import cors from 'cors';
import routes from './routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(routes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

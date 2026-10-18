import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import rotas from './rotas.js';
import { iniciarChat } from './chat.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(rotas);

const servidor = createServer(app);
const io = new Server(servidor, { cors: { origin: '*' } });

// guarda o io para as rotas conseguirem avisar os atendentes
app.set('io', io);
iniciarChat(io);

const porta = process.env.PORT || 3001;
servidor.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta}`);
});

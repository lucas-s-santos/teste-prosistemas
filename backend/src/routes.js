import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { gerarToken } from './auth.js';

const router = Router();

router.get('/health', async (req, res) => {
  await db.query('SELECT 1');
  res.json({ ok: true });
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe email e senha' });
  }

  const [linhas] = await db.query('SELECT * FROM usuario WHERE email = ?', [email]);
  const usuario = linhas[0];

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    return res.status(401).json({ erro: 'Email ou senha inválidos' });
  }

  res.json({
    token: gerarToken(usuario),
    usuario: { id: usuario.id, nome: usuario.nome },
  });
});

export default router;

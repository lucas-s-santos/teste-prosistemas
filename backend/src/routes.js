import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { gerarToken, exigirLogin } from './auth.js';

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

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) { // mesma mensagem para email e senha errados, para não revelar quais emails existem
    return res.status(401).json({ erro: 'Email ou senha inválidos' });
  }

  res.json({
    token: gerarToken(usuario),
    usuario: { id: usuario.id, nome: usuario.nome },
  });
});

async function salvarCliente({ nome, email, celular }) { // reaproveita o cliente pelo email, assim o histórico dele fica num cadastro só
  const [linhas] = await db.query('SELECT id FROM cliente WHERE email = ?', [email]);

  if (linhas.length > 0) {
    const id = linhas[0].id;
    await db.query('UPDATE cliente SET nome = ?, celular = ? WHERE id = ?', [nome, celular, id]);
    return id;
  }

  const [resultado] = await db.query(
    'INSERT INTO cliente (nome, email, celular) VALUES (?, ?, ?)',
    [nome, email, celular]
  );
  return resultado.insertId;
}

router.post('/atendimentos', async (req, res) => {
  const { nome, email, celular, assunto } = req.body; 

  if (!nome || !email || !celular || !assunto) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  const clienteId = await salvarCliente({ nome, email, celular });

  const [resultado] = await db.query(
    'INSERT INTO atendimento (cliente_id, assunto) VALUES (?, ?)',
    [clienteId, assunto]
  );

  res.status(201).json({ atendimentoId: resultado.insertId });
});


router.get('/atendimentos', exigirLogin, async (req, res) => {
  const [atendimentos] = await db.query(
    `SELECT a.id, a.assunto, a.status, a.criado_em, c.nome AS cliente
     FROM atendimento a
     JOIN cliente c ON c.id = a.cliente_id
     WHERE a.usuario_id = ?
     ORDER BY a.id DESC`,
    [req.usuario.id]
  );

  res.json(atendimentos);
});

router.get('/atendimentos/:id', async (req, res) => {
  const [linhas] = await db.query(
    `SELECT a.id, a.assunto, a.status, c.nome AS cliente, u.nome AS atendente
     FROM atendimento a
     JOIN cliente c ON c.id = a.cliente_id
     LEFT JOIN usuario u ON u.id = a.usuario_id
     WHERE a.id = ?`,
    [req.params.id]
  );

  if (linhas.length === 0) {
    return res.status(404).json({ erro: 'Atendimento não encontrado' });
  }

  const [mensagens] = await db.query(
    'SELECT * FROM mensagem WHERE atendimento_id = ? ORDER BY id',
    [req.params.id]
  );

  res.json({ ...linhas[0], mensagens });
});


export default router;

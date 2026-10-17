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

  const [linhas] = await db.query('SELECT * FROM usuario WHERE email = ?', [email]); //PROCURA O USUÁRIO PELO EMAIL
  const usuario = linhas[0];

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) { 
    return res.status(401).json({ erro: 'Email ou senha inválidos' });
  }

  res.json({
    token: gerarToken(usuario),
    usuario: { id: usuario.id, nome: usuario.nome },
  });
});

async function salvarCliente({ nome, email, celular }) {
  const [linhas] = await db.query('SELECT id FROM cliente WHERE email = ?', [email]); //PROCURA SE O CLIENTE JÁ EXISTE PELO EMAIL

  if (linhas.length > 0) {
    const id = linhas[0].id;
    await db.query('UPDATE cliente SET nome = ?, celular = ? WHERE id = ?', [nome, celular, id]);
    return id;
  }

  const [resultado] = await db.query( //SE NÃO EXISTIR, INSERE UM NOVO CLIENTE
    'INSERT INTO cliente (nome, email, celular) VALUES (?, ?, ?)',
    [nome, email, celular]
  );
  return resultado.insertId;
}

router.post('/atendimentos', async (req, res) => {
  const { nome, email, celular, assunto } = req.body; 

  if (!nome || !email || !celular || !assunto) {
    return res.status(400).json({ erro: 'Preencha todos os campos' }); //VERIFICA SE TODOS OS CAMPOS FORAM PREENCHIDOS, SE FALTAR ELE RETORNA UM ERRO 400
  }

  const clienteId = await salvarCliente({ nome, email, celular });

  const [resultado] = await db.query(
    'INSERT INTO atendimento (cliente_id, assunto) VALUES (?, ?)', //INSERE UM NOVO ATENDIMENTO NA TABELA DE ATENDIMENTOS
    [clienteId, assunto]
  );

  res.status(201).json({ atendimentoId: resultado.insertId }); //RETORNA O ID DO ATENDIMENTO CRIADO
});


export default router;

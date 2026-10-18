import bcrypt from 'bcryptjs';
import db from './conexaoBanco.js';

const usuarios = [
  { nome: 'Ana Souza', email: 'ana@teste.com' },
  { nome: 'Bruno Lima', email: 'bruno@teste.com' },
];

for (const usuario of usuarios) {
  const senha = await bcrypt.hash('123456', 10);

  await db.query(
    'INSERT IGNORE INTO usuario (nome, email, senha) VALUES (?, ?, ?)',
    [usuario.nome, usuario.email, senha]
  );
}

console.log('Usuários cadastrados. Senha de todos: 123456');
await db.end();

import db from './conexaoBanco.js';

// ids dos atendentes conectados no chat agora
export const atendentesOnline = new Set();

// entre os atendentes online, escolhe o que tem menos atendimentos em andamento
export async function escolherAtendente() {
  if (atendentesOnline.size === 0) {
    return null;
  }

  const ids = [...atendentesOnline];

  const [linhas] = await db.query(
    `SELECT u.id, COUNT(a.id) AS total
     FROM usuario u
     LEFT JOIN atendimento a ON a.usuario_id = u.id AND a.status = 'em_andamento'
     WHERE u.id IN (?)
     GROUP BY u.id
     ORDER BY total
     LIMIT 1`,
    [ids]
  );

  return linhas[0].id;
}

import db from './conexaoBanco.js';
import { verificarToken } from './autenticacao.js';
import { atendentesOnline } from './atendentesOnline.js';

export function iniciarChat(io) {
  io.on('connection', (socket) => {
    const { token, atendimentoId } = socket.handshake.auth;

    if (token) {
      conectarAtendente(socket, token);
    } else if (atendimentoId) {
      // o cliente entra na sala do atendimento dele
      socket.join(`atendimento:${atendimentoId}`);
    }

    // o atendente entra na sala quando abre uma conversa
    socket.on('entrar-atendimento', (id) => {
      if (socket.data.usuario) {
        socket.join(`atendimento:${id}`);
      }
    });

    socket.on('enviar-mensagem', (dados) => enviarMensagem(io, socket, dados));
  });
}

async function conectarAtendente(socket, token) {
  try {
    socket.data.usuario = verificarToken(token);
  } catch {
    socket.disconnect();
    return;
  }

  const usuarioId = socket.data.usuario.id;

  socket.join(`usuario:${usuarioId}`);
  atendentesOnline.add(usuarioId);

  socket.on('disconnect', () => {
    atendentesOnline.delete(usuarioId);
  });

  // quem estava aguardando vai para o atendente que acabou de entrar
  await db.query(
    "UPDATE atendimento SET usuario_id = ?, status = 'em_andamento' WHERE status = 'aguardando'",
    [usuarioId]
  );

  socket.emit('novo-atendimento');
}

async function enviarMensagem(io, socket, { atendimentoId, conteudo }) {
  const texto = conteudo?.trim();

  if (!texto) {
    return;
  }

  // com login é o atendente, sem login é o cliente
  const remetente = socket.data.usuario ? 'usuario' : 'cliente';

  try {
    const [resultado] = await db.query(
      'INSERT INTO mensagem (atendimento_id, remetente, conteudo) VALUES (?, ?, ?)',
      [atendimentoId, remetente, texto]
    );

    io.to(`atendimento:${atendimentoId}`).emit('nova-mensagem', {
      id: resultado.insertId,
      atendimento_id: atendimentoId,
      remetente,
      conteudo: texto,
      criado_em: new Date(),
    });
  } catch (erro) {
    console.error('Erro ao salvar mensagem:', erro);
  }
}

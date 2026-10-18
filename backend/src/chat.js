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
        // avisa o cliente que o atendente abriu a conversa
        socket.to(`atendimento:${id}`).emit('atendente-entrou', socket.data.usuario.nome);
      }
    });

    socket.on('enviar-mensagem', (dados) => enviarMensagem(io, socket, dados));
    socket.on('finalizar-atendimento', (id) => finalizarAtendimento(io, socket, id));
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

async function finalizarAtendimento(io, socket, atendimentoId) {
  if (!socket.data.usuario) {
    return;
  }

  try {
    // o "usuario_id = ?" garante que só o atendente responsável consegue finalizar
    const [resultado] = await db.query(
      "UPDATE atendimento SET status = 'finalizado' WHERE id = ? AND usuario_id = ?",
      [atendimentoId, socket.data.usuario.id]
    );

    if (resultado.affectedRows > 0) {
      io.to(`atendimento:${atendimentoId}`).emit('atendimento-finalizado', atendimentoId);
    }
  } catch (erro) {
    console.error('Erro ao finalizar atendimento:', erro);
  }
}

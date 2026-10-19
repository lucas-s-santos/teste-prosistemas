import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API } from '../api';
import Chat from './Chat';

export default function PainelAtendente({ token, usuario }) {
  // cria a conexão uma vez só, sem conectar ainda
  const [socket] = useState(() => io(API, { auth: { token }, autoConnect: false }));
  const [atendimentos, setAtendimentos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [comMensagemNova, setComMensagemNova] = useState([]);

  // conecta ao abrir o painel (o atendente fica online) e desconecta ao sair
  useEffect(() => {
    socket.connect();
    return () => socket.disconnect();
  }, [socket]);

  // carrega a lista agora e de novo sempre que chegar ou finalizar um atendimento
  useEffect(() => {
    function carregarAtendimentos() {
      fetch(`${API}/atendimentos`, { headers: { Authorization: `Bearer ${token}` } })
        .then((resposta) => resposta.json())
        .then((lista) => {
          setAtendimentos(lista);
          // entra na sala de todos os atendimentos para receber as mensagens de todos
          lista.forEach((atendimento) => socket.emit('entrar-atendimento', atendimento.id));
        });
    }

    carregarAtendimentos();
    socket.on('novo-atendimento', carregarAtendimentos);
    socket.on('atendimento-finalizado', carregarAtendimentos);

    return () => {
      socket.off('novo-atendimento', carregarAtendimentos);
      socket.off('atendimento-finalizado', carregarAtendimentos);
    };
  }, [socket, token]);

  // marca as conversas que receberam mensagem do cliente e não estão abertas
  useEffect(() => {
    function marcarMensagemNova(mensagem) {
      if (mensagem.remetente === 'cliente' && mensagem.atendimento_id !== selecionado) {
        setComMensagemNova((ids) => [...ids, mensagem.atendimento_id]);
      }
    }

    socket.on('nova-mensagem', marcarMensagemNova);
    return () => socket.off('nova-mensagem', marcarMensagemNova);
  }, [socket, selecionado]);

  function abrirAtendimento(id) {
    setSelecionado(id);
    setComMensagemNova((ids) => ids.filter((outroId) => outroId !== id));
  }

  return (
    <div className="painel">
      <aside className="lista">
        <h2>Olá, {usuario.nome}</h2>
        {atendimentos.length === 0 && <p>Nenhum atendimento ainda.</p>}
        {atendimentos.map((atendimento) => (
          <button
            key={atendimento.id}
            className={atendimento.id === selecionado ? 'item ativo' : 'item'}
            onClick={() => abrirAtendimento(atendimento.id)}
          >
            <strong>{atendimento.cliente}</strong>
            <span>{atendimento.assunto}</span>
            {atendimento.status === 'finalizado' && <small>Finalizado</small>}
            {comMensagemNova.includes(atendimento.id) && (
              <small className="mensagem-nova">Mensagem nova</small>
            )}
          </button>
        ))}
      </aside>

      {selecionado ? (
        <Chat key={selecionado} socket={socket} atendimentoId={selecionado} souAtendente />
      ) : (
        <p className="vazio">Selecione um atendimento</p>
      )}
    </div>
  );
}

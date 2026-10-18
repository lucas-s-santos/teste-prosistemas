import { useEffect, useRef, useState } from 'react';
import { API } from '../api';

export default function Chat({ socket, atendimentoId, souAtendente }) {
  const [atendimento, setAtendimento] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const fimDaLista = useRef(null);

  // o histórico vem pela API quando o chat abre
  useEffect(() => {
    fetch(`${API}/atendimentos/${atendimentoId}`)
      .then((resposta) => resposta.json())
      .then((dados) => {
        setAtendimento(dados);
        setMensagens(dados.mensagens);
      });
  }, [atendimentoId]);

  // as mensagens novas e os avisos do atendimento chegam pelo socket
  useEffect(() => {
    function receberMensagem(mensagem) {
      if (mensagem.atendimento_id === atendimentoId) {
        setMensagens((anteriores) => [...anteriores, mensagem]);
      }
    }

    function atendenteEntrou(nome) {
      setAtendimento((anterior) => ({ ...anterior, atendente: nome }));
    }

    function atendimentoFinalizado(id) {
      if (id === atendimentoId) {
        setAtendimento((anterior) => ({ ...anterior, status: 'finalizado' }));
      }
    }

    socket.on('nova-mensagem', receberMensagem);
    socket.on('atendente-entrou', atendenteEntrou);
    socket.on('atendimento-finalizado', atendimentoFinalizado);

    return () => {
      socket.off('nova-mensagem', receberMensagem);
      socket.off('atendente-entrou', atendenteEntrou);
      socket.off('atendimento-finalizado', atendimentoFinalizado);
    };
  }, [socket, atendimentoId]);

  // rola até a última mensagem
  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  function enviarMensagem(e) {
    e.preventDefault();
    socket.emit('enviar-mensagem', { atendimentoId, conteudo: texto });
    setTexto('');
  }

  function finalizarAtendimento() {
    if (window.confirm('Deseja finalizar este atendimento?')) {
      socket.emit('finalizar-atendimento', atendimentoId);
    }
  }

  function subtitulo() {
    if (!atendimento) return '';
    if (souAtendente) return `Cliente: ${atendimento.cliente}`;
    if (atendimento.atendente) return `Você está falando com ${atendimento.atendente}`;
    return 'Aguardando um atendente ficar online...';
  }

  const meuRemetente = souAtendente ? 'usuario' : 'cliente';
  const finalizado = atendimento?.status === 'finalizado';

  return (
    <div className="chat">
      <div className="chat-topo">
        <div>
          <h2>{atendimento?.assunto}</h2>
          <p>{subtitulo()}</p>
        </div>
        {souAtendente && !finalizado && (
          <button className="botao-finalizar" onClick={finalizarAtendimento}>
            Finalizar
          </button>
        )}
      </div>

      <div className="mensagens">
        {mensagens.map((mensagem) => (
          <div
            key={mensagem.id}
            className={mensagem.remetente === meuRemetente ? 'mensagem minha' : 'mensagem'}
          >
            {mensagem.conteudo}
          </div>
        ))}
        <div ref={fimDaLista} />
      </div>

      {finalizado ? (
        <div className="chat-finalizado">
          <p>Atendimento finalizado.</p>
          {!souAtendente && (
            <button onClick={() => window.location.reload()}>Abrir novo atendimento</button>
          )}
        </div>
      ) : (
        <form className="chat-envio" onSubmit={enviarMensagem}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite sua mensagem"
          />
          <button type="submit">Enviar</button>
        </form>
      )}
    </div>
  );
}

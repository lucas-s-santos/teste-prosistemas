import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API } from '../api';
import Chat from './Chat';

export default function PainelAtendente({ token, usuario }) {
    const [socket] = useState(() => io(API, { auth: { token }, autoConnect: false }));
    const [atendimentos, setAtendimentos] = useState([]);
    const [selecionado, setSelecionado] = useState(null);

    useEffect(() => {
        socket.connect();
        return () => socket.disconnect();
    }, [socket]);

    // carrega a lista agora e de novo sempre que chegar um atendimento
    useEffect(() => {
        if (!socket) return;

        function carregarAtendimentos() {
            fetch(`${API}/atendimentos`, { headers: { Authorization: `Bearer ${token}` } })
                .then((resposta) => resposta.json())
                .then(setAtendimentos);
        }

        carregarAtendimentos();
        socket.on('novo-atendimento', carregarAtendimentos);
        socket.on('atendimento-finalizado', carregarAtendimentos);

        return () => {
            socket.off('novo-atendimento', carregarAtendimentos);
            socket.off('atendimento-finalizado', carregarAtendimentos);
        };
    }, [socket, token]);

    function abrirAtendimento(id) {
        socket.emit('entrar-atendimento', id);
        setSelecionado(id);
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

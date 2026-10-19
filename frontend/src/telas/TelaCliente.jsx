import { useState } from 'react';
import { io } from 'socket.io-client';
import { API } from '../api';
import Chat from '../componentes/Chat';

function atendimentoSalvo() {
  return Number(sessionStorage.getItem('atendimentoId')) || null;
}

export default function TelaCliente() {
  const [form, setForm] = useState({ nome: '', email: '', celular: '', assunto: '' });
  // se a página for recarregada, volta para o mesmo atendimento
  const [atendimentoId, setAtendimentoId] = useState(atendimentoSalvo);
  const [socket, setSocket] = useState(() =>
    atendimentoId ? io(API, { auth: { atendimentoId } }) : null
  );
  const [erro, setErro] = useState('');

  function alterarCampo(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function iniciarAtendimento(e) {
    e.preventDefault();
    setErro('');

    const resposta = await fetch(`${API}/atendimentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro);
      return;
    }

    sessionStorage.setItem('atendimentoId', dados.atendimentoId);
    setSocket(io(API, { auth: { atendimentoId: dados.atendimentoId } }));
    setAtendimentoId(dados.atendimentoId);
  }

  if (atendimentoId) {
    return <Chat socket={socket} atendimentoId={atendimentoId} souAtendente={false} />;
  }

  return (
    <form className="cartao" onSubmit={iniciarAtendimento}>
      <h1>Fale com a gente</h1>
      <input name="nome" placeholder="Nome" value={form.nome} onChange={alterarCampo} required />
      <input name="email" type="email" placeholder="E-mail" value={form.email} onChange={alterarCampo} required />
      <input name="celular" placeholder="Celular" value={form.celular} onChange={alterarCampo} required />
      <input name="assunto" placeholder="Assunto" value={form.assunto} onChange={alterarCampo} required />
      {erro && <p className="erro">{erro}</p>}
      <button type="submit">Iniciar atendimento</button>
      <a href="/atendente">Sou atendente</a>
    </form>
  );
}

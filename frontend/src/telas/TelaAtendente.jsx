import { useState } from 'react';
import { API } from '../api';
import PainelAtendente from '../componentes/PainelAtendente';

export default function TelaAtendente() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [login, setLogin] = useState(null);
  const [erro, setErro] = useState('');

  async function entrar(e) {
    e.preventDefault();
    setErro('');

    const resposta = await fetch(`${API}/login`, { // envia email e senha para o login do atendente
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro);
      return;
    }

    setLogin(dados);
  }

  if (login) {
    return <PainelAtendente token={login.token} usuario={login.usuario} />;
  }

  return (
    <form className="cartao" onSubmit={entrar}>
      <h1>Área do atendente</h1>
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
      {erro && <p className="erro">{erro}</p>}
      <button type="submit">Entrar</button>
    </form>
  );
}

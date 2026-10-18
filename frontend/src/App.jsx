import TelaCliente from './telas/TelaCliente';
import TelaAtendente from './telas/TelaAtendente';

export default function App() {
  if (window.location.pathname === '/atendente') {
    return <TelaAtendente />;
  }

  return <TelaCliente />;
}

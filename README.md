# Chat de Atendimento - Teste Prosistemas

Chat de atendimento em tempo real. O cliente preenche um formulário com nome, e-mail, celular e assunto, e o atendimento vai para um atendente que esteja online. Os dois conversam pelo chat sem precisar atualizar a página.

Usei React no front, Node com Express no back, Socket.IO para o tempo real e MySQL como banco, rodando no Docker.

## Como rodar

Precisa ter o Node (versão 20.6 ou maior) e o Docker instalados.

Primeiro suba o banco, na raiz do projeto:

```
docker compose up -d
```

Na primeira vez ele já cria as tabelas usando o `database/banco.sql`. Espere uns 20 segundos antes de continuar, porque o MySQL demora um pouco para ficar pronto. Se tiver outro MySQL usando a porta 3306, precisa parar ele antes.

Depois o backend:

```
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

O `npm run seed` cadastra dois atendentes para teste.

E o frontend, em outro terminal:

```
cd frontend
npm install
npm run dev
```

## Como testar

O cliente abre em http://localhost:5173 e o atendente em http://localhost:5173/atendente. Também tem um link "Sou atendente" na tela do cliente.

Atendentes de teste (a senha dos dois é 123456):

- ana@teste.com
- bruno@teste.com

O jeito mais fácil de testar é deixar uma janela do atendente e uma do cliente lado a lado. Entre como Ana, abra um atendimento pelo formulário e ele aparece na lista dela na hora. Se você entrar com o Bruno em outra aba e abrir mais um atendimento, ele vai para o Bruno, porque o sistema manda para quem tem menos atendimentos em andamento.

## Como funciona

Quando o atendente faz login e entra no painel, ele conecta no Socket.IO e passa a contar como online. Quando o cliente envia o formulário, o backend procura o cliente pelo e-mail (se já existir, reaproveita o cadastro), cria o atendimento e escolhe, entre os atendentes online, o que tem menos atendimentos em andamento. Se ninguém estiver online, o atendimento fica aguardando e vai para o primeiro atendente que entrar.

Cada atendimento é uma sala no Socket.IO. O cliente entra na sala do atendimento dele, e o atendente entra nas salas de todos os atendimentos que são dele. Assim ele recebe as mensagens de todas as conversas, e a lista mostra quando chega mensagem nova numa conversa que não está aberta. Toda mensagem é salva no banco e depois enviada para a sala. O histórico vem pela API quando a conversa é aberta.


O atendente também pode finalizar o atendimento, e o cliente é avisado na hora.

## Organização

- `database/banco.sql`: script das tabelas (usuario, cliente, atendimento e mensagem)
- `backend/src/servidor.js`: inicia o Express e o Socket.IO
- `backend/src/rotas.js`: rotas da API (login, abrir atendimento, listar e histórico)
- `backend/src/chat.js`: tudo do tempo real (salas, mensagens e finalizar)
- `backend/src/atendentesOnline.js`: lista de quem está online e escolha do atendente
- `backend/src/autenticacao.js`: token do login
- `backend/src/conexaoBanco.js`: conexão com o MySQL
- `backend/src/criarAtendentes.js`: cadastro dos atendentes de teste
- `frontend/src/telas`: tela do cliente e login do atendente
- `frontend/src/componentes`: o chat (o mesmo para os dois lados) e o painel do atendente

## Algumas decisões

Não usei ORM. As consultas estão em SQL puro com o mysql2, que é com o que eu tenho mais costume. Os valores sempre vão como parâmetro (`?`) para evitar SQL injection.

A lista de atendentes online fica na memória do servidor, e não no banco. Online é quem está conectado agora. Se isso ficasse salvo no banco e o servidor caísse, ia ficar gente marcada como online sem estar.

Se o mesmo cliente abrir outro atendimento, eu reaproveito o cadastro pelo e-mail, que é único no banco, em vez de criar outro.

Quem decide se a mensagem é do cliente ou do atendente é o servidor, pela conexão (com token é atendente), e não o front.

As senhas são salvas com bcrypt e o login usa JWT.

O id do atendimento do cliente fica no `sessionStorage`. Se ele recarregar a página, a conversa continua. Usei o `sessionStorage` em vez do `localStorage` porque ele é separado por aba, então dá para testar dois clientes no mesmo navegador.

## O que eu melhoraria

- O cliente não tem login, então quem souber o número de um atendimento consegue abrir a conversa. Daria para gerar um código aleatório para cada atendimento.
- Se o atendente abrir duas abas e fechar uma, ele sai da lista de online.
- Os atendimentos de um atendente que saiu não são redistribuídos.
- Não tem testes automatizados.

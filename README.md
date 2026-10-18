# teste-prosistemas


Arquivo	                    O que tem dentro
database/banco.sql	        criação das tabelas
src/servidor.js	            liga o Express e o Socket.IO na porta 3001
src/conexaoBanco.js	        conexão com o MySQL
src/autenticacao.js	        gerar e conferir o token do login
src/rotas.js	            API: login, abrir atendimento, listar e histórico
src/chat.js	                tempo real: conexões, salas e mensagens
src/atendentesOnline.js	    quem está online e qual atendente escolher
src/criarAtendentes.js	    cadastra os atendentes de teste
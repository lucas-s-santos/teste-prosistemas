CREATE DATABASE IF NOT EXISTS chat_atendimento;
USE chat_atendimento;

CREATE TABLE usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL
);

CREATE TABLE cliente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  celular VARCHAR(20) NOT NULL
);

CREATE TABLE atendimento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  usuario_id INT NULL,
  assunto VARCHAR(200) NOT NULL,
  status ENUM('aguardando', 'em_andamento', 'finalizado') NOT NULL DEFAULT 'aguardando',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES cliente(id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE TABLE mensagem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  atendimento_id INT NOT NULL,
  remetente ENUM('cliente', 'usuario') NOT NULL,
  conteudo TEXT NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (atendimento_id) REFERENCES atendimento(id)
);

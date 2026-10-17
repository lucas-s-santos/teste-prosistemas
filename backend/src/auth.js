import jwt from 'jsonwebtoken';

export function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, nome: usuario.nome }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
}

export function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

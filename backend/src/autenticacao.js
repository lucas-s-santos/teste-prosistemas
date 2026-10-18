import jwt from 'jsonwebtoken';

export function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, nome: usuario.nome }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
}

export function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function exigirLogin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    req.usuario = verificarToken(token);
    next();
  } catch {
    res.status(401).json({ erro: 'Faça login novamente' });
  }
}

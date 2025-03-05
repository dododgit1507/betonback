// Middleware para verificar el token JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403); // El token no es válido
        }
  
        req.user = user; // Guardamos los datos del usuario en la solicitud
        next();
      });
    } else {
      res.sendStatus(401); // No se envió token
    }
  };
  
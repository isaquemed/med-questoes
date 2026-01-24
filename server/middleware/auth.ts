import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authenticateToken(
  req: any,
  res: any,
  next: any
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "sua-chave-secreta-aqui",
    (err: any, user: any) => {
      if (err) {
        console.error("Erro ao verificar token:", err);
        return res.status(403).json({ error: "Token inválido ou expirado" });
      }
      req.user = user;
      next();
    }
  );
}
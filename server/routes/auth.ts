import express from "express";
import pool from "../db/index.js";
import { db } from "../db/index.js";
import { usuarios } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Registro de usuário
router.post("/register", async (req: any, res: any) => {
  try {
    const { nome, email, senha } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir novo usuário
    const [newUser]: any = await db.insert(usuarios).values({
      email,
      senha: hashedPassword,
      nome,
      dataCadastro: new Date(),
    });

    const token = jwt.sign(
      { id: newUser.insertId, email },
      process.env.JWT_SECRET || "sua-chave-secreta",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.insertId,
        nome,
        email,
      },
    });
  } catch (error: any) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: error.message });
  }
});

// Login de usuário
router.post("/login", async (req: any, res: any) => {
  try {
    const { email, senha } = req.body;

    // Buscar usuário
    const [user] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "sua-chave-secreta",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
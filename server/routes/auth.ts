import express from "express";
import db from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Registro de usuário
router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verificar se o usuário já existe
    const [existingUsers] = await pool.execute(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );

    if ((existingUsers as any[]).length > 0) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir novo usuário
    const [result] = await pool.execute(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, hashedPassword]
    );

    // Gerar token JWT
    const token = jwt.sign(
      { id: (result as any).insertId, email },
      process.env.JWT_SECRET || "sua-chave-secreta-aqui",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: (result as any).insertId,
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
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Buscar usuário
    const [users] = await pool.execute(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if ((users as any[]).length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = (users as any[])[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "sua-chave-secreta-aqui",
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
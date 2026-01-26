import { Router } from "express";
import { db } from "../db/index.js";
import { usuarios } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

// Registro de usuário
router.post("/register", async (req: any, res: any) => {
  try {
    const { nome, usuario, senha } = req.body;

    if (!nome || !usuario || !senha) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    // Verificar se o usuário já existe
    const existingUser = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.usuario, usuario))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Nome de usuário já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir novo usuário
    const [result]: any = await db.insert(usuarios).values({
      usuario,
      senha: hashedPassword,
      nome,
    });

    const userId = result.insertId;

    const token = jwt.sign(
      { id: userId, usuario },
      process.env.JWT_SECRET || "sua-chave-secreta",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        nome,
        usuario,
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
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    // Buscar usuário
    const [user] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.usuario, usuario))
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
      { id: user.id, usuario: user.usuario },
      process.env.JWT_SECRET || "sua-chave-secreta",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
      },
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

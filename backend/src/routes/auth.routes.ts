import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";

const router = Router();

// POST /api/auth/register — register a new user
router.post("/register", register);

// POST /api/auth/login — login and receive JWT token
router.post("/login", login);

export default router;
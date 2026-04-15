import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.js';

const router = Router();

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/signup', async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const existing = await UserModel.findOne({ email: parsed.data.email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'Email already exists' });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await UserModel.create({ email: parsed.data.email, passwordHash });
  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

router.post('/login', async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

export default router;

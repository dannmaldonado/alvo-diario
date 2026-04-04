import express from 'express';
import { signup, login, getCurrentUser, updateUser } from '../services/auth.js';
import authMiddleware from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema, updateUserSchema } from '../schemas/auth.schema.js';

const router = express.Router();

router.post('/signup', validate(signupSchema), async (req, res) => {
  try {
    const { email, password, nome } = req.body;
    const result = await signup(email, password, nome);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.patch('/me', authMiddleware, validate(updateUserSchema), async (req, res) => {
  try {
    const user = await updateUser(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

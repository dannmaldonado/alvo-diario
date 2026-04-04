import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

export const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};

export const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required. Server cannot sign tokens without it.');
  }
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const signup = async (email, password, nome) => {
  const connection = await pool.getConnection();

  try {
    // Check if user exists
    const [rows] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      throw new Error('Email already registered');
    }

    const userId = uuidv4();
    const hashedPassword = await hashPassword(password);

    await connection.query(
      'INSERT INTO users (id, email, password, nome) VALUES (?, ?, ?, ?)',
      [userId, email, hashedPassword, nome]
    );

    const token = generateToken(userId);

    return {
      user: {
        id: userId,
        email,
        nome
      },
      token
    };
  } finally {
    connection.release();
  }
};

export const login = async (email, password) => {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = rows[0];
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user.id);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  } finally {
    connection.release();
  }
};

export const getCurrentUser = async (userId) => {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      'SELECT id, email, nome, nivel_atual, pontos_totais, streak_atual, meta_diaria_horas, data_criacao, created, updated FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      throw new Error('User not found');
    }

    return rows[0];
  } finally {
    connection.release();
  }
};

export const updateUser = async (userId, updates) => {
  const connection = await pool.getConnection();

  try {
    const allowedFields = ['nome', 'meta_diaria_horas'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await connection.query(query, values);

    return getCurrentUser(userId);
  } finally {
    connection.release();
  }
};

export default {
  signup,
  login,
  getCurrentUser,
  updateUser,
  generateToken,
  hashPassword,
  comparePassword
};

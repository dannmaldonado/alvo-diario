-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nome VARCHAR(255),
  nivel_atual INT DEFAULT 1,
  pontos_totais INT DEFAULT 0,
  streak_atual INT DEFAULT 0,
  meta_diaria_horas DECIMAL(4,2) DEFAULT 4.00,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Create cronogramas table
CREATE TABLE IF NOT EXISTS cronogramas (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  edital VARCHAR(10),
  data_alvo DATE NOT NULL,
  data_inicio DATE,
  materias JSON,
  status VARCHAR(20) DEFAULT 'ativo',
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Create sessoes_estudo table
CREATE TABLE IF NOT EXISTS sessoes_estudo (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  cronograma_id VARCHAR(36),
  materia VARCHAR(255) NOT NULL,
  data_sessao DATE NOT NULL,
  duracao_minutos INT NOT NULL,
  pontos_ganhos INT DEFAULT 0,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cronograma_id) REFERENCES cronogramas(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_data_sessao (data_sessao),
  INDEX idx_cronograma_id (cronograma_id)
);

-- Create metas_diarias table
CREATE TABLE IF NOT EXISTS metas_diarias (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  data DATE NOT NULL,
  horas_meta DECIMAL(4,2) NOT NULL,
  horas_realizadas DECIMAL(4,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'nao_iniciada',
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_data (data),
  UNIQUE KEY unique_user_date (user_id, data)
);

-- Create exames_diarios table
CREATE TABLE IF NOT EXISTS exames_diarios (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  data DATE NOT NULL,
  respostas JSON NOT NULL,
  observacoes TEXT,
  pontuacao TINYINT,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_data (data),
  UNIQUE KEY unique_user_date (user_id, data)
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  tipo_badge VARCHAR(100) NOT NULL,
  descricao TEXT,
  data_obtencao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Create historico_pontos table
CREATE TABLE IF NOT EXISTS historico_pontos (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  data DATE NOT NULL,
  pontos INT NOT NULL,
  motivo TEXT NOT NULL,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_data (data)
);

-- Migrations for existing tables (safe to re-run)
ALTER TABLE cronogramas ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE metas_diarias ADD COLUMN IF NOT EXISTS avaliacao_diaria TINYINT CHECK (avaliacao_diaria BETWEEN 1 AND 5);
ALTER TABLE historico_pontos ADD COLUMN IF NOT EXISTS rating_multiplier DECIMAL(3,1) NULL;

-- Study materials table (Feature: material per session)
CREATE TABLE IF NOT EXISTS materiais (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'outro',
  descricao VARCHAR(500),
  ativo TINYINT(1) DEFAULT 1,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_materiais_user_id (user_id)
);

-- Add material and notes columns to study sessions
ALTER TABLE sessoes_estudo ADD COLUMN IF NOT EXISTS notas VARCHAR(500) NULL;
ALTER TABLE sessoes_estudo ADD COLUMN IF NOT EXISTS material_id VARCHAR(36) NULL;
ALTER TABLE sessoes_estudo ADD COLUMN IF NOT EXISTS material_nome VARCHAR(200) NULL;

-- Add banca (exam board) to cronogramas for AI-style question generation
ALTER TABLE cronogramas ADD COLUMN IF NOT EXISTS banca VARCHAR(100) NULL;

-- AI-generated questions per study session
CREATE TABLE IF NOT EXISTS questoes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  sessao_id VARCHAR(36) NULL,
  materia VARCHAR(200) NOT NULL,
  banca VARCHAR(100) NULL,
  enunciado TEXT NOT NULL,
  opcoes JSON NOT NULL,
  resposta_correta TINYINT NOT NULL,
  explicacao TEXT NULL,
  dificuldade VARCHAR(20) DEFAULT 'media',
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INT DEFAULT 0,
  next_review DATE NULL,
  review_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sessao_id) REFERENCES sessoes_estudo(id) ON DELETE SET NULL,
  INDEX idx_questoes_user_id (user_id),
  INDEX idx_questoes_materia (user_id, materia),
  INDEX idx_questoes_next_review (user_id, next_review)
);

-- User responses to AI-generated questions (tracks accuracy + SM-2 inputs)
CREATE TABLE IF NOT EXISTS respostas_questoes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  questao_id VARCHAR(36) NOT NULL,
  sessao_id VARCHAR(36) NULL,
  resposta INT NOT NULL,
  correta TINYINT(1) NOT NULL,
  tempo_resposta_s INT NULL,
  criada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE CASCADE,
  INDEX idx_respostas_user_id (user_id),
  INDEX idx_respostas_questao_id (questao_id)
);

-- Daily missions — auto-generated based on study gaps, accuracy and schedule
CREATE TABLE IF NOT EXISTS missoes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(30) NOT NULL,           -- 'study' | 'review' | 'accuracy' | 'streak'
  titulo VARCHAR(200) NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  materia VARCHAR(200) NULL,
  meta_minutos INT NULL,
  meta_questoes INT NULL,
  status VARCHAR(20) DEFAULT 'pendente', -- 'pendente' | 'concluida' | 'ignorada'
  expires_at DATE NOT NULL,              -- valid for the day they were created
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_missoes_user_date (user_id, expires_at),
  INDEX idx_missoes_status (user_id, status)
);

-- Cache for AI-generated banca profiles (per exam board)
CREATE TABLE IF NOT EXISTS mapa_banca_cache (
  id VARCHAR(36) PRIMARY KEY,
  banca VARCHAR(100) NOT NULL UNIQUE,
  conteudo JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

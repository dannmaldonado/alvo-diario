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

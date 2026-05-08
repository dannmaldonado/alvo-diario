/**
 * AI Service — Claude API integration for question generation
 * Generates multiple-choice questions in the style of Brazilian exam boards (bancas)
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate multiple-choice questions for a given subject and exam board style.
 * @param {Object} params
 * @param {string} params.materia - Subject name (e.g., "Direito Constitucional")
 * @param {string} [params.banca] - Exam board (e.g., "CESPE/Cebraspe", "FGV")
 * @param {number} [params.quantidade=5] - Number of questions to generate
 * @param {string} [params.dificuldade='media'] - Difficulty: 'facil' | 'media' | 'dificil'
 * @returns {Promise<Array>} Array of question objects
 */
export async function gerarQuestoes({ materia, banca, quantidade = 5, dificuldade = 'media' }) {
  const bancaCtx = banca && banca !== 'Sem preferência'
    ? `no estilo da banca ${banca} (questões de concurso público real)`
    : 'para concursos policiais brasileiros';

  const dificuldadeMap = {
    facil: 'básico — conceitos fundamentais e definições',
    media: 'intermediário — aplicação de normas e situações práticas',
    dificil: 'avançado — casos complexos, jurisprudência e pegadinhas comuns',
  };
  const dificuldadeDesc = dificuldadeMap[dificuldade] || dificuldadeMap.media;

  const prompt = `Você é um especialista em elaboração de questões de concursos policiais brasileiros.

Gere exatamente ${quantidade} questões de múltipla escolha sobre "${materia}" ${bancaCtx}.

Regras obrigatórias:
- Nível: ${dificuldadeDesc}
- Cada questão deve ter: enunciado claro, 4 alternativas (A, B, C, D), exatamente 1 correta
- Foco em aspectos realmente cobrados em provas: legislação, doutrina, jurisprudência, casos práticos
- Linguagem formal e objetiva, sem ambiguidades
- A explicação deve ser concisa (2-3 frases) e citar o fundamento legal quando aplicável

Retorne APENAS o array JSON válido, sem markdown, sem texto antes ou depois:
[
  {
    "enunciado": "Texto completo da questão...",
    "opcoes": ["A) primeira alternativa", "B) segunda alternativa", "C) terceira alternativa", "D) quarta alternativa"],
    "resposta_correta": 0,
    "explicacao": "Explicação da resposta correta citando o fundamento.",
    "dificuldade": "${dificuldade}"
  }
]

Certifique-se de que "resposta_correta" é o índice numérico (0=A, 1=B, 2=C, 3=D) da alternativa correta.`;

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].text.trim();
  // Strip markdown code blocks if model wraps response in them
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const questoes = JSON.parse(json);

  if (!Array.isArray(questoes)) {
    throw new Error('AI returned invalid format: expected JSON array');
  }

  return questoes;
}

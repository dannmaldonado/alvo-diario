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

/**
 * Generate a strategic banca profile: subject distribution, question style, key tips.
 * Result is meant to be cached in mapa_banca_cache table.
 * @param {string} banca - Exam board name (e.g., "CESPE/Cebraspe")
 * @param {string[]} materias - Subjects in the user's cronograma
 * @returns {Promise<Object>} Structured banca profile
 */
export async function gerarMapaBanca(banca, materias) {
  const materiasCtx = materias.length > 0
    ? `O candidato estuda as seguintes matérias: ${materias.join(', ')}.`
    : 'Considere as matérias típicas de concursos policiais brasileiros.';

  const prompt = `Você é um especialista em concursos policiais brasileiros com amplo conhecimento sobre a banca ${banca}.

${materiasCtx}

Gere um perfil estratégico completo da banca ${banca} para ajudar o candidato a focar seus estudos.

Retorne APENAS JSON válido, sem markdown:
{
  "banca": "${banca}",
  "perfil": "Descrição objetiva do estilo e características da banca em 2-3 frases.",
  "estilo_questoes": "Como a banca elabora questões: assertivas C/E, múltipla escolha, etc.",
  "distribuicao": [
    { "area": "Nome da área/matéria", "peso": 20, "dica": "Dica específica para essa área nessa banca" }
  ],
  "pontos_criticos": ["Ponto crítico 1", "Ponto crítico 2", "Ponto crítico 3"],
  "dicas_estrategicas": ["Dica estratégica 1", "Dica estratégica 2", "Dica estratégica 3"]
}

Regras:
- "distribuicao" deve ter entre 4 e 8 áreas, com pesos somando 100
- Foque nas matérias que o candidato estuda quando relevantes
- Dicas devem ser específicas e acionáveis, não genéricas
- Pontos críticos são armadilhas reais que a banca usa`;

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].text.trim();
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(json);
}

/**
 * Parse a PDF edital and extract the list of subjects/topics.
 * @param {Buffer} pdfBuffer - Raw PDF file buffer
 * @returns {Promise<Object>} Extracted subjects list
 */
export async function parseEdital(pdfBuffer) {
  const base64 = pdfBuffer.toString('base64');

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Analise este edital de concurso público e extraia as matérias/disciplinas do conteúdo programático.

Retorne APENAS JSON válido, sem markdown:
{
  "concurso": "Nome do concurso/cargo identificado no edital",
  "banca": "Nome da banca organizadora, ou null se não encontrado",
  "materias": [
    {
      "nome": "Nome da matéria",
      "topicos": ["Tópico 1", "Tópico 2", "Tópico 3"]
    }
  ]
}

Regras:
- Extraia TODAS as matérias do conteúdo programático
- Se não encontrar conteúdo programático, retorne materias: []
- Normalize os nomes das matérias (ex: "Língua Portuguesa" não "LÍNGUA PORTUGUESA")
- Inclua no máximo 10 tópicos por matéria (os mais importantes)
- Banca: identifique se menciona CESPE, CEBRASPE, FGV, FUNDATEC, VUNESP, IBFC, AOCP, NC-UFPR, FEPESE, etc.`,
          },
        ],
      },
    ],
  });

  const text = msg.content[0].text.trim();
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(json);
}

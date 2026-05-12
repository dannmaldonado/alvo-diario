/**
 * AI Service — Claude API integration for question generation
 * Generates realistic exam questions based on subject + exam board (banca)
 */

// Dynamic import — resolved only when AI functions are called, not at server startup.
// This prevents the server from crashing if @anthropic-ai/sdk is not yet installed.
let _anthropic = null;
async function getAnthropicClient() {
  if (_anthropic) return _anthropic;
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return _anthropic;
  } catch (err) {
    throw new Error(
      '@anthropic-ai/sdk não está instalado. Execute "npm install" no servidor e reinicie.'
    );
  }
}

/**
 * Generate multiple choice questions for a specific subject
 * @param {Object} params
 * @param {string} params.materia - Subject name (e.g., "Direito Constitucional")
 * @param {string} [params.banca] - Exam board style (e.g., "CESPE/Cebraspe")
 * @param {number} [params.quantidade=5] - Number of questions to generate
 * @param {string} [params.dificuldade=media] - Difficulty level (facil, media, dificil)
 * @returns {Promise<Array>} Array of question objects
 */
export async function gerarQuestoes({ materia, banca, material_nome, quantidade = 5, dificuldade = 'media' }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const bancaCtx = banca && banca !== 'Sem preferência'
    ? `no estilo da banca ${banca} (questões de concurso real)`
    : 'para concursos policiais brasileiros';

  const materialCtx = material_nome
    ? `\nO candidato estudou com o material/livro: "${material_nome}". Priorize tópicos frequentemente abordados neste tipo de referência.`
    : '';

  const prompt = `Você é um especialista em elaboração de questões de concursos policiais brasileiros com décadas de experiência.

Gere exatamente ${quantidade} questões de múltipla escolha sobre "${materia}" ${bancaCtx}.${materialCtx}

Regras obrigatórias:
- Nível de dificuldade: ${dificuldade}
- Cada questão DEVE ter: enunciado claro, 4 alternativas (A-D), 1 resposta correta, explicação concisa
- Foco em aspectos realmente cobrados em provas (legislação, jurisprudência, doutrina)
- Linguagem objetiva, sem ambiguidades ou pegadinhas
- Alternativas plausíveis (não óbvias)
- Explicações educacionais (ajudam o candidato aprender)

Retorne APENAS o JSON válido, sem markdown, sem blocos de código, sem prefácio:
[
  {
    "enunciado": "Qual é a definição correta de...",
    "opcoes": ["A) Primeira opção", "B) Segunda opção", "C) Terceira opção", "D) Quarta opção"],
    "resposta_correta": 0,
    "explicacao": "Breve explicação de por que a alternativa A está correta.",
    "dificuldade": "${dificuldade}"
  }
]`;

  try {
    const anthropic = await getAnthropicClient();
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].text.trim();
    // Strip markdown code blocks if Claude wrapped response
    const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const questoes = JSON.parse(jsonStr);

    // Validate structure
    if (!Array.isArray(questoes)) {
      throw new Error('Response is not an array of questions');
    }

    return questoes.map((q, idx) => ({
      enunciado: q.enunciado || '',
      opcoes: q.opcoes || [],
      resposta_correta: typeof q.resposta_correta === 'number' ? q.resposta_correta : 0,
      explicacao: q.explicacao || '',
      dificuldade: q.dificuldade || dificuldade,
    }));
  } catch (error) {
    console.error('[ai.gerarQuestoes] Error:', error.message);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}

/**
 * Generate a comprehensive profile of an exam board's question style
 * Used for dashboard "Mapa da Banca" feature
 * @param {string} banca - Exam board name
 * @param {Array<string>} materias - List of subjects to profile
 * @returns {Promise<Object>} Banca profile with question patterns, favorite topics, etc.
 */
export async function gerarMapaBanca(banca, materias = []) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const materiasList = materias.length > 0
    ? `Matérias do edital: ${materias.join(', ')}`
    : 'Matérias comuns em concursos policiais';

  const prompt = `Você é um especialista em padrões de questões de concursos policiais brasileiros.

Gere um perfil estratégico da banca "${banca}" para candidatos. ${materiasList}

Retorne APENAS JSON válido, sem markdown, neste formato exato:
{
  "perfil": "2-3 frases descrevendo o estilo e características da banca",
  "estilo_questoes": "1 frase sobre o formato das questões (objetiva, certo/errado, etc.)",
  "distribuicao": [
    { "area": "Nome da área", "peso": 25, "dica": "Dica breve sobre essa área" }
  ],
  "pontos_criticos": ["Ponto 1", "Ponto 2", "Ponto 3"],
  "dicas_estrategicas": ["Dica 1", "Dica 2", "Dica 3"]
}

Regras:
- distribuicao: máximo 8 áreas, pesos somam 100
- pontos_criticos: máximo 4 itens, máximo 15 palavras cada
- dicas_estrategicas: máximo 4 itens, máximo 15 palavras cada
- Seja conciso — respostas longas serão cortadas`;

  try {
    const anthropic = await getAnthropicClient();
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].text.trim();
    const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('[ai.gerarMapaBanca] Error:', error.message);
    throw new Error(`Failed to generate banca profile: ${error.message}`);
  }
}

/**
 * Parse a PDF edital (exam notice) and extract subjects/disciplines
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<{concurso: string, banca: string|null, materias: Array}>}
 */
export async function parseEdital(pdfBuffer) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const base64 = pdfBuffer.toString('base64');

  const anthropic = await getAnthropicClient();
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

export default {
  gerarQuestoes,
  gerarMapaBanca,
  parseEdital,
};

# PHASE-4-STORY-402: Sequência de Tópicos com Import CSV/XLS

**Epic:** Phase 4 — Ciclo de Estudos Avançado  
**Project:** alvo-diario  
**Status:** InProgress  
**Created:** 2026-10-27  
**Effort:** 5-7 hours  
**Assigned Agent:** @dev Dex  

---

## Context

O usuário estuda por um ciclo date-based (ex: hoje = Direito Penal), mas não tem controle de **quais tópicos** dentro da matéria já foram estudados. A feature permite importar um edital/lista de tópicos via CSV/XLS, acompanhar o progresso por tópico com persistência, e registrar opcionalmente o desempenho em questões por tópico. Ao zerar todos os tópicos de uma matéria, a "segunda batida" começa automaticamente.

---

## Regras de Negócio

- O ciclo de datas **não muda** — o plus é o progresso dentro da matéria do dia
- Tópicos aparecem em ordem de importância (campo `ordem` do edital)
- O tópico atual = primeiro não concluído da batida corrente
- Ao concluir todos os tópicos de uma matéria → `batida` incrementa, progresso reseta para aquela matéria
- Questões por tópico são **opcionais** — o usuário pode marcar tópico como concluído sem registrá-las
- Importação CSV/XLS é parseada no browser (SheetJS) → envia JSON para API

---

## Scope

### Backend
- [ ] Migration: nova tabela `topico_progresso`
- [ ] `POST /api/editais/import` — cria/atualiza edital a partir de JSON parseado
- [ ] `GET /api/topicos/progresso?edital_id=X&materia=Y` — progresso da matéria
- [ ] `PATCH /api/topicos/progresso` — marca/desmarca tópico, registra questões opcionais
- [ ] Reset automático de batida (quando todos concluídos, incrementa `batida`)

### Frontend
- [ ] Instalar `xlsx` (SheetJS) em `apps/web`
- [ ] Componente `ImportEditalSheet` — drawer com upload CSV/XLS, preview da tabela, botão confirmar
- [ ] Botão "Importar Edital" em CronogramaPage
- [ ] Hook `useTopicoProgresso(editalId, materia)` — fetch + mutations
- [ ] `ConteudoDoDia` refatorado: checkboxes persistidos, tópico atual destacado
- [ ] Mini-form opcional ao concluir tópico: "Fez questões? [total] acertos [N]"
- [ ] Badge "Batida N" no header da matéria
- [ ] Banner "Segunda batida iniciada 🎉" ao zerar todos os tópicos

---

## Acceptance Criteria

- [ ] Usuário faz upload de CSV/XLS com colunas: Materia, Topico, Importancia (+ opcionais: Questoes_Prova, Horas_Sugeridas)
- [ ] Edital criado/atualizado com tópicos em ordem correta
- [ ] ConteudoDoDia mostra tópicos persistidos do edital em ordem de importância
- [ ] Tópico atual (primeiro não concluído) fica destacado visualmente
- [ ] Checkbox persiste no banco — recarregar a página mantém o progresso
- [ ] Ao marcar tópico, mini-form opcional aparece para registrar questões
- [ ] Ao concluir todos os tópicos → banner "Segunda batida iniciada" + batida incrementa + progresso reseta
- [ ] Badge "Batida 2, 3..." aparece quando em segunda batida ou superior
- [ ] `npm run lint` — zero erros

---

## CSV Format

```csv
Materia,Topico,Importancia,Questoes_Prova,Horas_Sugeridas
Direito Penal,Crimes contra a pessoa,1,15,2
Direito Penal,Crimes contra o patrimônio,2,10,1.5
Direito Constitucional,Direitos fundamentais,1,20,3
```

Campos obrigatórios: `Materia`, `Topico`, `Importancia`  
Campos opcionais: `Questoes_Prova`, `Horas_Sugeridas`

---

## DB Migration

```sql
CREATE TABLE IF NOT EXISTS topico_progresso (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  edital_id VARCHAR(36) NOT NULL,
  materia_nome VARCHAR(255) NOT NULL,
  topico_nome VARCHAR(500) NOT NULL,
  batida INT DEFAULT 1,
  concluido_em TIMESTAMP NULL,
  questoes_total INT NULL,
  questoes_acertos INT NULL,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (edital_id) REFERENCES editais(id) ON DELETE CASCADE,
  UNIQUE KEY uq_topico_batida (user_id, edital_id, materia_nome, topico_nome, batida),
  INDEX idx_tp_user_edital (user_id, edital_id),
  INDEX idx_tp_materia (user_id, edital_id, materia_nome)
);
```

---

## File List

| File | Change |
|------|--------|
| `apps/api/src/db/schema.sql` | Migration: tabela `topico_progresso` |
| `apps/api/src/routes/editais.js` | POST /api/editais/import |
| `apps/api/src/routes/topicos.js` | GET + PATCH /api/topicos/progresso |
| `apps/api/src/index.js` | Registrar rota topicos |
| `apps/web/package.json` | Adicionar `xlsx` |
| `apps/web/src/hooks/queries/useTopicoProgresso.ts` | Hook de progresso |
| `apps/web/src/components/cronograma/ImportEditalSheet.tsx` | Drawer de import |
| `apps/web/src/components/cronograma/ConteudoDoDia.tsx` | Checkboxes persistidos + mini-form questões + banner batida |
| `apps/web/src/pages/CronogramaPage.tsx` | Botão "Importar Edital" |

---

*Created by @dev (Dex) — 2026-10-27*

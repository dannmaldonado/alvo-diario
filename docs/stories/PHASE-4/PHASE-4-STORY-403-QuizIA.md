# PHASE-4-STORY-403: Tela de Quiz com IA

**Epic:** Phase 4 — Ciclo de Estudos Avançado  
**Project:** alvo-diario  
**Status:** InProgress  
**Created:** 2026-10-27  
**Effort:** 2-3 hours  
**Assigned Agent:** @dev Dex  

---

## Context

O Quiz com IA era acionado automaticamente no fim de uma sessão de estudo. A nova proposta é desacoplar completamente: o usuário entra em uma tela dedicada, escolhe edital/banca/tema e gera 10 questões inéditas para praticar quando quiser — sem precisar ter estudado naquele dia.

---

## Regras de Negócio

- Usuário escolhe: matéria (texto livre ou a partir de edital vinculado) + banca (opcional) + dificuldade
- Geração via `POST /api/questoes/gerar` com `quantidade: 10`
- Questões são salvas normalmente (SM-2) — o usuário pode revê-las em /revisao
- O QuizModal existente é reaproveitado sem modificação
- Remoção do QuizModal do fluxo pós-sessão de estudo fica para iteração futura (não quebrar o existente agora)

---

## Scope

- [ ] `QuizIAPage.tsx` — nova página `/quiz-ia`
  - Formulário: matéria (select do edital + input livre), banca, dificuldade
  - Botão "Gerar questões" → loading state → abre QuizModal
  - Estado de resultado (acertos/total) exibido na página após fechar o modal
- [ ] `App.tsx` — registrar rota `/quiz-ia`
- [ ] `Sidebar.tsx` — adicionar "Quiz IA" no grupo Desempenho
- [ ] `docs/stories/PHASE-4/PHASE-4-INDEX.md` — atualizar registro

---

## Acceptance Criteria

- [ ] Tela `/quiz-ia` acessível pelo sidebar
- [ ] Formulário com matéria (obrigatório), banca (opcional), dificuldade (fácil/média/difícil)
- [ ] Se usuário tem edital vinculado, matérias do edital aparecem como sugestões no select
- [ ] Botão "Gerar" desabilitado enquanto aguarda resposta da IA
- [ ] QuizModal abre com as 10 questões geradas
- [ ] Após fechar modal, resultado é exibido na página (X/10 acertos)
- [ ] `npm run lint` — zero erros

---

## File List

| File | Change |
|------|--------|
| `apps/web/src/pages/QuizIAPage.tsx` | Nova página |
| `apps/web/src/App.tsx` | Rota `/quiz-ia` |
| `apps/web/src/components/layout/Sidebar.tsx` | Item "Quiz IA" |

---

*Created by @dev (Dex) — 2026-10-27*

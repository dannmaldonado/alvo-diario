# PHASE-4-STORY-401: Adiantar Assunto do Próximo Dia

**Epic:** Phase 4 — Ciclo de Estudos Avançado  
**Project:** alvo-diario  
**Status:** Done  
**Created:** 2026-09-22  
**Effort:** 2-3 hours  
**Assigned Agent:** @dev Dex  

---

## Context

O usuário estuda o assunto do dia, marca todos os tópicos como concluídos no `ConteudoDoDia`, e quer aproveitar o momentum para adiantar o assunto seguinte no ciclo — sem precisar esperar o próximo dia.

O ciclo é **stateless e date-based**: nenhuma posição é salva em banco. Adiantar não altera o ciclo — amanhã o sistema ainda mostra o assunto correto de amanhã. Se o usuário estudar o assunto adiantado novamente amanhã, são duas sessões da mesma matéria — comportamento desejado para spaced repetition.

---

## Regra de Negócio

- O botão "Adiantar" só aparece quando **todos os tópicos do assunto atual estão marcados** (`allDone === true` em `ConteudoDoDia`)
- O próximo assunto é sempre `materias[(currentIndex + 1) % materias.length]`
- Ao clicar, navega para `/sessao?subject=<nome>` com o próximo assunto pré-selecionado
- No dia seguinte, o ciclo exibe o assunto correto; se o usuário completar de novo, o "Adiantar" aparece com o assunto seguinte — comportamento idêntico

---

## Scope

- [x] `ConteudoDoDia.tsx` — prop `nextMateria?` + banner de conclusão com CTA "Adiantar"
- [x] `CronogramaPage.tsx` — calcula `nextMateria` e passa ao component
- [x] `StudySessionPage.tsx` — lê `?subject=` da URL para pré-selecionar matéria
- [x] `useStudySession.ts` — aceita `initialSubject?` para inicializar estado com param da URL

---

## Acceptance Criteria

- [x] Banner "Assunto concluído" aparece somente quando todos os tópicos estão marcados
- [x] Banner exibe o nome do próximo assunto no ciclo
- [x] Clicar em "Adiantar" navega para `/sessao?subject=X` com a matéria pré-selecionada
- [x] Se o cronograma tem apenas 1 matéria, o botão "Adiantar" não aparece (ciclo sem próximo diferente)
- [x] Não há alteração no ciclo de datas — amanhã mostra o assunto correto normalmente
- [x] `npm run lint` — zero erros

---

## Technical Notes

- `getSubjectForDay(schedule, days + 1)` já existe em `useScheduleCalculator` — basta usá-lo
- `selectedSubject` em `useStudySession` inicializa com `''` e é sobrescrito pelo `useEffect` — basta inicializar com `initialSubject || ''` para que o param da URL tenha prioridade
- `ConteudoDoDia` usa local checkbox state — não há persistência, os checkboxes voltam ao desmarcar ao mudar de dia (correto)

---

## File List

| File | Change |
|------|--------|
| `apps/web/src/components/cronograma/ConteudoDoDia.tsx` | Prop `nextMateria`, banner de conclusão com CTA |
| `apps/web/src/pages/CronogramaPage.tsx` | Calcula e passa `nextMateria` |
| `apps/web/src/pages/StudySessionPage.tsx` | Lê `?subject=` de `useSearchParams` |
| `apps/web/src/hooks/useStudySession.ts` | Param `initialSubject?` |
| `docs/stories/PHASE-4/PHASE-4-STORY-401-AdiantarAssunto.md` | Esta story |

---

*Created by @dev (Dex) — 2026-09-22*

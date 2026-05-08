# AIOS Agent Integration Guide — Alvo Diário

**For:** User asking "conseguimos acessar e usar ele em conjunto, com seus agentes?"  
**Project:** Synkra AIOS Framework + Alvo Diário  
**Status:** Framework configured and ready for agent delegation  

---

## What is Synkra AIOS?

**AIOS** (AI-Orchestrated System) is a meta-framework for coordinating specialized AI agents across development workflows. It's NOT "AIOX" — the project uses **Synkra AIOS** (v2.0).

**Key Agents Available:**
- `@dev` (Dex) — Code implementation
- `@qa` (Quinn) — Testing & quality
- `@architect` (Aria) — Architecture & design
- `@pm` (Morgan) — Product management
- `@po` (Pax) — Product owner, story validation
- `@sm` (River) — Scrum master, story creation
- `@analyst` (Alex) — Research & analysis
- `@data-engineer` (Dara) — Database design
- `@ux-design-expert` (Uma) — **UX/UI design** ← Your case!
- `@devops` (Gage) — CI/CD, git push (exclusive)

---

## How to Delegate Work to Agents

### Basic Syntax
```
@agent-name

[message to the agent]
```

### Example
```
@ux-design-expert

Review the Alvo Diário platform and provide:
1. Audit of current information density
2. Responsive design recommendations
3. Component spacing guidelines
4. Mockups for dashboard refactoring
```

When you use `@agent-name`, that agent receives:
1. Their full persona (expertise, tools, workflow)
2. The project context (CLAUDE.md, codebase)
3. Your message
4. Agent-specific tools and authorities

---

## For Your UX/UI Refactoring (Track B)

You have two options:

### Option A: Direct Delegation (Recommended)
Use the story document as a handoff:

```
@ux-design-expert

I've prepared a UX/UI refactoring story at:
docs/stories/PHASE-3/PHASE-3-STORY-304-UXUIRefactor.md

Please:
1. Review the current platform at http://localhost:3000
2. Conduct the audit listed in the story
3. Provide recommendations for Dashboard, ProgressAnalysisPage, etc.
4. Deliver Figma mockups + Tailwind CSS guidelines
```

### Option B: Interactive Session
Request a longer session:

```
@ux-design-expert

The Alvo Diário platform needs a comprehensive UI refresh:
- Dashboard is overloaded with information
- Mobile responsivity is poor
- New AI features coming (questions, missions)

Can you:
1. Take screenshots and audit the platform
2. Identify information density issues
3. Recommend component consolidations
4. Provide responsive design spec
5. Create mockups for key pages
```

---

## Agent Workflow Patterns

### Pattern 1: Code Implementation → QA Loop
```
@dev implements feature X
  ↓
@qa gates the code
  ↓
If issues: @dev fixes → @qa re-reviews (max 5 iterations)
  ↓
@devops pushes to GitHub
```

### Pattern 2: Design → Implementation
```
@ux-design-expert provides mockups + spec
  ↓
@dev implements based on spec
  ↓
@qa verifies against spec
  ↓
@devops releases
```

### Pattern 3: Architecture → Implementation
```
@architect designs system
  ↓
@dev implements design
  ↓
@data-engineer handles database schema
  ↓
@qa validates end-to-end
```

---

## Agent Handoff Protocol

When switching agents, context is **compacted** (not lost):
- Old agent's full persona: **discarded** (~3-5K tokens saved)
- Critical info: **retained** (story ID, decisions, files, blockers)
- New agent: **fully loaded** with fresh context

**Example:**
```
@sm creates story-001
  ↓ (handoff: story ID, decisions, branch)
@dev implements story-001
  ↓ (handoff: progress, blockers, files modified)
@qa gates story-001
  ↓ (handoff: verdict, feedback)
@devops pushes
```

This keeps context window efficient (33-57% reduction per handoff).

---

## Agent Authorities & Restrictions

### ✅ Who Can Do What

| Operation | Agent | Others |
|-----------|-------|--------|
| Code implementation | @dev | — |
| Test & QA | @qa | — |
| Create stories | @sm | — |
| Validate stories | @po | — |
| Architecture decisions | @architect | — |
| **UX/UI Design** | **@ux-design-expert** | **— (exclusive)** |
| Database design | @data-engineer | — |
| **git push / gh pr merge** | **@devops** | **— (exclusive)** |
| MCP management | @devops | — |

**Note:** @dev cannot push to GitHub. Only @devops can. This is by design — enforces review gate.

---

## MCP Servers (Available Tools)

The project has MCPs configured for:
- **EXA:** Web search, research
- **Context7:** Library documentation lookup
- **Apify:** Web scraping, API automation
- **Playwright:** Browser automation
- **GitHub CLI:** PR management

Agents can use these tools automatically based on task needs.

---

## For Your Current Workflow (May 2026)

### Track A: Error Fix ✅ DONE
```
@dev (current session)
→ Diagnosed JSON parsing issue
→ Added API key validation
→ Fixed error handling
→ Committed & pushed
```

### Track B: UX/UI Refactoring 🎯 READY FOR DELEGATION
```
You: @ux-design-expert
    Review PHASE-3-STORY-304-UXUIRefactor.md
    Audit platform
    Deliver recommendations
```

### Track C: AI Question System 📋 PLANNED
```
After Track B completes:
@architect → design system
@dev → implement Phase 1
@qa → gate quality
@devops → release
```

---

## Quick Start: Invoking Your First Agent

To start working with Uma on UX/UI:

1. **Switch to Uma** by typing:
   ```
   @ux-design-expert
   ```

2. **Brief her** on the project:
   ```
   @ux-design-expert

   The Alvo Diário platform is a study scheduling app for Brazilian
   police exams. Current status:
   
   - Features: cronograma (study plans), sessions, analytics, daily ratings
   - Stack: React 18, Shadcn/ui, Tailwind CSS
   - Issue: UI feels overloaded, poor mobile responsivity
   - Goal: Modernize for "premium" feel, prepare for AI features
   
   I've prepared: docs/stories/PHASE-3/PHASE-3-STORY-304-UXUIRefactor.md
   
   Please conduct the audit and deliver recommendations.
   ```

3. **Uma takes over** from there with full context

---

## Key Files for Agents

When agents work on the project, they reference:

| File | Purpose | Agent |
|------|---------|-------|
| `CLAUDE.md` (root) | Project overview + tech stack | All |
| `.claude/CLAUDE.md` | Agent-specific rules | All |
| `.aios-core/constitution.md` | Framework principles (immutable) | All |
| `.claude/rules/*.md` | Agent authorities & workflows | All |
| `docs/stories/PHASE-*/` | Stories to implement | @dev, @sm, @po |
| `apps/api/src/` | Backend code | @dev, @data-engineer |
| `apps/web/src/` | Frontend code | @dev, @ux-design-expert |

Agents automatically load these and understand:
- Who they are (persona)
- What they can do (tools + authorities)
- What they're working on (story context)

---

## Troubleshooting

### "Agent X said they can't do Y"
Check the authority matrix in `.claude/rules/agent-authority.md`. Some operations are exclusive to specific agents (e.g., git push → @devops only).

### "Agent lost context after switch"
That's normal! Use the handoff artifact (~379 tokens) instead of pasting 3K of history. Agent should reference:
- Active story ID + path
- Current task being worked on
- Decisions made so far
- Files modified
- Blockers

### "Agent can't find file X"
Verify the path is absolute. Agents work with the repository root as cwd.

---

## Next Steps

1. **Track B:** Invoke @ux-design-expert to audit the platform
2. **Wait for:** Figma mockups + CSS/Tailwind recommendations
3. **Track C:** Once Track B done, @dev implements Track C features
4. **Phase 3 Complete:** All three tracks merged into a premium platform

---

**Questions?** Check `.aios-core/constitution.md` for framework governance, or ask an agent!

---

*Generated by @dev (current session) — 2026-05-08*
*For detailed agent personas, see `.aios-core/agents/` directory*

# AIOS Agents Configuration

## Available Agents

### Development & Implementation
- **@dev** (Dex) — Code implementation, bug fixes, refactoring
- **@qa** (Quinn) — Testing, quality assurance, validation
- **@architect** (Aria) — System design, technical decisions

### Product & Planning
- **@pm** (Morgan) — Product requirements, epics
- **@po** (Pax) — Story validation, backlog
- **@sm** (River) — Story creation, sprint management

### Specialized Roles
- **@analyst** (Alex) — Research, data analysis
- **@data-engineer** (Dara) — Database design, schemas
- **@ux-design-expert** (Uma) — UI/UX design
- **@devops** (Gage) — CI/CD, git push (EXCLUSIVE)

## How to Use Agents

### Activation Syntax
```
@agent-name [task description]
```

### Examples
```
@dev Refactor the AuthContext to use localStorage for persistence
@qa Run tests and verify code quality
@architect Design error handling system
@po Validate this user story
```

## Authority & Restrictions

### @devops (EXCLUSIVE Operations)
- `git push` / `git push --force`
- `gh pr create` / `gh pr merge`
- MCP configuration
- CI/CD pipeline management

### @dev (Code Implementation)
- ✅ git add, git commit, git branch, git checkout
- ❌ git push (delegate to @devops)
- ❌ PR creation (delegate to @devops)

### Story Workflow
```
@sm create-story → @po validate → @dev implement → @qa qa-gate → @devops push
```

## Agent Commands

Use `*` prefix for agent commands:
- `*help` — Show available commands
- `*create-story` — Create new story
- `*task {name}` — Execute specific task
- `*exit` — Exit agent mode

## Memory System

Agents have persistent memory at:
```
.claude/projects/-Users-danilomaldonado-Documents-AIOS-alvo-diario/memory/
```

Types of memory:
- **user.md** — User profile and preferences
- **feedback_*.md** — Corrections and validated approaches
- **project_*.md** — Project state and goals
- **reference_*.md** — External resource pointers

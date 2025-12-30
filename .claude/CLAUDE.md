# Claude Kit - Project Context Template

## Overview

This is a comprehensive Claude Kit for Claude Code, designed to accelerate development workflows for small teams (1-3 developers) working with Python and JavaScript/TypeScript multi-stack projects.

## Quick Reference

### Core Commands

| Command | Description |
|---------|-------------|
| `/feature [desc]` | Full feature development workflow |
| `/fix [error]` | Smart debugging and bug fix |
| `/review [file]` | Comprehensive code review |
| `/test [scope]` | Generate tests |
| `/ship [msg]` | Commit + PR automation |
| `/plan [task]` | Task decomposition |
| `/doc [target]` | Documentation generation |
| `/deploy [env]` | Deployment workflow |

### Enhanced Commands

| Command | Description |
|---------|-------------|
| `/plan --detailed [task]` | Detailed plan with 2-5 min tasks |
| `/brainstorm [topic]` | Interactive design session |
| `/execute-plan [file]` | Subagent-driven plan execution |
| `/tdd [feature]` | Test-driven development workflow |
| `/research [topic]` | Technology research |

### New Commands

| Command | Description |
|---------|-------------|
| `/mode [name]` | Switch behavioral mode |
| `/index` | Generate project structure index |
| `/load [component]` | Load project context |
| `/checkpoint [action]` | Save/restore session state |
| `/spawn [task]` | Launch parallel background task |

## Tech Stack

<!-- CUSTOMIZATION POINT: Update for your project -->
- **Languages**: Python, TypeScript, JavaScript
- **Backend Frameworks**: FastAPI, Django, NestJS, Express
- **Frontend Frameworks**: Next.js, React
- **Databases**: PostgreSQL, MongoDB
- **Testing**: pytest, vitest, Jest, Playwright
- **DevOps**: Docker, GitHub Actions, Cloudflare

## Architecture

<!-- CUSTOMIZATION POINT: Describe your project architecture -->
```
src/
├── api/          # API endpoints
├── services/     # Business logic
├── models/       # Data models
├── utils/        # Utilities
└── tests/        # Test files
```

## Code Conventions

### Naming Conventions

| Type | Python | TypeScript/JavaScript |
|------|--------|----------------------|
| Files | `snake_case.py` | `kebab-case.ts` |
| Functions | `snake_case` | `camelCase` |
| Classes | `PascalCase` | `PascalCase` |
| Constants | `UPPER_SNAKE` | `UPPER_SNAKE` |
| Components | N/A | `PascalCase.tsx` |

### Code Style

- **Python**: Follow PEP 8, use type hints, docstrings for public APIs
- **TypeScript**: Strict mode enabled, no `any` types, use interfaces
- **JavaScript**: ESLint + Prettier, prefer `const` over `let`

### File Organization

- One component/class per file
- Group related files in feature directories
- Keep test files adjacent to source files or in `tests/` directory

## Testing Standards

### Coverage Requirements
- Minimum coverage: 80%
- Critical paths: 95%

### Test Naming
- **Python**: `test_[function]_[scenario]_[expected]`
- **TypeScript**: `describe('[Component]', () => { it('should [behavior]') })`

### Test Types
1. **Unit tests**: All business logic functions
2. **Integration tests**: API endpoints, database operations
3. **E2E tests**: Critical user flows

## Security Standards

### Forbidden Patterns
- No hardcoded secrets or API keys
- No `eval()` or dynamic code execution
- No SQL string concatenation (use parameterized queries)
- No `any` types in TypeScript
- No disabled security headers

### Required Practices
- Input validation on all user inputs
- Output encoding for all rendered content
- Authentication on all protected endpoints
- Rate limiting on public APIs
- Secrets via environment variables only

## Git Conventions

### Branch Naming
- `feature/[ticket]-[description]`
- `fix/[ticket]-[description]`
- `hotfix/[description]`
- `chore/[description]`

### Commit Messages
```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### PR Requirements
- Descriptive title and description
- Linked to issue/ticket
- All tests passing
- Code review approved
- No merge conflicts

## Agent Behavior Overrides

<!-- CUSTOMIZATION POINT: Override default agent behaviors -->

### Planner Agent
- Break tasks into chunks of 15-60 minutes
- Always identify testing requirements
- Flag external dependencies

### Code-Reviewer Agent
- Enforce strict typing
- Security-first reviews
- Check for test coverage

### Tester Agent
- Prefer pytest for Python, vitest for TypeScript
- Generate edge case tests
- Include error scenario tests

### Debugger Agent
- Check logs first
- Reproduce before fixing
- Add regression tests

## Behavioral Modes

<!-- CUSTOMIZATION POINT: Configure default mode -->

Modes adjust communication style, output format, and problem-solving approach.

| Mode | Description | Best For |
|------|-------------|----------|
| `default` | Balanced standard behavior | General tasks |
| `brainstorm` | Creative exploration, questions | Design, ideation |
| `token-efficient` | Compressed, concise output | High-volume, cost savings |
| `deep-research` | Thorough analysis, citations | Investigation, audits |
| `implementation` | Code-focused, minimal prose | Executing plans |
| `review` | Critical analysis, finding issues | Code review, QA |
| `orchestration` | Multi-task coordination | Complex parallel work |

### Mode Activation

```bash
/mode brainstorm              # Switch mode for session
/feature --mode=implementation # Override for single command
```

Mode files: `.claude/modes/`

## Command Flags

<!-- CUSTOMIZATION POINT: Set default flag values -->

All commands support combinable flags for flexible customization.

### Universal Flags

| Flag | Description | Values |
|------|-------------|--------|
| `--mode=[mode]` | Behavioral mode | default, brainstorm, token-efficient, etc. |
| `--depth=[1-5]` | Thoroughness level | 1=quick, 5=exhaustive |
| `--format=[fmt]` | Output format | concise, detailed, json |
| `--save=[path]` | Save output to file | File path |
| `--checkpoint` | Create state checkpoint | Boolean |

### Persona Flags

| Flag | Description |
|------|-------------|
| `--persona=security` | Security-focused analysis |
| `--persona=performance` | Performance-focused analysis |
| `--persona=architecture` | Architecture-focused analysis |

### Examples

```bash
/review --persona=security --depth=5 src/auth/
/plan --mode=brainstorm --save=plans/design.md "feature"
/fix --format=concise "error message"
```

## Token Optimization

<!-- CUSTOMIZATION POINT: Set default output mode -->

Control output verbosity for cost optimization.

| Level | Flag | Savings | Description |
|-------|------|---------|-------------|
| Standard | (default) | 0% | Full explanations |
| Concise | `--format=concise` | 30-40% | Reduced explanations |
| Ultra | `--format=ultra` | 60-70% | Code-only responses |

### Session-Wide Optimization

```bash
/mode token-efficient         # Enable for entire session
```

Reference: `.claude/skills/optimization/token-efficient/SKILL.md`

## Context Management

### Project Indexing

Generate and use project structure index for faster navigation:

```bash
/index                        # Generate PROJECT_INDEX.md
/load api                     # Load API context
/load --all                   # Load full project context
```

### Session Checkpoints

Save and restore conversation state:

```bash
/checkpoint save "feature-x"  # Save current state
/checkpoint list              # List checkpoints
/checkpoint restore "feature-x" # Restore state
```

### Parallel Tasks

Launch background tasks for concurrent work:

```bash
/spawn "research auth patterns"
/spawn --list                 # Check status
/spawn --collect              # Gather results
```

## MCP Integrations

<!-- CUSTOMIZATION POINT: Enable/disable MCP servers -->

Optional MCP servers for extended capabilities.

| Server | Purpose | Status |
|--------|---------|--------|
| Context7 | Library documentation lookup | Optional |
| Sequential | Multi-step reasoning tools | Optional |
| Playwright | Browser automation (Microsoft) | Optional |
| Memory | Persistent knowledge graph | Optional |
| Filesystem | Secure file operations | Optional |

Setup: See `.claude/mcp/README.md`

## Methodology Settings

<!-- CUSTOMIZATION POINT: Configure superpowers methodology -->

Settings to control the integrated superpowers development methodology.

### Planning Granularity

| Mode | Task Size | Use Case |
|------|-----------|----------|
| `standard` | 15-60 min | Quick planning, experienced team |
| `detailed` | 2-5 min | Thorough plans with exact code |

To use detailed mode: `/plan --detailed [task]`

### Brainstorming Style

| Style | Description |
|-------|-------------|
| `standard` | All questions at once |
| `interactive` | One question per message with validation |

To use interactive mode: `/brainstorm [topic]`

### Execution Mode

| Mode | Description |
|------|-------------|
| `manual` | Developer executes tasks from plan |
| `subagent` | Automated execution with code review gates |

To use subagent mode: `/execute-plan [plan-file]`

### TDD Strictness

For strict TDD enforcement (no production code without failing test):
- Use `/tdd [feature]` command
- Reference: `.claude/skills/methodology/test-driven-development/SKILL.md`

### Verification Requirements

Enable mandatory verification before completion claims:
- Reference: `.claude/skills/methodology/verification-before-completion/SKILL.md`

### Available Methodology Skills

| Category | Skills |
|----------|--------|
| Planning | brainstorming, writing-plans, executing-plans |
| Testing | test-driven-development, verification-before-completion, testing-anti-patterns |
| Debugging | systematic-debugging, root-cause-tracing, defense-in-depth |
| Collaboration | dispatching-parallel-agents, requesting-code-review, receiving-code-review, finishing-development-branch |

Skills location: `.claude/skills/methodology/`

### Sequential Thinking

For complex problems requiring step-by-step analysis:
- Reference: `.claude/skills/methodology/sequential-thinking/SKILL.md`
- Activation: `/research --sequential [topic]` or use deep-research mode

## Environment Configuration

<!-- CUSTOMIZATION POINT: Update for your environments -->

### Development
```bash
# Python
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Node.js
pnpm install
pnpm dev
```

### Testing
```bash
# Python
pytest -v --cov=src

# Node.js
pnpm test
pnpm test:coverage
```

### Deployment
```bash
# Build
pnpm build

# Deploy
pnpm deploy:staging
pnpm deploy:production
```

## External Integrations

<!-- CUSTOMIZATION POINT: Add your integrations -->

### APIs
- GitHub API for issue tracking
- Slack for notifications (optional)

### Services
- Database: PostgreSQL / MongoDB
- Cache: Redis (optional)
- Storage: S3 / Cloudflare R2

## Documentation Standards

### Code Documentation
- Public functions: Docstrings required
- Complex logic: Inline comments
- APIs: OpenAPI/Swagger specs

### Project Documentation
- README.md: Quick start guide
- CONTRIBUTING.md: Contribution guidelines
- CHANGELOG.md: Version history

## Troubleshooting

### Common Issues

**Python import errors**
```bash
export PYTHONPATH="${PYTHONPATH}:${PWD}"
```

**Node modules issues**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Database connection**
- Check `.env` file for correct credentials
- Ensure database service is running

---

## Kit Version

- **Claude Kit Version**: 2.0.0
- **Last Updated**: 2025-01-29
- **Compatible with**: Claude Code 1.0+

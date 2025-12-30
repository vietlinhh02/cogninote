# /plan - Task Planning Command

## Purpose

Create structured implementation plans with task breakdown, dependencies, and time estimates for complex work.

## Usage

```
/plan [task description or feature request]
```

## Arguments

- `$ARGUMENTS`: Description of the task, feature, or work to plan

---

Create a detailed implementation plan for: **$ARGUMENTS**

## Workflow

### Phase 1: Understanding

1. **Parse Requirements**
   - Identify core functionality needed
   - List explicit requirements
   - Note implicit requirements
   - Identify acceptance criteria

2. **Clarify Ambiguities**
   - Ask questions if unclear
   - List assumptions made
   - Note dependencies on decisions

### Phase 2: Research

1. **Explore Codebase**
   - Find related implementations
   - Identify patterns to follow
   - Locate integration points
   - Note conventions

2. **Technical Research** (if needed)
   - Research unfamiliar technologies
   - Find best practices
   - Identify potential pitfalls

### Phase 3: Task Breakdown

1. **Decompose Work**
   - Break into atomic tasks
   - Each task: 15-60 minutes
   - Clear completion criteria

2. **Order by Dependencies**
   - What blocks what
   - Parallel opportunities
   - Critical path

3. **Add Estimates**
   - S: <30 min
   - M: 30-60 min
   - L: 1-2 hours
   - XL: 2-4 hours

### Phase 4: Documentation

1. **Create Plan Document**
   - Summary
   - Task list
   - Files to modify
   - Risks

2. **Track with TodoWrite**
   - Add all tasks
   - Set initial status

## Output

### Implementation Plan

```markdown
## Plan: [Feature/Task Name]

### Summary
[2-3 sentence overview of what will be built]

### Scope

**In Scope**
- [What will be done]

**Out of Scope**
- [What won't be done]

**Assumptions**
- [Key assumptions made]

---

### Tasks

#### Phase 1: Setup [Total: Xh]
| # | Task | Size | Depends On |
|---|------|------|------------|
| 1 | Create data model | M | - |
| 2 | Set up database migration | S | 1 |
| 3 | Add model tests | M | 1 |

#### Phase 2: Core Implementation [Total: Xh]
| # | Task | Size | Depends On |
|---|------|------|------------|
| 4 | Implement service layer | L | 1 |
| 5 | Add business logic | M | 4 |
| 6 | Write service tests | M | 5 |

#### Phase 3: API Layer [Total: Xh]
| # | Task | Size | Depends On |
|---|------|------|------------|
| 7 | Create API endpoints | M | 5 |
| 8 | Add validation | S | 7 |
| 9 | Write API tests | M | 8 |

#### Phase 4: Integration [Total: Xh]
| # | Task | Size | Depends On |
|---|------|------|------------|
| 10 | Integrate with frontend | M | 7 |
| 11 | End-to-end testing | M | 10 |
| 12 | Update documentation | S | 11 |

---

### Files to Create/Modify

**Create**
- `src/models/feature.py` - Data model
- `src/services/feature.py` - Business logic
- `src/api/feature.py` - API endpoints
- `tests/test_feature.py` - Tests

**Modify**
- `src/api/__init__.py` - Register routes
- `docs/api.md` - API documentation

---

### Dependencies

**External**
- [Package X] - For [purpose]

**Internal**
- Requires [existing feature] to be complete

---

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk 1] | High | [How to mitigate] |
| [Risk 2] | Medium | [How to mitigate] |

---

### Questions for Stakeholders
1. [Question about requirement]
2. [Question about edge case]

---

### Success Criteria
- [ ] All tasks completed
- [ ] Tests passing with 80%+ coverage
- [ ] API documentation updated
- [ ] Code reviewed and approved
```

## Plan Templates

### Feature Plan
For new functionality

### Bug Fix Plan
For debugging and fixing issues

### Refactor Plan
For code improvements

### Migration Plan
For data or system migrations

## Detailed Mode (Superpowers Methodology)

Use `--detailed` flag for superpowers-style plans with 2-5 minute tasks:

```
/plan --detailed [task description]
```

### Detailed Mode Features

**Reference**: `.claude/skills/methodology/writing-plans/SKILL.md`

When `--detailed` is specified:
- **Bite-sized tasks**: 2-5 minutes each (vs standard 15-60 min)
- **Exact file paths**: Always include full paths
- **Complete code samples**: Actual code, not descriptions
- **TDD steps per task**: Write test → verify fail → implement → verify pass → commit
- **Expected command outputs**: Specify what success looks like

### Detailed Task Template

```markdown
## Task [N]: [Task Name]

**Files**:
- Create: `path/to/new-file.ts`
- Modify: `path/to/existing-file.ts`
- Test: `path/to/test-file.test.ts`

**Steps**:

1. Write failing test
   ```typescript
   // Exact test code
   ```

2. Verify test fails
   ```bash
   npm test -- --grep "test name"
   # Expected: 1 failing
   ```

3. Implement minimally
   ```typescript
   // Exact implementation code
   ```

4. Verify test passes
   ```bash
   npm test -- --grep "test name"
   # Expected: 1 passing
   ```

5. Commit
   ```bash
   git commit -m "feat: add [feature]"
   ```
```

### Execution After Planning

Use `/execute-plan [plan-file]` for subagent-driven execution with code review gates.

**Reference**: `.claude/skills/methodology/executing-plans/SKILL.md`

## Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--mode=[mode]` | Use specific behavioral mode | `--mode=brainstorm` |
| `--detailed` | Use superpowers methodology (2-5 min tasks) | `--detailed` |
| `--depth=[1-5]` | Planning thoroughness level | `--depth=4` |
| `--format=[fmt]` | Output format (concise/detailed/json) | `--format=detailed` |
| `--save=[path]` | Save plan to file | `--save=plans/auth.md` |
| `--checkpoint` | Create checkpoint after planning | `--checkpoint` |

### Flag Usage Examples

```bash
/plan --detailed "implement user authentication"
/plan --mode=brainstorm "redesign checkout flow"
/plan --depth=5 --save=plans/migration.md "database migration"
/plan --format=json "api endpoint structure"
```

### Mode Recommendations

| Mode | Best For |
|------|----------|
| `default` | Standard planning |
| `brainstorm` | Exploratory planning, multiple approaches |
| `deep-research` | Complex features needing investigation |
| `implementation` | Quick plans for clear tasks |

## MCP Integration

This command leverages MCP servers for enhanced planning:

### Sequential Thinking - Structured Planning (Primary)
```
ALWAYS use Sequential Thinking for task decomposition:
- Break complex tasks into logical thought sequences
- Track dependencies between steps
- Revise plan as understanding deepens
- Use for risk identification and mitigation planning
```

### Memory - Decision Persistence
```
Store and recall planning context:
- Remember decisions from previous planning sessions
- Recall user preferences for task sizing
- Store architectural patterns for reuse
- Create entities for major features/components
```

### Context7 - Technology Research
```
When planning involves unfamiliar technologies:
- Fetch current documentation for accurate estimates
- Understand API patterns before estimating complexity
- Identify potential integration challenges
```

### Filesystem - Codebase Analysis
```
For accurate file identification:
- Use directory_tree to understand project structure
- Use search_files to find existing patterns
- Identify files to create vs modify
```

<!-- CUSTOMIZATION POINT -->
## Variations

Modify behavior via CLAUDE.md:
- Task size definitions (standard: 15-60 min, detailed: 2-5 min)
- Required plan sections
- Estimation approach
- Risk assessment criteria

# /brainstorm - Interactive Design Session

## Purpose

Start an interactive brainstorming session using the one-question-at-a-time methodology. Refine rough ideas into fully-formed designs through collaborative dialogue.

## Usage

```
/brainstorm [topic or feature to design]
```

## Arguments

- `$ARGUMENTS`: The topic, feature, or problem to brainstorm about

---

Start interactive brainstorming session for: **$ARGUMENTS**

## Methodology

**Reference**: `.claude/skills/methodology/brainstorming/SKILL.md`

This command uses the superpowers brainstorming methodology for optimal results.

## Workflow

### Phase 1: Understanding

**Goal**: Clarify requirements through sequential questioning.

**Rules**:
1. Ask **ONE question per message**
2. Wait for user response before next question
3. Prefer **multiple-choice** over open-ended questions
4. Break complex topics into multiple questions

**Example interaction**:
```
Claude: "What type of authentication should we support?
         a) Username/password only
         b) OAuth providers (Google, GitHub)
         c) Both options
         d) Magic link (passwordless)"

User: "b"

Claude: "Which OAuth providers should we integrate?
         a) Google only
         b) GitHub only
         c) Both Google and GitHub
         d) Let me specify others..."
```

### Phase 2: Exploration

**Goal**: Present alternatives with clear trade-offs.

Present 2-3 approaches:
- Lead with recommended option
- Explain trade-offs for each
- Let user choose direction

```markdown
## Approach 1: JWT-based (Recommended)
- Stateless, scalable
- Cons: Can't revoke instantly

## Approach 2: Session-based
- Easy revocation
- Cons: Requires session store

Which approach aligns better with your goals?
```

### Phase 3: Design Presentation

**Goal**: Present validated design incrementally.

**Rules**:
- Break into **200-300 word sections**
- Validate after each section
- Cover: architecture, components, data flow, error handling, testing

**Sections to present**:
1. Architecture overview
2. Component breakdown
3. Data flow
4. Error handling
5. Testing considerations

## Core Principles

### YAGNI Ruthlessly

Remove unnecessary features aggressively:
- Question every "nice to have"
- Start with minimal viable design
- "We might need this later" = remove it

### One Question at a Time

Sequential questioning produces better results:
- Gives user time to think deeply
- Prevents overwhelming with choices
- Creates natural conversation flow

### Multiple-Choice Preference

When possible, provide structured options:
- Reduces cognitive load
- Surfaces your understanding
- Makes decisions concrete

## Output

After design is validated, create design document:

```markdown
# Design: [Feature Name]
Date: [YYYY-MM-DD]

## Summary
[2-3 sentences]

## Architecture
[Architecture decisions]

## Components
[Component breakdown]

## Data Flow
[How data moves through system]

## Error Handling
[Error scenarios and handling]

## Testing Strategy
[Testing approach]

## Open Questions
[Any remaining unknowns]
```

## Next Steps After Brainstorming

After design is complete:
1. Commit design document to version control
2. Use `/plan --detailed` for implementation planning
3. Use `/execute-plan` for automated implementation

## Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--mode=[mode]` | Use specific behavioral mode | `--mode=brainstorm` |
| `--depth=[1-5]` | Exploration depth level | `--depth=4` |
| `--format=[fmt]` | Output format (concise/detailed) | `--format=detailed` |
| `--save=[path]` | Save design document to file | `--save=docs/design.md` |
| `--quick` | Shorter session, fewer questions | `--quick` |
| `--comprehensive` | Longer session, thorough exploration | `--comprehensive` |

### Flag Usage Examples

```bash
/brainstorm --comprehensive "authentication system design"
/brainstorm --save=docs/payment-design.md "payment integration"
/brainstorm --quick "simple file upload feature"
/brainstorm --depth=5 "microservices architecture"
```

### Session Depth

| Level | Questions | Exploration |
|-------|-----------|-------------|
| 1 | 2-3 | Quick validation only |
| 2 | 4-5 | Standard session |
| 3 | 6-8 | Thorough exploration |
| 4 | 8-10 | Comprehensive |
| 5 | 10+ | Exhaustive, all angles |

## MCP Integration

This command leverages MCP servers for enhanced brainstorming:

### Sequential Thinking - Structured Exploration (Primary)
```
ALWAYS use Sequential Thinking for brainstorming:
- Explore design options systematically
- Track pros/cons for each approach
- Revise conclusions based on user feedback
- Build confidence in final design incrementally
```

### Memory - Design Persistence
```
Store design decisions for continuity:
- Create entities for design concepts
- Store user preferences and constraints
- Recall previous design patterns
- Build knowledge graph of architecture decisions
```

### Context7 - Technology Options
```
When exploring technology choices:
- Fetch current documentation for options
- Compare library capabilities accurately
- Understand trade-offs with real data
```

## When NOT to Use

- Clear "mechanical" processes with known implementation
- Simple bug fixes with obvious solutions
- Tasks with explicit requirements already defined

Use direct implementation instead.

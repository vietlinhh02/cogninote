# /tdd - Test-Driven Development Workflow

## Purpose

Start a TDD workflow: write failing tests first, then implement to make them pass.

## Usage

```
/tdd [feature or function description]
```

---

Start TDD workflow for: **$ARGUMENTS**

## Workflow

### Phase 1: Red - Write Failing Tests

1. **Understand Requirements**
   - What should the code do?
   - What are the inputs/outputs?
   - What edge cases exist?

2. **Write Tests First**
   ```python
   def test_feature_does_expected_thing():
       result = feature("input")
       assert result == "expected"
   ```

3. **Run Tests (Expect Failure)**
   ```bash
   pytest -v  # Should fail
   ```

### Phase 2: Green - Make Tests Pass

1. **Implement Minimal Code**
   - Just enough to pass tests
   - No premature optimization

2. **Run Tests (Expect Success)**
   ```bash
   pytest -v  # Should pass
   ```

### Phase 3: Refactor

1. **Improve Code Quality**
   - Clean up implementation
   - Remove duplication
   - Improve naming

2. **Run Tests (Ensure Still Passing)**
   ```bash
   pytest -v  # Should still pass
   ```

### Phase 4: Repeat

Add more test cases and repeat the cycle.

## TDD Best Practices

- Write one test at a time
- Tests should be specific and focused
- Keep the red-green-refactor cycle short
- Commit after each green phase

## Superpowers TDD Methodology

**Reference**: `.claude/skills/methodology/test-driven-development/SKILL.md`

### Non-Negotiable Rule

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST**

This is not a guideline - it's a rule.

### If You Already Wrote Code

Delete it. Completely. Don't keep it as reference.

```
WRONG: "I'll keep this code as reference while writing tests"
RIGHT: Delete the code, write test, rewrite implementation
```

### Verification Before Completion

**Reference**: `.claude/skills/methodology/verification-before-completion/SKILL.md`

Before claiming tests pass:
1. **Identify** the command that proves assertion
2. **Execute** it fully and freshly
3. **Read** complete output
4. **Verify** output matches claim
5. **Only then** make the claim

### Forbidden Language

Never use without verification:
- "should work"
- "probably fixed"
- "seems to pass"

### Testing Anti-Patterns to Avoid

**Reference**: `.claude/skills/methodology/testing-anti-patterns/SKILL.md`

1. Testing mock behavior instead of real code
2. Polluting production with test-only methods
3. Mocking without understanding dependencies
4. Creating incomplete mocks
5. Writing tests as afterthoughts

## Output

```markdown
## TDD Session: [Feature]

### Tests Written
1. `test_basic_functionality` - [description]
2. `test_edge_case` - [description]

### Implementation
`src/feature.py` - [description]

### Cycle Summary
- Red: 3 tests written
- Green: All passing
- Refactor: Extracted helper function
```

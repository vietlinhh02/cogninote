# /refactor - Refactoring Command

## Purpose

Improve code structure, readability, or performance without changing behavior.

## Usage

```
/refactor [file or function] [goal: clean | extract | simplify | optimize]
```

---

Refactor: **$ARGUMENTS**

## Workflow

### Step 1: Understand Current Code

1. Read the code thoroughly
2. Identify what it does
3. Note existing tests

### Step 2: Plan Refactoring

1. Identify improvement opportunities
2. Ensure tests exist
3. Plan incremental changes

### Step 3: Execute

1. Make small, focused changes
2. Run tests after each change
3. Commit incrementally

## Refactoring Types

- **Extract**: Pull out reusable functions
- **Simplify**: Reduce complexity
- **Rename**: Improve clarity
- **Clean**: Remove dead code

## Output

```markdown
## Refactoring Complete

### Changes Made
- Extracted `validateInput()` function
- Simplified conditional logic
- Renamed `x` to `userCount`

### Before/After
[Code comparison]

### Tests
All passing
```

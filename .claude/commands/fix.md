# /fix - Bug Fix Workflow

## Purpose

Smart debugging and bug fixing workflow that analyzes errors, identifies root causes, implements fixes, and adds regression tests.

## Usage

```
/fix [error message, bug description, or issue reference]
```

## Arguments

- `$ARGUMENTS`: Error message, stack trace, bug description, or issue number

---

Analyze and fix the following issue: **$ARGUMENTS**

## Workflow

### Phase 1: Error Analysis

1. **Parse Error Information**
   - Extract error type and message
   - Parse stack trace if available
   - Identify the failing location

2. **Gather Context**
   - When does this error occur?
   - What triggers it?
   - Is it reproducible?
   - When did it start happening?

3. **Check for Known Patterns**
   - Common error patterns
   - Similar issues in codebase
   - Recent changes that might have caused it

### Phase 2: Root Cause Investigation

1. **Trace Execution**
   - Follow the code path to the error
   - Identify state at each step
   - Find where expectations diverge

2. **Form Hypotheses**
   - List possible causes ranked by likelihood
   - Identify minimal tests to validate each

3. **Validate Hypothesis**
   - Test the most likely cause first
   - Confirm root cause before fixing
   - Don't fix symptoms only

### Phase 3: Search Related Code

1. **Find Similar Code**
   - Search for similar patterns
   - Check if same bug exists elsewhere
   - Identify shared code that might be affected

2. **Review Recent Changes**
   ```bash
   git log --oneline -20
   git blame [file]
   ```

### Phase 4: Implement Fix

1. **Develop Minimal Fix**
   - Fix the root cause, not symptoms
   - Keep changes minimal and focused
   - Consider edge cases

2. **Add Defensive Code** (if appropriate)
   - Input validation
   - Null checks
   - Error handling

3. **Update Related Code** (if needed)
   - Fix same issue in similar code
   - Update shared utilities

### Phase 5: Verification

1. **Test the Fix**
   - Verify original error is resolved
   - Check related functionality
   - Run existing test suite

2. **Add Regression Test**
   - Write test that would have caught this bug
   - Include edge cases discovered
   - Ensure test fails without fix

3. **Run Full Test Suite**
   ```bash
   # Python
   pytest -v

   # TypeScript
   pnpm test
   ```

### Phase 6: Documentation

1. **Document the Fix**
   - What was the issue
   - What caused it
   - How it was fixed

2. **Update Comments** (if needed)
   - Add clarifying comments
   - Document non-obvious behavior

## Output

### Bug Fix Summary

```markdown
## Bug Fix Complete

### Issue
[Original error/bug description]

### Root Cause
[Explanation of what caused the bug]

### Location
`path/to/file.ts:42` - [function/method name]

### Fix Applied

**Before:**
```[language]
// Problematic code
```

**After:**
```[language]
// Fixed code
```

### Explanation
[Why this fix resolves the issue]

### Regression Test Added
`path/to/test.ts` - `test_[scenario]`

### Verification
- [x] Original error no longer occurs
- [x] Existing tests pass
- [x] New regression test passes
- [x] No new issues introduced

### Related Areas Checked
- [x] `path/to/similar.ts` - No similar issue

### Commands to Verify
```bash
pytest tests/test_file.py -v
# or
pnpm test path/to/file.test.ts
```
```

## Common Fix Patterns

### Null/Undefined Access

```typescript
// Before
const name = user.profile.name;

// After
const name = user?.profile?.name ?? 'Unknown';
```

### Missing Error Handling

```python
# Before
data = json.loads(response.text)

# After
try:
    data = json.loads(response.text)
except json.JSONDecodeError as e:
    logger.error(f"Invalid JSON response: {e}")
    raise InvalidResponseError("Failed to parse response")
```

### Race Condition

```typescript
// Before
const data = await fetchData();
setState(data); // May be unmounted

// After
useEffect(() => {
  let cancelled = false;
  fetchData().then(data => {
    if (!cancelled) setState(data);
  });
  return () => { cancelled = true; };
}, []);
```

### Off-by-One Error

```python
# Before
for i in range(len(items) + 1):  # IndexError
    process(items[i])

# After
for i in range(len(items)):
    process(items[i])
# or
for item in items:
    process(item)
```

## Example

**Input**: `/fix TypeError: Cannot read property 'email' of undefined in UserService.ts:45`

**Output**:
1. Analysis: User object is undefined when accessed
2. Root cause: async fetch didn't await, user not loaded yet
3. Fix: Add null check and proper async handling
4. Regression test: Test for case when user is not loaded

## Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--mode=[mode]` | Use specific behavioral mode | `--mode=deep-research` |
| `--persona=[type]` | Apply persona expertise | `--persona=security` |
| `--depth=[1-5]` | Investigation thoroughness | `--depth=4` |
| `--format=[fmt]` | Output format (concise/detailed) | `--format=concise` |
| `--skip-regression` | Skip regression test creation | `--skip-regression` |
| `--checkpoint` | Create checkpoint before fixing | `--checkpoint` |

### Flag Usage Examples

```bash
/fix --mode=deep-research "intermittent timeout error"
/fix --persona=security "SQL injection vulnerability"
/fix --depth=5 "race condition in auth flow"
/fix --format=concise "typo in error message"
```

### Persona Options

| Persona | Focus Area |
|---------|------------|
| `security` | Security vulnerabilities, OWASP |
| `performance` | Speed, memory, efficiency |
| `reliability` | Error handling, edge cases |

## MCP Integration

This command leverages MCP servers for enhanced debugging:

### Sequential Thinking - Root Cause Analysis (Primary)
```
ALWAYS use Sequential Thinking for debugging:
- Trace execution path step-by-step
- Form and test hypotheses systematically
- Track confidence in each potential cause
- Revise understanding as evidence emerges
```

### Memory - Bug Context
```
Store and recall debugging context:
- Remember similar bugs from previous sessions
- Recall fix patterns that worked before
- Store root cause analysis for future reference
- Create relations between bugs and affected components
```

### Playwright - Browser Testing
```
For UI/frontend bugs:
- Reproduce the bug in browser environment
- Test fix across different browsers
- Verify visual regressions are resolved
- Automate regression test for the fix
```

### Context7 - Library Issues
```
When debugging library-related issues:
- Fetch current documentation for correct usage
- Check for known issues or breaking changes
- Find correct patterns and examples
```

### Filesystem - Code Search
```
For tracing bug across codebase:
- Use search_files to find related code
- Use read_file to examine suspicious areas
- Track changes with file history
```

<!-- CUSTOMIZATION POINT -->
## Variations

Modify behavior via CLAUDE.md:
- Set required test coverage for fixes
- Define severity levels for bugs
- Configure error reporting format
- Set required review process

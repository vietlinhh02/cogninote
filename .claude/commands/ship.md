# /ship - Ship Code Command

## Purpose

Complete workflow to commit changes, run reviews, execute tests, and create a pull request ready for merge.

## Usage

```
/ship [commit message or 'quick']
```

## Arguments

- `$ARGUMENTS`:
  - Commit message: Use as commit subject
  - `quick`: Auto-generate message, skip review

---

Ship the current changes with: **$ARGUMENTS**

## Workflow

### Phase 1: Pre-Ship Checks

1. **Check Repository Status**
   ```bash
   git status
   git diff --staged
   ```

2. **Identify Changes**
   - Files modified
   - Files added
   - Files deleted

3. **Quick Validation**
   - No secrets in changes
   - No debug statements
   - No commented-out code

### Phase 2: Code Review (unless 'quick')

1. **Run Self-Review**
   - Check code quality
   - Verify style compliance
   - Identify security issues

2. **Address Critical Issues**
   - Fix any critical problems
   - Note recommendations

### Phase 3: Run Tests

1. **Execute Test Suite**
   ```bash
   # Python
   pytest -v

   # TypeScript
   pnpm test
   ```

2. **Verify All Pass**
   - No failing tests
   - No new warnings

3. **Check Coverage**
   - Coverage not decreased
   - New code is tested

### Phase 4: Create Commit

1. **Stage Changes**
   ```bash
   git add -A
   ```

2. **Generate Commit Message**
   - Follow conventional commit format
   - Reference issues if applicable

3. **Create Commit**
   ```bash
   git commit -m "$(cat <<'EOF'
   type(scope): subject

   body

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

### Phase 5: Push and Create PR

1. **Push to Remote**
   ```bash
   git push -u origin [branch-name]
   ```

2. **Create Pull Request**
   ```bash
   gh pr create --title "type(scope): description" --body "$(cat <<'EOF'
   ## Summary
   - Change 1
   - Change 2

   ## Test Plan
   - [ ] Tests pass
   - [ ] Manual testing

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

## Output

### Ship Report

```markdown
## Ship Complete

### Commit
**Hash**: `abc1234`
**Message**: `feat(auth): add password reset functionality`

### Changes
| File | Change |
|------|--------|
| `src/auth/reset.ts` | Added |
| `src/auth/routes.ts` | Modified |
| `tests/auth/reset.test.ts` | Added |

### Checks
- [x] Code review passed
- [x] Tests passing (42 tests)
- [x] Coverage: 85% (+3%)
- [x] No security issues

### Pull Request
**URL**: https://github.com/org/repo/pull/123
**Title**: feat(auth): add password reset functionality
**Base**: main
**Status**: Ready for review

### Next Steps
1. Request review from team
2. Address any feedback
3. Merge when approved
```

## Quick Ship Mode

When using `/ship quick`:
- Skip detailed code review
- Auto-generate commit message
- Minimal output

```bash
# Quick ship for small changes
/ship quick
```

## Commit Message Generation

Based on changes, generate appropriate message:

### Feature
```
feat(scope): add [feature]

- Added [component/function]
- Implemented [functionality]
- Added tests for [scenarios]
```

### Bug Fix
```
fix(scope): resolve [issue]

- Fixed [bug description]
- Added null check for [case]
- Updated tests
```

### Refactor
```
refactor(scope): improve [area]

- Extracted [logic] to [location]
- Renamed [old] to [new]
- Simplified [complex code]
```

## Pre-Ship Checklist

- [ ] All changes staged
- [ ] No unintended files included
- [ ] Tests pass
- [ ] No secrets in code
- [ ] No debug statements
- [ ] Commit message is descriptive
- [ ] PR description is complete

<!-- CUSTOMIZATION POINT -->
## Variations

Modify behavior via CLAUDE.md:
- Required checks before ship
- Commit message format
- PR template requirements
- Auto-merge settings

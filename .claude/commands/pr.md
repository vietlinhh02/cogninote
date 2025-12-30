# /pr - Create Pull Request

## Purpose

Create a well-documented pull request with proper description and checks.

## Usage

```
/pr [title or 'auto']
```

---

Create a pull request: **$ARGUMENTS**

## Workflow

### Step 1: Prepare Changes

```bash
git status
git diff main...HEAD
```

### Step 2: Verify Ready

- [ ] All tests passing
- [ ] Code reviewed
- [ ] No merge conflicts
- [ ] Branch pushed

### Step 3: Create PR

```bash
gh pr create --title "type(scope): description" --body "$(cat <<'EOF'
## Summary
- [Change 1]
- [Change 2]

## Test Plan
- [ ] Unit tests
- [ ] Manual testing

## Screenshots
[If applicable]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Output

```markdown
## Pull Request Created

**URL**: https://github.com/org/repo/pull/123
**Title**: feat(auth): add OAuth support
**Base**: main ← feature/oauth

### Changes
- 5 files changed
- +234 -12 lines
```

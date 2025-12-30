# /commit - Smart Commit Command

## Purpose

Create a well-formatted commit with auto-generated message based on staged changes.

## Usage

```
/commit [optional message hint]
```

## Arguments

- `$ARGUMENTS`: Optional hint for commit message focus (e.g., "auth", "bugfix", "refactor")

---

Create a commit for staged changes with hint: **$ARGUMENTS**

## Workflow

### Step 1: Analyze Changes

1. **Check Status**
   ```bash
   git status
   ```

2. **View Staged Changes**
   ```bash
   git diff --staged
   ```

3. **Review Recent Commits**
   ```bash
   git log --oneline -5
   ```

### Step 2: Categorize Changes

Determine commit type:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Step 3: Generate Message

Follow conventional commit format:
```
type(scope): subject

body (optional)

footer (optional)
```

### Step 4: Create Commit

```bash
git commit -m "$(cat <<'EOF'
type(scope): subject

- Change 1
- Change 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Commit Message Guidelines

### Subject Line
- Max 50 characters
- Imperative mood ("Add" not "Added")
- No period at end
- Capitalize first letter

### Body
- Wrap at 72 characters
- Explain what and why
- Use bullet points for multiple changes

### Examples

#### Feature
```
feat(auth): add password reset functionality

- Add reset token generation
- Implement email sending
- Add rate limiting for reset requests

Closes #123
```

#### Bug Fix
```
fix(api): handle null user in profile endpoint

The profile endpoint crashed when accessing deleted users.
Added null check and proper 404 response.

Fixes #456
```

#### Refactor
```
refactor(database): extract query builders

Split large database service into focused modules
for better maintainability and testing.
```

#### Documentation
```
docs(readme): update installation instructions

- Add prerequisites section
- Update configuration examples
- Fix broken links
```

#### Test
```
test(auth): add missing login tests

- Add test for invalid credentials
- Add test for locked account
- Add test for expired session
```

#### Chore
```
chore(deps): update dependencies

- Update React to 18.2
- Update TypeScript to 5.3
- Remove unused packages
```

## Output

### Commit Created

```markdown
## Commit Created

**Hash**: `abc1234`
**Branch**: `feature/auth-improvements`

### Message
```
feat(auth): add OAuth2 login support

- Implement Google OAuth provider
- Implement GitHub OAuth provider
- Add session token generation
- Update user model for OAuth data

Closes #789
```

### Files Changed
| Status | File |
|--------|------|
| M | src/auth/providers.ts |
| A | src/auth/oauth/google.ts |
| A | src/auth/oauth/github.ts |
| M | src/models/user.ts |
| A | tests/auth/oauth.test.ts |

### Stats
- 5 files changed
- 234 insertions(+)
- 12 deletions(-)

### Next Steps
```bash
# Push to remote
git push -u origin feature/auth-improvements

# Create PR
gh pr create
```
```

## Pre-Commit Checks

Before committing:
- [ ] No secrets in staged files
- [ ] No debug statements
- [ ] No TODO comments (unless intentional)
- [ ] Code is formatted

## Amending Commits

If pre-commit hooks modify files:
```bash
# Stage modified files and amend
git add -A
git commit --amend --no-edit
```

<!-- CUSTOMIZATION POINT -->
## Variations

Modify behavior via CLAUDE.md:
- Commit message format
- Required sections
- Issue reference format
- Co-author settings

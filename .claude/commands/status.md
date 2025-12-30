# /status - Project Status Command

## Purpose

Get current project status including tasks, git state, and recent activity.

## Usage

```
/status
```

---

Show current project status.

## Workflow

1. **Check Git Status**
   ```bash
   git status
   git log --oneline -5
   ```

2. **Review Todos**
   - In progress
   - Pending
   - Completed today

3. **Recent Activity**
   - Recent commits
   - Open PRs
   - Open issues

## Output

```markdown
## Project Status

### Git
- Branch: `feature/xyz`
- Status: Clean / X modified files

### Tasks
- In Progress: X
- Pending: Y
- Completed: Z

### Recent Commits
1. [commit message]
2. [commit message]

### Open PRs
- #123: [title]
```

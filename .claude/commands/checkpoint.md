# /checkpoint

## Purpose

Save and restore conversation context using git-based checkpoints. Enables session recovery and state preservation for complex, multi-session work.

---

Manage checkpoints for the current work session.

## Checkpoint Operations

### Save Checkpoint

Create a checkpoint of current state:

```bash
/checkpoint save [name]
```

**Process:**
1. Create git stash with descriptive message
2. Record current context (files being worked on, task state)
3. Save checkpoint metadata to `.claude/checkpoints/[name].json`

**Metadata Format:**
```json
{
  "name": "feature-auth",
  "created": "2024-01-15T14:30:00Z",
  "git_stash": "stash@{0}",
  "files_in_context": ["src/auth/login.ts", "src/auth/token.ts"],
  "current_task": "Implementing JWT refresh",
  "notes": "User-provided notes"
}
```

### List Checkpoints

Show available checkpoints:

```bash
/checkpoint list
```

**Output:**
```markdown
## Available Checkpoints

| Name | Created | Task | Stash |
|------|---------|------|-------|
| feature-auth | 2h ago | JWT refresh | stash@{0} |
| bugfix-login | 1d ago | Login timeout | stash@{1} |
```

### Restore Checkpoint

Restore a previous checkpoint:

```bash
/checkpoint restore [name]
```

**Process:**
1. Apply git stash
2. Load checkpoint metadata
3. Summarize restored context
4. Ready to continue work

### Delete Checkpoint

Remove a checkpoint:

```bash
/checkpoint delete [name]
```

## Flags

| Flag | Description |
|------|-------------|
| `--notes="[text]"` | Add notes to checkpoint |
| `--force` | Overwrite existing checkpoint |
| `--include-uncommitted` | Include uncommitted changes |
| `--dry-run` | Show what would be saved |

## Usage Examples

```bash
/checkpoint save auth-progress              # Save current state
/checkpoint save auth --notes="WIP tokens"  # Save with notes
/checkpoint list                            # Show checkpoints
/checkpoint restore auth-progress           # Restore state
/checkpoint delete old-checkpoint           # Remove checkpoint
```

## Arguments

$ARGUMENTS

Parse the operation (save/list/restore/delete) and checkpoint name.

---

## Auto-Checkpoint

For complex tasks, checkpoints are automatically suggested:
- Before major refactoring
- When switching contexts
- Before risky operations
- At natural breakpoints

## Best Practices

1. **Name Descriptively**: Use task-related names
2. **Add Notes**: Future you will thank present you
3. **Checkpoint Often**: Before context switches
4. **Clean Up**: Delete obsolete checkpoints

## Recovery Workflow

When resuming work:
```
1. /checkpoint list              # See available states
2. /checkpoint restore [name]    # Restore context
3. Continue where you left off   # Context is loaded
```

## Limitations

- Checkpoints use git stash (requires git repo)
- Large uncommitted changes may be slow
- Metadata stored in `.claude/checkpoints/`
- Consider committing before checkpointing for safety

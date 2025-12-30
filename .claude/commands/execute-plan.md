# /execute-plan - Subagent-Driven Plan Execution

## Purpose

Execute a detailed implementation plan using fresh subagents per task with mandatory code review gates between tasks.

## Usage

```
/execute-plan [plan-file-path]
```

## Arguments

- `$ARGUMENTS`: Path to the plan file (created with `/plan --detailed`)

---

Execute plan from: **$ARGUMENTS**

## Methodology

**Reference**: `.claude/skills/methodology/executing-plans/SKILL.md`

This command uses the superpowers execution methodology for quality-gated implementation.

## Core Pattern

**"Fresh subagent per task + review between tasks = high quality, fast iteration"**

### Why Fresh Agents?

- Prevents context pollution between tasks
- Each task gets focused attention
- Failures don't cascade
- Easier to retry individual tasks

### Why Code Review Between Tasks?

- Catches issues early
- Ensures code matches intent
- Prevents technical debt accumulation
- Creates natural checkpoints

## Workflow

### Step 1: Load Plan

1. Read the plan file
2. Verify plan is complete and approved
3. Create TodoWrite with all tasks from plan
4. Set first task to `in_progress`

### Step 2: Execute Task (For Each Task)

```markdown
1. Dispatch fresh subagent with task details
2. Subagent implements following TDD cycle:
   - Write failing test
   - Verify test fails
   - Implement minimally
   - Verify test passes
   - Commit
3. Subagent returns completion summary
```

### Step 3: Code Review

After each task:

```markdown
1. Dispatch code-reviewer subagent
2. Review scope: only changes from current task
3. Reviewer returns findings:
   - Critical: Must fix before proceeding
   - Important: Should fix before proceeding
   - Minor: Can fix later
```

### Step 4: Handle Review Findings

```markdown
IF Critical or Important issues found:
  1. Dispatch fix subagent for each issue
  2. Re-request code review
  3. Repeat until no Critical/Important issues

IF only Minor issues:
  1. Note for later cleanup
  2. Proceed to next task
```

### Step 5: Mark Complete

1. Update TodoWrite - mark task completed
2. Move to next task
3. Repeat from Step 2

### Step 6: Final Review

After all tasks complete:

1. Dispatch comprehensive code review
2. Review entire implementation against plan
3. Verify all success criteria met
4. Run full test suite
5. Use `finishing-development-branch` skill

## Critical Rules

### Never Skip Code Reviews

Every task must be reviewed before proceeding. No exceptions.

### Never Proceed with Critical Issues

Critical issues must be fixed:
```
implement → review → fix critical → re-review → proceed
```

### Never Run Parallel Implementation

Tasks run sequentially:
```
WRONG: Run Task 1, 2, 3 simultaneously
RIGHT: Task 1 → Review → Task 2 → Review → Task 3 → Review
```

### Always Read Plan Before Implementing

```
WRONG: Start coding based on memory of plan
RIGHT: Read plan file, extract task details, then implement
```

## Error Handling

### Task Fails

1. Capture error details
2. Attempt fix (max 2 retries)
3. If still failing, pause execution
4. Report to user with:
   - Which task failed
   - Error details
   - Suggested resolution
5. Wait for user decision

### Review Finds Major Issues

1. List all Critical/Important issues
2. Dispatch fix subagent for each
3. Re-run code review
4. If issues persist after 2 cycles:
   - Pause execution
   - Report to user
   - May need plan revision

## Output

### Progress Updates

```markdown
## Execution Progress

### Task 1: Create User model ✓
- Files modified: src/models/user.ts
- Tests added: 3
- Review: Passed

### Task 2: Add validation ✓
- Files modified: src/models/user.ts
- Tests added: 2
- Review: Passed (1 minor deferred)

### Task 3: Create endpoint [IN PROGRESS]
- Status: Implementing...
```

### Completion Summary

```markdown
## Execution Complete

### Summary
- Tasks completed: 8/8
- Tests added: 24
- Coverage: 92%

### Files Created
- src/models/user.ts
- src/services/user-service.ts
- src/routes/user.ts

### Files Modified
- src/routes/index.ts
- src/types/index.ts

### Deferred Items
- Minor: Variable rename in user-service.ts line 12

### Next Steps
- Run full test suite
- Use /ship to create PR
```

## Prerequisites

Before using this command:

1. Plan file exists and is complete
2. Plan was created with `/plan --detailed`
3. Plan has been reviewed and approved
4. Tests can be run (`npm test` or `pytest`)

## Related Commands

- `/plan --detailed` - Create detailed plan
- `/brainstorm` - Design before planning
- `/ship` - Create PR after execution

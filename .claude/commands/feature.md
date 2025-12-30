# /feature - Feature Development Workflow

## Purpose

End-to-end feature development workflow that orchestrates planning, implementation guidance, testing, and code review.

## Usage

```
/feature [feature description or issue reference]
```

## Arguments

- `$ARGUMENTS`: Feature description, issue number, or requirement specification

---

Implement a complete feature development workflow for: **$ARGUMENTS**

## Workflow

### Phase 1: Planning

First, analyze the feature request and create an implementation plan:

1. **Understand Requirements**
   - Parse the feature description thoroughly
   - Identify acceptance criteria
   - List assumptions that need validation
   - Clarify any ambiguous requirements with the user

2. **Explore Codebase**
   - Find related existing implementations
   - Identify patterns and conventions to follow
   - Locate integration points
   - Note dependencies

3. **Create Task Breakdown**
   - Decompose into atomic, verifiable tasks
   - Order tasks by dependencies
   - Include testing requirements
   - Estimate complexity (S/M/L)

4. **Use TodoWrite** to track all tasks

### Phase 2: Research (If Needed)

If the feature involves unfamiliar technology:

1. Research best practices and patterns
2. Find examples in the codebase or documentation
3. Identify potential pitfalls
4. Document key decisions

### Phase 3: Implementation Guidance

For each implementation task:

1. **Identify Target Files**
   - Existing files to modify
   - New files to create
   - Tests to add/update

2. **Provide Implementation Direction**
   - Code structure recommendations
   - Patterns to follow
   - Edge cases to handle
   - Error handling approach

3. **Review Progress**
   - Mark tasks complete as you go
   - Identify blockers early
   - Adjust plan if needed

### Phase 4: Testing

After implementation:

1. **Generate Tests**
   - Unit tests for new functions
   - Integration tests for workflows
   - Edge case coverage

2. **Run Test Suite**
   ```bash
   # Python
   pytest -v --cov=src

   # TypeScript
   pnpm test
   ```

3. **Verify Coverage**
   - Ensure new code is tested
   - Coverage should not decrease

### Phase 5: Code Review

Before completion:

1. **Self-Review Checklist**
   - [ ] Code follows project conventions
   - [ ] No security vulnerabilities
   - [ ] Error handling is complete
   - [ ] Documentation updated
   - [ ] Tests are passing

2. **Review Staged Changes**
   ```bash
   git diff --staged
   ```

3. **Address Any Issues**
   - Fix critical issues immediately
   - Note recommendations for future

### Phase 6: Completion

1. **Verify All Tasks Complete**
   - All TodoWrite items done
   - All tests passing
   - Documentation updated

2. **Prepare for Commit**
   - Stage appropriate files
   - Generate commit message
   - Create PR if requested

## Output

### Deliverables

1. **Implementation Plan** - Structured task breakdown
2. **Code Changes** - Feature implementation
3. **Tests** - Comprehensive test coverage
4. **Documentation** - Updated docs if needed
5. **Commit/PR** - Ready for merge

### Summary Format

```markdown
## Feature Implementation Complete

### Feature
[Feature description]

### Changes Made
- `path/to/file.ts` - [What was added/modified]
- `path/to/file.test.ts` - [Tests added]

### Tests
- [x] Unit tests passing
- [x] Integration tests passing
- [x] Coverage: XX%

### Documentation
- [x] Code comments added
- [x] README updated (if applicable)

### Ready for Review
```bash
git status
git diff --staged
```

### Next Steps
1. Review changes
2. Run full test suite
3. Create PR
```

## Example

**Input**: `/feature Add password reset functionality with email verification`

**Output**:
1. Plan with 8 tasks covering model, service, routes, email, tests
2. Implementation of password reset flow
3. Tests for happy path and error cases
4. Updated API documentation
5. Commit message and PR description

## Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--mode=[mode]` | Use specific behavioral mode | `--mode=implementation` |
| `--depth=[1-5]` | Planning thoroughness level | `--depth=3` |
| `--checkpoint` | Create checkpoint before starting | `--checkpoint` |
| `--skip-tests` | Skip test generation phase | `--skip-tests` |
| `--skip-review` | Skip code review phase | `--skip-review` |
| `--format=[fmt]` | Output format (concise/detailed) | `--format=concise` |

### Flag Usage Examples

```bash
/feature --mode=implementation "add user profile page"
/feature --depth=5 --checkpoint "implement payment flow"
/feature --format=concise "add logging utility"
```

## MCP Integration

This command leverages MCP servers for enhanced capabilities:

### Context7 - Library Documentation
When researching unfamiliar libraries or frameworks:
```
Use Context7's resolve-library-id and get-library-docs tools to fetch
current documentation for any libraries involved in the feature.
```

### Sequential Thinking - Structured Planning
For complex feature breakdowns:
```
Use Sequential Thinking's sequentialthinking tool for step-by-step
analysis when decomposing requirements or designing architecture.
```

### Memory - Context Persistence
Store and recall project context:
```
- Store architectural decisions made during planning
- Recall user preferences from previous sessions
- Remember patterns used in similar features
```

### Filesystem - File Operations
For creating and modifying files:
```
- Use directory_tree to understand project structure
- Use search_files to find related implementations
- Use read_file and write_file for file operations
```

### Playwright - E2E Testing
For features with UI components:
```
Use Playwright for browser-based E2E testing of the implemented feature.
Validate user flows and interactions in real browser environment.
```

<!-- CUSTOMIZATION POINT -->
## Variations

Modify behavior via CLAUDE.md:
- Set minimum test coverage requirements
- Define required documentation updates
- Configure branch naming conventions
- Set PR template requirements

# /research - Research Command

## Purpose

Research a technology, library, or approach with comprehensive analysis.

## Usage

```
/research [topic or technology]
```

---

Research: **$ARGUMENTS**

## Workflow

1. **Gather Information**
   - Official documentation
   - Community resources
   - Comparisons

2. **Analyze**
   - Pros and cons
   - Best practices
   - Alternatives

3. **Recommend**
   - Summary
   - Recommendation
   - Next steps

## Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--mode=[mode]` | Use specific behavioral mode | `--mode=deep-research` |
| `--depth=[1-5]` | Research thoroughness level | `--depth=5` |
| `--format=[fmt]` | Output format (concise/detailed/json) | `--format=detailed` |
| `--save=[path]` | Save research to file | `--save=docs/research.md` |
| `--compare` | Focus on comparing alternatives | `--compare` |
| `--sequential` | Use sequential thinking methodology | `--sequential` |

### Flag Usage Examples

```bash
/research --depth=5 "authentication libraries for Node.js"
/research --compare "React vs Vue vs Svelte"
/research --sequential "root cause of memory leak"
/research --save=docs/orm-research.md "ORM comparison"
```

### Depth Levels

| Level | Behavior |
|-------|----------|
| 1 | Quick overview, key points only |
| 2 | Standard analysis |
| 3 | Thorough with examples |
| 4 | Comprehensive with trade-offs |
| 5 | Exhaustive with citations |

## MCP Integration

This command leverages MCP servers for enhanced research:

### Context7 - Library Documentation (Primary)
```
ALWAYS use Context7 for library/framework research:
1. Use resolve-library-id to find the library ID
2. Use get-library-docs with topic parameter for focused docs
3. Use mode='code' for API references, mode='info' for concepts
```

### Sequential Thinking - Structured Analysis
```
For complex research requiring step-by-step reasoning:
- Use sequentialthinking tool to break down analysis
- Track confidence scores for each finding
- Revise conclusions as new information emerges
```

### Memory - Persistent Research
```
Store research findings for future reference:
- Create entities for researched technologies
- Add observations with pros/cons/recommendations
- Link related technologies with relations
```

## Output

```markdown
## Research: [Topic]

### Summary
[Overview]

### Pros
- [Pro 1]
- [Pro 2]

### Cons
- [Con 1]

### Alternatives
[Comparison table]

### Recommendation
[Clear recommendation]
```

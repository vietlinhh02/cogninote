# /api-gen - API Generation Command

## Purpose

Generate API endpoints, documentation, or client code from specifications.

## Usage

```
/api-gen [resource name or OpenAPI spec path]
```

---

Generate API for: **$ARGUMENTS**

## Workflow

### Step 1: Define Resource

1. Identify resource properties
2. Define relationships
3. Determine operations

### Step 2: Generate

1. Create model/schema
2. Create routes/endpoints
3. Add validation
4. Generate tests

### Step 3: Document

1. Create OpenAPI spec
2. Add examples
3. Document errors

## Output

```markdown
## API Generated

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /resources | List all |
| POST | /resources | Create |
| GET | /resources/:id | Get one |

### Files Created
- `src/models/resource.ts`
- `src/routes/resource.ts`
- `tests/resource.test.ts`
- `docs/api/resource.md`
```

# /security-scan - Security Scanning Command

## Purpose

Scan code and dependencies for security vulnerabilities.

## Usage

```
/security-scan [scope: deps | code | secrets | all]
```

---

Run security scan: **$ARGUMENTS**

## Workflow

### Dependency Scan

```bash
npm audit
pip-audit
```

### Code Scan

- SQL injection patterns
- XSS vulnerabilities
- Command injection

### Secret Detection

- API keys
- Passwords
- Tokens

## Output

```markdown
## Security Scan Results

### Summary
| Type | Critical | High | Medium |
|------|----------|------|--------|
| Dependencies | 0 | 2 | 5 |
| Code | 0 | 1 | 3 |
| Secrets | 0 | 0 | 0 |

### Findings
[Detailed findings with remediation]
```

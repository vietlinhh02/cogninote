# /deploy - Deployment Command

## Purpose

Deploy the application to a specified environment with proper checks.

## Usage

```
/deploy [environment: staging | production]
```

---

Deploy to: **$ARGUMENTS**

## Workflow

### Pre-Deploy Checks

1. **Verify Build**
   ```bash
   pnpm build
   ```

2. **Run Tests**
   ```bash
   pnpm test
   ```

3. **Security Scan**
   ```bash
   npm audit --audit-level=high
   ```

### Deploy

1. **Staging**
   ```bash
   # Deploy to staging environment
   ```

2. **Production** (requires confirmation)
   ```bash
   # Deploy to production environment
   ```

### Post-Deploy

1. **Verify Deployment**
   - Health checks
   - Smoke tests

2. **Monitor**
   - Check logs
   - Watch metrics

## Output

```markdown
## Deployment Complete

**Environment**: staging
**Version**: v1.2.3
**URL**: https://staging.example.com

### Checks
- [x] Build successful
- [x] Tests passing
- [x] Security scan clean
- [x] Health check passed
```

# /changelog - Changelog Command

## Purpose

Generate changelog entries from recent commits.

## Usage

```
/changelog [version or 'since:tag']
```

---

Generate changelog for: **$ARGUMENTS**

## Workflow

1. **Analyze Commits**
   ```bash
   git log --oneline --since="last tag"
   ```

2. **Categorize**
   - Added
   - Changed
   - Fixed
   - Removed

3. **Generate**
   - User-friendly descriptions
   - Link to PRs/issues

## Output

```markdown
## [Version] - Date

### Added
- Feature description (#123)

### Changed
- Improvement description (#124)

### Fixed
- Bug fix description (#125)
```

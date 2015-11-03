# CLUSTERNATOR SERVER

## API Endpoints

### POST `/clusternate`

##### Expected body
```
{
  "appdef": {...},       // app definition file contents
  "repo":   "user/repo", // used to identify your project
  "pr":     42,          // identifies PR by number (required for now)
  "sha":    abc123,      // identifies unique commit (optional)
}
```

### POST `/github/pr`

**For use as a github webhook only**

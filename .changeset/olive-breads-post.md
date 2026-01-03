---
"@glxmart/boss-cli": patch
"@glxmart/conductor-mcp": patch
---

Fix MCP configuration hanging bug and Docker image auto-update

- **MCP Hanging Fix**: Resolved issue where boss bootstrap would hang for 20+ minutes during "Generating MCP configuration..." by moving user prompt before spinner starts
- **Docker Auto-Update**: Changed Docker base image reference from hardcoded `1.0.0-beta.0` to `latest` tag which auto-updates on version releases
- **Docker Workflow**: Added `latest` tag to Docker workflow that publishes on git tag releases, fixed PR build tag generation
- **Changeset Workflow**: Added pull-requests write permission to fix PR comment failures
- **Template Mapping**: Added template directory mapping to support nextjs-app-turbo template (currently maps to t3-app)

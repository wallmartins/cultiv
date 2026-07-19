---
name: blair:crm-setup
description: Connect your CRM to Blair so pipeline data pulls automatically — no more pasting numbers. Supports HubSpot, Salesforce, and Pipedrive via MCP.
---

# /blair:crm-setup

Triggered when the user runs `/blair:crm-setup` with an optional CRM name.

Examples:
- `/blair:crm-setup`
- `/blair:crm-setup hubspot`
- `/blair:crm-setup salesforce`

Once connected, `/blair:pipeline-impact` and all analytics reviews pull pipeline data automatically — no pasting required.

---

## Execution

**Step 1: Identify CRM**

If the user specified a CRM in the command, use it. Otherwise ask:
> "Which CRM are you connecting — HubSpot, Salesforce, Pipedrive, or something else?"

Wait for the answer.

---

**Step 2: Run setup for the chosen CRM**

### HubSpot

**Install the MCP server:**
```bash
# Add to your project's .mcp.json (or ~/.claude/mcp.json for global install)
{
  "mcpServers": {
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@hubspot/mcp-server"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "your-private-app-token"
      }
    }
  }
}
```

**Get your HubSpot token:**
1. Go to HubSpot → Settings → Integrations → Private Apps
2. Create a new private app
3. Scopes needed: `crm.objects.contacts.read`, `crm.objects.deals.read`, `crm.objects.companies.read`
4. Copy the access token

**Verify the connection:**
Once added to `.mcp.json`, restart Claude Code. Run `/blair:pipeline-impact` — if Blair pulls deal data without asking you to paste, the connection is working.

---

### Salesforce

**Install the MCP server:**
```bash
{
  "mcpServers": {
    "salesforce": {
      "command": "npx",
      "args": ["-y", "salesforce-mcp-server"],
      "env": {
        "SF_USERNAME": "your-username",
        "SF_PASSWORD": "your-password",
        "SF_SECURITY_TOKEN": "your-security-token",
        "SF_LOGIN_URL": "https://login.salesforce.com"
      }
    }
  }
}
```

**Get your Salesforce credentials:**
1. Your username and password are your standard Salesforce login
2. Security token: Salesforce → Settings → Reset My Security Token (emailed to you)
3. For sandbox environments, use `https://test.salesforce.com` as the login URL

---

### Pipedrive

**Install the MCP server:**
```bash
{
  "mcpServers": {
    "pipedrive": {
      "command": "npx",
      "args": ["-y", "pipedrive-mcp"],
      "env": {
        "PIPEDRIVE_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Get your Pipedrive token:**
Pipedrive → Settings → Personal Preferences → API → Your personal API token

---

### Other CRM

If the user's CRM isn't listed:
> "I don't have a pre-built setup guide for [CRM]. Check if they have an official MCP server or REST API. If they have an API, I can help you build a lightweight MCP wrapper — just share the API docs."

---

**Step 3: Update brand.md**

After confirming the connection works, update the Pipeline section of `.claude/cmo/brand.md` to reflect the connected CRM:

```
CRM: [HubSpot / Salesforce / Pipedrive]
CRM MCP: Connected
```

---

**Step 4: Confirm and test**

> "CRM connected. Run `/blair:pipeline-impact` to pull your first pipeline snapshot — no pasting needed."

If the user reports it's not working:
1. Confirm the `.mcp.json` file is in the correct location (project root or `~/.claude/`)
2. Confirm Claude Code was restarted after adding the config
3. Check the MCP server is running: in Claude Code terminal, MCP connections are shown on startup
4. Verify the API token has the correct scopes

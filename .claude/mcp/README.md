# MCP Server Integrations

Model Context Protocol (MCP) servers extend Claude Code capabilities with specialized tools and integrations.

## Available MCP Servers

| Server | Purpose | Status |
|--------|---------|--------|
| Context7 | Up-to-date library documentation | Optional |
| Sequential | Multi-step reasoning tools | Optional |
| Playwright | Browser automation (Microsoft) | Optional |
| Memory | Persistent knowledge graph | Optional |
| Filesystem | Secure file operations | Optional |

## Installation

### Prerequisites
- Node.js 18+
- npx available in PATH

### Global Configuration

MCP servers are configured in your Claude Code settings:

**Location**: `~/.claude/settings.json` (user) or `.mcp.json` (project)

### Quick Setup

1. Copy the configuration for your platform (see below)
2. Add to your `.mcp.json` or `settings.json` under `mcpServers`
3. Restart Claude Code

## Platform-Specific Configuration

MCP server configuration differs between platforms:

### Linux / macOS

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Windows

Windows requires the `cmd /c` wrapper to execute npx:

```json
{
  "mcpServers": {
    "context7": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@upstash/context7-mcp"]
    }
  }
}
```

> **Note**: The `.mcp.json` included in this repository uses Windows syntax. Linux/macOS users should use the configurations in this README.

## Server Configurations

### Context7 (Documentation Lookup)

Provides up-to-date documentation for libraries and frameworks.

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**Usage**: Ask about any library and get current documentation.

**Tools**:
- `resolve-library-id` - Find library IDs for documentation lookup
- `get-library-docs` - Fetch documentation for a specific library

### Sequential Thinking

Provides structured reasoning tools for complex problem-solving.

```json
{
  "mcpServers": {
    "sequential": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Usage**: Complex analysis with step-by-step reasoning.

**Tools**:
- `sequentialthinking` - Dynamic problem-solving through thought sequences

### Playwright (Browser Automation)

Microsoft's browser automation using accessibility tree for fast, LLM-friendly interaction.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    }
  }
}
```

**Usage**: Web testing, screenshots, form automation.

**Key Features**:
- Fast and lightweight - uses accessibility tree, not pixels
- LLM-friendly - no vision models needed
- Supports Chrome, Firefox, WebKit, Edge
- Device emulation and profile management

**Command-Line Options**:
- `--browser <browser>` - Browser to use (chrome, firefox, webkit, msedge)
- `--headless` - Run browser in headless mode
- `--viewport-size <size>` - Viewport size (e.g., "1280x720")
- `--device <device>` - Device to emulate (e.g., "iPhone 15")

### Memory (Persistent Knowledge Graph)

Maintains persistent memory across sessions using a local knowledge graph.

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Usage**: Remember information across conversations and sessions.

**Tools**:
- `create_entities` - Create new entities in the knowledge graph
- `create_relations` - Create relationships between entities
- `add_observations` - Add observations to entities
- `delete_entities` - Remove entities from the graph
- `delete_observations` - Remove observations
- `delete_relations` - Remove relationships
- `read_graph` - Read the entire knowledge graph
- `search_nodes` - Search for entities
- `open_nodes` - Open specific entities by name

### Filesystem (Secure File Operations)

Enables secure file operations with configurable access controls.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

**Usage**: Read, write, and manage files with access controls.

**Tools**:
- `read_file` - Read file contents
- `read_multiple_files` - Read multiple files at once
- `write_file` - Write content to a file
- `edit_file` - Make edits to a file
- `create_directory` - Create a new directory
- `list_directory` - List directory contents
- `directory_tree` - Get directory tree structure
- `move_file` - Move or rename files
- `search_files` - Search for files by pattern
- `get_file_info` - Get file metadata

**Note**: The last argument specifies the allowed directory (`.` for current directory).

## Full Configuration Example

### Linux / macOS

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "sequential": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

### Windows

```json
{
  "mcpServers": {
    "context7": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@upstash/context7-mcp"]
    },
    "sequential": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "playwright": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@playwright/mcp"]
    },
    "memory": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-memory"]
    },
    "filesystem": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

## Optional Additional Servers

These servers can be added for extended functionality:

| Server | Package | Purpose |
|--------|---------|---------|
| Fetch | `mcp-server-fetch` (uvx) | Web content fetching |
| Brave Search | `@modelcontextprotocol/server-brave-search` | Web search (requires API key) |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | Database access |
| Sentry | `@sentry/mcp-server` | Error tracking |
| GitHub | `@github/mcp-server` | GitHub API operations |

## Verification

After configuration, verify servers are loaded:

1. Start a new Claude Code session
2. Check for MCP tools in available capabilities
3. Test with a simple request

## Troubleshooting

### Server Not Loading
- Check Node.js version (18+ required)
- Verify npx is in PATH
- Check for typos in configuration
- Review Claude Code logs

### Permission Errors
- Ensure network access for package installation
- Check firewall settings
- Verify npm registry access

### Slow Startup
- First run downloads packages (one-time)
- Subsequent starts should be faster
- Consider pre-installing packages globally

## Security Notes

- MCP servers run with your user permissions
- Review server source before installing
- Playwright has browser access - use carefully
- Context7 makes network requests to documentation sources
- Filesystem server restricts access to specified directories

## Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude-code/mcp)

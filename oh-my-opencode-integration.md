# Oh My OpenCode Integration

If you use [Oh My OpenCode](https://github.com/code-yeongyu/oh-my-opencode), you can integrate Cowork as a custom agent.

## Setup

Add to your `oh-my-opencode.json`:

```json
{
  "agents": {
    "cowork": {
      "description": "Cowork mode - Autonomous file operations",
      "prompt_append": "Enter Cowork mode. Autonomously complete tasks, explain before each modification, verify after completion."
    }
  }
}
```

## Usage

```
@cowork Refactor this file
@cowork Add unit tests for utils.ts
@cowork Find and fix security issues
```

## Full Example

See [examples/oh-my-opencode.example.json](./examples/oh-my-opencode.example.json) for a complete configuration.

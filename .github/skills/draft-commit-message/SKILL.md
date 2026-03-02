---
name: draft-commit-message
description: Draft a conventional commit message for staged changes. Use when the user asks to write, draft, or generate a commit message, or when committing code. Analyzes staged diffs to produce a ready-to-copy message in a code block.
---

# Draft Commit Message

## Workflow

1. Run `git diff --cached --stat` to get an overview of staged files.
2. Run `git diff --cached` to read the actual changes. If the output is empty or truncated, run `git diff --cached -- <path>` for each staged file individually.
3. Analyze the changes and draft the message following the format rules below.
4. Present the message inside a single fenced code block for easy copy.

## Format Rules

Use **Conventional Commits**: `type(scope): subject`

### Type

One of: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`, `ci`, `perf`, `build`.

| Type       | When to use                                 |
| ---------- | ------------------------------------------- |
| `feat`     | New feature or capability                   |
| `fix`      | Bug fix                                     |
| `refactor` | Code restructuring without behavior change  |
| `chore`    | Maintenance, config, tooling, dependencies  |
| `docs`     | Documentation only                          |
| `style`    | Formatting, whitespace (no logic change)    |
| `test`     | Adding or updating tests                    |
| `ci`       | CI/CD pipeline changes                      |
| `perf`     | Performance improvement                     |
| `build`    | Build system or external dependency changes |

### Scope

Short, lowercase identifier in parentheses matching the area of change. Derive from the feature folder, component, or module name (e.g., `workspace`, `menu-bar`, `app`, `skill`, `canvas`). Omit scope only when the change truly spans the entire project.

### Subject

- Lowercase after the colon (no capital first letter).
- Imperative mood (e.g., "add", "remove", "update", not "added", "adds").
- Max **72 characters** for the full `type(scope): subject` line.
- No trailing period.
- Concise but descriptive — state _what_ changed, not _how_.

### Body (optional)

Add a body only when the subject alone cannot explain the change (complex refactors, breaking changes, non-obvious decisions). Separate from subject with a blank line.

### Breaking Changes

Prefix the subject with `!` before the colon: `feat(workspace)!: remove legacy save format`.

## Output

**CRITICAL: Reply with the commit message ONLY — nothing else. No introduction, no explanation, no commentary before or after the code block. Any text outside the code block is a violation of this skill.**

```
type(scope): subject
```

Or with a body:

```
type(scope): subject

Optional body explaining the why or details of the change.
```

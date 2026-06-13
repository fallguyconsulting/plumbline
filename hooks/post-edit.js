#!/usr/bin/env node

// SPDX-License-Identifier: Apache-2.0

// @agent-contract
// - PostToolUse hook for Edit and Write. Reads the tool-call event from stdin,
//   extracts the edited file path, runs `plumbline` on just that file, and exits 2
//   if violations are found. Stdout/stderr from plumbline is forwarded so the agent
//   sees the violation messages and can fix in the same turn.
// - Exit 0: no violations or file not lintable. Exit 2: violations found (blocks).
//   Exit 1: internal error (treat as non-blocking).
// - Reads CLAUDE_PLUGIN_ROOT from env to locate the lint binary.
// - Does NOT: lint the whole repo on every edit; lint files outside the project tree.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function main() {
  let event;
  try {
    event = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (err) {
    process.exit(0);
  }

  const file = event && event.tool_input && event.tool_input.file_path;
  if (!file || !fs.existsSync(file)) process.exit(0);

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (!pluginRoot) process.exit(0);

  const binary = path.join(pluginRoot, 'bin', 'plumbline');
  if (!fs.existsSync(binary)) process.exit(0);

  const result = spawnSync('node', [binary, file], { stdio: 'inherit' });
  if (result.error) process.exit(0);
  process.exit(result.status === 2 ? 2 : 0);
}

main();

#!/usr/bin/env node
/**
 * Project Connect Claude Code PreToolUse shell guard (Bash and PowerShell).
 *
 * Deterministic defense-in-depth only. Project permission deny rules remain primary.
 * Inspects ONLY tool_input.command (never the description or other payload fields,
 * which caused false positives). Cross-platform: Windows, WSL, macOS, Linux, CI.
 *
 * - BLOCK (permissionDecision "deny"): never-autonomous operations (CLAUDE.md §7, §27, §32).
 * - ASK (permissionDecision "ask"): GOVERNANCE-RESOLUTIONS-V1.1 GR-001 approval
 *   boundary, enforced even in permission modes that would otherwise auto-approve.
 * - Malformed hook input fails closed.
 */

const BLOCK = [
  [/\bterraform\b[\s\S]*\b(apply|destroy)\b/i, 'Terraform apply/destroy'],
  // Force push in any form: --force, --force-with-lease, --force-if-includes,
  // any short-flag group containing f (-f, -fu, -uf), or a +refspec (git push origin +main).
  [/\bgit\s+push\b[\s\S]*\s(--force(-with-lease|-if-includes)?(?=\s|=|$)|-[a-z]*f[a-z]*(?=\s|$)|\+[^\s+])/i, 'force push'],
  [/\bkubectl\b/i, 'kubectl (Kubernetes not approved for V1)'],
  [/(^|[\s;&|(])aws\s/i, 'AWS CLI (cloud mutation/production access is human-controlled)'],
  [/\beas\s+(submit|update|build)\b[\s\S]*\b(production|prod)\b/i, 'production EAS release'],
  [/\bgh\s+workflow\s+run\b[\s\S]*(deploy|release|production|prod)/i, 'deployment workflow'],
  [/\brm\s+-[a-z]*r[a-z]*\s+(['"]?)(\/|~|[a-z]:[\\/]?)\1(\s|$)/i, 'recursive delete of a root/home path'],
  [/\bremove-item\b[\s\S]*-recurse[\s\S]*\s(['"]?)([a-z]:[\\/]?|\/|~)\1(\s|$)/i, 'recursive delete of a root/home path'],
  [/\b(rm|del|erase|remove-item|rmdir|rd)\b[\s\S]*(\.env\b|secrets?\b|credentials?\b|\.pem\b|\.key\b)/i, 'deleting secret/credential files'],
  [/--dangerously-skip-permissions/i, 'permission bypass'],
];

const ASK = [
  [/\b(pnpm|npm|yarn|bun)\s+(add|install|i|ci|remove|rm|uninstall|un|update|up|upgrade|outdated --fix|link)\b/i, 'package install/removal/upgrade or lockfile change'],
  [/\b(npx|pnpx|bunx)\s/i, 'npx may download and execute packages'],
  [/\bpnpm\s+dlx\b/i, 'pnpm dlx may download and execute packages'],
  [/\b(curl|wget)\b/i, 'external network command'],
  [/\b(invoke-webrequest|invoke-restmethod|iwr|irm|start-bitstransfer)\b/i, 'external network command'],
  [/\bgit\s+push\b/i, 'git push'],
  [/\bgh\s+(api|pr\s+(create|merge)|repo|release|workflow\s+run)\b/i, 'GitHub network/mutation command'],
  [/\beas\s+(submit|update|build)\b/i, 'EAS cloud build/update/submit'],
  [/\bterraform\s/i, 'Terraform'],
  [/\brm\s+-[a-z]*r/i, 'recursive delete'],
  [/\bremove-item\b[\s\S]*-recurse/i, 'recursive delete'],
  [/\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f|checkout\s+--\s|restore\s)/i, 'destructive git operation'],
  [/\bdb:migrate\b|\bdrizzle-kit\s+(push|migrate)\b/i, 'database migration execution'],
];

// Decisions are returned as structured JSON on stdout with exit code 0, never via
// exit code 2: shells such as `pwsh -Command` collapse non-zero exit codes to 1,
// which Claude Code treats as a non-blocking error (the guard would fail open).
function decide(permissionDecision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: reason },
  }));
  if (permissionDecision === 'deny') console.error(reason);
  process.exit(0);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let command;
  try {
    command = JSON.parse(raw)?.tool_input?.command;
  } catch {
    decide('deny', 'Project Connect guard: unreadable hook input; denying to fail closed.');
  }
  if (typeof command !== 'string' || command.length === 0) process.exit(0);

  for (const [pattern, label] of BLOCK) {
    if (pattern.test(command)) {
      decide('deny', `Blocked by Project Connect guard (${label}): this high-risk command requires explicit human-controlled execution.`);
    }
  }

  for (const [pattern, label] of ASK) {
    if (pattern.test(command)) {
      decide('ask', `Project Connect approval boundary (GR-001): ${label} requires human approval.`);
    }
  }

  process.exit(0);
});

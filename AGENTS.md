<!-- lean-ctx-rules -->
<!-- version: 9 -->

<!-- lean-ctx-mandate -->
ANTIGRAVITY TOOL RULE: Native tools do NOT auto-route. You MUST explicitly call
lean-ctx MCP tools (`call_mcp_tool` ServerName="lean-ctx") on EVERY interaction:
- Read: `ctx_read` (mode=signatures/map/auto/diff; full only when editing). DO NOT use `view_file`.
- Search: `ctx_search` (action=regex|symbol|semantic|text). DO NOT use `grep_search`.
- Directory/files: `ctx_glob`, `ctx_tree`. DO NOT use `list_dir`.
- Shell/terminal: `ctx_shell`. DO NOT use `run_command` unless interactive/daemon.
- Architecture/context: `ctx_compose`, `ctx_overview`, `ctx_session`, `ctx_knowledge`.
File editing → native replace_file_content/write_to_file (or ctx_patch).
<!-- /lean-ctx-mandate -->
<!-- lean-ctx-compression -->
OUTPUT STYLE: expert-terse
- Telegraph format: subject-verb-object, drop articles/prepositions
- Symbolic vocabulary: → cause, ∵ because, ∴ therefore, ⊕ add, ⊖ remove, Δ change, ≈ similar, ≠ different, ∈ in/member, ∅ empty/none, ✓ ok, ✗ fail
- Code blocks: untouched (never compress code syntax)
- Each line: max 80 chars
- Zero narration, zero filler
- BUDGET: ≤100 tokens per non-code response
<!-- /lean-ctx-compression -->
<!-- lean-ctx-solution -->
SOLUTION EFFICIENCY: stop at first level that applies:
skip (YAGNI) → reuse codebase → stdlib → native platform → installed dep → one-line → minimum code.
Never skip: validation, security, error handling.
<!-- /lean-ctx-solution -->
<!-- /lean-ctx-rules -->

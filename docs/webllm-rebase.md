# Rebasing the web-llm Fork on Upstream MLC

This project vendors a customized JS runtime via the git submodule `3rd_party/web-llm`
([ford442/web-llm](https://github.com/ford442/web-llm)) and optional patches in
`patches/web-llm/*.patch` applied by `scripts/build-webllm.sh`.

## When to rebase

- Upstream [mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) ships a release you need
  (bug fixes, new models, OPFS/cache changes).
- `./scripts/build-webllm.sh` fails with `Patch ... failed --check`.

## Procedure

### 1. Update the fork submodule pointer

```bash
cd 3rd_party/web-llm

# One-time: add upstream if missing
git remote add upstream https://github.com/mlc-ai/web-llm.git

git fetch upstream
git fetch origin

# Rebase our fork branch on upstream main (preferred) or merge if conflicts are heavy
git checkout main
git rebase upstream/main
# Resolve conflicts in src/, run `npm test` inside the submodule if you changed core paths
git push origin main   # ford442/web-llm — requires fork write access
```

### 2. Refresh patches in the main repo

After landing comedy/runtime changes directly in the fork **or** editing patches:

```bash
cd 3rd_party/web-llm
git reset --hard HEAD
git clean -fd

# If changes live only in the fork remote, checkout the new SHA:
# git checkout <new-sha>

# Regenerate a single patch from fork commits not in upstream:
# git format-patch upstream/main..HEAD -o ../../patches/web-llm/

# Or from a working tree diff (current comedy deltas):
git apply ../../patches/web-llm/0001-comedy-runtime-deltas.patch  # dry-run first
git apply --check ../../patches/web-llm/0001-comedy-runtime-deltas.patch
```

If the patch no longer applies:

1. `git apply --reject ../../patches/web-llm/0001-....patch`
2. Manually fix `.rej` hunks in `3rd_party/web-llm/src/`
3. `git diff > ../../patches/web-llm/0001-comedy-runtime-deltas.patch`
4. `rm -rf patches/web-llm/.applied/` (force re-apply on next build)

### 3. Commit submodule + patches in the_jokesters

```bash
cd ../..   # repo root
git add 3rd_party/web-llm patches/web-llm
git commit -m "chore: update web-llm fork to <sha> and refresh patches"
```

### 4. Rebuild and verify

```bash
./scripts/build-webllm.sh
./scripts/verify-webllm-dist.sh
USE_CUSTOM_WEBLLM=1 npm run build    # bundle size / alias smoke test
npm run typecheck                    # default npm @mlc-ai/web-llm path unchanged
```

## Consumption flags

| Flag | Effect |
|------|--------|
| `USE_CUSTOM_WEBLLM=1` | Vite aliases `@mlc-ai/web-llm` → `3rd_party/web-llm-dist/lib/index.js` |
| `SKIP_PATCHES=1` | Build submodule as-is (no `patches/web-llm/*.patch`) |
| `FORCE_PATCHES=1` | Re-apply patches even if `.applied` markers exist |
| `SKIP_SUBMODULE_RESET=1` | Do not `git reset --hard` before patching (local submodule hacks) |

## Upstreaming comedy deltas

Prefer merging substantial changes into **ford442/web-llm** and keeping thin patch files
only for Jokesters-specific experiments. Long-term maintenance cost drops when the fork
and upstream diffs stay small.

See also: [webllm-customization-plan.md](./webllm-customization-plan.md)

# Guide: Resolving Non-Fast-Forward Push Errors

## The Problem
When you see this error:
```
! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/tclaret/turntable3D.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart.
```

This means your local `main` branch is behind the remote `main` branch.

## Solution Options

### Option 1: Pull and Merge (Recommended)
This integrates remote changes with your local changes:

```bash
# Pull the latest changes from remote
git pull origin main

# If there are merge conflicts, resolve them, then:
git add .
git commit -m "Merge remote changes"

# Push your changes
git push origin main
```

### Option 2: Pull with Rebase (Cleaner History)
This replays your local commits on top of the remote commits:

```bash
# Pull with rebase
git pull --rebase origin main

# If there are conflicts, resolve them, then:
git add .
git rebase --continue

# Push your changes
git push origin main
```

### Option 3: Force Push (Use with Caution!)
Only use this if you're sure you want to overwrite remote changes:

```bash
# This will overwrite remote history - USE CAREFULLY!
git push --force origin main
# Or safer: git push --force-with-lease origin main
```

⚠️ **Warning**: Force pushing can cause data loss if others have pulled the remote branch.

## Recommended Workflow

1. **Check status**: `git status`
2. **See what's different**: `git fetch origin && git log HEAD..origin/main`
3. **Pull changes**: `git pull origin main`
4. **Resolve any conflicts** if they occur
5. **Push**: `git push origin main`

## Quick Commands

```bash
# One-liner to pull and push
git pull origin main && git push origin main

# To see what's on remote that you don't have
git fetch origin
git log HEAD..origin/main --oneline

# To see what you have that remote doesn't
git log origin/main..HEAD --oneline
```

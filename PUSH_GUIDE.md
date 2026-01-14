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

## Unrelated Histories Error

If you see this error when running `git pull`:
```
fatal: refusing to merge unrelated histories
```

This means your local repository and the remote repository don't share any common commit history. This typically happens when:
- You initialized a new local repository
- The remote was initialized separately  
- You're trying to merge two completely independent projects

**Solution**: Use the `--allow-unrelated-histories` flag:
```bash
git pull --no-rebase --allow-unrelated-histories origin main
git push origin main
```

⚠️ **Warning**: Only use this if you're sure you want to merge two unrelated repositories. Review the changes carefully.

## Divergent Branches Error (Git 2.27+)

If you see this error when running `git pull`:
```
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands:
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
fatal: Need to specify how to reconcile divergent branches.
```

**Quick fix**: Use `git pull --no-rebase` to explicitly use merge strategy, or configure git once:
```bash
git config pull.rebase false  # Use merge strategy by default
```

## Solution Options

### Option 1: Pull and Merge (Recommended)
This integrates remote changes with your local changes:

```bash
# Pull the latest changes from remote (explicit merge strategy)
git pull --no-rebase origin main

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
3. **Pull changes**: `git pull --no-rebase origin main`
4. **Resolve any conflicts** if they occur
5. **Push**: `git push origin main`

## Quick Commands

```bash
# Pull and push with explicit merge strategy
git pull --no-rebase origin main && git push origin main

# Or configure git once to use merge by default, then pull and push
git config pull.rebase false
git pull origin main && git push origin main

# To see what's on remote that you don't have
git fetch origin
git log HEAD..origin/main --oneline

# To see what you have that remote doesn't
git log origin/main..HEAD --oneline
```

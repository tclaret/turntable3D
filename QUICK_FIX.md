## Quick Reference: Fixing "rejected - non-fast-forward" Error

### The Error You're Seeing
```
! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs
```

### Quick Fix (Choose One)

#### 🔍 Best: Diagnose First (Recommended)
```bash
./diagnose-and-fix.sh
# Shows exactly what's wrong and offers to fix it
```

#### 🎯 Easiest: Use Auto-Sync Script
```bash
./sync-and-push.sh main
```

#### 📝 Manual Method
```bash
# 1. Pull remote changes (with explicit merge strategy)
git pull --no-rebase origin main

# 2. If conflicts occur, fix them then:
git add .
git commit -m "Resolve merge conflicts"

# 3. Push
git push origin main
```

#### ⚙️ If You See "Divergent Branches" Error
```bash
# Configure git once (choose merge strategy)
git config pull.rebase false

# Then pull and push
git pull origin main
git push origin main
```

#### 🧹 Clean History (Rebase)
```bash
git pull --rebase origin main
# Fix conflicts if needed, then:
git add .
git rebase --continue
git push origin main
```

### When to Use What

| Situation | Command | When to Use |
|-----------|---------|-------------|
| Want to understand the issue | `./diagnose-and-fix.sh` | First time or complex situation |
| Quick automated fix | `./sync-and-push.sh main` | Trust automation, want speed |
| Normal sync | `git pull --no-rebase origin main && git push origin main` | Comfortable with git |
| Want clean history | `git pull --rebase origin main` | Team prefers linear history |
| Solo project | `git push --force-with-lease origin main` | You're the only contributor |
| Divergent branches error | `git config pull.rebase false && git pull origin main` | One-time git configuration |

### Prevention

Set up auto-pull before push:
```bash
# Add this alias to ~/.gitconfig
[alias]
    pushup = "!git pull origin $(git rev-parse --abbrev-ref HEAD) && git push origin $(git rev-parse --abbrev-ref HEAD)"
```

Then use: `git pushup`

---
📖 **Full Guide**: See [PUSH_GUIDE.md](PUSH_GUIDE.md) for detailed explanations.

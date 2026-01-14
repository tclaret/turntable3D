# turntable3D
Simulate scratching vinyl on a 3D turntable.

---

## 🆘 GETTING A PUSH ERROR? → [IMMEDIATE_FIX.md](IMMEDIATE_FIX.md)

**Quick fix:**
```bash
# If you see "divergent branches" error, use:
git pull --no-rebase origin main && git push origin main

# Or configure git once:
git config pull.rebase false
git pull origin main && git push origin main
```

---

## 📦 Getting the Helper Scripts

The helper scripts are in the `copilot/push-remote-code` branch. Get them:

### Method 1: Switch to PR Branch
```bash
git fetch origin copilot/push-remote-code
git checkout copilot/push-remote-code
./diagnose-and-fix.sh
```

### Method 2: Install to Current Branch
```bash
# This downloads the scripts without changing branches
curl -sSL https://raw.githubusercontent.com/tclaret/turntable3D/copilot/push-remote-code/install-helpers.sh | bash
```

### Method 3: Manual Download
Download these files from the PR branch:
- `diagnose-and-fix.sh` - Interactive diagnostic tool
- `sync-and-push.sh` - Automated sync script  
- `PUSH_GUIDE.md` - Detailed guide
- `QUICK_FIX.md` - Quick reference

## Git Workflow Helpers

### Resolving Push Conflicts

If you encounter a "non-fast-forward" error when pushing:

```bash
# Option 1: Use the diagnostic tool (Recommended - shows what's wrong)
./diagnose-and-fix.sh

# Option 2: Use the automated sync script
./sync-and-push.sh main

# Option 3: Manual sync (with explicit merge strategy)
git pull --no-rebase origin main
git push origin main
```

📋 **Quick Reference**: [QUICK_FIX.md](QUICK_FIX.md)  
📖 **Detailed Guide**: [PUSH_GUIDE.md](PUSH_GUIDE.md)  
📄 **Complete Solution**: [SOLUTION.md](SOLUTION.md)

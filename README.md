# turntable3D
Simulate scratching vinyl on a 3D turntable.

## Git Workflow Helpers

### Resolving Push Conflicts

If you encounter a "non-fast-forward" error when pushing:

```bash
# Option 1: Use the diagnostic tool (Recommended - shows what's wrong)
./diagnose-and-fix.sh

# Option 2: Use the automated sync script
./sync-and-push.sh main

# Option 3: Manual sync
git pull origin main
git push origin main
```

📋 **Quick Reference**: [QUICK_FIX.md](QUICK_FIX.md)  
📖 **Detailed Guide**: [PUSH_GUIDE.md](PUSH_GUIDE.md)

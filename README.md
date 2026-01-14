# turntable3D
Simulate scratching vinyl on a 3D turntable.

## Git Workflow Helpers

### Resolving Push Conflicts

If you encounter a "non-fast-forward" error when pushing:

```bash
# Option 1: Use the automated script
./sync-and-push.sh main

# Option 2: Manual sync
git pull origin main
git push origin main
```

See [PUSH_GUIDE.md](PUSH_GUIDE.md) for detailed instructions on resolving push conflicts.

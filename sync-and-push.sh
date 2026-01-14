#!/bin/bash

# Script to sync local branch with remote and push changes
# Usage: ./sync-and-push.sh [branch-name]
# Default branch: main

# Show help
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: ./sync-and-push.sh [branch-name]"
    echo ""
    echo "Syncs local branch with remote and pushes changes."
    echo "Handles non-fast-forward errors automatically."
    echo ""
    echo "Arguments:"
    echo "  branch-name    Branch to sync (default: main)"
    echo ""
    echo "Examples:"
    echo "  ./sync-and-push.sh           # Sync main branch"
    echo "  ./sync-and-push.sh develop   # Sync develop branch"
    exit 0
fi

BRANCH=${1:-main}
REMOTE="origin"

# Validate branch name to prevent command injection
if [[ ! "$BRANCH" =~ ^[a-zA-Z0-9/_-]+$ ]]; then
    echo "❌ Error: Invalid branch name. Only alphanumeric characters, /, -, and _ are allowed."
    exit 1
fi

echo "🔄 Syncing and pushing branch: $BRANCH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if branch exists
if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    echo "❌ Error: Branch '$BRANCH' does not exist locally"
    exit 1
fi

# Save current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$CURRENT_BRANCH" ]; then
    echo "❌ Error: Unable to determine current branch"
    exit 1
fi

# Switch to target branch if not already on it
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "📍 Switching to branch: $BRANCH"
    git checkout "$BRANCH" || exit 1
fi

# Check for uncommitted changes (including untracked files)
STATUS_OUTPUT=$(git status --porcelain)
if [ -n "$STATUS_OUTPUT" ]; then
    echo "⚠️  Warning: You have uncommitted or untracked changes"
    echo "Options:"
    echo "  1. Commit them: git add . && git commit -m 'your message'"
    echo "  2. Stash them: git stash -u (includes untracked)"
    echo "  3. Discard them: git reset --hard HEAD && git clean -fd"
    read -p "Do you want to stash your changes (including untracked)? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash -u
        STASHED=true
    else
        echo "❌ Aborting. Please handle uncommitted changes first."
        exit 1
    fi
fi

# Fetch latest changes
echo "📥 Fetching latest changes from $REMOTE..."
git fetch "$REMOTE" || exit 1

# Check if remote branch exists
if ! git show-ref --verify --quiet "refs/remotes/$REMOTE/$BRANCH"; then
    echo "ℹ️  Remote branch '$REMOTE/$BRANCH' doesn't exist yet"
    echo "📤 Pushing local branch to remote..."
    git push --set-upstream "$REMOTE" "$BRANCH"
    exit 0
fi

# Check if we're behind
LOCAL=$(git rev-parse "$BRANCH")
REMOTE_REF=$(git rev-parse "$REMOTE/$BRANCH")
BASE=$(git merge-base "$BRANCH" "$REMOTE/$BRANCH")

if [ "$LOCAL" = "$REMOTE_REF" ]; then
    echo "✅ Already up to date with $REMOTE/$BRANCH"
    echo "📤 Pushing to remote..."
    git push "$REMOTE" "$BRANCH"
elif [ "$LOCAL" = "$BASE" ]; then
    echo "⬇️  Your branch is behind $REMOTE/$BRANCH"
    echo "📥 Pulling changes..."
    git pull --no-rebase "$REMOTE" "$BRANCH" || exit 1
    echo "📤 Pushing to remote..."
    git push "$REMOTE" "$BRANCH"
elif [ "$REMOTE_REF" = "$BASE" ]; then
    echo "⬆️  Your branch is ahead of $REMOTE/$BRANCH"
    echo "📤 Pushing to remote..."
    git push "$REMOTE" "$BRANCH"
else
    echo "🔀 Branches have diverged. Pulling with merge strategy..."
    git pull --no-rebase "$REMOTE" "$BRANCH" || {
        echo "❌ Merge conflicts detected. Please resolve them manually:"
        echo "   1. Fix conflicts in the listed files"
        echo "   2. Run: git add ."
        echo "   3. Run: git commit"
        echo "   4. Run: git push \"$REMOTE\" \"$BRANCH\""
        exit 1
    }
    echo "📤 Pushing merged changes..."
    git push "$REMOTE" "$BRANCH"
fi

# Restore stashed changes if any
if [ "$STASHED" = true ]; then
    echo "📦 Restoring stashed changes..."
    git stash pop
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Successfully synced and pushed $BRANCH!"

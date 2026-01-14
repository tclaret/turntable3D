#!/bin/bash

# Interactive script to diagnose and fix git push problems
# Usage: ./diagnose-and-fix.sh

set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
REMOTE="origin"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Git Push Diagnostics Tool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

echo "📊 Current Status:"
echo "   Branch: $BRANCH"
echo ""

# Fetch latest info
echo "📥 Fetching latest information from remote..."
git fetch "$REMOTE" 2>/dev/null || {
    echo "⚠️  Warning: Could not fetch from remote"
}
echo ""

# Check if remote branch exists
if ! git show-ref --verify --quiet "refs/remotes/$REMOTE/$BRANCH" 2>/dev/null; then
    echo "ℹ️  Remote branch '$REMOTE/$BRANCH' doesn't exist yet"
    echo "✅ You can push directly with: git push --set-upstream $REMOTE $BRANCH"
    exit 0
fi

# Get commit information
LOCAL=$(git rev-parse "$BRANCH" 2>/dev/null)
REMOTE_REF=$(git rev-parse "$REMOTE/$BRANCH" 2>/dev/null)
BASE=$(git merge-base "$BRANCH" "$REMOTE/$BRANCH" 2>/dev/null)

# Diagnose the situation
echo "🔬 Diagnosis:"
echo ""

if [ "$LOCAL" = "$REMOTE_REF" ]; then
    echo "✅ Your branch is up to date with $REMOTE/$BRANCH"
    echo ""
    echo "💡 You can push with: git push $REMOTE $BRANCH"
    
elif [ "$LOCAL" = "$BASE" ]; then
    echo "⬇️  Your branch is BEHIND $REMOTE/$BRANCH"
    echo ""
    echo "📝 Remote has these commits that you don't have:"
    git log --oneline "$LOCAL".."$REMOTE_REF" 2>/dev/null | head -10
    echo ""
    echo "❗ This is why you're getting the 'non-fast-forward' error!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 Recommended Solutions:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1️⃣  PULL THEN PUSH (Recommended):"
    echo "   git pull --no-rebase $REMOTE $BRANCH"
    echo "   git push $REMOTE $BRANCH"
    echo ""
    echo "2️⃣  USE OUR AUTOMATED SCRIPT:"
    echo "   ./sync-and-push.sh $BRANCH"
    echo ""
    echo "3️⃣  PULL WITH REBASE (Cleaner history):"
    echo "   git pull --rebase $REMOTE $BRANCH"
    echo "   git push $REMOTE $BRANCH"
    echo ""
    read -p "Would you like me to fix this automatically? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🔄 Pulling changes from remote..."
        if git pull --no-rebase "$REMOTE" "$BRANCH"; then
            echo "✅ Pull successful!"
            echo ""
            echo "📤 Now pushing to remote..."
            if git push "$REMOTE" "$BRANCH"; then
                echo "✅ Push successful!"
                echo ""
                echo "🎉 All done! Your branch is now synced."
            else
                echo "❌ Push failed. Please check the error message above."
                exit 1
            fi
        else
            echo "❌ Pull failed. You may have merge conflicts."
            echo "   Please resolve them manually and then run: git push $REMOTE $BRANCH"
            exit 1
        fi
    fi
    
elif [ "$REMOTE_REF" = "$BASE" ]; then
    echo "⬆️  Your branch is AHEAD of $REMOTE/$BRANCH"
    echo ""
    echo "📝 You have these commits that remote doesn't have:"
    git log --oneline "$REMOTE_REF".."$LOCAL" 2>/dev/null | head -10
    echo ""
    echo "✅ You can push safely with: git push $REMOTE $BRANCH"
    echo ""
    read -p "Would you like me to push now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📤 Pushing to remote..."
        if git push "$REMOTE" "$BRANCH"; then
            echo "✅ Push successful!"
        else
            echo "❌ Push failed. Please check the error message above."
            exit 1
        fi
    fi
    
else
    echo "🔀 Your branch and $REMOTE/$BRANCH have DIVERGED"
    echo ""
    echo "📝 Remote has these commits that you don't have:"
    git log --oneline "$LOCAL".."$REMOTE_REF" 2>/dev/null | head -5
    echo ""
    echo "📝 You have these commits that remote doesn't have:"
    git log --oneline "$REMOTE_REF".."$LOCAL" 2>/dev/null | head -5
    echo ""
    echo "❗ This requires merging or rebasing!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 Solutions:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1️⃣  MERGE (keeps both histories):"
    echo "   git pull --no-rebase $REMOTE $BRANCH"
    echo "   # Resolve conflicts if any"
    echo "   git push $REMOTE $BRANCH"
    echo ""
    echo "2️⃣  REBASE (cleaner, linear history):"
    echo "   git pull --rebase $REMOTE $BRANCH"
    echo "   # Resolve conflicts if any"
    echo "   git push $REMOTE $BRANCH"
    echo ""
    echo "3️⃣  USE OUR AUTOMATED SCRIPT:"
    echo "   ./sync-and-push.sh $BRANCH"
    echo ""
    read -p "Would you like me to merge automatically? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🔄 Pulling and merging changes..."
        if git pull --no-rebase "$REMOTE" "$BRANCH"; then
            echo "✅ Merge successful!"
            echo ""
            echo "📤 Now pushing to remote..."
            if git push "$REMOTE" "$BRANCH"; then
                echo "✅ Push successful!"
                echo ""
                echo "🎉 All done! Your branches are now synced."
            else
                echo "❌ Push failed. Please check the error message above."
                exit 1
            fi
        else
            echo "❌ Merge conflicts detected!"
            echo ""
            echo "📋 To resolve:"
            echo "   1. Fix conflicts in the listed files"
            echo "   2. Run: git add <fixed-files>"
            echo "   3. Run: git commit"
            echo "   4. Run: git push $REMOTE $BRANCH"
            exit 1
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 For more help, see: PUSH_GUIDE.md or QUICK_FIX.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

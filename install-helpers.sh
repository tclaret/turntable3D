#!/bin/bash

# Quick installer for turntable3D git helper scripts
# Usage: curl -sSL https://raw.githubusercontent.com/tclaret/turntable3D/copilot/push-remote-code/install-helpers.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/tclaret/turntable3D/copilot/push-remote-code/install-helpers.sh | bash

set -e

BRANCH="copilot/push-remote-code"
REPO="tclaret/turntable3D"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Installing turntable3D Git Helper Scripts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Download scripts
echo "📥 Downloading scripts..."

curl -sSL "${BASE_URL}/diagnose-and-fix.sh" -o diagnose-and-fix.sh
curl -sSL "${BASE_URL}/sync-and-push.sh" -o sync-and-push.sh

# Make executable
chmod +x diagnose-and-fix.sh sync-and-push.sh

echo "✅ Scripts installed!"
echo ""

# Download documentation
echo "📥 Downloading documentation..."

curl -sSL "${BASE_URL}/PUSH_GUIDE.md" -o PUSH_GUIDE.md
curl -sSL "${BASE_URL}/QUICK_FIX.md" -o QUICK_FIX.md
curl -sSL "${BASE_URL}/SOLUTION.md" -o SOLUTION.md

echo "✅ Documentation installed!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Installation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Available commands:"
echo "  ./diagnose-and-fix.sh    - Diagnose and fix push issues"
echo "  ./sync-and-push.sh main  - Auto-sync and push"
echo ""
echo "Documentation:"
echo "  SOLUTION.md     - Complete solution overview"
echo "  QUICK_FIX.md    - Quick reference card"
echo "  PUSH_GUIDE.md   - Detailed guide"
echo ""
echo "To fix your current push issue, run:"
echo "  ./diagnose-and-fix.sh"
echo ""

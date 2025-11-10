#!/bin/bash
# Script to push code to GitHub after allowing secrets

echo "🚀 Pushing code to GitHub..."
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
git status --short

echo ""
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "📥 To pull on another computer, run:"
    echo "   git clone git@github.com:netsec-gg/portfolio-intelligence.git"
    echo "   cd portfolio-intelligence"
    echo "   cd backend && npm install && npm run dev"
else
    echo ""
    echo "❌ Push failed. If GitHub blocked due to secrets:"
    echo "   1. Visit: https://github.com/netsec-gg/portfolio-intelligence/security/secret-scanning/unblock-secret/35Gt26w1rMIlzCH5n92Fv6XbQyw"
    echo "   2. Click 'Allow secret'"
    echo "   3. Run this script again: ./push-to-github.sh"
fi


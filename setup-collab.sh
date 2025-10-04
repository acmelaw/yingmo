#!/bin/bash

echo "🚀 Setting up Vue Notes Collaborative Edition"
echo "=============================================="
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
node --version || { echo "❌ Node.js not found. Please install Node.js 18+"; exit 1; }
echo ""

# Check Python
echo "🐍 Checking Python..."
python3 --version || { echo "❌ Python not found. Please install Python 3.9+"; exit 1; }
echo ""

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
npm install
echo ""

# Install backend dependencies
echo "📥 Installing backend dependencies..."
cd server
python3 -m pip install -r requirements.txt
cd ..
echo ""

# Create .env file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi
echo ""

# Create data directory for server
mkdir -p server/data/documents
echo "✅ Created server data directory"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with your settings"
echo "  2. Start development:"
echo "     npm run dev:fullstack"
echo ""
echo "  Or start separately:"
echo "     Terminal 1: npm run dev"
echo "     Terminal 2: npm run server:dev"
echo ""
echo "📚 See COLLABORATION.md for detailed documentation"

#!/bin/bash

set -e

cd "$(dirname "$0")"

echo "=== Tetris Game Service Started ==="
echo "Building game..."
if [ ! -d "dist" ] || [ "src/App.tsx" -nt "dist/index.html" ] || [ "src/styles.css" -nt "dist/index.html" ]; then
  npm run build
else
  echo "Build up to date; skipping npm run build to avoid npm PATH issues in service."
fi

echo "Starting game server on port 18181..."
echo "Access the game at: http://localhost:18181"

echo "Press Ctrl+C to stop"

# Use serve to serve the built files
exec ./node_modules/.bin/serve -s dist -l tcp://0.0.0.0:18181 --no-clipboard
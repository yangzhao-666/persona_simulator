#!/bin/bash
# Run this on your LOCAL Mac to complete the tunnel and open the simulator
# Make sure launch_hpc.sh is already running on the GPU node first

echo "→ Clearing any existing tunnel on port 11434..."
PIDS=$(lsof -ti:11434 2>/dev/null)
if [ -n "$PIDS" ]; then
  kill $PIDS
  sleep 1
  echo "  killed old session"
fi

echo "→ Opening SSH tunnel to Snellius..."
echo "  (keep this terminal open while using the simulator)"
echo ""

# Open browser after a short delay
(sleep 3 && open "https://yangzhao-666.github.io/persona_simulator/") &

ssh snellius

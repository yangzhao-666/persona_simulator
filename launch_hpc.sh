#!/bin/bash
# Run this from the login node — it requests a GPU, starts Ollama, and opens the reverse tunnel

SCRIPT_DIR=/gpfs/home2/zyang1/persona_simulator

# If not already on a GPU node, request one and re-run this script there
if [ -z "$SLURM_JOB_ID" ]; then
  echo "→ Requesting GPU node..."
  exec srun --partition gpu_a100 --gpus 1 -t 48:00:00 --cpus-per-gpu=4 --gpus-per-task=1 --pty bash "$SCRIPT_DIR/launch_hpc.sh"
fi

echo "✓ On GPU node: $(hostname)"

export OLLAMA_MODELS="$SCRIPT_DIR/ollama/models"
export OLLAMA_ORIGINS="*"
export OLLAMA_HOST="127.0.0.1:11434"
export LD_LIBRARY_PATH="$SCRIPT_DIR/ollama/lib/ollama:$LD_LIBRARY_PATH"

# Start Ollama if not already running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "✓ Ollama already running"
else
  echo "→ Starting Ollama..."
  "$SCRIPT_DIR/ollama/bin/ollama" serve > /tmp/ollama.log 2>&1 &
  # Wait for it to be ready
  for i in $(seq 1 15); do
    sleep 1
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
      echo "✓ Ollama ready (GPU: $(grep -o 'name=[^ ]*' /tmp/ollama.log | head -1))"
      break
    fi
    echo "  waiting... ($i)"
  done
fi

echo ""
echo "→ Opening reverse tunnel to login node..."
echo "  (keep this terminal open while using the simulator)"
echo ""
ssh -R 0.0.0.0:11434:localhost:11434 snellius.surf.nl

#!/bin/bash
# Start Ollama server for persona_simulator (HPC GPU node)
# Usage: ./start_ollama.sh
# Then open the simulator and select Ollama (Local) with http://localhost:11434

SCRIPT_DIR=/gpfs/home2/zyang1/persona_simulator

export OLLAMA_MODELS="$SCRIPT_DIR/ollama/models"
export OLLAMA_ORIGINS="*"
export OLLAMA_HOST="127.0.0.1:11434"
export LD_LIBRARY_PATH="$SCRIPT_DIR/ollama/lib/ollama:$LD_LIBRARY_PATH"

echo "Starting Ollama on $OLLAMA_HOST"
echo "Models: $OLLAMA_MODELS"
echo ""
echo "Available models:"
OLLAMA_HOST="$OLLAMA_HOST" "$SCRIPT_DIR/ollama/bin/ollama" list 2>/dev/null || echo "  (server not yet running)"
echo ""

"$SCRIPT_DIR/ollama/bin/ollama" serve

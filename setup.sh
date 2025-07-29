#!/bin/bash
# Setup script to initialize the Codex environment
# Abort on any failure so errors are visible in CI logs
set -e

# Install Python dependencies
python3 -m pip install -r core_App/requirements.txt

# Ensure admin credentials file exists for the Administracion API
if [ ! -f core_App/Administracion/admin_credentials.json ]; then
    cp core_App/Administracion/admin_credentials.example.json core_App/Administracion/admin_credentials.json
fi

# Export environment variable so Django picks up the credentials path
export ADMIN_CREDENTIALS_FILE="$(pwd)/core_App/Administracion/admin_credentials.json"

#!/bin/bash

# "deploy"|"env"
JSON="deploy"
# "bot"|"map"|"pdf"|"random"|"search"|"all"|"services"
WHAT="bot"
# "local"|"docker"|"dev"|"beta"|"stable"
WHERE="local"
# "ghost"
GHOST=""
#
BRANCH="develop"
#
FORCE=""

# Set variables in a single loop
for arg in "$@"; do
  if [[ "$arg" == "deploy" || "$arg" == "env" ]]; then
    JSON="$arg"
  elif [[ "$arg" == "bot" || "$arg" == "map" || "$arg" == "pdf" || "$arg" == "random" || "$arg" == "search" || "$arg" == "all" || "$arg" == "services" ]]; then
    WHAT="$arg"
  elif [[ "$arg" == "local" || "$arg" == "docker" || "$arg" == "dev" || "$arg" == "beta" || "$arg" == "stable" ]]; then
    WHERE="$arg"
  elif [[ "$arg" = "develop" || "$arg" = "beta" || "$arg" = "main" ]]; then
    BRANCH="$arg"
  elif [ "$arg" = "ghost" ]; then
    GHOST="ghost"
  elif [ "$arg" = "force" ]; then
    FORCE="--force"
  fi
done

# Validate JSON and WHERE variables
if [[ -z "$JSON" ]] || [[ -z "$WHAT" ]] || [[ -z "$WHERE" ]]; then
  echo "Error: JSON variable must be either 'deploy' or 'env'"
  echo "Error: WHAT variable must be either 'bot' or 'services'"
  echo "Error: WHERE variable must be either 'local', 'docker', 'dev', 'beta', or 'stable'"
  echo "GHOST is optional, but must be 'ghost'"
  exit 1
fi

if [[ "$JSON" == "deploy" && "$WHERE" == "local" ]]; then
  echo "Cannot deploy locally."
  exit;
fi

# Pass all arguments to the Node.js script

node deploy.mjs env "$WHAT" "$WHERE"

if [[ "$WHERE" == "local" ]]; then
  echo "./config/env.json created."
else
  echo "./config/env-$WHERE.json created."
fi

if [[ "$JSON" == "env" ]]; then
  exit;
fi

node deploy.mjs deploy "$WHAT" "$WHERE" "$BRANCH" "$GHOST"

# run pm2 from repo root
cd ..

if [[ "$WHAT" == "bot" && "$WHERE" == "docker" ]]; then
  docker compose up -d
  pm2 deploy bot.config.cjs "$WHERE" "$FORCE"

elif [[ "$WHAT" == "bot" && "$WHERE" == "dev" && "$BRANCH" == "develop" ]]; then
  pm2 deploy bot.config.cjs "$WHERE"

elif [[ "$WHAT" == "bot" && "$WHERE" == "beta" && "$BRANCH" == "beta" ]]; then
  pm2 deploy bot.config.cjs "$WHERE"

elif [[ "$WHAT" == "bot" && "$WHERE" == "stable" && "$BRANCH" == "main" ]]; then
  pm2 deploy bot.config.cjs "$WHERE"

else
  echo "nothing else works yet"
fi

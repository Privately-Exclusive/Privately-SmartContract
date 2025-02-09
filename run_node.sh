#!/bin/bash

npx hardhat node --hostname 0.0.0.0 &
NODE_PID=$!

echo "Starting Hardhat Node (PID: $NODE_PID)..."

while ! nc -z 127.0.0.1 8545; do
  echo "Waiting for Hardhat Node to start on 127.0.0.1:8545..."
  sleep 1
done

echo "Hardhat Node is up. Running the deployment script."
npx hardhat run scripts/deploy.ts --network localhost
echo "Deployment complete. Hardhat Node is still running. Press CTRL+C to stop."

wait $NODE_PID

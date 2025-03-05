#!/bin/bash

npx hardhat node &
NODE_PID=$!

echo "Starting Hardhat Node (PID: $NODE_PID)..."

echo "Waiting for Hardhat Node to start on 127.0.0.1:8545..."
while ! nc -z 127.0.0.1 8545; do
  sleep 1
done

echo "Hardhat Node is up. Running the deployment script."
npx hardhat run scripts/deploy.ts --network localhost
echo "Deployment complete."

if [ "$1" == "stop" ]; then
  echo "Stopping Hardhat Node."
  kill $NODE_PID
  wait $NODE_PID
else
  echo "Hardhat Node is still running. Press CTRL+C to stop."
  wait $NODE_PID
fi
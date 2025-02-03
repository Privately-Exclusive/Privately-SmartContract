#!/bin/bash

# Start Hardhat Node in the background
npx hardhat node &
NODE_PID=$! # Capture the Hardhat Node process ID

echo "Starting Hardhat Node (PID: $NODE_PID)..."

# Wait until the Hardhat node is ready (listening on localhost:8545)
while ! nc -z localhost 8545; do
  echo "Waiting for Hardhat Node to start on localhost:8545..."
  sleep 1
done

echo "Hardhat Node is up. Running the deployment script."

# Run the deployment script
npx hardhat run scripts/deploy.ts --network localhost

echo "Deployment complete. Hardhat Node is still running. Press CTRL+C to stop."

# Keep the script running until manually interrupted
wait $NODE_PID

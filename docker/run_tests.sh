#!/bin/bash

echo "Waiting for deployment, this may take a few seconds..."
while [ ! -f /app/deployment-complete.txt ]; do
    sleep 1
done

cp /app/artifacts/contracts/mocks/MockUSDC.sol/MockUSDC.json /app/lib/
cp /app/artifacts/contracts/PrivatelyCollection.sol/PrivatelyCollection.json /app/lib/
cp /app/artifacts/contracts/PrivatelyAuctionSystem.sol/PrivatelyAuctionSystem.json /app/lib/

cd lib
npm test

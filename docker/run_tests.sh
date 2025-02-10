#!/bin/bash

echo "Waiting for deployment, this may take a few seconds..."
while [ ! -f /app/deployment-complete.txt ]; do
    sleep 1
done

cp /app/artifacts/contracts/PrivatelyToken.sol/PrivatelyNFT.json /app/lib/

cd lib
npm test

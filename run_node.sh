docker compose -f docker-compose.yml up --build \
  --exit-code-from hardhat-node

docker compose -f docker-compose.yml down -v

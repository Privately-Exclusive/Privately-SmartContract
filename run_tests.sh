docker compose -f docker-compose.test.yml up --build \
  --abort-on-container-exit \
  --exit-code-from test-runner

docker compose -f docker-compose.test.yml down -v

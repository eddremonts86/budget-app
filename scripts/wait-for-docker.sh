#!/bin/bash
echo "Waiting for Docker to be ready..."
max_retries=30
counter=0
while ! docker info > /dev/null 2>&1; do
  sleep 2
  counter=$((counter+1))
  if [ $counter -ge $max_retries ]; then
    echo "Docker failed to start within timeout."
    exit 1
  fi
  echo "Waiting for Docker... ($counter/$max_retries)"
done
echo "Docker is ready!"

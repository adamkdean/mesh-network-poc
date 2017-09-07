#!/bin/bash

# set cwd to script parent
cd "${0%/*}/.."

echo "[building 'mesh-network-server' image]"
docker build -q --rm -t mesh-network-server .

echo "[removing old containers]"
docker ps -a | grep mesh.project | awk '{print $1}' | xargs docker rm -f

if [ -z "$(docker network ls | grep test-network)" ]; then
  echo "[creating test network]"
  docker network create \
    --driver bridge \
    --subnet 172.25.0.1/16 \
    test-network
fi

echo "[running n1.mesh.project]"
docker run \
  --detach \
  --name n1.mesh.project \
  --hostname n1.mesh.project \
  --network test-network \
  --env PORT=12000 \
  mesh-network-server

echo "[running n2.mesh.project]"
docker run \
  --detach \
  --name n2.mesh.project \
  --hostname n2.mesh.project \
  --network test-network \
  --env PORT=12000 \
  mesh-network-server

echo "[running n3.mesh.project]"
docker run \
  --detach \
  --name n3.mesh.project \
  --hostname n3.mesh.project \
  --network test-network \
  --env PORT=12000 \
  mesh-network-server
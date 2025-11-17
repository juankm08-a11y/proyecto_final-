#!/bin/sh

HOST=$1
PORT=$2

echo "Esperando a Kafka en $HOST:$PORT ..."

# Esperar hasta que nc pueda conectarse
while ! nc -z $HOST $PORT; do
  sleep 2
done

echo "Kafka está listo!"

const express = require("express");
const amqp = require("amqp");
const cors = require("cors");

const app = express();
app.use(express());
app.use(cors());

const RABBITMQ_URL = "amqp://192.168.80.1";
const EXCHANGE = "aula_exchange";
const ROUTING_KEY = "asistencia.alerta";

let alertas = [];
let channel;

async function conectRabbit() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, "direct", { durable: false });
  console.log(`API conectada a Rabbit MQ y conectada a alertas`);
  return channel;
}

const express = require("express");
const amqp = require("amqp");
const cors = require("cors");
const WebSocket = require("ws");

const app = express();
app.use(cors());

const wss = new WebSocket.Server({ port: 8082 });

function broadcast(msg) {
  wss.clients.forEach((c) => c.readyState === WebSocket.OPEN && c.send(msg));
}

const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";
const EXCHANGE = "betting_exchange";
const ROUTING_KEY = "match.alert";

async function connectRabbit() {
  try {
    const connection = amqp.createConnection({ url: RABBITMQ_URL });

    connection.on("ready", () => {
      connection.exchange(
        EXCHANGE,
        { type: "direct", durable: false },
        (exchange) => {
          connection.queue("", { exclusive: true }, (queue) => {
            queue.bind(EXCHANGE, ROUTING_KEY);
            queue.subscribe((msg) => {
              const alerta = msg.data.toString();
              console.log(`Alerta WS: ${alerta}`);
              broadcast(alerta);
            });
          });
        }
      );
    });
  } catch (error) {
    console.error("Error al conectar a RabbitMQ: ", error);
  }
}

app.listen(8081, () => {
  console.log("Dashboard API en 8081");
  connectRabbit();
});

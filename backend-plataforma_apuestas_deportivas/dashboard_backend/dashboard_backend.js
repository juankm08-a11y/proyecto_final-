const fs = require("fs");
const https = require("https");
const express = require("express");
const amqp = require("amqp");
const cors = require("cors");
const WebSocket = require("ws");
const path = require("path");

const app = express();

const server = https.createServer(
  {
    cert: fs.readFileSync("cert.pem"),
    key: fs.readFileSync("key.pem"),
  },
  app
);

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const wss = new WebSocket.Server({ server });

function broadcast(msg) {
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
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

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola Mundo desde api con dockersql" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(8081, "0.0.0.0", () => {
  console.log("Dashboard API con HTTPS en 8081");
  connectRabbit();
});

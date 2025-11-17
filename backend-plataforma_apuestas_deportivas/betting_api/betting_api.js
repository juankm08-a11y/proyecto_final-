const { Kafka } = require("kafkajs");
const amqp = require("amqp");
const express = require("express");
const mysql = require("mysql2/promise");
const app = express();

app.use(express.json());

const kafka = new Kafka({
  clientId: "betting-api",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();

const db = await mysql.createPool({
  host: "mysql",
  user: "root",
  password: "apuestas_deportivas",
});

const RABBITMQ_URL = "amqp://guest:guest@rabbitMQ";
const EXCHANGE = "betting_exchange";
const ROUTING_KEY = "match.alert";

async function connectRabbit() {
  return new Promise((resolve, reject) => {
    const connection = amqp.createConnection({ url: RABBITMQ_URL });

    connection.on("ready", () => {
      console.log("Betting API conectado a RabbitMQ");

      connection.exchange(
        EXCHANGE,
        { type: "direct", durable: false },
        (exchange) => resolve({ connection, exchange })
      );
    });

    connection.on("error", reject);
  });
}

async () => {
  await producer.connect();
  var { exchange } = await connectRabbit();
};

app.post("/odds", async (req, res) => {
  const { matchId, newOdds } = req.body;

  if (!matchId || !newOdds)
    return res.status(400).json({ error: "Datos incompletos" });

  await db.query(
    "INSERT INTO odds_history (match_id,odds,timestamp) VALUES (?,?,NOW())",
    [matchId, newOdds]
  );

  await producer.send({
    topic: "bettings_events",
    messages: [{ key: matchId, value: JSON.stringify({ matchId, newOdds }) }],
  });

  exchange.publish(
    ROUTING_KEY,
    Buffer.from(`Nueva cuota ${newOdds} para ${matchId}`)
  );

  res.json({ message: "Cuota enviada correctamente" });
});

app.listen(8080, () => console.log("Betting api escuchando en el puerto 8080"));

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

let db;
async function initDB() {
  db = await mysql.createPool({
    host: "mysql",
    user: "root",
    password: "juan03",
    database: "apuestas_deportivas",
  });

  await db.query(
    `
    CREATE TABLE IF NOT EXISTS odds_history (
      id INT AUTO_INCREMENT, 
      match_id VARCHAR(50), 
      odds DECIMAL (5,2),
      timestamp DATETIME DEFAULT NOW()
    )`
  );

  console.log("Conectado correctamente a MySQL");
}

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
        (exchange) => {
          exchangeGlobal = exchange;
          resolve(exchange);
        }
      );
    });

    connection.on("error", reject);
  });
}

async function init() {
  await producer.connect();
  await initDB();
  await connectRabbit();

  console.log("Api lista");
}

init();

app.post("/odds", async (req, res) => {
  const { matchId, newOdds } = req.body;

  if (!matchId || !newOdds)
    return res.status(400).json({ error: "Datos incompletos" });

  await producer.send({
    topic: "bettings_events",
    messages: [{ key: matchId, value: JSON.stringify({ matchId, newOdds }) }],
  });

  await db.query("INSERT INTO odds_history (match_id,odds) VALUES (?,?)", [
    matchId,
    newOdds,
  ]);

  await producer.send({
    topic: "bettings_events",
    messages: [{ key: matchId, value: JSON.stringify({ Math, newOdds }) }],
  });

  if (exchangeGlobal) {
    exchangeGlobal.publish(
      ROUTING_KEY,
      Buffer.from(`Nueva cuota ${newOdds} para ${matchId}`)
    );
  }

  res.json({ message: "Cuota enviada correctamente" });
});

app.listen(8080, () => console.log("Betting api escuchando en el puerto 8080"));

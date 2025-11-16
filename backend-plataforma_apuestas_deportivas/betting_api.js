const { Kafka } = require("kafkajs");
const amqp = require("amqp");

const kafka = new Kafka({
  clientId: "betting-api",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();
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

async function run() {
  await producer.connect();
  const { exchange } = await connectRabbit();

  setInterval(async () => {
    const matchId = `match_${Math.floor(Math.random() * 1000)}`;
    const odds = (Math.random() * (2.5 - 1.1) + 1.1).toFixed(2);
    const msg = { matchId, odds, timestamp: new Date().toISOString() };

    await producer.send({
      topic: "bettings_events",
      messages: [{ key: matchId, value: JSON.stringify(msg) }],
    });

    console.log(`Evento enviado a Kafka: ${JSON.stringify(msg)}`);

    const alerta = `Nueva cuota disponible para ${matchId}: ${odds}`;
    exchange.publish(ROUTING_KEY, Buffer.from(alerta));

    console.log(`Alerta enviada a RabbitMQ: ${alerta}`);
  }, 4000);
}

run().catch(console.error);

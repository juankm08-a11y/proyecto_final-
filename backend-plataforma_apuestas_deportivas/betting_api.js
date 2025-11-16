const { Kafka } = require("kafkajs");
const { amqp } = require("amqp");

const kafka = new Kafka({
  clientId: "betting-api",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();
const RABBITMQ_URL = "amqp://guest:guest@rabbitMQ";
const EXCHANGE = "betting_exchange";

async function conectRabbit() {
  const connection = amqp.createConnection({ url: RABBITMQ_URL });

  connection.on("ready", () => {
    console.log("Conectado a RabbitMQ");
  });

  return connection;
}

async function run() {
  await producer.connect();
  rabbitChannel = await conectRabbit();

  connection.exchange(
    EXCHANGE,
    { type: "direct", durable: false },
    (exchange) => {
      setInterval(async () => {
        const matchId = `match_${Math.floor(Math.random() * 1000)}`;
        const odds = (Math.random() * (2.5 - 1.1) + 1.1).toFixed(2);
        const msg = { matchId, odds, timestamp: new Date().toISOString() };

        await producer.send({
          topic: "bettings_events",
          messages: [{ key: matchId, value: JSON.stringify(msg) }],
        });

        console.log(`Evento de apuesta: ${JSON.stringify(msg)}`);

        const alerta = `Nueva cuota disponible para ${matchId}:${odds}`;
        exchange.publish("match.alert", Buffer.from(alerta));
        console.log(`Alerta enviada a RabbitMQ ${alerta}`);
      }, 4000);
    }
  );
}

run().catch(console.error);

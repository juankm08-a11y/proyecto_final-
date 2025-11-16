const { Kafka } = require("kafkajs");
const amqp = require("amqp");

const kafka = new Kafka({
  clientId: "match-generator",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();
const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";

async function run() {
  await producer.connect();

  const connection = amqp.createConnection({ url: RABBITMQ_URL });

  connection.on("ready", () => {
    console.log("Conectado a RabbitMQ");
  });

  connection.exchange(
    "match_exchange",
    { type: "direct", durable: true },
    (exchange) => {
      setInterval(async () => {
        const matchId = `m${Math.floor(Math.random() * 999)}`;
        const event = { event_type: "MATCH_CREATE", match_id: matchId, teams };

        console.log(`Nuevo partido: ${event}`);

        await producer.send({
          topic: "match_events",
          messages: [{ key: matchId, value: JSON.stringify(event) }],
        });

        exchange.publish("match_simulator", { match_id: matchId });
        console.log(`Partido enviado a (RabbitMQ)`);
      }, 5000);
    }
  );
  connection.on("error", (err) => {
    console.error(`Error al conectar RabbitMQ ${err}`);
  });
}

run().catch(console.error);

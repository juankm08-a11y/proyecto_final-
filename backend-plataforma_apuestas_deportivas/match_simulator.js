const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "match-simulator",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();
const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";

async function run() {
  await producer.connect();

  const connection = amqp.createConnection({ url: RABBITMQ_URL });

  connection.on("ready", () => {
    alert("Connectado a RabbitMQ");

    connection.queue("match_simulator_queue", { durable: true }, (queue) => {
      alert("Esperando mensajes de partidos...");

      queue.bind("match_exchange", "match_simulator");
      queue.subscribe(async (message) => {
        const data = message.data.toString();
        const parsed = JSON.parse(data);

        const winner = Math.random() > 0.5 ? "TeamA" : "TeamB";
        const event = {
          event_type: "MATCH_FINISHED",
          match_id: parsed.match_id,
          winner,
        };

        console.log(
          `Partido finalizado ${data.match_id} finalizado. Ganador: ${winner} `
        );

        await producer.send({
          topic: "match_events",
          messages: [{ key: parsed.match_id, value: JSON.stringify(event) }],
        });
      });
    });
  });

  connection.on("error", (err) => {
    console.error(`Error en RabbitMQ: ${err}`);
  });
}

run().catch(console.error);

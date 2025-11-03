const { Kafka } = require("kafkajs");
const { WebSocket } = require("ws");

const kafka = new Kafka({
  clientId: "asistencia-backend",
  brokers: ["kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "asistencia-backend" });
const wss = new WebSocket.Server({ port: 8082 });

wss.on("connection", (ws) => {
  console.log("Cliente conectado al WebSocket");
});

async function run() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "asistencia-summary",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const summary = JSON.parse(message.value);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(summary));
        }
      });
      console.log(`Enviado a WebSocket: ${JSON.stringify}`);
    },
  });
}

run().catch(console.error);

const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "asistencia-processor",
  brokers: ["kafka:9092"],
});

const consumer = kafka.consumewr({ groupId: "asistencia-processor" });
const producer = kafka.producer();
const zoneBuffers = new Map();

async function run() {
  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: "asistencia-events", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value);
      const { zoneId, asistanceCount } = data;

      const buffer = zoneBuffers.get(zoneId) || [];
      buffer.push(asistanceCount);
      if (buffer.length > 5) buffer.shift();
      zoneBuffers.set(zoneId, buffer);

      const average = buffer.reduce((sum, val) => sum + val, 0) / buffer.length;
      const summary = {
        zoneId,
        currentAverage: average.toFixed(1),
        timestamp: data.timestamp,
      };

      await producer.send({
        topic: "asistencia-summary",
        messages: [{ value: JSON.stringify(summary) }],
      });
      console.log(`Procesando: ${JSON.stringify(summary)}`);
    },
  });
}

run().catch(console.error);

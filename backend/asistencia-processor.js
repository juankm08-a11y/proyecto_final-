const { Kafka } = require("kafkajs");
const amqp = require("amqp");

const kafka = new Kafka({
  clientId: "asistencia-processor",
  brokers: ["kafka:9092"],
});

const consumer = kafka.consumewr({ groupId: "asistencia-processor" });

const RABBITMQ_URL = "amqp://192.168.80.1";

const EXCHANGE = "aula_exchange";
let rabbitChannel;

async function conectRabbit() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, "direct", { durable: false });
  console.log(`Procesador conectado a rabbitMQ`);
  return channel;
}

async function run() {
  rabbitChannel = await conectRabbit();
  await consumer.connect();
  await consumer.subscribe({ topic: "asistencia-events", fromBeginning: true });

  console.log("Escuchando eventos Kafka...");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`Evento recibido de Kafka: ${JSON.stringify(data)}`);

      const { zoneId, asistanceCount } = data;

      if (asistanceCount > 40) {
        const alerta = `Alerta: Zona ${zoneId} tiene alta ocupación (${asistanceCount} personas)`;
        console.log(alerta);

        rabbitChannel.publish(
          EXCHANGE,
          "asistencia.alerta",
          Buffer.from(alerta)
        );
        console.log(`Alerta enviada a RabbitMQ: ${alerta}`);
      }
    },
  });
}

run().catch(console.error);

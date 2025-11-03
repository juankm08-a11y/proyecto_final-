const amqp = require("amqp");

const RABBITMQ_URL = "amqp://192.168.80.1";
const EXCHANGE = "aula_exchange";
const ROUTING_KEY = "asistencia.alerta";

async function run() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, "direct", { durable: false });
  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE, ROUTING_KEY);

  console.log("Esperando mensajes de asistencia");

  channel.consume(
    q.queue,
    (msg) => {
      if (msg.content) {
        console.log(`Recibido: ${msg.content.toString()}`);
      }
    },
    { noAck: true }
  );
}

run().catch(console.error);

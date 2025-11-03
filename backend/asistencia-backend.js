const express = require("express");
const amqp = require("amqp");
const cors = require("cors");

const app = express();
app.use(express());
app.use(cors());

const RABBITMQ_URL = "amqp://192.168.80.1";
const EXCHANGE = "aula_exchange";
const ROUTING_KEY = "asistencia.alerta";

let alertas = [];
let channel;

async function conectRabbit() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, "direct", { durable: false });
    const q = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE, ROUTING_KEY);

    console.log(`API conectada a Rabbit MQ y conectada a alertas`);

    channel.consume(
      q.queue,
      (msg) => {
        if (msg.content) {
          const alerta = msg.content.toString();
          console.log(`Nueva alerta recibida: ${alerta}`);
          alertas.push({
            mensaje: alerta,
            fecha: new Date().toISOString(),
          });
        }
      },
      { noAck: true }
    );
  } catch (error) {
    console.error("Error al conectar a RabbitMQ: ", error);
  }
}

app.get("/", (req, res) => {
  res.json({ status: "0K", message: "API de asistencia en ejecución" });
});

app.get("/alertas", (req, res) => {
  res.json(alertas);
});

app.delete("/alertas", (req, res) => {
  alertas = [];
  res.json({ message: "Alertas eliminadas correctamente" });
});

const PORT = 8081;
app.listen(PORT, async () => {
  console.log(`Backend corriendo en el puerto ${PORT}`);
  await conectRabbit();
});

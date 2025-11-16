const express = require("express");
const amqp = require("amqp");
const cors = require("cors");

const app = express();
app.use(express());
app.use(cors());

const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";
const EXCHANGE = "betting_exchange";
const ROUTING_KEY = "match.alerta";

let alertas = [];

async function conectRabbit() {
  try {
    const connection = amqp.createConnection({ url: RABBITMQ_URL });

    connection.on("ready", () => {
      console.log("Dashboard conectado a RabbitMQ");

      connection.exchange(
        EXCHANGE,
        { type: "direct", durable: false },
        (exchange) => {
          connection.queue("", { exclusive: true }, (queue) => {
            queue.bind(EXCHANGE, ROUTING_KEY);
            queue.subscribe((message) => {
              const alerta = message.data.toString();
              console.log(`Nueva alerta: ${alerta}`);
              alertas.push({
                message: alerta,
                fecha: new Date().toISOString(),
              });
            });
          });
        }
      );
    });
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

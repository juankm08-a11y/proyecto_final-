const amqp = require("amqp");

const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";
const EXCHANGE = "betting_exchange";
const ROUTING_KEY = "match.alerta";

async function run() {
  const connection = amqp.createConnection({ url: RABBITMQ_URL });

  connection.on("ready", () => {
    console.log("Email Worker conectado a RabbitMQ");

    connection.exchange(
      EXCHANGE,
      { type: "direct", durable: false },
      (exchange) => {
        connection.queue("", { exclusive: true }, (queue) => {
          queue.bind(EXCHANGE, ROUTING_KEY);
          queue.subscribe((message) => {
            const texto = message.data.toString();
            console.log(`Correo enviado: ${texto}`);
          });
        });
      }
    );
  });

  connection.on("error", (err) => {
    console.error(`Error en RabbitMQ ${err}`);
  });
}

run().catch(console.error);

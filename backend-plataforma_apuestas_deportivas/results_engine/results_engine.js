const amqp = require("amqp");

const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";
const EXCHANGE = "betting_exchange";
const ROUTING_KEY = "match.alert";

async function run() {
  const connection = amqp.createConnection({ url: RABBITMQ_URL });

  connection.on("ready", () => {
    console.log("Conectado a RabbitMQ en results_engine");

    connection.exchange(
      EXCHANGE,
      { type: "direct", durable: false },
      (exchange) => {

        connection.queue("", { exclusive: true }, (queue) => {
          queue.bind(EXCHANGE, ROUTING_KEY);

          queue.subscribe((message) => {
            const msg = message.data.toString();
            console.log("Mensaje recibido:", msg);
          });
        });

      }
    );
  });

  connection.on("error",(err) => {
    console.error("Error en resuts engine RabbitMQ",err)
  })
}

run();

const { Kafka } = require("kafkajs");
const amqp = require("amqp");

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
    console.log("Connectado a RabbitMQ");

    connection.exchange(
      "alertas exchange",
      { type: "direct", durable: true },
      (exchange) => {
        connection.queue("alertas inmediatas", { durable: true }, (queue) => {
          queue.bind(exchange, "alerta_key"),
            console.log("Cola lista: alertas inmediatas");

          setInterval(async () => {
            const matchId = "MATCH-001";

            const oldOdds = parseFloat((Math.random() * 3).toFixed(2));
            const newOdds = parseFloat((Math.random() * 3).toFixed(2));

            await producer.send({
              topic: "match_events",
              messages: [
                {
                  key: matchId,
                  value: JSON.stringify({
                    type: "ODDS_UPDATED",
                    matchId,
                    newOdds,
                    timestamp: Date.now(),
                  }),
                },
              ],
            });

            const alerta = {
              type: "NUEVA_CUOTA",
              matchId,
              oldOdds,
              newOdds,
              change: (newOdds - oldOdds).toFixed(2),
              timestamp: Date.now(),
            };

            exchange.publish("alerta_key", alerta);
            console.log("Alerta enviada: ", alerta);
          }, 5000);
        });
      }
    );
  });

  connection.on("error", (err) => {
    console.error(`Error en RabbitMQ: ${err}`);
  });
}

run().catch((err) => console.error("Error fatal: ", err));

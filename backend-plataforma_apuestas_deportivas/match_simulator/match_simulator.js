const { Kafka } = require("kafkajs");
const amqp = require("amqp");

const KAFKA_BROKER = "kafka:9092";
const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";

const DELAY_EXCHANGE = "match_delay";
const DELAY_ROUTING_KEY = "match.simulate";
const QUEUE_NAME = "match_simulator_queue";

const KAFKA_TOPIC = "match_events";

async function start() {
    console.log("Iniciando match_simulator...");

    const kafka = new Kafka({
        clientId: "match.simulator",
        brokers: [KAFKA_BROKER]
    });

    const producer = kafka.producer();

    try {
        await producer.connect();
        console.log("Kafka conectado:", KAFKA_BROKER);
    } catch (error) {
        console.error("Error conectando a Kafka:", error);
    }

    const connection = amqp.createConnection({ url: RABBITMQ_URL });

    connection.on("error", (err) => console.error("RabbitMQ error:", err));

    connection.on("ready", () => {
        console.log("RabbitMQ conectado:", RABBITMQ_URL);

        connection.queue(
            QUEUE_NAME,
            { durable: true, autoDelete: false },
            (queue) => {
                console.log("Cola lista:", QUEUE_NAME);

                queue.bind(DELAY_EXCHANGE, DELAY_ROUTING_KEY);
                console.log(
                    `Cola enlazada a ${DELAY_EXCHANGE} con routing key ${DELAY_ROUTING_KEY}`
                );

                queue.subscribe(async (msg, headers, info) => {
                    try {
                        const data = JSON.parse(msg.data.toString());

                        console.log("Mensaje recibido en match_simulator", data);

                        const finishedMsg = {
                            event_type: "MATCH_FINISHED",
                            matchId: data.matchId,
                            teams: data.teams,
                            timestamp: new Date().toISOString()
                        };

                        await producer.send({
                            topic: KAFKA_TOPIC,
                            messages: [
                                {
                                    key: data.matchId,
                                    value: JSON.stringify(finishedMsg)
                                }
                            ]
                        });

                        console.log("MATCH_FINISHED enviado a Kafka:", finishedMsg);

                    } catch (err) {
                        console.error("Error procesando mensaje:", err);
                    }
                });
            }
        );
    });

    process.on("SIGINT", async () => {
        console.log("Apagando match simulator...");
        await producer.disconnect();
        process.exit(0);
    });
}

start();

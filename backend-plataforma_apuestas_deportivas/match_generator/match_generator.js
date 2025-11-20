const { Kafka } = require("kafkajs");
const amqp = require("amqp");

const KAFKA_BROKER = "kafka:9092";
const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";
const DELAY_MS = parseInt("30000", 10);
const CREATE_INTERVAL_MS = parseInt("10000", 10);

const PARTIDOS = [
    ["Millonarios", "Barcelona"],
    ["Real Madrid", "Liverpool"],
    ["Chelsea", "PSG"],
    ["Juventus", "Inter"],
    ["Bayern", "Dortmund"]
];

const KAFKA_TOPIC = "match_events";
const DELAY_EXCHANGE = "match_delay";
const DELAY_ROUTING_KEY = "match.simulate";

let running = true;

async function start() {
    const kafka = new Kafka({
        clientId: "match-generator",
        brokers: [KAFKA_BROKER]
    });

    const producer = kafka.producer();

    try {
        await producer.connect();
        console.log("Kafka producer conectado a", KAFKA_BROKER);
    } catch (error) {
        console.error("Error conectando a Kafka:", error);
        process.exit(1);
    }

    const connection = amqp.createConnection({ url: RABBITMQ_URL });

    connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
    });

    connection.on("ready", () => {
        console.log("Conectado a RabbitMQ en", RABBITMQ_URL);

        connection.exchange(
            DELAY_EXCHANGE,
            {
                type: "x-delayed-message",
                durable: true,
                autoDelete: false,
                arguments: { "x-delayed-type": "direct" },
            },
            (exchange) => {
                console.log(`Exchange retrasado listo: ${DELAY_EXCHANGE}`);

                loopCreateMatches(producer, exchange).catch((e) => {
                    console.error("Error en loopCreateMatches:", e);
                });
            }
        );
    });

    process.on("SIGINT", async () => {
        console.log("SIGINT recibido - cerrando...");
        running = false;

        try {
            await producer.disconnect();
        } catch (e) {}

        try {
            connection && connection.end();
        } catch (e) {}

        process.exit(0);
    });
}

function uid() {
    return `m${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
}

async function loopCreateMatches(producer, exchange) {
    while (running) {
        try {
            const idx = Math.floor(Math.random() * PARTIDOS.length);
            const teams = PARTIDOS[idx];
            const matchId = uid();

            const payload = {
                event_type: "MATCH_CREATED",
                matchId,
                teams,
                timestamp: new Date().toISOString(),
            };

            await producer.send({
                topic: KAFKA_TOPIC,
                messages: [
                    {
                        key: matchId,
                        value: JSON.stringify(payload),
                    }
                ]
            });

            console.log("MATCH_CREATED -> kafka:", JSON.stringify(payload));

            const delayedMsg = {
                matchId,
                teams,
                timestamp: Date.now(),
                scheduledAfterMs: DELAY_MS
            };

            exchange.publish(
                DELAY_ROUTING_KEY,
                JSON.stringify(delayedMsg),
                {
                    headers: { "x-delay": DELAY_MS },
                    contentType: "application/json"
                }
            );

            console.log(
                `Mensaje diferido publicado en RabbitMQ (delay=${DELAY_MS}ms) ->`,
                delayedMsg
            );

        } catch (error) {
            console.error("Error publicando MATCH_CREATED:", error);
        }

        await new Promise((r) => setTimeout(r, CREATE_INTERVAL_MS));
    }
}

start().catch((err) => {
    console.error("Fallo iniciando match_generator:", err);
    process.exit(1);
});

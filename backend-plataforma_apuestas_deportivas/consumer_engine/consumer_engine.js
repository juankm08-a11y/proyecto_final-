const { Kafka } = require("kafkajs");
const amqp = require("amqp");

const KAFKA_BROKER = "kafka:9092";
const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";

const KAFKA_TOPIC = "match_events";

const EXCHANGE = "betting_exchange";
const ROUTING_KEY = "match.alert";

async function start() {
    console.log("Iniciando consumer_engine...");

    const kafka = new Kafka({
        clientId: "Consumer-engine",
        brokers: [KAFKA_BROKER],
    });

    const consumer = kafka.consumer({ groupId: "match-processing" });

    await consumer.connect();
    await consumer.subscribe({ topic: KAFKA_TOPIC });

    console.log("Conectado a Kafka y escuchando:", KAFKA_TOPIC);

    const rabbit = amqp.createConnection({ url: RABBITMQ_URL });

    rabbit.on("ready", () => {
        rabbit.exchange(
            EXCHANGE,
            { type: "direct", durable: false },
            (exchange) => {

                console.log("RabbitMQ listo en consumer_engine");

                consumer.run({
                    eachMessage: async ({ message }) => {
                        try {
                            const event = JSON.parse(message.value.toString());
                            console.log("Evento Kafka recibido:", event);

                            let alertMsg = null;

                            switch (event.event_type) {
                                case "MATCH_CREATED":
                                    alertMsg = {
                                        event_type: "MATCH_CREATED",
                                        match_id: event.match_id,
                                        teams: event.teams,
                                        timestamp: event.timestamp,
                                        odds: { A: 1.5, B: 1.5 }
                                    };
                                    break;

                                case "MATCH_FINISHED":
                                    alertMsg = {
                                        event_type: "MATCH_FINISHED",
                                        match_id: event.match_id,
                                        teams: event.teams,
                                        timestamp: event.timestamp,
                                        result: event.result || "PENDING"
                                    };
                                    break;

                                case "ODDS_UPDATED":
                                    alertMsg = {
                                        event_type: "ODDS_UPDATED",
                                        match_id: event.match_id,
                                        team: event.team,
                                        odds: event.odds
                                    };
                                    break;
                            }

                            if (!alertMsg) return;

                            exchange.publish(ROUTING_KEY, JSON.stringify(alertMsg));
                            console.log("---> reenviado a RabbitMQ:", alertMsg);

                        } catch (error) {
                            console.error("Error procesando mensaje Kafka:", error);
                        }
                    }
                });
            }
        );
    });
}

start();

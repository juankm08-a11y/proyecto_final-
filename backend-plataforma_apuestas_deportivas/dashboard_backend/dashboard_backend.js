const fs = require("fs");
const https = require("https");
const express = require("express");
const amqp = require("amqp");
const cors = require("cors");
const WebSocket = require("ws");
const path = require("path");

const app = express();

const server = https.createServer(
  {
    cert: fs.readFileSync("cert.pem"),
    key: fs.readFileSync("key.pem"),
  },
  app
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const wss = new WebSocket.Server({ server });

function broadcast(msg) {
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}

const RABBITMQ_URL = "amqp://guest:guest@rabbitmq";
const EXCHANGE = "betting_exchange";
const ROUTING_KEY = "match.alert";

let rabbitConnection = null;
let rabbitExchange = null;

let matches = {};

async function connectRabbit() {
  return new Promise((resolve, reject) => {
    try {
      const connection = amqp.createConnection({ url: RABBITMQ_URL });

      connection.on("ready", () => {
        connection.exchange(
          EXCHANGE,
          { type: "direct", durable: false },
          (exchange) => {
            rabbitConnection = connection;
            rabbitExchange = exchange;

            console.log("Exchange listo: ", EXCHANGE);

            connection.queue("", { exclusive: true }, (queue) => {
              queue.bind(EXCHANGE, ROUTING_KEY);
              queue.subscribe((msg) => {
                const alerta = msg.data.toString();
                console.log(`Alerta WS: ${alerta}`);

                try {
                  const data = JSON.parse(alerta);
                  if (data.match_id) {
                    if (data.teamA && data.teamB) {
                      matches[data.match_id] = data;
                    } else if (data.teams && data.teams.length === 2) {
                      matches[data.match_id] = {
                        ...data,
                        teamA: data.teams[0],
                        teamB: data.teams[1],
                      };
                    } else {
                      matches[data.match_id] = {
                        ...data,
                        teamA: data.teams?.[0] || "Equipo1",
                        teamB: data.teams?.[0] || "Equipo2",
                      };
                    }

                    if (data.event_type === "ODDS_UPDATED") {
                      matches[data.match_id].odds = matches[data.match_id].odds || {};
                      matches[data.match_id].odda[data.team] = data.odds;
                    }
                  }
                } catch (e) {
                  console.error("error parseando alerta: ", e);
                }
                broadcast(alerta);
              });
            });
            resolve(true);
          }
        );
      });
      connection.on("error", (err) => {
        console.error("Error RabbitQM", err);
        reject(err);
      });
    } catch (error) {
      console.error("Error al conectar a RabbitMQ: ", error);
      reject(err);
    }
  });
}

const rabbitConn = connectRabbit();

// app.get("/api/hello", (req, res) => {
//   res.json({ message: "Hola Mundo desde api con dockersql" });
// });

app.post("/api/set-odds", (req, res) => {
  const { match_id, team, odds } = req.body;
  if (!match_id || !team || odds === undefined)
    return res.status(400).json({ error: "Faltan datos" });

  if (!rabbitExchange) {
    return res
      .status(503)
      .json({ error: "RabbitMQ no está listo aún, intenta en 2 segundos" });
  }

  const msg = JSON.stringify({
    match_id,
    team,
    odds,
    event_type: "ODDS_UPDATED",
  });

  rabbitExchange.publish(ROUTING_KEY, msg);
  console.log("Cuota enviada: ", msg);

  res.json({ status: "ok", data: msg });
});

app.get("/api/matches", (req, res) => {
  res.json(matches);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(8081, "0.0.0.0", () => {
  console.log("Dashboard API con HTTPS en 8081");
  connectRabbit();
});

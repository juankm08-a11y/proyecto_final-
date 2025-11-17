// async function loadMatches() {
//   try {
//     const res = await fetch("/matches");
//     if (!res.ok) {
//       throw new Error(`Error al cargar partidos: ${res.status}`);
//     }

//     const matches = await res.json();
//     const container = document.getElementById("matches");
//     container.innerHTML = "";

//     matches.forEach((m) => {
//       const div = document.createElement("div");

//       div.className = "match";
//       div.innerHTML = `
//                 <strong>${m.homeTeam}</strong> vs <strong>${
//         m.awayTeam
//       }</strong><br>
//                 Inicio: ${new Date(m.startAt).toLocaleString()}

//             `;
//       container.appendChild(div);
//     });
//   } catch (err) {
//     console.error(err);
//   }
// }

// loadMatches();

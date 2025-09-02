// ====== Config ======
// Como o site e a API estão no MESMO domínio (vercel.json faz o roteamento),
// deixe vazio para o fetch usar /api/... na mesma origem.
const API_BASE = "";

// Helper para montar URL
const api = (p) => (API_BASE ? API_BASE : "") + p;

// ====== STATUS (cards do topo) ======
async function loadStatus() {
  try {
    const r = await fetch(api("/api/status"));
    const j = await r.json();

    const dot = document.getElementById("connDot");
    const txt = document.getElementById("connText");

    if (j.online) {
      dot.className = "dot online";
      txt.textContent = "Online";
    } else {
      dot.className = "dot offline";
      txt.textContent = "Offline";
    }

    // Última leitura
    if (j.latest) {
      const t = Number(j.latest.temp);
      const u = Number(j.latest.umid);

      const limT = Number(j?.limites?.temp ?? 30);
      const limU = Number(j?.limites?.umid ?? 30);

      const tempEl = document.getElementById("tempValue");
      const humEl  = document.getElementById("humValue");
      const tStatus = document.getElementById("tempStatus");
      const hStatus = document.getElementById("humStatus");

      if (Number.isFinite(t)) tempEl.textContent = t.toFixed(1);
      if (Number.isFinite(u)) humEl.textContent  = u.toFixed(0);

      tStatus.textContent = Number.isFinite(t) && t > limT ? "Acima do limite" : "Normal";
      hStatus.textContent = Number.isFinite(u) && u < limU ? "Baixa" : "Normal";

      if (j.latest.error) {
        dot.className = "dot warn";
        txt.textContent = "Sensor com falha";
      }
    }

    document.getElementById("deviceOnline").textContent = j.online ? "Online" : "Offline";
    document.getElementById("lastSeen").textContent = j.lastSeen
      ? new Date(j.lastSeen).toLocaleString()
      : "—";
  } catch (e) {
    const dot = document.getElementById("connDot");
    const txt = document.getElementById("connText");
    dot.className = "dot offline";
    txt.textContent = "Erro ao conectar";
    console.error(e);
  }
}

// ====== HISTÓRICO (tabela + CSV) ======
async function loadHistory() {
  try {
    const r = await fetch(api("/api/history?limit=20"));
    const j = await r.json();

    const tbody = document.getElementById("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    (j.series || []).forEach((row) => {
      const tr = document.createElement("tr");
      const dt = row.ts ? new Date(row.ts).toLocaleString() : "—";
      tr.innerHTML = `
        <td>${dt}</td>
        <td>${Number(row.temp).toFixed(1)}</td>
        <td>${Number(row.umid).toFixed(0)}</td>
        <td>${row.error ? "sim" : "não"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
  }
}

async function exportCSV() {
  try {
    const r = await fetch(api("/api/history?format=csv"));
    const txt = await r.text();
    const blob = new Blob([txt], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historico.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
  }
}

// ====== Boot ======
document.addEventListener("DOMContentLoaded", () => {
  loadStatus();
  loadHistory();
  setInterval(loadStatus, 10000);
  setInterval(loadHistory, 15000);

  const btn = document.getElementById("btnExport");
  if (btn) btn.addEventListener("click", exportCSV);
});

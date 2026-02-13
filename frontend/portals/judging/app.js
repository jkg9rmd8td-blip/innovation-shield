import { bootPortal } from "../../shared/shell/shell.js";
import { api } from "../../shared/core/api-client.js";

bootPortal({ portal: "judging" });

async function renderJudgingRows() {
  const body = document.getElementById("judgingRows");
  if (!body) return;

  try {
    const res = await api("/api/v2/initiatives", { auth: false });
    const rows = res?.data || [];
    body.innerHTML = rows.length
      ? rows
          .map(
            (item) => `
            <tr>
              <td>${item.id}</td>
              <td>${item.title}</td>
              <td>${item.averageScore ?? "-"}</td>
              <td>${item.judgingLocked ? "Yes" : "No"}</td>
            </tr>
          `
          )
          .join("")
      : '<tr><td colspan="4" class="muted">No initiatives found.</td></tr>';
  } catch {
    body.innerHTML = '<tr><td colspan="4" class="muted">Backend unavailable.</td></tr>';
  }
}

async function submitDemoScore() {
  try {
    const list = await api("/api/v2/initiatives", { auth: false });
    const first = list?.data?.[0];
    if (!first) return;

    await api(`/api/v2/judging/${first.id}/scores`, {
      method: "POST",
      auth: false,
      body: {
        judgeId: "demo-judge",
        judgeName: "Demo Judge",
        marks: { impact: 84, feasibility: 79, innovation: 82, governance: 88, scalability: 74 },
      },
    });

    await renderJudgingRows();
  } catch {
    // no-op for demo shell
  }
}

document.getElementById("quickScoreBtn")?.addEventListener("click", submitDemoScore);
renderJudgingRows();

// ---------------- chat ui ----------------
const chatBox = document.querySelector(".chat-box");
const userInput = document.querySelector("#user-input");
const sendBtn = document.querySelector("#send-btn");

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    if (typeof window.__yunieParseMessage === "function") {
      window.__yunieParseMessage(text, { fromUser: sender === "user" });
    }
  } catch {}
}

async function sendMessage() {
  const message = (userInput.value || "").trim();
  if (!message) return;
  addMessage("user", message);
  userInput.value = "";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error(response.status);
    const data = await response.json().catch(() => ({}));
    addMessage("bot", data.reply || "(couldn’t get a reply)");
  } catch {
    addMessage("bot", "(network error talking to /chat)");
  }
}

if (sendBtn) sendBtn.addEventListener("click", sendMessage);
if (userInput)
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

// ---------------- dashboard ----------------
const els = {
  todoList: document.getElementById("todo-list"),
  finishedList: document.getElementById("finished-list"),
  manualAdd: document.getElementById("manual-add-btn"),
  viewFinished: document.getElementById("view-finished-btn"),
  backBtn: document.getElementById("back-btn"),
  clearFinishedBtn: document.getElementById("clear-finished-btn"),
  finishedSection: document.querySelector(".finished-section"),
  dashboardSection: document.querySelector(".dashboard"),
};

const Dashboard = (function () {
  let todos = [];
  let finished = [];
  let nextId = 1;

  function exists(text) {
    const t = text.trim().toLowerCase();
    return (
      todos.some((x) => x.text.trim().toLowerCase() === t) ||
      finished.some((x) => x.text.trim().toLowerCase() === t)
    );
  }

  function addItem(text) {
    const clean = String(text || "").trim();
    if (!clean || exists(clean)) return;
    todos.push({ id: nextId++, text: clean });
    render();
  }

  function completeItem(id) {
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const [item] = todos.splice(idx, 1);
    finished.unshift({ ...item, doneAt: Date.now() });
    render();
  }

  function removeFinishedAll() {
    finished = [];
    render();
  }

  function renderTodos() {
    els.todoList.innerHTML = "";
    if (todos.length === 0) {
      const li = document.createElement("li");
      li.textContent = "no tasks yet — add one ✨";
      els.todoList.appendChild(li);
      return;
    }
    todos.forEach((t) => {
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.addEventListener("change", () => {
        if (cb.checked) completeItem(t.id);
      });
      const span = document.createElement("span");
      span.textContent = t.text;
      li.append(cb, span);
      els.todoList.appendChild(li);
    });
  }

  function renderFinished() {
    els.finishedList.innerHTML = "";
    if (finished.length === 0) {
      const li = document.createElement("li");
      li.textContent = "nothing finished yet";
      els.finishedList.appendChild(li);
      return;
    }
    finished.forEach((f) => {
      const li = document.createElement("li");
      const date = new Date(f.doneAt).toLocaleString();
      li.textContent = `${f.text} (done ${date})`;
      els.finishedList.appendChild(li);
    });
  }

  function render() {
    renderTodos();
    renderFinished();
  }

  return { addItem, exists, render, removeFinishedAll };
})();
window.Dashboard = Dashboard;

// init
Dashboard.render();

// buttons
els.manualAdd?.addEventListener("click", () => {
  const t = prompt("new task:");
  if (t) Dashboard.addItem(t);
});

els.viewFinished?.addEventListener("click", () => {
  els.dashboardSection.classList.add("hidden");
  els.finishedSection.classList.remove("hidden");
});

els.backBtn?.addEventListener("click", () => {
  els.finishedSection.classList.add("hidden");
  els.dashboardSection.classList.remove("hidden");
});

els.clearFinishedBtn?.addEventListener("click", () => {
  if (confirm("clear all finished tasks?")) Dashboard.removeFinishedAll();
});

// ---------------- task parser ----------------
(function () {
  const SESSION = new Set();

  function clean(s) {
    return String(s || "").trim().replace(/\s+/g, " ");
  }

  function extract(text) {
    if (!text) return [];
    const tasks = new Set();
    const bullet = /^(?:\s*[-*•–]\s*(?:\[\s?[xX ]\]\s*)?)(.+)$/gm;
    let m;
    while ((m = bullet.exec(text)) !== null) tasks.add(clean(m[1]));
    const numbered = /^(?:\s*\d+[.)]\s+)(.+)$/gm;
    while ((m = numbered.exec(text)) !== null) tasks.add(clean(m[1]));
    const todo = /\bTODO\s*[:\-]\s*(.+)/gi;
    while ((m = todo.exec(text)) !== null) tasks.add(clean(m[1]));
    return Array.from(tasks);
  }

  function emit(t) {
    const key = t.toLowerCase();
    if (SESSION.has(key)) return;
    Dashboard.addItem(t);
    SESSION.add(key);
  }

  function parseAndEmit(text, { fromUser = false } = {}) {
    const found = extract(text);
    if (found.length) return found.forEach(emit);
    if (fromUser && text.split(/\s+/).length > 1 && !text.endsWith("?")) emit(text);
  }

  window.__yunieParseMessage = parseAndEmit;
})();

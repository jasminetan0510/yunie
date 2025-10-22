document.addEventListener("DOMContentLoaded", () => {
  // ===== DOM =====
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const todoList = document.getElementById("todo-list");
  const finishedList = document.getElementById("finished-list");
  const manualAddBtn = document.getElementById("manual-add-btn");
  const viewFinishedBtn = document.getElementById("view-finished-btn");
  const backBtn = document.getElementById("back-btn");
  const dashboardSection = document.querySelector(".dashboard");
  const finishedSection = document.querySelector(".finished-section");
  const clearFinishedBtn = document.getElementById("clear-finished-btn");

  // Basic element checks (fail gracefully)
  if (!chatBox || !userInput || !sendBtn || !todoList) {
    console.error("Missing required DOM elements. Check IDs in HTML.");
    return;
  }

  // ===== load state =====
  const storedTodos = JSON.parse(localStorage.getItem("todos")) || [];
  const storedFinished = JSON.parse(localStorage.getItem("finished")) || [];

  storedTodos.forEach(({ title, due }) => todoList.appendChild(createTodoItem(title, due)));
  storedFinished.forEach(({ title, due }) => finishedList.appendChild(createFinishedItem(title, due)));

  // ===== helpers =====
  function saveState() {
    const todos = [...todoList.querySelectorAll("li")].map((li) => {
      const span = li.querySelector("span");
      const text = span?.textContent || "";
      return {
        title: text.split(" — due ")[0].trim() || "",
        due: text.split(" — due ")[1] || null,
      };
    });

    const finished = [...finishedList.querySelectorAll("li")].map((li) => {
      const span = li.querySelector("span");
      const text = span?.textContent || "";
      return {
        title: text.split(" — due ")[0].trim() || "",
        due: text.split(" — due ")[1] || null,
      };
    });

    localStorage.setItem("todos", JSON.stringify(todos));
    localStorage.setItem("finished", JSON.stringify(finished));
  }

  // append message and scroll
  function createMessageEl(text, who = "bot") {
    const div = document.createElement("div");
    div.className = `message ${who}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
  }

  // create todo <li> with checkbox that moves item when checked
  function createTodoItem(title, due = null) {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "0.5rem";

    const chk = document.createElement("input");
    chk.type = "checkbox";

    const span = document.createElement("span");
    span.textContent = title + (due ? ` — due ${due}` : "");

    // when checked -> move to finished (use current span text)
    chk.addEventListener("change", () => {
      if (chk.checked) {
        // preserve the exact text (in case of punctuation or formatting)
        const currentText = span.textContent;
        const [t, ...rest] = currentText.split(" — due ");
        const duePart = rest.length ? rest.join(" — due ") : null;
        finishedList.appendChild(createFinishedItem(t.trim(), duePart));
        li.remove();
        saveState();
        createMessageEl(`yay~ “${t.trim()}” is all done! 🌸`);
      }
    });

    li.append(chk, span);
    return li;
  }

  // finished list item with delete button
  function createFinishedItem(title, due = null) {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "0.5rem";

    const span = document.createElement("span");
    span.textContent = title + (due ? ` — due ${due}` : "");

    const del = document.createElement("button");
    del.textContent = "✕";
    del.title = "Delete finished task";
    del.style.marginLeft = "auto";
    del.style.background = "transparent";
    del.style.border = "none";
    del.style.cursor = "pointer";

    del.addEventListener("click", () => {
      li.remove();
      saveState();
    });

    li.append(span, del);
    return li;
  }

  // Simple Yunie parser to extract tasks from chat text
  function parseTask(message) {
    if (!message || typeof message !== "string") return null;
    const msg = message.trim().toLowerCase();

    // quick negative checks (if user says "no" or it's a pure question)
    if (/^\s*(no|not|why|how|who|when|where|\?)/i.test(msg)) return null;

    // trigger words (extend as needed)
    const triggers = [
      "do",
      "finish",
      "complete",
      "submit",
      "buy",
      "call",
      "email",
      "remind",
      "study",
      "work on",
      "write",
      "read",
      "prepare",
    ];

    // if any trigger exists, treat it as a task
    const isTask = triggers.some((t) => msg.includes(t));
    if (!isTask) return null;

    // remove polite prefixes
    let cleaned = msg.replace(/^(please|could you|can you|hey yunie|yunie,?)/i, "");
    // remove leading request forms like "remind me to" or "i need to"
    cleaned = cleaned.replace(/^(remind me to|remind me|i need to|i have to|i must|i should)\s*/i, "");
    // drop trailing punctuation
    cleaned = cleaned.replace(/[.?!]$/, "").trim();

    if (!cleaned) return null;
  }

  // Yunie responses
  const yunieResponses = [
    "okay~ i’ve added that to your list ☁️",
    "got it! one step closer to calm skies 💗",
    "yunie’s got this task tucked safely away~",
    "task added! let’s float through it together 🌸",
  ];
  function pickYunieReply() {
    return yunieResponses[Math.floor(Math.random() * yunieResponses.length)];
  }

  // ===== chat & UI handlers =====
  function sendMessage() {
    const raw = userInput.value.trim();
    if (!raw) return;

    createMessageEl(raw, "user");
    userInput.value = "";

    const parsed = parseTask(raw);
    if (parsed) {
      // add to todo list
      todoList.appendChild(createTodoItem(parsed));
      saveState();
      // small delay for natural bot reply
      setTimeout(() => createMessageEl(`${pickYunieReply()} (“${parsed}”)`), 250);
    } 
    else {
      setTimeout(() => {
        createMessageEl("hmm... that doesn’t sound like a task. wanna to tell me something you need to do? ☁️");
      }, 300);
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // manual add
  manualAddBtn?.addEventListener("click", () => {
    const title = prompt("Task title:");
    if (!title) return;
    const due = prompt("Optional due date:");
    todoList.appendChild(createTodoItem(title.trim(), due ? due.trim() : null));
    saveState();
  });

  // navigation
  viewFinishedBtn?.addEventListener("click", () => {
    dashboardSection?.classList.add("hidden");
    finishedSection?.classList.remove("hidden");
  });

  backBtn?.addEventListener("click", () => {
    finishedSection?.classList.add("hidden");
    dashboardSection?.classList.remove("hidden");
  });

  // clear finished
  clearFinishedBtn?.addEventListener("click", () => {
    if (!confirm("are you sure you want to clear all finished tasks?")) return;
    finishedList.innerHTML = "";
    saveState();
    createMessageEl("woohoo! all clean 🍃 — ready for new adventures?");
  });
});

const musicWidget = document.getElementById("music-widget");
const iframe = musicWidget.querySelector("iframe");

musicWidget.addEventListener("click", () => {
  musicWidget.classList.toggle("open");
  iframe.classList.toggle("hidden");
});

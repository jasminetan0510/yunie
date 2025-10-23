const chatBox = document.querySelector(".chat-box");
const userInput = document.querySelector("#user-input");
const sendBtn = document.querySelector("#send-btn");

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender); // "user" | "bot"
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage("user", message);
  userInput.value = "";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      addMessage("bot", `(server error ${response.status}) ${text || ""}`.trim());
      return;
    }

    const data = await response.json();
    if (data.reply) addMessage("bot", data.reply);
    else addMessage("bot", "(hmm... couldn’t get a reply)");
  } catch (err) {
    console.error("error talking to yunie:", err);
    addMessage("bot", "(something went wrong talking to me)");
  }
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

import fetch from "node-fetch";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

export default async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified");
      return res
        .status(200)
        .setHeader("Content-Type", "text/plain")
        .send(challenge);
    }

    console.log("Webhook verification failed");
    return res.status(403).send("Verification failed");
  }

  if (req.method === "POST") {
    const body = req.body;
    console.log("INCOMING:", JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message) return res.status(200).send("No message");

    const from = message.from;
    const text = message.text?.body || "";

    console.log(`Message from ${from}: ${text}`);

    await sendTextMessage(from, `Hello! You sent: "${text}"`);
    return res.status(200).send("EVENT_RECEIVED");
  }

  return res.status(405).send("Method Not Allowed");
}

async function sendTextMessage(to, messageText) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_TOKEN) return;

  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = { messaging_product: "whatsapp", to, text: { body: messageText } };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) console.error("Send failed:", data);
    else console.log("Message sent:", data);
  } catch (err) {
    console.error("Send error:", err);
  }
}

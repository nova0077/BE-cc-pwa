require("dotenv").config();
const express = require("express");
const cors = require("cors");
const webpush = require("web-push");
const admin = require("firebase-admin");
const WebSocket = require("ws");

// Initialize Firebase
const serviceAccount = require("./firebase-service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Web Push Configuration
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);


//****/ Routes ****//
app.post("/save-subscription", async (req, res) => {
  try {
    const subscription = req.body;
    console.log("Subsrciption: ", subscription);
    if (!subscription) return res.status(400).json({ error: "Subscription missing" });

    await db.collection("push-subscriptions").add(subscription);
    res.status(200).json({ message: "Subscription saved successfully!" });
  } catch (error) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/save-barcode", async (req, res) => {
  console.log("Request body", req.body);
  try {
    const barcodeData = req.body;
    if (!barcodeData.id)
      return res.status(400).json({ error: "Barcode missing" });

    await db.collection("barcodes").add({ barcodeData, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ message: "Barcode saved successfully!" });
  } catch (error) {
    console.error("Error saving barcode:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/get-barcodes", async (req, res) => {
  try {
    const barcodesSnapshot = await db.collection("barcodes").orderBy("timestamp", "desc").get();

    const barcodes = barcodesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(barcodes);
  } catch (error) {
    console.error("Error fetching barcodes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// **** Websocket Server ****//

// Helper function to delete invalid subscriptions
async function deleteSubscription(subscriptionId) {
  try {
    await db.collection("push-subscriptions").doc(subscriptionId).delete();
    console.log(`Deleted subscription with ID: ${subscriptionId}`);
  } catch (error) {
    console.error(`Error deleting subscription with ID: ${subscriptionId}`, error);
  }
}


const wss = new WebSocket.Server({ port: 8080 });
wss.on("connection", (ws) => {
  console.log("WebSocket connection established.");

  ws.on("message", async (msg) => {
    const message = msg.toString();
    console.log("Received WebSocket message:", message);
        webpush.sendNotification(subscription, payload).catch(async (err) => {
          console.error(`Invalid subscription found: ${doc.id}`);
          if (err.statusCode === 410) {
            await deleteSubscription(doc.id);
          }
        });
      const subscription = doc.data();
      const payload = JSON.stringify({ title: "New Alert", body: message });

      notifications.push(
        webpush.sendNotification(subscription, payload).catch((err) => {
          console.error(`Invalid subscription found: ${sub.id}`);
          if (error.statusCode === 410) {
            await deleteSubscription(sub.id);
          }
        })
      );
    });

    await Promise.all(notifications);
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
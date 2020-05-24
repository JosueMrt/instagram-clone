const functions = require("firebase-functions");
const admin = require("firebase-admin");
require("dotenv").config();

const app = require("express")();

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Posts routes
app.get("/posts", async (req, res) => {
  try {
    const posts = await db.collection("posts").get();
    let data = [];
    posts.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
    console.error(err);
  }
  // ^ Needs refactoring
});

app.post("/posts", async (req, res) => {
  try {
    const newPost = {
      userHandle: req.body.userHandle,
      caption: req.body.caption,
      imgUrl: req.body.imgUrl,
      date: new Date().toISOString(),
    };
    doc = await db.collection("posts").add(newPost);
    res.json({ message: `Document ${doc.id} created sucessfully` });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
    console.error(err);
  }
});

app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };
  // TODO: Validate Data
});

exports.api = functions.https.onRequest(app);

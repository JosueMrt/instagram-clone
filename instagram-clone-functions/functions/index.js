const functions = require("firebase-functions");
const admin = require("firebase-admin");
require("dotenv").config();

const app = require("express")();

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.get("/posts", (req, res) => {
  db.collection("posts")
    .orderBy("date", "desc")
    .get()
    .then((data) => {
      let posts = [];
      data.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      return res.json(posts);
    })
    .catch((err) => console.error(err));
});

app.post("/posts", (req, res) => {
  const newPost = {
    userHandle: req.body.userHandle,
    caption: req.body.caption,
    imgUrl: req.body.imgUrl,
    date: new Date().toISOString(),
  };
  db.collection("posts")
    .add(newPost)
    .then((doc) => {
      res.json({ message: `Document ${doc.id} created sucessfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
});

exports.api = functions.https.onRequest(app);

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
require("dotenv").config();

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app = express();

app.get("/posts", (req, res) => {
  db.collection("posts")
    .get()
    .then((data) => {
      let posts = [];
      data.forEach((doc) => {
        posts.push(doc.data());
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
    date: admin.firestore.Timestamp.fromDate(new Date()),
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

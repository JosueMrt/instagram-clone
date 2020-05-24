const firebase = require("firebase");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Express
const app = require("express")();

// Get account credientials from env and init admin SDK
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDA8qrE-xtEB4aWAdzOIBExE2fB3vbtUCI",
  authDomain: "instagram-clone-7b247.firebaseapp.com",
  databaseURL: "https://instagram-clone-7b247.firebaseio.com",
  projectId: "instagram-clone-7b247",
  storageBucket: "instagram-clone-7b247.appspot.com",
  messagingSenderId: "500158409705",
  appId: "1:500158409705:web:0442fa7928b52d99a77978",
};
firebase.initializeApp(firebaseConfig);

// Store DB Route
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

// Signup route
app.post("/signup", async (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };
  // TODO: Validate Data
  try {
    const data = await firebase
      .auth()
      .createUserWithEmailAndPassword(newUser.email, newUser.password);
    res
      .status(201)
      .json({ message: `User ${data.user.uid} signed up sucessfully` });
  } catch (err) {
    res.status(500).json({ error: `Error ${err.code}` });
    console.error(err);
  }
});

exports.api = functions.https.onRequest(app);

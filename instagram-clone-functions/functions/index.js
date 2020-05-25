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

// Auth middleware
const auth = async (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    const user = await db
      .collection("users")
      .where("id", "==", req.user.uid)
      .limit(1)
      .get();

    req.user.handle = user.docs[0].data().handle;
    return next();
  } catch (err) {
    res.status(500).json({ error: `Invalid Token: ${err.code}` });
    console.error(err);
  }
};

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

app.post("/posts", auth, async (req, res) => {
  try {
    const newPost = {
      userHandle: req.user.handle,
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
  // Signup form data ⤵
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  // Validate user data
  let errors = {};
  // const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  Object.keys(newUser).map((key) => {
    if (!newUser[key].trim().length) errors[key] = "Must not be empty";
  });
  // if (!newUser.email.match(emailRegEx)) errors.email = "Must be a valid email";
  if (newUser.password !== newUser.confirmPassword) {
    errors.password = "Password must match";
  }

  Object.keys(errors).length && res.status(400).json(errors);

  try {
    const user = await db.doc(`/users/${newUser.handle}`).get();
    // Check if user handle is already taken
    if (user.exists) {
      res
        .status(500)
        .json({ handle: `handle "${newUser.handle}" is already taken` });
    } else {
      // If not create the account
      const data = await firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);

      // Adding additional info about the user to the database
      await db.doc(`/users/${newUser.handle}`).set({
        email: newUser.email,
        handle: newUser.handle,
        createdAt: new Date().toISOString(),
        id: data.user.uid,
      });
      const token = await data.user.getIdToken();
      res.status(201).json({ token });
    }

    // Catch any errors that may occur
  } catch (err) {
    err.code === "auth/email-already-in-use"
      ? res.status(400).json({ email: "email already in use" })
      : res.status(500).json({ error: `Error ${err.code}` });
    console.error(err);
  }
});

// Login Route ⤵
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const data = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const token = await data.user.getIdToken();
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.code });
  }
});

exports.api = functions.https.onRequest(app);

const functions = require("firebase-functions");

const auth = require("./util/auth");
const { getAllPosts, createPost } = require("./handlers/posts");
const { signup, login } = require("./handlers/users");

// Initialize Express
const app = require("express")();

// Posts routes
app.get("/posts", getAllPosts);
app.post("/posts", auth, createPost);

// User route
app.post("/signup", signup);
app.post("/login", login);

exports.api = functions.https.onRequest(app);

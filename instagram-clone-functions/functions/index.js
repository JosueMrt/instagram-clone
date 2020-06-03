const functions = require("firebase-functions");

const auth = require("./util/auth");
const {
  getAllPosts,
  getPost,
  createPost,
  createComment,
  likePost,
} = require("./handlers/posts");

const {
  signup,
  login,
  uploadProfileImg,
  addUserDetails,
  getUserDetails,
} = require("./handlers/users");

// Initialize Express
const app = require("express")();

// Posts routes
app.get("/posts", getAllPosts);
app.get("/posts/:postId", getPost);
app.post("/posts", auth, createPost);
app.post("/posts/:postId/comment", auth, createComment);
app.get("/posts/:postId/like", auth, likePost);
// app.get("/posts/:postId/unlike", auth, unlikePost);

// User route
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", auth, uploadProfileImg);
app.post("/user", auth, addUserDetails);
app.get("/user", auth, getUserDetails);

exports.api = functions.https.onRequest(app);

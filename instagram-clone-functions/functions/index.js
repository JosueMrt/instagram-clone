const functions = require("firebase-functions");
const { db } = require("./util/admin");
const auth = require("./util/auth");

const {
  getAllPosts,
  getPost,
  createPost,
  createComment,
  likePost,
  unlikePost,
  deletePost,
} = require("./handlers/posts");

const {
  signup,
  login,
  uploadProfileImg,
  addUserDetails,
  getUserDetails,
  getUserOwnDetails,
  markNotificationsRead,
} = require("./handlers/users");

// Initialize Express
const app = require("express")();

// Posts routes
app.get("/posts", getAllPosts);
app.get("/posts/:postId", getPost);
app.post("/posts", auth, createPost);
app.post("/posts/:postId/comment", auth, createComment);
app.get("/posts/:postId/like", auth, likePost);
app.get("/posts/:postId/unlike", auth, unlikePost);
app.delete("/posts/:postId", auth, deletePost);

// User routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", auth, uploadProfileImg);
app.post("/user", auth, addUserDetails);
app.get(`/user/:handle`, getUserDetails);
app.get("/user", auth, getUserOwnDetails);
app.post("/notifications", auth, markNotificationsRead);

exports.api = functions.region("europe-west3").https.onRequest(app);

// Like notification
exports.createLikeNotification = functions
  .region("europe-west3")
  .firestore.document("likes/{id}")
  .onCreate(async (snapshot) => {
    try {
      const post = await db.doc(`posts/${snapshot.data().postId}`).get();
      if (post.exists) {
        db.doc(`notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          postId: post.id,
          recipient: post.data().userHandle,
          sender: snapshot.data().userHandle,
          type: "like",
          read: false,
        });
      }
    } catch (err) {
      console.error(err);
    }
  });

// Delete like notification
exports.deleteLikeNotification = functions
  .region("europe-west3")
  .firestore.document("likes/{id}")
  .onDelete(async (snapshot) => {
    try {
      const post = await db.doc(`notifications/${snapshot.id}`).get();
      if (post.exists) {
        post.ref.delete();
      }
    } catch (err) {
      console.error(err);
    }
  });

// Comment notification
exports.createCommentnotification = functions
  .region("europe-west3")
  .firestore.document("comments/{id}")
  .onCreate(async (snapshot) => {
    try {
      const post = await db.doc(`posts/${snapshot.data().postId}`).get();
      if (post.exists) {
        db.doc(`notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          postId: post.id,
          recipient: post.data().userHandle,
          sender: snapshot.data().userHandle,
          type: "comment",
          read: false,
        });
      }
    } catch (err) {
      console.error(err);
    }
  });

// Delete comment notification
// There is no route to delete comments yet
exports.deleteCommentNotification = functions
  .region("europe-west3")
  .firestore.document("likes/{id}")
  .onDelete(async (snapshot) => {
    try {
      const post = await db.doc(`notifications/${snapshot.id}`).get();
      if (post.exists) {
        post.ref.delete();
      }
    } catch (err) {
      console.error(err);
    }
  });

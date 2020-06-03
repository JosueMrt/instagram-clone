const { db } = require("../util/admin");

exports.getAllPosts = async (req, res) => {
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
};

// Create new post
exports.createPost = async (req, res) => {
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
};

// Get specific post with its comments
exports.getPost = async (req, res) => {
  let postData = {};
  try {
    let post = await db.doc(`/posts/${req.params.postId}`).get();
    !post.exists &&
      res
        .status(404)
        .json({ error: `Post ${req.params.postId} does not exist` });

    let comments = await db
      .collection("comments")
      .orderBy("createdAt", "desc")
      .where("postId", "==", req.params.postId)
      .get();

    postData = { ...post.data(), postId: post.id, comments: [] };
    // Could we add the comments in this line? ⤴

    comments.forEach((doc) => {
      postData.comments.push(doc.data());
    });
    res.json(postData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
};

// Create comment on post
exports.createComment = async (req, res) => {
  !req.body.body.length && res.json({ message: "Must not be empty" });
  try {
    const post = await db.doc(`/posts/${req.params.postId}`).get();
    !post.exists && res.status(404).json({ error: "Post does not exist" });

    const newComment = {
      userHandle: req.user.handle,
      profilePicUrl: req.user.profilePicUrl,
      postId: req.params.postId,
      body: req.body.body,
      createdAt: new Date().toISOString(),
    };

    await db.collection("comments").add(newComment);
    res.status(201).json({ message: "Comment created sucessfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
};

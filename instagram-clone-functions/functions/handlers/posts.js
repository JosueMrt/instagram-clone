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
      profilePicUrl: req.user.profilePicUrl,
      caption: req.body.caption,
      imgUrl: req.body.imgUrl,
      date: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
    };
    doc = await db.collection("posts").add(newPost);
    res.json({ ...newPost, postId: doc.id });
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

// Like post
exports.likePost = async (req, res) => {
  try {
    const postQuery = db.doc(`/posts/${req.params.postId}`);
    const post = await postQuery.get();
    if (post.exists) {
      let postData = { ...post.data(), postId: req.params.postId };
      const likeDoc = await db
        .collection("likes")
        .where("userHandle", "==", req.user.handle)
        .where("postId", "==", req.params.postId)
        .limit(1)
        .get();
      if (likeDoc.empty) {
        db.collection("likes").add({
          postId: req.params.postId,
          userHandle: req.user.handle,
        });
        postData.likeCount++;
        await postQuery.update({ likeCount: postData.likeCount });
        res.status(200).json(postData);
      } else res.status(400).json({ error: "Already liked" });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
};

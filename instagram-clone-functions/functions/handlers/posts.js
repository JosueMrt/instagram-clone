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

exports.getPost = async (req, res) => {
  let postData = {};
  try {
    let post = await db.doc(`/posts/${req.params.postId}`).get();
    !post.exists &&
      res
        .status(404)
        .json({ error: `Post ${req.params.postId} does not exist` });

    postData = { ...post.data(), postId: post.id, comments: [] };

    let comments = await db
      .collection("comments")
      .where("postId", "==", req.params.postId)
      .get();

    comments.forEach((doc) => {
      postData.comments.push(doc.data());
    });
    res.json(postData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
};

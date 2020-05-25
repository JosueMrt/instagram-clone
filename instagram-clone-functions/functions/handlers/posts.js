const { db } = require("../util/admin")

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
  }

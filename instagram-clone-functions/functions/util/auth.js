const { admin, db } = require("./admin");

module.exports = async (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split(" ")[1];
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

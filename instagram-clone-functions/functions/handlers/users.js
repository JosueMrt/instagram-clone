firebase = require("firebase");
const config = require("../util/config");
const { db, admin } = require("../util/admin");
const { validateSignUp, reduceUserDetails } = require("../util/validators");

firebase.initializeApp(config);

exports.signup = async (req, res) => {
  // Signup form data ⤵
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };
  const { valid, errors } = validateSignUp(newUser);
  if (!valid) res.status(400).json(errors);
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
        profilePicUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/no-img.png?alt=media`,
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
};

// Login Route
exports.login = async (req, res) => {
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
};

// Add user profile details
exports.addUserDetails = async (req, res) => {
  let userDetails = reduceUserDetails(req.body);
  try {
    await db.doc(`/users/${req.user.handle}`).update(userDetails);
    res.status(201).json({ message: "details updated sucessfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.code });
  }
};

// Get any user's details
exports.getUserDetails = async (req, res) => {
  let userData = {};
  try {
    const userDoc = await db.doc(`/users/${req.params.handle}`).get();
    if (!userDoc.exists) res.status(404).json({ message: "Does not exist" });
    userData.credentials = userDoc.data();
    const userPosts = await db
      .collection("posts")
      .where("userHandle", "==", req.params.handle)
      .orderBy("date", "desc")
      .get();
    userData.posts = [];
    userPosts.forEach((doc) => {
      userData.posts.push({ ...doc.data(), postId: doc.id });
    });
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
};

// Get authenticated user
exports.getUserOwnDetails = async (req, res) => {
  let userData = {};
  try {
    let doc = await db.doc(`/users/${req.user.handle}`).get();
    if (doc.exists) {
      userData.credentials = doc.data();
      let likes = await db
        .collection("likes")
        .where("userHandle", "==", req.user.handle)
        .get();
      userData.likes = [];
      likes.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      let notifications = await db
        .collection("notifications")
        .where("recipient", "==", req.user.handle)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
      userData.notifications = [];
      notifications.forEach((doc) => {
        userData.notifications.push({ ...doc.data(), notificationId: doc.id });
      });
    }
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.code });
  }
};

exports.markNotificationsRead = async (req, res) => {
  let batch = db.batch();
  try {
    req.body.forEach(async (notificationId) => {
      batch.update(db.doc(`/notifications/${notificationId}`), {
        read: true,
      });
    });
    await batch.commit();
    res.json({ message: "Updated sucessfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
};

// Upload User Profile Picture
exports.uploadProfileImg = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");
  const busboy = new BusBoy({ headers: req.headers });
  let imgFileName;
  let imageToUpload;
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(mimetype, os.tmpdir(), file);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res
        .status(400)
        .json({ error: ".jpg / .png are the only formats supported" });
    }
    imgFileName = `${Math.round(Math.random() * 1000000000)}.${
      filename.split(".")[filename.split(".").length - 1]
    }`;
    const filepath = path.join(os.tmpdir(), imgFileName);
    imageToUpload = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", async () => {
    try {
      await admin
        .storage()
        .bucket(config.storageBucket)
        .upload(imageToUpload.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToUpload.mimetype,
            },
          },
        });
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imgFileName}?alt=media`;
      await db
        .doc(`/users/${req.user.handle}`)
        .update({ profilePicUrl: imageUrl });
      res.json({
        message: `@${req.user.handle} profile picture updated sucessfully`,
      });
    } catch (err) {
      res
        .status(500)
        .json({ error: `Couldn't update profile pic: ${err.code}` });
      console.error(err);
    }
  });
  busboy.end(req.rawBody);
};

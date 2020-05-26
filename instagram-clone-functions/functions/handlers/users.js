const firebase = require("firebase");
const config = require("../util/config");
const { db, admin } = require("../util/admin");
const { validateSignUp } = require("../util/validators");

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

exports.uploadProfileImg = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imgFileName;
  let imageToUpload;

  busboy.on("file", (fieldname, file, filename, mimetype) => {
    const fileExtension = filename.split(".")[filename.split(".").length - 1];
    imgFileName = `${Math.round(Math.random() * 1000000000)}.${fileExtension}`;
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

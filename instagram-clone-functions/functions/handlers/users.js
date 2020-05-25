const firebase = require("firebase");
const config = require("../util/config");
const {db} = require("../util/admin");
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

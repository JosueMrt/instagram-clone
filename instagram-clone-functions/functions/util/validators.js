exports.validateSignUp = (data) => {
  let errors = {};
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  Object.keys(data).map((key) => {
    if (!data[key].trim().length) errors[key] = "Must not be empty";
  });
  if (!data.email.match(emailRegEx)) errors.email = "Must be a valid email";
  if (data.password !== data.confirmPassword) {
    errors.password = "Password must match";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (data.bio.trim().length) userDetails.bio = data.bio;
  if (data.location.trim().length) userDetails.location = data.location;
  data.website.trim().slice(0, 4) === "http"
    ? (userDetails.website = data.website.trim())
    : (userDetails.website = `http://${data.website.trim()}`);

  return userDetails;
};

const { Attendee } = require("../models/attendee");

async function userNameSlugify(firstName, lastName) {
  str = firstName + "-" + lastName;
  str = str.replace(/^\s+|\s+$/g, ""); // trim leading/trailing white space

  str = str.toLowerCase(); // convert string to lowercase

  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove any non-alphanumeric characters
    .replace(/-+/g, "-"); // remove consecutive hyphens

  // check if slug already exists
  const count = await Attendee.countDocuments({
    where: { firstName: firstName, lastName: lastName },
  });
  // if slug exists, append count to slug
  if (count) {
    str += "-" + count;
  }

  return str;
}

module.exports = userNameSlugify;

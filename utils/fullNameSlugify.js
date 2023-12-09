async function fullNameSlugify(firstName, lastName) {
  let str = firstName + " " + lastName;
  str = str.trim();
  str = str.replace(/[^\w\s-]/g, "");

  return str;
}

module.exports = fullNameSlugify;

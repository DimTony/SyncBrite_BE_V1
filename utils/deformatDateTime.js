function deformatSingleDate(inputDateString) {
  // Parse the input date string
  const parsedDate = new Date(inputDateString);

  // Get the components of the date
  const year = parsedDate.getUTCFullYear();
  const month = parsedDate.getUTCMonth();
  const day = parsedDate.getUTCDate();

  // Array of short month names
  const shortMonthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Get short name of the month
  const monthShortName = shortMonthNames[month];

  // Create formatted date string
  const formattedDate = `${year}-${month + 1 < 10 ? "0" : ""}${month + 1}-${
    day < 10 ? "0" : ""
  }${day}`;

  const original = inputDateString;
  const originalCap = original.toUpperCase();

  return [original, originalCap, formattedDate, year, monthShortName, day];
}

function deformatCustomDates(customDatesString) {
  if (
    Array.isArray(customDatesString) &&
    customDatesString.length === 1 &&
    customDatesString[0] === ""
  ) {
    return [];
  }

  const customDatesArray = Array.isArray(customDatesString)
    ? customDatesString
    : customDatesString.split(",");

  const formattedCustomDates = customDatesArray.map((date) =>
    deformatSingleDate(date)
  );

  return [formattedCustomDates];
}

function deformatCreatedAt(inputString) {
  const date = new Date(inputString);

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const formattedString = date.toLocaleString("en-US", options);

  return formattedString.replace("at", "•");
}

module.exports = { deformatSingleDate, deformatCustomDates, deformatCreatedAt };

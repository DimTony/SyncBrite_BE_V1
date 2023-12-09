async function formatDate(inputDate) {
  const [year, month, day] = inputDate.split("-");
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)); // Adjust month by subtracting 1

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formattedDay = daysOfWeek[date.getUTCDay()];
  const formattedMonth = months[date.getUTCMonth()];
  const formattedDayOfMonth = date.getUTCDate();
  const formattedYear = date.getUTCFullYear();

  const formattedDate = `${formattedDay}, ${formattedMonth} ${formattedDayOfMonth}, ${formattedYear}`;

  return formattedDate;
}

async function formatTime(inputTime) {
  const [hours, minutes] = inputTime.split(":");
  const parsedHours = parseInt(hours, 10);

  // Convert to 12-hour format with AM/PM
  const period = parsedHours >= 12 ? "PM" : "AM";
  const formattedHours = parsedHours % 12 || 12;
  const formattedMinutes = minutes;

  const formattedTime = `${formattedHours}:${formattedMinutes} ${period}`;

  return formattedTime;
}

module.exports = { formatDate, formatTime };

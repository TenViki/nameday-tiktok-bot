const MONTHS = [
  "Ledna",
  "Února",
  "Března",
  "Dubna",
  "Května",
  "Června",
  "Července",
  "Srpna",
  "Září",
  "Října",
  "Listopadu",
  "Prosince",
];

export const formatMonth = (date: string) => {
  // Format date to 4. Července
  const month = date.split(".")[1];
  const monthNumber = parseInt(month);
  const monthName = MONTHS[monthNumber - 1];
  return `${date.split(".")[0]}. ${monthName}`;
};

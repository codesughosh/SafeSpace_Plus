import { distressQuotes } from "./distressQuotes";

export function getDailyQuote(distress: number) {
  let category: "low" | "medium" | "high";

  if (distress < 30) category = "low";
  else if (distress < 70) category = "medium";
  else category = "high";

  const quotes = distressQuotes[category];

  // 🔁 random quote
  return quotes[Math.floor(Math.random() * quotes.length)];
}
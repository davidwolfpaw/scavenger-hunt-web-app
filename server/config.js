const path = require("path");

let config = {};
try {
  config = require(path.join(__dirname, "../public/config.json"));
} catch {
  console.warn("Warning: Could not load public/config.json — using defaults.");
}

/**
 * Returns today's event date (YYYY-MM-DD) in the timezone configured in config.json.
 * Defaults to America/New_York (EST) if not configured.
 * Use this anywhere a date-scoped query needs to know "what day is it for this event".
 * @returns {string}
 */
function getEventDate() {
  const tz = config.timezone || "America/New_York";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    console.warn(
      `Warning: Invalid timezone "${tz}" in config.json — falling back to America/New_York (EST).`,
    );
    // Fallback to EST if invalid timezone
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
}

module.exports = { config, getEventDate };

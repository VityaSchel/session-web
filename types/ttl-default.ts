// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

const seconds = 1000
const minutes = seconds * 60
const hours = minutes * 60
const days = hours * 24

/** in milliseconds */
export const DURATION = {
  /** 1000ms */
  SECONDS: seconds,
  /** 60 * 1000 = 60,000 ms */
  MINUTES: minutes,
  /** 60 * 60 * 1000 = 3,600,000 ms */
  HOURS: hours,
  /** 24 * 60 * 60 * 1000 = 86,400,000 ms */
  DAYS: days,
  /** 7 * 24 * 60 * 60 * 1000 = 604,800,000 ms */
  WEEKS: days * 7,
}

export const TTL_DEFAULT = {
  /** 20 seconds */
  TYPING_MESSAGE: 20 * DURATION.SECONDS,
  /** 5 minutes */
  CALL_MESSAGE: 5 * 60 * DURATION.SECONDS,
  /** 14 days */
  CONTENT_MESSAGE: 14 * DURATION.DAYS,
  /** 30 days */
  CONFIG_MESSAGE: 30 * DURATION.DAYS,
}
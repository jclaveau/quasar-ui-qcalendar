/*!
 * @quasar/quasar-ui-qcalendar v4.0.0-beta.16
 * (c) 2024 Jeff Galbraith <jeff@quasar.dev>
 * Released under the MIT License.
 */

'use strict';

var vue = require('vue');

const PARSE_REGEX = /^(\d{4})-(\d{1,2})(-(\d{1,2}))?([^\d]+(\d{1,2}))?(:(\d{1,2}))?(:(\d{1,2}))?(.(\d{1,3}))?$/;
const PARSE_DATE = /^(\d{4})-(\d{1,2})(-(\d{1,2}))/;
const PARSE_TIME = /(\d\d?)(:(\d\d?)|)(:(\d\d?)|)/;

const DAYS_IN_MONTH = [ 0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
const DAYS_IN_MONTH_LEAP = [ 0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
const DAYS_IN_MONTH_MIN = 28;
const DAYS_IN_MONTH_MAX = 31;
const MONTH_MAX = 12;
const MONTH_MIN = 1;
const DAY_MIN = 1;
const DAYS_IN_WEEK = 7;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const FIRST_HOUR = 0;
const MILLISECONDS_IN_MINUTE = 60000;
const MILLISECONDS_IN_HOUR = 3600000;
const MILLISECONDS_IN_DAY = 86400000;
const MILLISECONDS_IN_WEEK = 604800000;

/* eslint-disable no-multi-spaces */
/**
 * @typedef {Object} Timestamp The Timestamp object
 * @property {string=} Timestamp.date Date string in format 'YYYY-MM-DD'
 * @property {string=} Timestamp.time Time string in format 'HH:MM'
 * @property {number} Timestamp.year The numeric year
 * @property {number} Timestamp.month The numeric month (Jan = 1, ...)
 * @property {number} Timestamp.day The numeric day
 * @property {number} Timestamp.weekday The numeric weekday (Sun = 0, ..., Sat = 6)
 * @property {number=} Timestamp.hour The numeric hour
 * @property {number} Timestamp.minute The numeric minute
 * @property {number=} Timestamp.doy The numeric day of the year (doy)
 * @property {number=} Timestamp.workweek The numeric workweek
 * @property {boolean} Timestamp.hasDay True if Timestamp.date is filled in and usable
 * @property {boolean} Timestamp.hasTime True if Timestamp.time is filled in and usable
 * @property {boolean=} Timestamp.past True if the Timestamp is in the past
 * @property {boolean=} Timestamp.current True if Timestamp is current day (now)
 * @property {boolean=} Timestamp.future True if Timestamp is in the future
 * @property {boolean=} Timestamp.disabled True if this is a disabled date
 * @property {boolean=} Timestamp.currentWeekday True if this date corresponds to current weekday
 */
const Timestamp = {
  date: '',        // YYYY-MM-DD
  time: '',        // HH:MM (optional)
  year: 0,         // YYYY
  month: 0,        // MM (Jan = 1, etc)
  day: 0,          // day of the month
  weekday: 0,      // week day (0=Sunday...6=Saturday)
  hour: 0,         // 24-hr format
  minute: 0,       // mm
  doy: 0,          // day of year
  workweek: 0,     // workweek number
  hasDay: false,   // if this timestamp is supposed to have a date
  hasTime: false,  // if this timestamp is supposed to have a time
  past: false,     // if timestamp is in the past (based on `now` property)
  current: false,  // if timestamp is current date (based on `now` property)
  future: false,   // if timestamp is in the future (based on `now` property)
  disabled: false, // if timestamp is disabled
  currentWeekday: false // if this date corresponds to current weekday 
};

const TimeObject = {
  hour: 0,  // Number
  minute: 0 // Number
};
/* eslint-enable no-multi-spaces */

// returns YYYY-MM-dd format
/**
 * Returns today's date
 * @returns {string} Date string in the form 'YYYY-MM-DD'
 */
function today () {
  const d = new Date(),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  return [ year, padNumber(month, 2), padNumber(day, 2) ].join('-')
}

/**
 * Returns the start of the week give a {@link Timestamp} and weekdays (in which it finds the day representing the start of the week).
 * If today {@link Timestamp} is passed in then this is used to update relative information in the returned {@link Timestamp}.
 * @param {Timestamp} timestamp The {@link Timestamp} to use to find the start of the week
 * @param {number[]} weekdays The array is [0,1,2,3,4,5,6] where 0=Sunday and 6=Saturday
 * @param {Timestamp=} today If passed in then the {@link Timestamp} is updated with relative information
 * @returns {Timestamp} The {@link Timestamp} representing the start of the week
 */
function getStartOfWeek (timestamp, weekdays, today) {
  let start = copyTimestamp(timestamp);
  if (start.day === 1 || start.weekday === 0) {
    while (!weekdays.includes(start.weekday)) {
      start = nextDay(start);
    }
  }
  start = findWeekday(start, weekdays[ 0 ], prevDay);
  start = updateFormatted(start);
  if (today) {
    start = updateRelative(start, today, start.hasTime);
  }
  return start
}

/**
 * Returns the end of the week give a {@link Timestamp} and weekdays (in which it finds the day representing the last of the week).
 * If today {@link Timestamp} is passed in then this is used to update relative information in the returned {@link Timestamp}.
 * @param {Timestamp} timestamp The {@link Timestamp} to use to find the end of the week
 * @param {number[]} weekdays The array is [0,1,2,3,4,5,6] where 0=Sunday and 6=Saturday
 * @param {Timestamp=} today If passed in then the {@link Timestamp} is updated with relative information
 * @returns {Timestamp} The {@link Timestamp} representing the end of the week
 */
function getEndOfWeek (timestamp, weekdays, today) {
  let end = copyTimestamp(timestamp);
  // is last day of month?
  const lastDay = daysInMonth(end.year, end.month);
  if (lastDay === end.day || end.weekday === 6) {
    while (!weekdays.includes(end.weekday)) {
      end = prevDay(end);
    }
  }
  end = findWeekday(end, weekdays[ weekdays.length - 1 ], nextDay);
  end = updateFormatted(end);
  if (today) {
    end = updateRelative(end, today, end.hasTime);
  }
  return end
}

/**
 * Finds the start of the month based on the passed in {@link Timestamp}
 * @param {Timestamp} timestamp The {@link Timestamp} to use to find the start of the month
 * @returns {Timestamp} A {@link Timestamp} of the start of the month
 */
function getStartOfMonth (timestamp) {
  const start = copyTimestamp(timestamp);
  start.day = DAY_MIN;
  updateFormatted(start);
  return start
}

/**
 * Finds the end of the month based on the passed in {@link Timestamp}
 * @param {Timestamp} timestamp The {@link Timestamp} to use to find the end of the month
 * @returns {Timestamp} A {@link Timestamp} of the end of the month
 */
function getEndOfMonth (timestamp) {
  const end = copyTimestamp(timestamp);
  end.day = daysInMonth(end.year, end.month);
  updateFormatted(end);
  return end
}

// returns minutes since midnight
function parseTime (input) {
  const type = Object.prototype.toString.call(input);
  switch (type) {
    case '[object Number]':
      // when a number is given, it's minutes since 12:00am
      return input
    case '[object String]':
    {
      // when a string is given, it's a hh:mm:ss format where seconds are optional, but not used
      const parts = PARSE_TIME.exec(input);
      if (!parts) {
        return false
      }
      return parseInt(parts[ 1 ], 10) * 60 + parseInt(parts[ 3 ] || 0, 10)
    }
    case '[object Object]':
      // when an object is given, it must have hour and minute
      if (typeof input.hour !== 'number' || typeof input.minute !== 'number') {
        return false
      }
      return input.hour * 60 + input.minute
  }

  return false
}

/**
 * Validates the passed input ('YYY-MM-DD') as a date or ('YYY-MM-DD HH:MM') date time combination
 * @param {string} input A string in the form 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM'
 * @returns {boolean} True if parseable
 */
function validateTimestamp (input) {
  return !!PARSE_REGEX.exec(input)
}

/**
 * Compares two {@link Timestamp}s for exactness
 * @param {Timestamp} ts1 The first {@link Timestamp}
 * @param {Timestamp} ts2 The second {@link Timestamp}
 * @returns {boolean} True if the two {@link Timestamp}s are an exact match
 */
function compareTimestamps (ts1, ts2) {
  return JSON.stringify(ts1) === JSON.stringify(ts2)
}

/**
 * Compares the date of two {@link Timestamp}s that have been updated with relative data
 * @param {Timestamp} ts1 The first {@link Timestamp}
 * @param {Timestamp} ts2 The second {@link Timestamp}
 * @returns {boolean} True if the two dates are the same
 */
function compareDate (ts1, ts2) {
  return getDate(ts1) === getDate(ts2)
}

/**
 * Compares the time of two {@link Timestamp}s that have been updated with relative data
 * @param {Timestamp} ts1 The first {@link Timestamp}
 * @param {Timestamp} ts2 The second {@link Timestamp}
 * @returns {boolean} True if the two times are an exact match
 */
function compareTime (ts1, ts2) {
  return getTime(ts1) === getTime(ts2)
}

/**
 * Compares the date and time of two {@link Timestamp}s that have been updated with relative data
 * @param {Timestamp} ts1 The first {@link Timestamp}
 * @param {Timestamp} ts2 The second {@link Timestamp}
 * @returns {boolean} True if the date and time are an exact match
 */
function compareDateTime (ts1, ts2) {
  return getDateTime(ts1) === getDateTime(ts2)
}

/**
 * Fast low-level parser for a date string ('YYYY-MM-DD'). Does not update formatted or relative date.
 * Use 'parseTimestamp' for formatted and relative updates
 * @param {string} input In the form 'YYYY-MM-DD hh:mm:ss' (seconds are optional, but not used)
 * @returns {Timestamp} This {@link Timestamp} is minimally filled in. The {@link Timestamp.date} and {@link Timestamp.time} as well as relative data will not be filled in.
 */
function parsed (input) {
  const parts = PARSE_REGEX.exec(input);

  if (!parts) return null

  return {
    date: input,
    time: padNumber(parseInt(parts[ 6 ], 10) || 0, 2) + ':' + padNumber(parseInt(parts[ 8 ], 10) || 0, 2),
    year: parseInt(parts[ 1 ], 10),
    month: parseInt(parts[ 2 ], 10),
    day: parseInt(parts[ 4 ], 10) || 1,
    hour: !isNaN(parseInt(parts[ 6 ], 10)) ? parseInt(parts[ 6 ], 10) : 0,
    minute: !isNaN(parseInt(parts[ 8 ], 10)) ? parseInt(parts[ 8 ], 10) : 0,
    weekday: 0,
    doy: 0,
    workweek: 0,
    hasDay: !!parts[ 4 ],
    hasTime: true, // there is always time because no time is '00:00', which is valid
    past: false,
    current: false,
    future: false,
    disabled: false
  }
}

/**
 * High-level parser that converts the passed in string to {@link Timestamp} and uses 'now' to update relative information.
 * @param {string} input In the form 'YYYY-MM-DD hh:mm:ss' (seconds are optional, but not used)
 * @param {Timestamp} now A {@link Timestamp} to use for relative data updates
 * @returns {Timestamp} The {@link Timestamp.date} will be filled in as well as the {@link Timestamp.time} if a time is supplied and formatted fields (doy, weekday, workweek, etc). If 'now' is supplied, then relative data will also be updated.
 */
function parseTimestamp (input, now) {
  let timestamp = parsed(input);
  if (timestamp === null) return null

  timestamp = updateFormatted(timestamp);

  if (now) {
    updateRelative(timestamp, now, timestamp.hasTime);
  }

  return timestamp
}

/**
 * Takes a JavaScript Date and returns a {@link Timestamp}. The {@link Timestamp} is not updated with relative information.
 * @param {date} date JavaScript Date
 * @param {boolean} utc If set the {@link Timestamp} will parse the Date as UTC
 * @returns {Timestamp} A minimal {@link Timestamp} without updated or relative updates.
 */
function parseDate (date, utc = false) {
  const UTC = !!utc ? 'UTC' : '';
  return updateFormatted({
    date: padNumber(date[ `get${ UTC }FullYear` ](), 4) + '-' + padNumber(date[ `get${ UTC }Month` ]() + 1, 2) + '-' + padNumber(date[ `get${ UTC }Date` ](), 2),
    time: padNumber(date[ `get${ UTC }Hours` ]() || 0, 2) + ':' + padNumber(date[ `get${ UTC }Minutes` ]() || 0, 2),
    year: date[ `get${ UTC }FullYear` ](),
    month: date[ `get${ UTC }Month` ]() + 1,
    day: date[ `get${ UTC }Date` ](),
    hour: date[ `get${ UTC }Hours` ](),
    minute: date[ `get${ UTC }Minutes` ](),
    weekday: 0,
    doy: 0,
    workweek: 0,
    hasDay: true,
    hasTime: true, // Date always has time, even if it is '00:00'
    past: false,
    current: false,
    future: false,
    disabled: false
  })
}

/**
 * Converts a {@link Timestamp} into a numeric date identifier based on the passed {@link Timestamp}'s date
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @returns {number} The numeric date identifier
 */
function getDayIdentifier (timestamp) {
  return timestamp.year * 100000000 + timestamp.month * 1000000 + timestamp.day * 10000
}

/**
 * Converts a {@link Timestamp} into a numeric time identifier based on the passed {@link Timestamp}'s time
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @returns {number} The numeric time identifier
 */
function getTimeIdentifier (timestamp) {
  return timestamp.hour * 100 + timestamp.minute
}

/**
 * Converts a {@link Timestamp} into a numeric date and time identifier based on the passed {@link Timestamp}'s date and time
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @returns {number} The numeric date+time identifier
 */
function getDayTimeIdentifier (timestamp) {
  return getDayIdentifier(timestamp) + getTimeIdentifier(timestamp)
}

/**
 * Returns the difference between two {@link Timestamp}s
 * @param {Timestamp} ts1 The first {@link Timestamp}
 * @param {Timestamp} ts2 The second {@link Timestamp}
 * @param {boolean=} strict Optional flag to not to return negative numbers
 * @returns {number} The difference
 */
function diffTimestamp (ts1, ts2, strict) {
  const utc1 = Date.UTC(ts1.year, ts1.month - 1, ts1.day, ts1.hour, ts1.minute);
  const utc2 = Date.UTC(ts2.year, ts2.month - 1, ts2.day, ts2.hour, ts2.minute);
  if (strict === true && utc2 < utc1) {
    // Not negative number
    // utc2 - utc1 < 0  -> utc2 < utc1 ->   NO: utc1 >= utc2
    return 0
  }
  return utc2 - utc1
}

/**
 * Updates a {@link Timestamp} with relative data (past, current and future)
 * @param {Timestamp} timestamp The {@link Timestamp} that needs relative data updated
 * @param {Timestamp} now {@link Timestamp} that represents the current date (optional time)
 * @param {boolean=} time Optional flag to include time ('timestamp' and 'now' params should have time values)
 * @returns {Timestamp} The updated {@link Timestamp}
 */
function updateRelative (timestamp, now, time = false) {
  let a = getDayIdentifier(now);
  let b = getDayIdentifier(timestamp);
  let current = a === b;

  if (timestamp.hasTime && time && current) {
    a = getTimeIdentifier(now);
    b = getTimeIdentifier(timestamp);
    current = a === b;
  }

  timestamp.past = b < a;
  timestamp.current = current;
  timestamp.future = b > a;
  timestamp.currentWeekday = timestamp.weekday === now.weekday;

  return timestamp
}

/**
 * Sets a Timestamp{@link Timestamp} to number of minutes past midnight (modifies hour and minutes if needed)
 * @param {Timestamp} timestamp The {@link Timestamp} to modify
 * @param {number} minutes The number of minutes to set from midnight
 * @param {Timestamp=} now Optional {@link Timestamp} representing current date and time
 * @returns {Timestamp} The updated {@link Timestamp}
 */
function updateMinutes (timestamp, minutes, now) {
  timestamp.hasTime = true;
  timestamp.hour = Math.floor(minutes / MINUTES_IN_HOUR);
  timestamp.minute = minutes % MINUTES_IN_HOUR;
  timestamp.time = getTime(timestamp);
  if (now) {
    updateRelative(timestamp, now, true);
  }

  return timestamp
}

/**
 * Updates the {@link Timestamp} with the weekday
 * @param {Timestamp} timestamp The {@link Timestamp} to modify
 * @returns The modified Timestamp
 */
function updateWeekday (timestamp) {
  timestamp.weekday = getWeekday(timestamp);

  return timestamp
}

/**
 * Updates the {@link Timestamp} with the day of the year (doy)
 * @param {Timestamp} timestamp The {@link Timestamp} to modify
 * @returns The modified Timestamp
 */
function updateDayOfYear (timestamp) {
  timestamp.doy = getDayOfYear(timestamp);

  return timestamp
}

/**
 * Updates the {@link Timestamp} with the workweek
 * @param {Timestamp} timestamp The {@link Timestamp} to modify
 * @returns The modified {@link Timestamp}
 */
function updateWorkWeek (timestamp) {
  timestamp.workweek = getWorkWeek(timestamp);

  return timestamp
}

/**
 * Updates the passed {@link Timestamp} with disabled, if needed
 * @param {Timestamp} timestamp The {@link Timestamp} to modify
 * @param {string} [disabledBefore] In 'YYY-MM-DD' format
 * @param {string} [disabledAfter] In 'YYY-MM-DD' format
 * @param {number[]} [disabledWeekdays] An array of numbers representing weekdays [0 = Sun, ..., 6 = Sat]
 * @param {string[]} [disabledDays] An array of days in 'YYYY-MM-DD' format. If an array with a pair of dates is in first array, then this is treated as a range.
 * @returns The modified {@link Timestamp}
 */
function updateDisabled (timestamp, disabledBefore, disabledAfter, disabledWeekdays, disabledDays) {
  const t = getDayIdentifier(timestamp);

  if (disabledBefore !== undefined) {
    const before = getDayIdentifier(parsed(disabledBefore));
    if (t <= before) {
      timestamp.disabled = true;
    }
  }

  if (timestamp.disabled !== true && disabledAfter !== undefined) {
    const after = getDayIdentifier(parsed(disabledAfter));
    if (t >= after) {
      timestamp.disabled = true;
    }
  }

  if (timestamp.disabled !== true && Array.isArray(disabledWeekdays) && disabledWeekdays.length > 0) {
    for (const weekday in disabledWeekdays) {
      if (disabledWeekdays[ weekday ] === timestamp.weekday) {
        timestamp.disabled = true;
        break
      }
    }
  }

  if (timestamp.disabled !== true && Array.isArray(disabledDays) && disabledDays.length > 0) {
    for (const day in disabledDays) {
      if (Array.isArray(disabledDays[ day ]) && disabledDays[ day ].length === 2) {
        const start = parsed(disabledDays[ day ][ 0 ]);
        const end = parsed(disabledDays[ day ][ 1 ]);
        if (isBetweenDates(timestamp, start, end)) {
          timestamp.disabled = true;
          break
        }
      }
      else {
        const d = getDayIdentifier(parseTimestamp(disabledDays[ day ] + ' 00:00'));
        if (d === t) {
          timestamp.disabled = true;
          break
        }
      }
    }
  }

  return timestamp
}

/**
 * Updates the passed {@link Timestamp} with formatted data (time string, date string, weekday, day of year and workweek)
 * @param {Timestamp} timestamp The {@link Timestamp} to modify
 * @returns The modified {@link Timestamp}
 */
function updateFormatted (timestamp) {
  timestamp.hasTime = true;
  timestamp.time = getTime(timestamp);
  timestamp.date = getDate(timestamp);
  timestamp.weekday = getWeekday(timestamp);
  timestamp.doy = getDayOfYear(timestamp);
  timestamp.workweek = getWorkWeek(timestamp);

  return timestamp
}

/**
 * Returns day of the year (doy) for the passed in {@link Timestamp}
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @returns {number} The day of the year
 */
function getDayOfYear (timestamp) {
  if (timestamp.year === 0) return
  return (Date.UTC(timestamp.year, timestamp.month - 1, timestamp.day) - Date.UTC(timestamp.year, 0, 0)) / 24 / 60 / 60 / 1000
}

/**
 * Returns workweek for the passed in {@link Timestamp}
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @returns {number} The work week
 */
function getWorkWeek (timestamp) {
  if (timestamp.year === 0) {
    timestamp = parseTimestamp(today());
  }

  const date = makeDate(timestamp);
  if (isNaN(date)) return 0

  // Remove time components of date
  const weekday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Change date to Thursday same week
  weekday.setDate(weekday.getDate() - ((weekday.getDay() + 6) % 7) + 3);

  // Take January 4th as it is always in week 1 (see ISO 8601)
  const firstThursday = new Date(weekday.getFullYear(), 0, 4);

  // Change date to Thursday same week
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

  // Check if daylight-saving-time-switch occurred and correct for it
  const ds = weekday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
  weekday.setHours(weekday.getHours() - ds);

  // Number of weeks between target Thursday and first Thursday
  const weekDiff = (weekday - firstThursday) / (MILLISECONDS_IN_WEEK);
  return 1 + Math.floor(weekDiff)
}

/**
 * Returns weekday for the passed in {@link Timestamp}
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @returns {number} The weekday
 */
function getWeekday (timestamp) {
  let weekday = timestamp.weekday;
  if (timestamp.hasDay) {
    const floor = Math.floor;
    const day = timestamp.day;
    const month = ((timestamp.month + 9) % MONTH_MAX) + 1;
    const century = floor(timestamp.year / 100);
    const year = (timestamp.year % 100) - (timestamp.month <= 2 ? 1 : 0);

    weekday = (((day + floor(2.6 * month - 0.2) - 2 * century + year + floor(year / 4) + floor(century / 4)) % 7) + 7) % 7;
  }

  return weekday
}

/**
 * Returns if the passed year is a leap year
 * @param {number} year The year to check (ie: 1999, 2020)
 * @returns {boolean} True if the year is a leap year
 */
function isLeapYear (year) {
  return ((year % 4 === 0) ^ (year % 100 === 0) ^ (year % 400 === 0)) === 1
}

/**
 * Returns the days of the specified month in a year
 * @param {number} year The year (ie: 1999, 2020)
 * @param {number} month The month (zero-based)
 * @returns {number} The number of days in the month (corrected for leap years)
 */
function daysInMonth (year, month) {
  return isLeapYear(year) ? DAYS_IN_MONTH_LEAP[ month ] : DAYS_IN_MONTH[ month ]
}

/**
 * Makes a copy of the passed in {@link Timestamp}
 * @param {Timestamp} timestamp The original {@link Timestamp}
 * @returns {Timestamp} A copy of the original {@link Timestamp}
 */
function copyTimestamp (timestamp) {
  return { ...timestamp }
}

/**
 * Padds a passed in number to length (converts to a string). Good for converting '5' as '05'.
 * @param {number} x The number to pad
 * @param {number} length The length of the required number as a string
 * @returns {string} The padded number (as a string). (ie: 5 = '05')
 */
function padNumber (x, length) {
  let padded = String(x);
  while (padded.length < length) {
    padded = '0' + padded;
  }

  return padded
}

/**
 * Used internally to convert {@link Timestamp} used with 'parsed' or 'parseDate' so the 'date' portion of the {@link Timestamp} is correct.
 * @param {Timestamp} timestamp The (raw) {@link Timestamp}
 * @returns {string} A formatted date ('YYYY-MM-DD')
 */
function getDate (timestamp) {
  let str = `${ padNumber(timestamp.year, 4) }-${ padNumber(timestamp.month, 2) }`;

  if (timestamp.hasDay) str += `-${ padNumber(timestamp.day, 2) }`;

  return str
}

/**
 * Used intenally to convert {@link Timestamp} with 'parsed' or 'parseDate' so the 'time' portion of the {@link Timestamp} is correct.
 * @param {Timestamp} timestamp The (raw) {@link Timestamp}
 * @returns {string} A formatted time ('hh:mm')
 */
function getTime (timestamp) {
  if (!timestamp.hasTime) {
    return ''
  }

  return `${ padNumber(timestamp.hour, 2) }:${ padNumber(timestamp.minute, 2) }`
}

/**
 * Returns a formatted string date and time ('YYYY-YY-MM hh:mm')
 * @param {Timestamp} timestamp The {@link Timestamp}
 * @returns {string} A formatted date time ('YYYY-MM-DD HH:mm')
 */
function getDateTime (timestamp) {
  return getDate(timestamp) + ' ' + (timestamp.hasTime ? getTime(timestamp) : '00:00')
}

/**
 * Returns a {@link Timestamp} of next day from passed in {@link Timestamp}
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @returns {Timestamp} The modified {@link Timestamp} as the next day
 */
function nextDay (timestamp) {
  ++timestamp.day;
  timestamp.weekday = (timestamp.weekday + 1) % DAYS_IN_WEEK;
  if (timestamp.day > DAYS_IN_MONTH_MIN && timestamp.day > daysInMonth(timestamp.year, timestamp.month)) {
    timestamp.day = DAY_MIN;
    ++timestamp.month;
    if (timestamp.month > MONTH_MAX) {
      timestamp.month = MONTH_MIN;
      ++timestamp.year;
    }
  }

  return timestamp
}

/**
 * Returns a {@link Timestamp} of previous day from passed in {@link Timestamp}
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @returns {Timestamp} The modified {@link Timestamp} as the previous day
 */
function prevDay (timestamp) {
  timestamp.day--;
  timestamp.weekday = (timestamp.weekday + 6) % DAYS_IN_WEEK;
  if (timestamp.day < DAY_MIN) {
    timestamp.month--;
    if (timestamp.month < MONTH_MIN) {
      timestamp.year--;
      timestamp.month = MONTH_MAX;
    }
    timestamp.day = daysInMonth(timestamp.year, timestamp.month);
  }

  return timestamp
}

/**
 * An alias for {relativeDays}
 * @param {Timestamp} timestamp The {@link Timestamp} to modify
 * @param {function} [mover=nextDay] The mover function to use (ie: {nextDay} or {prevDay}).
 * @param {number} [days=1] The number of days to move.
 * @param {number[]} [allowedWeekdays=[ 0, 1, 2, 3, 4, 5, 6 ]] An array of numbers representing the weekdays. ie: [0 = Sun, ..., 6 = Sat].
 * @returns The modified {@link Timestamp}
 */
function moveRelativeDays (timestamp, mover = nextDay, days = 1, allowedWeekdays = [ 0, 1, 2, 3, 4, 5, 6 ]) {
  return relativeDays(timestamp, mover, days, allowedWeekdays)
}

/**
 * Moves the {@link Timestamp} the number of relative days
 * @param {Timestamp} timestamp The {@link Timestamp} to modify
 * @param {function} [mover=nextDay] The mover function to use (ie: {nextDay} or {prevDay}).
 * @param {number} [days=1] The number of days to move.
 * @param {number[]} [allowedWeekdays=[ 0, 1, 2, 3, 4, 5, 6 ]] An array of numbers representing the weekdays. ie: [0 = Sun, ..., 6 = Sat].
 * @returns The modified {@link Timestamp}
 */
function relativeDays (timestamp, mover = nextDay, days = 1, allowedWeekdays = [ 0, 1, 2, 3, 4, 5, 6 ]) {
  if (!allowedWeekdays.includes(timestamp.weekday) && timestamp.weekday === 0 && mover === nextDay) {
    ++days;
  }
  while (--days >= 0) {
    timestamp = mover(timestamp);
    if (allowedWeekdays.length < 7 && !allowedWeekdays.includes(timestamp.weekday)) {
      ++days;
    }
  }

  return timestamp
}

/**
 * Finds the specified weekday (forward or back) based on the {@link Timestamp}
 * @param {Timestamp} timestamp The {@link Timestamp} to modify
 * @param {number} weekday The weekday number (Sun = 0, ..., Sat = 6)
 * @param {function} [mover=nextDay] The function to use ({prevDay} or {nextDay}).
 * @param {number} [maxDays=6] The number of days to look forward or back.
 * @returns The modified {@link Timestamp}
 */
function findWeekday (timestamp, weekday, mover = nextDay, maxDays = 6) {
  while (timestamp.weekday !== weekday && --maxDays >= 0) timestamp = mover(timestamp);
  return timestamp
}

/**
 * Returns an array of 0's and mostly 1's representing skipped days (used internally)
 * @param {number[]} weekdays An array of numbers representing the weekdays. ie: [0 = Sun, ..., 6 = Sat].
 * @returns {number[]} An array of 0's and mostly 1's (other numbers may occur previous to skipped days)
 */
function getWeekdaySkips (weekdays) {
  const skips = [ 1, 1, 1, 1, 1, 1, 1 ];
  const filled = [ 0, 0, 0, 0, 0, 0, 0 ];
  for (let i = 0; i < weekdays.length; ++i) {
    filled[ weekdays[ i ] ] = 1;
  }
  for (let k = 0; k < DAYS_IN_WEEK; ++k) {
    let skip = 1;
    for (let j = 1; j < DAYS_IN_WEEK; ++j) {
      const next = (k + j) % DAYS_IN_WEEK;
      if (filled[ next ]) {
        break
      }
      ++skip;
    }
    skips[ k ] = filled[ k ] * skip;
  }

  return skips
}

/**
 * Creates an array of {@link Timestamp}s based on start and end params
 * @param {Timestamp} start The starting {@link Timestamp}
 * @param {Timestamp} end The ending {@link Timestamp}
 * @param {Timestamp} now The relative day
 * @param {number[]} weekdaySkips An array representing available and skipped weekdays
 * @param {string} [disabledBefore] Days before this date are disabled (YYYY-MM-DD)
 * @param {string} [disabledAfter] Days after this date are disabled (YYYY-MM-DD)
 * @param {number[]} [disabledWeekdays] An array representing weekdays that are disabled [0 = Sun, ..., 6 = Sat]
 * @param {string[]} [disabledDays] An array of days in 'YYYY-MM-DD' format. If an array with a pair of dates is in first array, then this is treated as a range.
 * @param {number} [max=42] Max days to do
 * @param {number} [min=0]  Min days to do
 * @returns {Timestamp[]} The requested array of {@link Timestamp}s
 */
function createDayList (start, end, now, weekdaySkips, disabledBefore, disabledAfter, disabledWeekdays = [], disabledDays = [], max = 42, min = 0) {
  const stop = getDayIdentifier(end);
  const days = [];
  let current = copyTimestamp(start);
  let currentIdentifier = 0;
  let stopped = currentIdentifier === stop;

  if (stop < getDayIdentifier(start)) {
    return days
  }

  while ((!stopped || days.length < min) && days.length < max) {
    currentIdentifier = getDayIdentifier(current);
    stopped = stopped || (currentIdentifier > stop && days.length >= min);
    if (stopped) {
      break
    }
    if (weekdaySkips[ current.weekday ] === 0) {
      current = relativeDays(current, nextDay);
      continue
    }
    const day = copyTimestamp(current);
    updateFormatted(day);
    updateRelative(day, now);
    updateDisabled(day, disabledBefore, disabledAfter, disabledWeekdays, disabledDays);
    days.push(day);
    current = relativeDays(current, nextDay);
  }

  return days
}

/**
 * Creates an array of interval {@link Timestamp}s based on params
 * @param {Timestamp} timestamp The starting {@link Timestamp}
 * @param {number} first The starting interval time
 * @param {number} minutes How many minutes between intervals (ie: 60, 30, 15 would be common ones)
 * @param {number} count The number of intervals needed
 * @param {Timestamp} now A relative {@link Timestamp} with time
 * @returns {Timestamp[]} The requested array of interval {@link Timestamp}s
 */
function createIntervalList (timestamp, first, minutes, count, now) {
  const intervals = [];

  for (let i = 0; i < count; ++i) {
    const mins = (first + i) * minutes;
    const ts = copyTimestamp(timestamp);
    intervals.push(updateMinutes(ts, mins, now));
  }

  return intervals
}

/**
 * @callback getOptions
 * @param {Timestamp} timestamp A {@link Timestamp} object
 * @param {boolean} short True if using short options
 * @returns {Object} An Intl object representing optioons to be used
 */

/**
 * @callback formatter
 * @param {Timestamp} timestamp The {@link Timestamp} being used
 * @param {boolean} short If short format is being requested
 * @returns {string} The localized string of the formatted {@link Timestamp}
 */

/**
 * Returns a function that uses Intl.DateTimeFormat formatting
 * @param {string} locale The locale to use (ie: en-US)
 * @param {getOptions} cb The function to call for options. This function should return an Intl formatted object. The function is passed (timestamp, short).
 * @returns {formatter} The function has params (timestamp, short). The short is to use the short options.
 */
function createNativeLocaleFormatter (locale, cb) {
  const emptyFormatter = (_t, _s) => '';

  /* istanbul ignore next */
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') {
    return emptyFormatter
  }

  return (timestamp, short) => {
    try {
      const intlFormatter = new Intl.DateTimeFormat(locale || undefined, cb(timestamp, short));
      return intlFormatter.format(makeDateTime(timestamp))
    }
    catch (e) /* istanbul ignore next */ {
      /* eslint-disable-next-line */
      console.error(`Intl.DateTimeFormat: ${e.message} -> ${getDateTime(timestamp)}`);
      return emptyFormatter
    }
  }
}

/**
 * Makes a JavaScript Date from the passed {@link Timestamp}
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @param {boolean} utc True to get Date object using UTC
 * @returns {date} A JavaScript Date
 */
function makeDate (timestamp, utc = true) {
  if (utc) return new Date(Date.UTC(timestamp.year, timestamp.month - 1, timestamp.day, 0, 0))
  return new Date(timestamp.year, timestamp.month - 1, timestamp.day, 0, 0)
}

/**
 * Makes a JavaScript Date from the passed {@link Timestamp} (with time)
 * @param {Timestamp} timestamp The {@link Timestamp} to use
 * @param {boolean} utc True to get Date object using UTC
 * @returns {date} A JavaScript Date
 */
function makeDateTime (timestamp, utc = true) {
  if (utc) return new Date(Date.UTC(timestamp.year, timestamp.month - 1, timestamp.day, timestamp.hour, timestamp.minute))
  return new Date(timestamp.year, timestamp.month - 1, timestamp.day, timestamp.hour, timestamp.minute)
}

// validate a number IS a number
/**
 * Teting is passed value is a number
 * @param {(string|number)} input The value to use
 * @returns {boolean} True if a number (not floating point)
 */
function validateNumber (input) {
  return isFinite(parseInt(input, 10))
}

/**
 * Given an array of {@link Timestamp}s, finds the max date (and possible time)
 * @param {Timestamp[]} timestamps This is an array of {@link Timestamp}s
 * @param {boolean=} useTime Default false; if true, uses time in the comparison as well
 * @returns The {@link Timestamp} with the highest date (and possibly time) value
 */
function maxTimestamp (timestamps, useTime = false) {
  const func = useTime === true ? getDayTimeIdentifier : getDayIdentifier;
  return timestamps.reduce((prev, cur) => {
    return Math.max(func(prev), func(cur)) === func(prev) ? prev : cur
  })
}

/**
 * Given an array of {@link Timestamp}s, finds the min date (and possible time)
 * @param {Timestamp[]} timestamps This is an array of {@link Timestamp}s
 * @param {boolean=} useTime Default false; if true, uses time in the comparison as well
 * @returns The {@link Timestamp} with the lowest date (and possibly time) value
 */
 function minTimestamp (timestamps, useTime = false) {
  const func = useTime === true ? getDayTimeIdentifier : getDayIdentifier;
  return timestamps.reduce((prev, cur) => {
    return Math.min(func(prev), func(cur)) === func(prev) ? prev : cur
  })
}

/**
 * Determines if the passed {@link Timestamp} is between (or equal) to two {@link Timestamp}s (range)
 * @param {Timestamp} timestamp The {@link Timestamp} for testing
 * @param {Timestamp} startTimestamp The starting {@link Timestamp}
 * @param {Timestamp} endTimestamp The ending {@link Timestamp}
 * @param {boolean=} useTime If true, use time from the {@link Timestamp}s
 * @returns {boolean} True if {@link Timestamp} is between (or equal) to two {@link Timestamp}s (range)
 */
function isBetweenDates (timestamp, startTimestamp, endTimestamp, useTime /* = false */) {
  const cd = getDayIdentifier(timestamp) + (useTime === true ? getTimeIdentifier(timestamp) : 0);
  const sd = getDayIdentifier(startTimestamp) + (useTime === true ? getTimeIdentifier(startTimestamp) : 0);
  const ed = getDayIdentifier(endTimestamp) + (useTime === true ? getTimeIdentifier(endTimestamp) : 0);

  return cd >= sd && cd <= ed
}

/**
 * Determine if two ranges of {@link Timestamp}s overlap each other
 * @param {Timestamp} startTimestamp The starting {@link Timestamp} of first range
 * @param {Timestamp} endTimestamp The endinging {@link Timestamp} of first range
 * @param {Timestamp} firstTimestamp The starting {@link Timestamp} of second range
 * @param {Timestamp} lastTimestamp The ending {@link Timestamp} of second range
 * @returns {boolean} True if the two ranges overlap each other
 */
function isOverlappingDates (startTimestamp, endTimestamp, firstTimestamp, lastTimestamp) {
  const start = getDayIdentifier(startTimestamp);
  const end = getDayIdentifier(endTimestamp);
  const first = getDayIdentifier(firstTimestamp);
  const last = getDayIdentifier(lastTimestamp);
  return (
    (start >= first && start <= last) // overlap left
    || (end >= first && end <= last) // overlap right
    || (first >= start && end >= last) // surrounding
  )
}

/**
 * Add or decrements years, months, days, hours or minutes to a timestamp
 * @param {Timestamp} timestamp The {@link Timestamp} object
 * @param {Object} options configuration data
 * @param {number=} options.year If positive, adds years. If negative, removes years.
 * @param {number=} options.month If positive, adds months. If negative, removes month.
 * @param {number=} options.day If positive, adds days. If negative, removes days.
 * @param {number=} options.hour If positive, adds hours. If negative, removes hours.
 * @param {number=} options.minute If positive, adds minutes. If negative, removes minutes.
 * @returns {Timestamp} A modified copy of the passed in {@link Timestamp}
 */
function addToDate (timestamp, options) {
  const ts = copyTimestamp(timestamp);
  let minType;
  __forEachObject(options, (value, key) => {
    if (ts[ key ] !== undefined) {
      ts[ key ] += parseInt(value, 10);
      const indexType = NORMALIZE_TYPES.indexOf(key);
      if (indexType !== -1) {
        if (minType === undefined) {
          minType = indexType;
        }
        else {
          /* istanbul ignore next */
          minType = Math.min(indexType, minType);
        }
      }
    }
  });

  // normalize timestamp
  if (minType !== undefined) {
    __normalize(ts, NORMALIZE_TYPES[ minType ]);
  }
  updateFormatted(ts);
  return ts
}

const NORMALIZE_TYPES = [ 'minute', 'hour', 'day', 'month' ];

// addToDate helper
function __forEachObject (obj, cb) {
  Object.keys(obj).forEach(k => cb(obj[ k ], k));
}

// normalize minutes
function __normalizeMinute (ts) {
  if (ts.minute >= MINUTES_IN_HOUR || ts.minute < 0) {
    const hours = Math.floor(ts.minute / MINUTES_IN_HOUR);
    ts.minute -= hours * MINUTES_IN_HOUR;
    ts.hour += hours;
    __normalizeHour(ts);
  }
  return ts
}

// normalize hours
function __normalizeHour (ts) {
  if (ts.hour >= HOURS_IN_DAY || ts.hour < 0) {
    const days = Math.floor(ts.hour / HOURS_IN_DAY);
    ts.hour -= days * HOURS_IN_DAY;
    ts.day += days;
    __normalizeDay(ts);
  }
  return ts
}

// normalize days
function __normalizeDay (ts) {
  __normalizeMonth(ts);
  let dim = daysInMonth(ts.year, ts.month);
  if (ts.day > dim) {
    ++ts.month;
    if (ts.month > MONTH_MAX) {
      __normalizeMonth(ts);
    }
    let days = ts.day - dim;
    dim = daysInMonth(ts.year, ts.month);
    do {
      if (days > dim) {
        ++ts.month;
        if (ts.month > MONTH_MAX) {
          __normalizeMonth(ts);
        }
        days -= dim;
        dim = daysInMonth(ts.year, ts.month);
      }
    } while (days > dim)
    ts.day = days;
  }
  else if (ts.day <= 0) {
    let days = -1 * ts.day;
    --ts.month;
    if (ts.month <= 0) {
      __normalizeMonth(ts);
    }
    dim = daysInMonth(ts.year, ts.month);
    do {
      if (days > dim) /* istanbul ignore next */ {
        days -= dim;
        --ts.month;
        if (ts.month <= 0) {
          __normalizeMonth(ts);
        }
        dim = daysInMonth(ts.year, ts.month);
      }
    } while (days > dim)
    ts.day = dim - days;
  }
  return ts
}

// normalize months
function __normalizeMonth (ts) {
  if (ts.month > MONTH_MAX) {
    const years = Math.floor(ts.month / MONTH_MAX);
    ts.month = ts.month % MONTH_MAX;
    ts.year += years;
  }
  else if (ts.month < MONTH_MIN) {
    ts.month += MONTH_MAX;
    --ts.year;
  }
  return ts
}

// normalize all
function __normalize (ts, type) {
  switch (type) {
    case 'minute':
      return __normalizeMinute(ts)
    case 'hour':
      return __normalizeHour(ts)
    case 'day':
      return __normalizeDay(ts)
    case 'month':
      return __normalizeMonth(ts)
  }
}

/**
 * Returns number of days between two {@link Timestamp}s
 * @param {Timestamp} ts1 The first {@link Timestamp}
 * @param {Timestamp} ts2 The second {@link Timestamp}
 * @returns Number of days
 */
function daysBetween (ts1, ts2) {
  const diff = diffTimestamp(ts1, ts2, true);
  return Math.floor(diff / MILLISECONDS_IN_DAY)
}

/**
 * Returns number of weeks between two {@link Timestamp}s
 * @param {Timestamp} ts1 The first {@link Timestamp}
 * @param {Timestamp} ts2 The second {@link Timestamp}
 */
 function weeksBetween (ts1, ts2) {
  let t1 = copyTimestamp(ts1);
  let t2 = copyTimestamp(ts2);
  t1 = findWeekday(t1, 0);
  t2 = findWeekday(t2, 6);
  return Math.ceil(daysBetween(t1, t2) / DAYS_IN_WEEK)
}

// Known dates - starting week on a monday to conform to browser
const weekdayDateMap = {
  Sun: new Date('2020-01-05T00:00:00.000Z'),
  Mon: new Date('2020-01-06T00:00:00.000Z'),
  Tue: new Date('2020-01-07T00:00:00.000Z'),
  Wed: new Date('2020-01-08T00:00:00.000Z'),
  Thu: new Date('2020-01-09T00:00:00.000Z'),
  Fri: new Date('2020-01-10T00:00:00.000Z'),
  Sat: new Date('2020-01-11T00:00:00.000Z')
};

function getWeekdayFormatter () {
  const emptyFormatter = (_d, _t) => '';
  const options = {
    long: { timeZone: 'UTC', weekday: 'long' },
    short: { timeZone: 'UTC', weekday: 'short' },
    narrow: { timeZone: 'UTC', weekday: 'narrow' }
  };

  /* istanbul ignore next */
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') {
    return emptyFormatter
  }

  // type = 'narrow', 'short', 'long'
  function weekdayFormatter (weekday, type, locale) {
    try {
      const intlFormatter = new Intl.DateTimeFormat(locale || undefined, options[ type ] || options[ 'long' ]);
      return intlFormatter.format(weekdayDateMap[ weekday ])
    }
    catch (e) /* istanbul ignore next */ {
      /* eslint-disable-next-line */
      console.error(`Intl.DateTimeFormat: ${e.message} -> day of week: ${ weekday }`);
      return emptyFormatter
    }
  }

  return weekdayFormatter
}

function getWeekdayNames (type, locale) {
  const shortWeekdays = Object.keys(weekdayDateMap);
  const weekdayFormatter = getWeekdayFormatter();
  return shortWeekdays.map(weekday => weekdayFormatter(weekday, type, locale))
}

function getMonthFormatter () {
  const emptyFormatter = (_m, _t) => '';
  const options = {
    long: { timeZone: 'UTC', month: 'long' },
    short: { timeZone: 'UTC', month: 'short' },
    narrow: { timeZone: 'UTC', month: 'narrow' }
  };

  /* istanbul ignore next */
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') {
    return emptyFormatter
  }

  // type = 'narrow', 'short', 'long'
  function monthFormatter (month, type, locale) {
    try {
      const intlFormatter = new Intl.DateTimeFormat(locale || undefined, options[ type ] || options[ 'long' ]);
      const date = new Date();
      date.setDate(1);
      date.setMonth(month);
      return intlFormatter.format(date)
    }
    catch (e) /* istanbul ignore next */ {
      /* eslint-disable-next-line */
      console.error(`Intl.DateTimeFormat: ${e.message} -> month: ${ month }`);
      return emptyFormatter
    }
  }

  return monthFormatter
}

function getMonthNames (type, locale) {
  const monthFormatter = getMonthFormatter();
  return [...Array(12).keys()]
    .map(month => monthFormatter(month, type, locale))
}

function convertToUnit (input, unit = 'px') {
  if (input == null || input === '') {
    return undefined
  }
  else if (isNaN(input)) {
    return String(input)
  }
  else if (input === 'auto') {
    return input
  }
  else {
    return `${ Number(input) }${ unit }`
  }
}

function indexOf (array, cb) {
  for (let i = 0; i < array.length; i++) {
    if (cb(array[ i ], i) === true) {
      return i
    }
  }
  return -1
}

function minCharWidth (str, count) {
  if (count === 0) return str
  return str.slice(0, count)
}

var ResizeObserver$1 = {
  name: 'ResizeObserver',

  mounted (el, { modifiers, value }) {
    if (!value) return // callback

    const opts = {};
    opts.callback = value;
    opts.size = { width: 0, height: 0 };

    opts.observer = new ResizeObserver(entries => {
      const rect = entries[ 0 ].contentRect;
      if (rect.width !== opts.size.width || rect.height !== opts.size.height) {
        opts.size.width = rect.width;
        opts.size.height = rect.height;
        opts.callback(opts.size);
      }
    });

    // start the observing
    opts.observer.observe(el);

    // save to element
    el.__onResizeObserver = opts;
  },

  beforeUnmount (el) {
    if (!el.__onResizeObserver) return
    const { observer } = el.__onResizeObserver;
    observer.unobserve(el);
    delete el.__onResizeObserver;
  }
};

/**
 * The main QCalendar wrapper
 * All others are a child to this one
 */


function useCalendar (props, renderFunc, {
  scrollArea,
  pane
}) {
  if (!renderFunc) {
    const msg = '[error: renderCalendar] no renderFunc has been supplied to useCalendar';
    console.error(msg);
    throw new Error(msg)
  }

  const size = vue.reactive({ width: 0, height: 0 }),
    rootRef = vue.ref(null);

  function __onResize ({ width, height }) {
    size.width = width;
    size.height = height;
  }

  const scrollWidth = vue.computed(() => {
    return props.noScroll !== true
      ? scrollArea.value && pane.value && size.height // force recalc with height change
        ? (scrollArea.value.offsetWidth - pane.value.offsetWidth)
        : 0
      : 0
  });

  function __initCalendar () {
    //
  }

  function __renderCalendar () {
    const data = {
      ref: rootRef,
      role: 'complementary',
      lang: props.locale,
      class: {
        'q-calendar--dark': props.dark === true,
        'q-calendar': true,
        'q-calendar__bordered': props.bordered === true
      }
    };

    return vue.withDirectives(
      vue.h('div', data, [
        renderFunc()
      ]), [[
        ResizeObserver$1,
        __onResize
      ]]
    )

    // return h('div', data, [
    //     renderFunc()
    // ])
  }

  return {
    rootRef,
    scrollWidth,
    __initCalendar,
    __renderCalendar
  }
}

// https://github.com/vuejs/core/issues/5303#issuecomment-1543596383
// TODO deepUnref? https://www.npmjs.com/package/vue-deepunref

function deepToRaw(sourceObj) {
  const objectIterator = (input) => {
    if (Array.isArray(input)) {
      return input.map((item) => objectIterator(item));
    } if (vue.isRef(input) || vue.isReactive(input) || vue.isProxy(input)) {
      return objectIterator(vue.toRaw(input));
    } if (input && typeof input === 'object') {
      return Object.keys(input).reduce((acc, key) => {
        acc[ key ] = objectIterator(input[ key ]);
        return acc;
      }, {});
    }
    return input;
  };

  return objectIterator(sourceObj);
}

// common composables

const useCommonProps = {
  modelValue: { // v-model
    type: String,
    default: today(),
    validator: v => v === '' || validateTimestamp(v)
  },
  weekdays: {
    type: Array,
    default: () => [ 0, 1, 2, 3, 4, 5, 6 ]
  },
  dateType: {
    type: String,
    default: 'round',
    validator: v => [ 'round', 'rounded', 'square' ].includes(v)
  },
  weekdayAlign: {
    type: String,
    default: 'center',
    validator: v => [ 'left', 'center', 'right' ].includes(v)
  },
  dateAlign: {
    type: String,
    default: 'center',
    validator: v => [ 'left', 'center', 'right' ].includes(v)
  },
  bordered: Boolean,
  dark: Boolean,
  noAria: Boolean,
  noActiveDate: Boolean,
  noHeader: Boolean,
  noScroll: Boolean,
  shortWeekdayLabel: Boolean,
  noDefaultHeaderText: Boolean,
  noDefaultHeaderBtn: Boolean,
  minWeekdayLabel: {
    type: [ Number, String ],
    default: 1
  },
  weekdayBreakpoints: {
    type: Array,
    default: () => [ 75, 35 ],
    validator: v => v.length === 2
  },
  locale: {
    type: String,
    default: 'en-US'
  },
  animated: Boolean,
  transitionPrev: {
    type: String,
    default: 'slide-right'
  },
  transitionNext: {
    type: String,
    default: 'slide-left'
  },
  disabledDays: Array,
  disabledBefore: String,
  disabledAfter: String,
  disabledWeekdays: {
    type: Array,
    default: () => []
  },
  dragEnterFunc: {
    type: Function
    // event, timestamp
  },
  dragOverFunc: {
    type: Function
    // event, timestamp
  },
  dragLeaveFunc: {
    type: Function
    // event, timestamp
  },
  dropFunc: {
    type: Function
    // event, timestamp
  },
  selectedDates: {
    type: [ Array, Set ],
    default: () => []
  },
  selectedStartEndDates: {
    type: Array,
    default: () => []
  },
  hoverable: Boolean,
  focusable: Boolean,
  focusType: {
    type: Array,
    default: ['date'],
    validator: v => {
      let val = true;
      // v is an array of selected types
      v.forEach(type => {
        if ([ 'day', 'date', 'weekday', 'interval', 'time', 'resource', 'task' ].includes(type) !== true) {
          val = false;
        }
      });
      return val
    }
  }
};

function useCommon (props, {
  startDate,
  endDate,
  times
}) {
  const weekdaySkips = vue.computed(() => getWeekdaySkips(props.weekdays));
  const parsedStart = vue.computed(() => parseTimestamp(startDate.value));
  const parsedEnd = vue.computed(() => {
    if (endDate.value === '0000-00-00') {
      return endOfWeek(parsedStart.value)
    }
    return parseTimestamp(endDate.value)
  });

  // different from 'createDayList' in useIntervals
  // const days = computed(() => createDayList(
  //   parsedStart.value,
  //   parsedEnd.value,
  //   times.today,
  //   weekdaySkips.value,
  //   props.disabledBefore,
  //   props.disabledAfter,
  //   props.disabledWeekdays,
  //   props.disabledDays
  // ))

  const dayFormatter = vue.computed(() => {
    const options = { timeZone: 'UTC', day: 'numeric' };

    return createNativeLocaleFormatter(
      props.locale,
      (_tms, _short) => options
    )
  });

  const weekdayFormatter = vue.computed(() => {
    const longOptions = { timeZone: 'UTC', weekday: 'long' };
    const shortOptions = { timeZone: 'UTC', weekday: 'short' };

    return createNativeLocaleFormatter(
      props.locale,
      (_tms, short) => (short ? shortOptions : longOptions)
    )
  });

  const ariaDateFormatter = vue.computed(() => {
    const longOptions = { timeZone: 'UTC', dateStyle: 'full' };

    return createNativeLocaleFormatter(
      props.locale,
      (_tms) => longOptions
    )
  });

  function arrayHasDate (arr, timestamp) {
    return arr && arr.length > 0 && arr.includes(timestamp.date)
  }

  function checkDays (ranges, timestamp) {
    const days = {
      firstDay: false,
      betweenDays: false,
      lastDay: false
    };

    ranges = deepToRaw(ranges);

    if (!ranges || ranges.length === 0) {
      return days
    }

    // Single range case: range must have two dates ('YYYY-MM-DD') in it
    if (ranges.length === 2 && typeof(ranges[ 1 ]) === 'string' && typeof(ranges[ 2 ]) === 'string') {
      ranges = [ranges];
    }

    if (ranges.map(range => Array.isArray(range)).includes(false)) {
      // console.log({
      //   areArrays: ranges.map(range => typeof(range) === 'array'),
      //   ranges,
      //   types: ranges.map(range => {
      //     return {
      //       range,
      //       type: Array.isArray(range)
      //     }
      //   })
      // })
      throw new Error('Invalid argument for checkdays: ' + JSON.stringify(ranges, null, 2))
    }

    for (const range of ranges) {
      range.sort();
      const current = getDayIdentifier(timestamp);
      const first = getDayIdentifier(parsed(range[ 0 ]));
      const last = getDayIdentifier(parsed(range[ 1 ]));
      !days.firstDay && (days.firstDay = first === current);
      !days.lastDay && (days.lastDay = last === current);
      !days.betweenDays && (days.betweenDays = first < current && last > current);
    }
    return days
  }

  function getRelativeClasses (timestamp, outside = false, selectedDays = [], startEndDays = [], hover = false) {
    const isSelected = arrayHasDate(selectedDays, timestamp);
    const { firstDay, lastDay, betweenDays } = checkDays(startEndDays, timestamp);

    return {
      'q-past-day': firstDay !== true && betweenDays !== true && lastDay !== true && isSelected !== true && outside !== true && timestamp.past,
      'q-future-day': firstDay !== true && betweenDays !== true && lastDay !== true && isSelected !== true && outside !== true && timestamp.future,
      'q-outside': outside, // outside the current month
      'q-outside-before': outside && (timestamp.day > 15), // before the current month
      'q-outside-after':  outside && (timestamp.day < 15), // after the current month
      'q-current-day': timestamp.current,
      'q-selected': isSelected,
      'q-range-first': firstDay === true,
      'q-range': betweenDays === true,
      'q-range-last': lastDay === true,
      'q-range-hover': hover === true && (firstDay === true || lastDay === true || betweenDays === true),
      'q-disabled-day disabled': timestamp.disabled === true
    }
  }

  function startOfWeek (timestamp) {
    return getStartOfWeek(timestamp, props.weekdays, times.today)
  }

  function endOfWeek (timestamp) {
    return getEndOfWeek(timestamp, props.weekdays, times.today)
  }

  function dayStyleDefault (timestamp) {
    return undefined
  }

  const selectedDatesPropArray = vue.computed(() => {
    return props.selectedDates !== null ? Array.from(props.selectedDates) : null
  });

  return {
    weekdaySkips,
    parsedStart,
    parsedEnd,
    // days,
    dayFormatter,
    weekdayFormatter,
    ariaDateFormatter,
    arrayHasDate,
    checkDays,
    getRelativeClasses,
    startOfWeek,
    endOfWeek,
    dayStyleDefault,
    selectedDatesPropArray
  }
}

function scrollTo (scrollTarget, offset) {
  if (scrollTarget === window) {
    window.scrollTo(window.pageXOffset || window.scrollX || document.body.scrollLeft || 0, offset);
    return
  }
  scrollTarget.scrollTop = offset;
}

function scrollToHorizontal (scrollTarget, offset) {
  if (scrollTarget === window) {
    window.scrollTo(offset, window.pageYOffset || window.scrollY || document.body.scrollTop || 0);
    return
  }
  scrollTarget.scrollLeft = offset;
}

function getVerticalScrollPosition (scrollTarget) {
  return scrollTarget === window
    ? window.pageYOffset || window.scrollY || document.body.scrollTop || 0
    : scrollTarget.scrollTop
}

function getHorizontalScrollPosition (scrollTarget) {
  return scrollTarget === window
    ? window.pageXOffset || window.scrollX || document.body.scrollLeft || 0
    : scrollTarget.scrollLeft
}

function animVerticalScrollTo (el, to, duration = 0 /* , prevTime */) {
  const prevTime = arguments[ 3 ] === void 0 ? performance.now() : arguments[ 3 ];
  const pos = getVerticalScrollPosition(el);

  if (duration <= 0) {
    if (pos !== to) {
      scrollTo(el, to);
    }
    return
  }

  requestAnimationFrame(nowTime => {
    const frameTime = nowTime - prevTime;
    const newPos = pos + (to - pos) / Math.max(frameTime, duration) * frameTime;
    scrollTo(el, newPos);
    if (newPos !== to) {
      animVerticalScrollTo(el, to, duration - frameTime, nowTime);
    }
  });
}

function animHorizontalScrollTo (el, to, duration = 0 /* , prevTime */) {
  const prevTime = arguments[ 3 ] === void 0 ? performance.now() : arguments[ 3 ];
  const pos = getHorizontalScrollPosition(el);

  if (duration <= 0) {
    if (pos !== to) {
      scrollToHorizontal(el, to);
    }
    return
  }

  requestAnimationFrame(nowTime => {
    const frameTime = nowTime - prevTime;
    const newPos = pos + (to - pos) / Math.max(frameTime, duration) * frameTime;
    setHorizontalScroll(el, newPos);
    if (newPos !== to) {
      animHorizontalScrollTo(el, to, duration - frameTime, nowTime);
    }
  });
}

// interval composables

const useAgendaProps = {
  view: {
    type: String,
    validator: v => [ 'day', 'week', 'month', 'month-interval' ].includes(v),
    default: 'day'
  },
  leftColumnOptions: {
    type: Array
  },
  rightColumnOptions: {
    type: Array
  },
  columnOptionsId: {
    type: String
  },
  columnOptionsLabel: {
    type: String
  },
  weekdayStyle: {
    type: Function,
    default: null
  },
  weekdayClass: {
    type: Function,
    default: null
  },
  dayStyle: {
    type: Function,
    default: null
  },
  dayClass: {
    type: Function,
    default: null
  },
  dateHeader: {
    type: String,
    default: 'stacked',
    validator: v => [ 'stacked', 'inline', 'inverted' ].includes(v)
  },
  dayHeight: {
    type: [ Number, String ],
    default: 0,
    validator: validateNumber
  },
  dayMinHeight: {
    type: [ Number, String ],
    default: 40,
    validator: validateNumber
  }
};

function useInterval (props, {
  weekdaySkips,
  times,
  scrollArea,
  parsedStart,
  parsedEnd,
  maxDays,
  size,
  headerColumnRef
}) {
  const parsedIntervalStart = vue.computed(() => parseInt(props.intervalStart, 10));
  const parsedIntervalMinutes = vue.computed(() => parseInt(props.intervalMinutes, 10));
  const parsedIntervalCount = vue.computed(() => parseInt(props.intervalCount, 10));
  const parsedIntervalHeight = vue.computed(() => parseFloat(props.intervalHeight));
  const parsedCellWidth = vue.computed(() => {
    let width = 0;
    if (props.cellWidth) {
      width = props.cellWidth;
    }
    else if (size.width > 0 && headerColumnRef.value) {
      width = headerColumnRef.value.offsetWidth / (props.columnCount > 1 ? props.columnCount : maxDays.value);
    }
    return width
  });
  const parsedStartMinute = vue.computed(() => parsedIntervalStart.value * parsedIntervalMinutes.value);
  const bodyHeight = vue.computed(() => parsedIntervalCount.value * parsedIntervalHeight.value);
  const bodyWidth = vue.computed(() => parsedIntervalCount.value * parsedCellWidth.value);

  const parsedWeekStart = vue.computed(() => startOfWeek(parsedStart.value));
  const parsedWeekEnd = vue.computed(() => endOfWeek(parsedEnd.value));

  /**
   * Returns the days of the specified week
   */
  const days = vue.computed(() => {
    return createDayList(
      parsedStart.value,
      parsedEnd.value,
      times.today,
      weekdaySkips.value,
      props.disabledBefore,
      props.disabledAfter,
      props.disabledWeekdays,
      props.disabledDays,
      maxDays.value
    )
  });

  /**
   * Returns an interval list for each day
   */
  const intervals = vue.computed(() => {
    return days.value.map(day => createIntervalList(
      day,
      parsedIntervalStart.value,
      parsedIntervalMinutes.value,
      parsedIntervalCount.value,
      times.now
    ))
  });

  function startOfWeek (timestamp) {
    return getStartOfWeek(timestamp, props.weekdays, times.today)
  }

  function endOfWeek (timestamp) {
    return getEndOfWeek(timestamp, props.weekdays, times.today)
  }

  /**
   * Returns true if Timestamp is within passed Array of Timestamps
   * @param {Array.<Timestamp>} arr
   * @param {Timestamp} timestamp
   */
  function arrayHasDateTime (arr, timestamp) {
    return arr && arr.length > 0 && arr.includes(getDateTime(timestamp))
  }

  /**
   * Takes an array of 2 Timestamps and validates the passed Timestamp (second param)
   * @param {Array.<Timestamp>} arr
   * @param {Timestamp} timestamp
   * @returns {Object.<{firstDay: Boolean, betweenDays: Boolean, lastDay: Boolean}>}
   */
  function checkIntervals (arr, timestamp) {
    const days = {
      firstDay: false,
      betweenDays: false,
      lastDay: false
    };

    // array must have two dates ('YYYY-MM-DD HH:MM') in it
    if (arr && arr.length === 2) {
      const current = getDayTimeIdentifier(timestamp);
      const first = getDayTimeIdentifier(parsed(arr[ 0 ]));
      const last = getDayTimeIdentifier(parsed(arr[ 1 ]));
      days.firstDay = first === current;
      days.lastDay = last === current;
      days.betweenDays = first < current && last > current;
    }
    return days
  }

  function getIntervalClasses (interval, selectedDays = [], startEndDays = []) {
    const isSelected = arrayHasDateTime(selectedDays, interval);
    const { firstDay, lastDay, betweenDays } = checkIntervals(startEndDays, interval);

    return {
      'q-selected': isSelected,
      'q-range-first': firstDay === true,
      'q-range': betweenDays === true,
      'q-range-last': lastDay === true,
      'q-disabled-interval disabled': interval.disabled === true
    }
  }

  function getResourceClasses (interval, selectedDays = [], startEndDays = []) {
    return []
  }

  /**
   * Returns a function that uses the locale property
   * The function takes a timestamp and a boolean (to indicate short format)
   * and returns a formatted hour value from the browser
   */
  const intervalFormatter = vue.computed(() => {
    const longOptions = { timeZone: 'UTC', hour12: !props.hour24Format, hour: '2-digit', minute: '2-digit' };
    const shortOptions = { timeZone: 'UTC', hour12: !props.hour24Format, hour: 'numeric', minute: '2-digit' };
    const shortHourOptions = { timeZone: 'UTC', hour12: !props.hour24Format, hour: 'numeric' };

    return createNativeLocaleFormatter(
      props.locale,
      (tms, short) => (short ? (tms.minute === 0 ? shortHourOptions : shortOptions) : longOptions)
    )
  });

  /**
   * Returns a function that uses the locale property
   * The function takes a timestamp and a boolean (to indicate short format)
   * and returns a fully formatted timestamp string from the browser
   * that can be read with screen readers.
   * Note: This value also contains the time.
   */
  const ariaDateTimeFormatter = vue.computed(() => {
    const longOptions = { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'short' };

    return createNativeLocaleFormatter(
      props.locale,
      (_tms) => longOptions
    )
  });

  function showIntervalLabelDefault (interval) {
    const first = intervals.value[ 0 ][ 0 ];
    const isFirst = first.hour === interval.hour && first.minute === interval.minute;
    return !isFirst && interval.minute === 0
  }

  function showResourceLabelDefault (resource) {
  }

  function styleDefault (interval) {
    return undefined
  }

  /**
   * Returns a Timestamp based on mouse click position on the calendar
   * Also handles touch events
   * This function is used for vertical intervals
   * @param {MouseEvent} e Browser MouseEvent
   * @param {Timestamp} day Timestamp associated with event
   * @param {Boolean} clamp Whether to clamp values to nearest interval
   * @param {Timestamp*} now Optional Timestamp for now date/time
   */
  function getTimestampAtEventInterval (e, day, clamp = false, now = undefined) {
    let timestamp = copyTimestamp(day);
    const bounds = (e.currentTarget).getBoundingClientRect();
    const touchEvent = e;
    const mouseEvent = e;
    const touches = touchEvent.changedTouches || touchEvent.touches;
    const clientY = touches && touches[ 0 ] ? touches[ 0 ].clientY : mouseEvent.clientY;
    const addIntervals = (clientY - bounds.top) / parsedIntervalHeight.value;
    const addMinutes = Math.floor((clamp ? Math.floor(addIntervals) : addIntervals) * parsedIntervalMinutes.value);

    if (addMinutes !== 0) {
      timestamp = addToDate(timestamp, { minute: addMinutes });
    }

    if (now) {
      updateRelative(timestamp, now, true);
    }

    return timestamp
  }

  /**
   * Returns a Timestamp based on mouse click position on the calendar
   * Also handles touch events
   * This function is used for vertical intervals
   * @param {MouseEvent} e Browser MouseEvent
   * @param {Timestamp} day Timestamp associated with event
   * @param {Boolean} clamp Whether to clamp values to nearest interval
   * @param {Timestamp*} now Optional Timestamp for now date/time
   */
  function getTimestampAtEvent (e, day, clamp = false, now = undefined) {
    let timestamp = copyTimestamp(day);
    const bounds = (e.currentTarget).getBoundingClientRect();
    const touchEvent = e;
    const mouseEvent = e;
    const touches = touchEvent.changedTouches || touchEvent.touches;
    const clientY = touches && touches[ 0 ] ? touches[ 0 ].clientY : mouseEvent.clientY;
    const addIntervals = (clientY - bounds.top) / parsedIntervalHeight.value;
    const addMinutes = Math.floor((clamp ? Math.floor(addIntervals) : addIntervals) * parsedIntervalMinutes.value);

    if (addMinutes !== 0) {
      timestamp = addToDate(timestamp, { minute: addMinutes });
    }

    if (now) {
      updateRelative(timestamp, now, true);
    }

    return timestamp
  }

  /**
   * Returns a Timestamp based on mouse click position on the calendar
   * Also handles touch events
   * This function is used for horizontal intervals
   * @param {MouseEvent} e Browser MouseEvent
   * @param {Timestamp} day Timestamp associated with event
   * @param {Boolean} clamp Whether to clamp values to nearest interval
   * @param {Timestamp*} now Optional Timestamp for now date/time
   */
  function getTimestampAtEventX (e, day, clamp = false, now = undefined) {
    let timestamp = copyTimestamp(day);
    const bounds = (e.currentTarget).getBoundingClientRect();
    const touchEvent = e;
    const mouseEvent = e;
    const touches = touchEvent.changedTouches || touchEvent.touches;
    const clientX = touches && touches[ 0 ] ? touches[ 0 ].clientX : mouseEvent.clientX;
    const addIntervals = (clientX - bounds.left) / parsedCellWidth.value;
    const addMinutes = Math.floor((clamp ? Math.floor(addIntervals) : addIntervals) * parsedIntervalMinutes.value);

    if (addMinutes !== 0) {
      timestamp = addToDate(timestamp, { minute: addMinutes });
    }

    if (now) {
      updateRelative(timestamp, now, true);
    }

    return timestamp
  }

  /**
   * Returns the scope for the associated Timestamp
   * This function is used for vertical intervals
   * @param {Timestamp} timestamp
   * @param {Number} columnIndex
   */
  function getScopeForSlot (timestamp, columnIndex) {
    const scope = { timestamp };
    scope.timeStartPos = timeStartPos;
    scope.timeDurationHeight = timeDurationHeight;
    if (columnIndex !== undefined) {
      scope.columnIndex = columnIndex;
    }
    return scope
  }

  /**
   * Returns the scope for the associated Timestamp
   * This function is used for horizontal intervals
   * @param {Timestamp} timestamp
   * @param {Number*} index
   */
  function getScopeForSlotX (timestamp, index) {
    const scope = { timestamp: copyTimestamp(timestamp) };
    scope.timeStartPosX = timeStartPosX;
    scope.timeDurationWidth = timeDurationWidth;
    if (index !== undefined) {
      scope.index = index;
    }
    return scope
  }

  /**
   * Forces the browser to scroll to the specified time
   * This function is used for vertical intervals
   * @param {String} time in format HH:MM
   * @param {Number*} duration in milliseconds
   */
  function scrollToTime (time, duration = 0) {
    const y = timeStartPos(time);

    if (y === false || !scrollArea.value) {
      return false
    }

    animVerticalScrollTo (scrollArea.value, y, duration);

    return true
  }

  /**
   * Forces the browser to scroll to the specified time
   * This function is used for horizontal intervals
   * @param {String} time in format HH:MM
   * @param {Number*} duration in milliseconds
   */
  function scrollToTimeX (time, duration = 0) {
    const x = timeStartPosX(time);

    if (x === false || !scrollArea.value) {
      return false
    }

    animHorizontalScrollTo (scrollArea.value, x, duration);

    return true
  }

  function timeDurationHeight (minutes) {
    return minutes / parsedIntervalMinutes.value * parsedIntervalHeight.value
  }

  function timeDurationWidth (minutes) {
    return minutes / parsedIntervalMinutes.value * parsedCellWidth.value
  }

  function heightToMinutes (height) {
    return parseInt(height, 10) * parsedIntervalMinutes.value / parsedIntervalHeight.value
  }

  function widthToMinutes (width) {
    return parseInt(width, 10) * parsedIntervalMinutes.value / parsedCellWidth.value
  }

  function timeStartPos (time, clamp = true) {
    const minutes = parseTime(time);
    if (minutes === false) return false

    const min = parsedStartMinute.value;
    const gap = parsedIntervalCount.value * parsedIntervalMinutes.value;
    const delta = (minutes - min) / gap;
    let y = delta * bodyHeight.value;

    if (clamp) {
      if (y < 0) {
        y = 0;
      }
      if (y > bodyHeight.value) {
        y = bodyHeight.value;
      }
    }

    return y
  }

  function timeStartPosX (time, clamp = true) {
    const minutes = parseTime(time);
    if (minutes === false) return false

    const min = parsedStartMinute.value;
    const gap = parsedIntervalCount.value * parsedIntervalMinutes.value;
    const delta = (minutes - min) / gap;
    let x = delta * bodyWidth.value;

    if (clamp) {
      if (x < 0) {
        x = 0;
      }
      if (x > bodyWidth.value) {
        x = bodyWidth.value;
      }
    }

    return x
  }

  return {
    parsedIntervalStart,
    parsedIntervalMinutes,
    parsedIntervalCount,
    parsedIntervalHeight,
    parsedCellWidth,
    parsedStartMinute,
    bodyHeight,
    bodyWidth,
    parsedWeekStart,
    parsedWeekEnd,
    days,
    intervals,
    intervalFormatter,
    ariaDateTimeFormatter,
    arrayHasDateTime,
    checkIntervals,
    getIntervalClasses,
    getResourceClasses,
    showIntervalLabelDefault,
    showResourceLabelDefault,
    styleDefault,
    getTimestampAtEventInterval,
    getTimestampAtEvent,
    getTimestampAtEventX,
    getScopeForSlot,
    getScopeForSlotX,
    scrollToTime,
    scrollToTimeX,
    timeDurationHeight,
    timeDurationWidth,
    heightToMinutes,
    widthToMinutes,
    timeStartPos,
    timeStartPosX
  }
}

// column composables

const useColumnProps = {
  columnCount: {
    type: [ Number, String ],
    default: 0,
    validator: validateNumber
  },
  columnIndexStart: {
    type: [ Number, String ],
    default: 0,
    validator: validateNumber
  }
};

// MaxDays composables

/**
 * export of useMaxDaysProps
 * @returns 'maxDays' property
 */
const useMaxDaysProps = {
  maxDays: {
    type: Number,
    default: 1
  }
};

/**
 * export of useTimesProps
 * @returns 'now' property
 */
const useTimesProps = {
  now: {
    type: String,
    validator: v => v === '' || validateTimestamp(v),
    default: ''
  }
};

/**
 * export of default funtion
 * @param {Object} props object passed to 'setup' function
 */
function useTimes (props) {
  /**
   * 'times' is a reactive object containing 'now' and 'today'
   */
  const times = vue.reactive({
    now: parseTimestamp('0000-00-00 00:00'),
    today: parseTimestamp('0000-00-00')
  });

  /**
   * parsedNow is a computed property based on 'props.now' or current date
   */
  const parsedNow = vue.computed(() => (props.now ? parseTimestamp(props.now) : getNow()));

  /**
   * watcher if parsedNow should change
   */
  vue.watch(() => parsedNow, val => updateCurrent());

  /**
   * sets 'times.now' (relative) to 'times.today' (relative)
   */
  function setCurrent () {
    times.now.current = times.today.current = true;
    times.now.past = times.today.past = false;
    times.now.future = times.today.future = false;
  }

  /**
   * updates current dates
   */
  function updateCurrent () {
    const now = parsedNow.value || getNow();
    updateDay(now, times.now);
    updateTime(now, times.now);
    updateDay(now, times.today);
  }

  /**
   * return 'Timestamp' with current date and time
   */
  function getNow () {
    return parseDate(new Date())
  }

  /**
   * Updates target timestamp date info with now timestamp date info
   * @param {Timestamp} now
   * @param {Timestamp} target
   */
  function updateDay (now, target) {
    if (now.date !== target.date) {
      target.year = now.year;
      target.month = now.month;
      target.day = now.day;
      target.weekday = now.weekday;
      target.date = now.date;
    }
  }

  /**
   * Updates target timestamp times with now timestamp times
   * @param {Timestamp} now
   * @param {Timestamp} target
   */
  function updateTime (now, target) {
    if (now.time !== target.time) {
      target.hour = now.hour;
      target.minute = now.minute;
      target.time = now.time;
    }
  }

  return {
    times,
    parsedNow,
    setCurrent,
    updateCurrent,
    getNow,
    updateDay,
    updateTime
  }
}

function useRenderValues (props, {
  parsedView,
  parsedValue,
  times
}) {
  const renderValues = vue.computed(() => {
    const around = parsedValue.value;
    let maxDays = props.maxDays;
    let start = around;
    let end = around;
    switch (parsedView.value) {
      case 'month':
        start = getStartOfMonth(around);
        end = getEndOfMonth(around);
        maxDays = daysInMonth(start.year, start.month);
        break
      case 'week':
      case 'week-agenda':
      case 'week-scheduler':
        start = getStartOfWeek(around, props.weekdays, times.today);
        end = getEndOfWeek(start, props.weekdays, times.today);
        maxDays = props.weekdays.length;
        break
      case 'day':
      case 'scheduler':
      case 'agenda':
        end = moveRelativeDays(copyTimestamp(end), nextDay, maxDays > 1 ? maxDays - 1 : maxDays, props.weekdays);
        updateFormatted(end);
        break
      case 'month-interval':
      case 'month-scheduler':
      case 'month-agenda':
        start = getStartOfMonth(around);
        end = getEndOfMonth(around);
        updateFormatted(end);
        maxDays = daysInMonth(start.year, start.month);
        break
      case 'resource':
        maxDays = 1;
        end = moveRelativeDays(copyTimestamp(end), nextDay, maxDays, props.weekdays);
        updateFormatted(end);
        break
    }
    return { start, end, maxDays }
  });

  return {
    renderValues
  }
}

const toCamelCase = str => str.replace(/(-\w)/g, m => m[ 1 ].toUpperCase());
let $listeners, $emit;

/**
 * Used by render function to set up specialized mouse events
 * The mouse event will not be set if there is no listener for it to key callbacks to a minimum
 * @param {Object} events undecorated events (ie: 'click-day' will be transformed to 'onClickDay')
 * @param {Function} getEvent callback for event
 * @returns {Object} contents of decorated mouse events
 */
function getMouseEventHandlers (events, getEvent) {
  const on = {};
  for (const eventName in events) {
    const eventOptions = events[ eventName ];

    // convert eventName to vue camelCase (decorated)
    const eventKey = toCamelCase('on-' + eventName);

    // make sure listeners has been set up properly
    if ($listeners === undefined) {
      // someone forgot to call the default function export
      console.warn('$listeners has not been set up');
      return
    }

    // if there is no listener for this, then don't process it
    if ($listeners.value[ eventKey ] === undefined) continue

    // https://vuejs.org/v2/guide/render-function.html#Event-amp-Key-Modifiers
    // const prefix = eventOptions.passive ? '&' : ((eventOptions.once ? '~' : '') + (eventOptions.capture ? '!' : ''))
    // const key = prefix + eventOptions.event

    // prefix 'on' and capitalize first character
    const key = 'on' + eventOptions.event.charAt(0).toUpperCase() + eventOptions.event.slice(1);

    const handler = (event) => {
      const mouseEvent = event;
      if (eventOptions.button === undefined || (mouseEvent.buttons > 0 && mouseEvent.button === eventOptions.button)) {
        if (eventOptions.prevent) {
          mouseEvent.preventDefault();
        }
        if (eventOptions.stop) {
          mouseEvent.stopPropagation();
        }
        $emit(eventName, getEvent(mouseEvent, eventName));
      }

      return eventOptions.result
    };

    if (key in on) {
      if (Array.isArray(on[ key ])) {
        (on[ key ]).push(handler);
      }
      else {
        on[ key ] = [ on[ key ], handler ];
      }
    }
    else {
      on[ key ] = handler;
    }
  }

  return on
}

/**
 *
 * @param {String} suffix
 * @param {Function} getEvent The callback
 * @returns {Object} contains decorated mouse events based on listeners of that event and for each a callback
 */
function getDefaultMouseEventHandlers (suffix, getEvent) {
  return getMouseEventHandlers(getMouseEventName(suffix), getEvent)
}

/**
 *
 * @param {String} suffix
 * @returns {Object}
 */
function getMouseEventName (suffix) {
  return {
    [ 'click' + suffix ]: { event: 'click' },
    [ 'contextmenu' + suffix ]: { event: 'contextmenu', prevent: true, result: false },
    [ 'mousedown' + suffix ]: { event: 'mousedown' },
    [ 'mousemove' + suffix ]: { event: 'mousemove' },
    [ 'mouseup' + suffix ]: { event: 'mouseup' },
    [ 'mouseenter' + suffix ]: { event: 'mouseenter' },
    [ 'mouseleave' + suffix ]: { event: 'mouseleave' },
    [ 'touchstart' + suffix ]: { event: 'touchstart' },
    [ 'touchmove' + suffix ]: { event: 'touchmove' },
    [ 'touchend' + suffix ]: { event: 'touchend' }
  }
}

/**
 *
 * @param {String} suffix
 * @returns {Array} the array or raw listeners (ie: 'click-day' as opposed to 'onClickDay')
 */
function getRawMouseEvents (suffix) {
  return Object.keys(getMouseEventName(suffix))
}

/**
 * export of default funtion
 * @param {VTTCue.emit} emit
 * @param {Array} listeners on the instance
 */
function useMouse (emit, listeners) {
  $emit = emit;
  $listeners = listeners;
  return {
    getMouseEventHandlers,
    getDefaultMouseEventHandlers,
    getMouseEventName,
    getRawMouseEvents
  }
}

const useMoveEmits = [
  'moved'
];

/**
 * export of default funtion
 * @param {Object} props object passed to 'setup' function
 */

/**
 * export of default funtion
 * @param {Object} props object passed to 'setup' function
 * @param {Object} param object containing various needed values and functions
 * @param {String} param.parsedView the computed calendar view
 * @param {import('vue').Ref} param.parsedValue computed value (YYYY-YY-MM)
 * @param {Array} param.weekdaySkips an array of 1's and 0's representing if a day is on/off
 * @param {import('vue').Ref} param.direction the direction for animation
 * @param {Number} param.maxDays comes from props.maxDays, not applicable for week or month views
 * @param {import('vue').ReactiveEffect} param.times reactive object (contains `today` and `now` - both Timestamp objects)
 * @param {import('vue').Ref} param.emittedValue reactive sting that is emitted when changed (YYYY-MM-DD)
 * @param {Function} param.emit Vue emit function
 */
function useMove (props, {
  parsedView,
  parsedValue,
  weekdaySkips,
  direction,
  maxDays,
  times,
  emittedValue,
  emit
}) {
  /**
   * Moves the calendar the desired amount. This is based on the 'view'.
   * A month calendar moves by prev/next month
   * A week calendar moves by prev/next week
   * Other considerations are the 'weekdaySkips'; if a day of the week shoud be displayed (ie: weekends turned off)
   * @param {Number} amount The amount to move (default 1)
   * @fires 'moved' with current Timestamp
   */
  function move (amount = 1) {
    if (amount === 0) {
      emittedValue.value = today();
      return
    }
    let moved = copyTimestamp(parsedValue.value);
    const forward = amount > 0;
    const mover = forward ? nextDay : prevDay;
    const limit = forward ? DAYS_IN_MONTH_MAX : DAY_MIN;
    let count = forward ? amount : -amount;
    direction.value = forward ? 'next' : 'prev';
    const dayCount = weekdaySkips.value.filter(x => x !== 0).length;

    while (--count >= 0) {
      switch (parsedView.value) {
        case 'month':
          moved.day = limit;
          mover(moved);
          updateWeekday(moved);
          while (weekdaySkips.value[ moved.weekday ] === 0) {
            moved = addToDate(moved, { day: forward === true ? 1 : -1 });
          }
          break
        case 'week':
        case 'week-agenda':
        case 'week-scheduler':
          relativeDays(moved, mover, dayCount, props.weekdays);
          break
        case 'day':
        case 'scheduler':
        case 'agenda':
          relativeDays(moved, mover, maxDays.value, props.weekdays);
          break
        case 'month-interval':
        case 'month-agenda':
        case 'month-scheduler':
          moved.day = limit;
          mover(moved);
          break
        case 'resource':
          relativeDays(moved, mover, maxDays.value, props.weekdays);
          break
      }
    }

    updateWeekday(moved);
    updateFormatted(moved);
    updateDayOfYear(moved);
    updateRelative(moved, times.now);

    emittedValue.value = moved.date;
    emit('moved', moved);
  }

  return {
    move
  }
}

const listenerRE = /^on[A-Z]/;

/**
 * export of default funtion
 * @param {Vue.getCurrentInstance} [vm]
 * @returns {Object} computed listeners on the instance
 */
function useEmitListeners (vm = vue.getCurrentInstance()) {
  return {
    emitListeners: vue.computed(() => {
      const acc = {};

      if (vm.vnode !== void 0 && vm.vnode !== null && vm.vnode.props !== null) {
        Object.keys(vm.vnode.props).forEach(key => {
          if (listenerRE.test(key) === true) {
            acc[ key ] = true;
          }
        });
      }

      return acc
    })
  }
}

function useFocusHelper () {
  return [
    vue.h('span', {
      ariaHidden: 'true',
      class: 'q-calendar__focus-helper'
    })
  ]
}

function useButton (props, data, slotData) {
  const isFocusable = props.focusable === true && props.focusType.includes('date') === true;
  data.tabindex = isFocusable === true ? 0 : -1;
  return vue.h('button', data, [
    slotData,
    isFocusable === true && useFocusHelper()
  ])
}

// cellWidth composables

/**
 * export of useStickyProps
 * @returns 'cellWidth' property
 */

const useCellWidthProps = {
  cellWidth: [ Number, String ],
};

function useCellWidth (props) {
  const isSticky = vue.computed(() => props.cellWidth !== undefined);

  return {
    isSticky
  }
}

const useCheckChangeEmits = [
  'change'
];

function useCheckChange (emit, {
  days,
  lastStart,
  lastEnd
}) {
  function checkChange () {
    if (days.value && days.value.length > 0) {
      const start = days.value[ 0 ].date;
      const end = days.value[ days.value.length - 1 ].date;
      if (lastStart.value === null
        || lastEnd.value === null
        || start !== lastStart.value
        || end !== lastEnd.value
      ) {
        lastStart.value = start;
        lastEnd.value = end;
        emit('change', { start, end, days: days.value });
        return true
      }
    }
    return false
  }

  return {
    checkChange
  }
}

function useEvents () {
  function createEvent (name, { bubbles = false, cancelable = false } = {}) {
    try {
      return new CustomEvent(name, { bubbles, cancelable })
    }
    catch (e) {
      // IE doesn't support `new Event()`, so...
      const evt = document.createEvent('Event');
      evt.initEvent(name, bubbles, cancelable);
      return evt
    }
  }

  function isKeyCode (evt, keyCodes) {
    return [].concat(keyCodes).includes(evt.keyCode)
  }

  return {
    createEvent,
    isKeyCode
  }
}

const { isKeyCode } = useEvents();

const useNavigationProps = {
  useNavigation: Boolean
};

function useKeyboard (props, {
  rootRef,
  focusRef,
  focusValue,
  datesRef,
  days,
  parsedView,
  parsedValue,
  emittedValue,
  weekdaySkips,
  direction,
  times
}) {
  // pgUp -> 33, pgDown -> 34, end -> 35, home -> 36
  // left -> 37, up -> 38, right -> 39, down -> 40
  // space -> 32, enter -> 13

  let initialized = false;

  vue.onBeforeUnmount(() => {
    endNavigation();
  });

  vue.watch(() => props.useNavigation, val => {
    if (val === true) {
      startNavigation();
    }
    else {
      endNavigation();
    }
  });

  // check at start up what should be happening
  if (props.useNavigation === true) {
    startNavigation();
  }

  // start keyup/keydown listeners
  function startNavigation () {
    if (initialized === true) return
    if (document) {
      initialized = true;
      document.addEventListener('keyup', onKeyUp);
      document.addEventListener('keydown', onKeyDown);
    }
  }

  // end keyup/keydown listeners
  function endNavigation () {
    if (document) {
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('keydown', onKeyDown);
      initialized = false;
    }
  }

  function canNavigate (e) {
    if (e === void 0) {
      return false
    }

    // if (e.defaultPrevented === true) {
    //   return false
    // }

    if (document) {
      const el = document.activeElement;
      if (el !== document.body
        && rootRef.value.contains(el) === true
        // required for iOS and desktop Safari
        // && el.contains(rootRef.value) === false
      ) {
        return true
      }
    }

    return false
  }

  // attempts to set focus on the focusRef date
  // this function is called when the dates change,
  // so retry until we get it (or count expires)
  function tryFocus () {
    let count = 0;
    const interval = setInterval(() => {
      if (datesRef.value[ focusRef.value ]) {
        datesRef.value[ focusRef.value ].focus();
        if (++count === 50 || document.activeElement === datesRef.value[ focusRef.value ]) {
          clearInterval(interval);
        }
      }
      else {
        clearInterval(interval);
      }
    }, 250);
  }

  function onKeyDown (e) {
    if (canNavigate(e) && isKeyCode(e, [ 33, 34, 35, 36, 37, 38, 39, 40 ])) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  function onKeyUp (e) {
    if (canNavigate(e) && isKeyCode(e, [ 33, 34, 35, 36, 37, 38, 39, 40 ])) {
      switch (e.keyCode) {
        case 33:
          onPgUp();
          break
        case 34:
          onPgDown();
          break
        case 35:
          onEnd();
          break
        case 36:
          onHome();
          break
        case 37:
          onLeftArrow();
          break
        case 38:
          onUpArrow();
          break
        case 39:
          onRightArrow();
          break
        case 40:
          onDownArrow();
          break
      }
    }
  }

  function onUpArrow (e) {
    let tm = copyTimestamp(focusValue.value);
    // console.log(tm)

    if (parsedView.value === 'month') {
      tm = addToDate(tm, { day: -7 });
      if (focusValue.value.month !== tm.month) {
        direction.value = 'prev';
        emittedValue.value = tm.date;
        return
      }
    }
    else if (parsedView.value === 'day'
      || parsedView.value === 'week'
      || parsedView.value === 'month-interval') {
      tm = addToDate(tm, { minute: parseInt(props.intervalMinutes) });
    }

    direction.value = 'prev';
    // emittedValue.value = tm.date
    focusRef.value = tm.date;
  }

  function onDownArrow (e) {
    let tm = copyTimestamp(focusValue.value);
    // console.log(tm)

    if (parsedView.value === 'month') {
      tm = addToDate(tm, { day: 7 });
      if (focusValue.value.month !== tm.month) {
        direction.value = 'next';
        emittedValue.value = tm.date;
        return
      }
    }
    else if (parsedView.value === 'day'
      || parsedView.value === 'week'
      || parsedView.value === 'month-interval') {
      tm = addToDate(tm, { minute: parseInt(props.intervalMinutes) });
    }

    direction.value = 'next';
    // emittedValue.value = tm.date
    focusRef.value = tm.date;
  }

  /**
   * Sets focus on previous day/week/month. Takes into account weekdaySkips. Applies to all calendars.
   * @param {KeyboardEvent} e The keyboard event
   */
  function onLeftArrow (e) {
    let tm = copyTimestamp(focusValue.value);
    direction.value = 'prev';

    do {
      tm = addToDate(tm, { day: -1 });
    } while (weekdaySkips.value[ tm.weekday ] === 0)

    if (parsedView.value === 'month'
      || parsedView.value === 'month-interval') {
      if (focusValue.value.month !== tm.month) {
        emittedValue.value = tm.date;
        return
      }
    }
    else if (parsedView.value === 'week') {
      if (tm.weekday > focusValue.value.weekday) {
        emittedValue.value = tm.date;
        return
      }
    }
    else if (parsedView.value === 'day') {
      emittedValue.value = tm.date;
      return
    }

    focusRef.value = tm.date;
  }

  /**
   * Sets focus on next day/week/month. Takes into account weekdaySkips. Applies to all calendars.
   * @param {KeyboardEvent} e The keyboard event
   */
  function onRightArrow (e) {
    let tm = copyTimestamp(focusValue.value);
    direction.value = 'next';

    do {
      tm = addToDate(tm, { day: 1 });
    } while (weekdaySkips.value[ tm.weekday ] === 0)

    if (parsedView.value === 'month'
      || parsedView.value === 'month-interval') {
      if (focusValue.value.month !== tm.month) {
        emittedValue.value = tm.date;
        return
      }
    }
    else if (parsedView.value === 'week') {
      if (tm.weekday < focusValue.value.weekday) {
        emittedValue.value = tm.date;
        return
      }
    }
    else if (parsedView.value === 'day') {
      emittedValue.value = tm.date;
      return
    }

    focusRef.value = tm.date;
  }

  function onPgUp (e) {
    let tm = copyTimestamp(focusValue.value);

    if (parsedView.value === 'month'
      || parsedView.value === 'month-interval') {
      tm = addToDate(tm, { month: -1 });
      const next = tm.day <= 15 ? 1 : -1;
      while (weekdaySkips.value[ tm.weekday ] === 0) {
        tm = addToDate(tm, { day: next });
      }
    }
    else if (parsedView.value === 'day') {
      tm = addToDate(tm, { day: -1 });
    }
    else if (parsedView.value === 'week') {
      tm = addToDate(tm, { day: -7 });
    }

    direction.value = 'prev';
    // emittedValue.value = tm.date
    focusRef.value = tm.date;
  }

  function onPgDown (e) {
    let tm = copyTimestamp(focusValue.value);

    if (parsedView.value === 'month'
      || parsedView.value === 'month-interval') {
      tm = addToDate(tm, { month: 1 });
      const next = tm.day <= 15 ? 1 : -1;
      while (weekdaySkips.value[ tm.weekday ] === 0) {
        tm = addToDate(tm, { day: next });
      }
    }
    else if (parsedView.value === 'day') {
      tm = addToDate(tm, { day: 1 });
    }
    else if (parsedView.value === 'week') {
      tm = addToDate(tm, { day: 7 });
    }

    direction.value = 'next';
    // emittedValue.value = tm.date
    focusRef.value = tm.date;
  }

  function onHome (e) {
    let tm = copyTimestamp(focusValue.value);

    if (parsedView.value === 'month'
      || parsedView.value === 'month-interval') {
      tm = getStartOfMonth(tm);
    }
    else if (parsedView.value === 'week') {
      tm = getStartOfWeek(tm, props.weekdays, times.today);
    }

    while (weekdaySkips.value[ tm.weekday ] === 0) {
      tm = addToDate(tm, { day: -1 });
    }

    // emittedValue.value = tm.date
    focusRef.value = tm.date;
  }

  function onEnd (e) {
    let tm = copyTimestamp(focusValue.value);

    if (parsedView.value === 'month'
    || parsedView.value === 'month-interval') {
      tm = getEndOfMonth(tm);
    }
    else if (parsedView.value === 'week') {
      tm = getEndOfWeek(tm, props.weekdays, times.today);
    }

    while (weekdaySkips.value[ tm.weekday ] === 0) {
      tm = addToDate(tm, { day: -1 });
    }

    // emittedValue.value = tm.date
    focusRef.value = tm.date;
  }

  return {
    startNavigation,
    endNavigation,
    tryFocus
  }
}

// Vue

var QCalendarAgenda = vue.defineComponent({
  name: 'QCalendarAgenda',

  directives: [ResizeObserver$1],

  props: {
    ...useCommonProps,
    ...useAgendaProps,
    ...useColumnProps,
    ...useMaxDaysProps,
    ...useTimesProps,
    ...useCellWidthProps,
    ...useNavigationProps
  },

  emits: [
    'update:model-value',
    ...useCheckChangeEmits,
    ...useMoveEmits,
    ...getRawMouseEvents('-date'),
    ...getRawMouseEvents('-head-day'),
    ...getRawMouseEvents('-time')
  ],

  setup (props, { slots, emit, expose }) {
    const
      scrollArea = vue.ref(null),
      pane = vue.ref(null),
      headerColumnRef = vue.ref(null),
      focusRef = vue.ref(null),
      focusValue = vue.ref(null),
      datesRef = vue.ref({}),
      headDayEventsParentRef = vue.ref({}),
      headDayEventsChildRef = vue.ref({}),
      direction = vue.ref('next'),
      startDate = vue.ref(today()),
      endDate = vue.ref('0000-00-00'),
      maxDaysRendered = vue.ref(0),
      emittedValue = vue.ref(props.modelValue),
      size = vue.reactive({ width: 0, height: 0 }),
      dragOverHeadDayRef = vue.ref(false),
      // keep track of last seen start and end dates
      lastStart = vue.ref(null),
      lastEnd = vue.ref(null);

    vue.watch(() => props.view, () => {
      // reset maxDaysRendered
      maxDaysRendered.value = 0;
    });

    const parsedView = vue.computed(() => {
      if (props.view === 'month') {
        return 'month-interval'
      }
      return props.view
    });

    const vm = vue.getCurrentInstance();
    if (vm === null) {
      throw new Error('current instance is null')
    }

    const { emitListeners } = useEmitListeners(vm);

    const {
      isSticky
    } = useCellWidth(props);

    vue.watch(isSticky, (val) => {
      // console.log('isSticky', isSticky.value)
    });

    const {
      times,
      setCurrent,
      updateCurrent
    } = useTimes(props);

    // update dates
    updateCurrent();
    setCurrent();

    const {
      // computed
      weekdaySkips,
      parsedStart,
      parsedEnd,
      dayFormatter,
      weekdayFormatter,
      ariaDateFormatter,
      // methods
      dayStyleDefault,
      getRelativeClasses
    } = useCommon(props, { startDate, endDate, times });

    const parsedValue = vue.computed(() => {
      return parseTimestamp(props.modelValue, times.now)
        || parsedStart.value
        || times.today
    });

    focusValue.value = parsedValue.value;
    focusRef.value = parsedValue.value.date;

    const { renderValues } = useRenderValues(props, {
      parsedView,
      parsedValue,
      times
    });

    const {
      rootRef,
      scrollWidth,
      __initCalendar,
      __renderCalendar
    } = useCalendar(props, __renderAgenda, {
      scrollArea,
      pane
    });

    const {
      // computed
      days,
      // ariaDateTimeFormatter,
      parsedCellWidth,
      // methods
      // styleDefault,
      getScopeForSlot,
    } = useInterval(props, {
      weekdaySkips,
      times,
      scrollArea,
      parsedStart,
      parsedEnd,
      maxDays: maxDaysRendered,
      size,
      headerColumnRef
    });

    const { move } = useMove(props, {
      parsedView,
      parsedValue,
      weekdaySkips,
      direction,
      maxDays: maxDaysRendered,
      times,
      emittedValue,
      emit
    });

    const {
      getDefaultMouseEventHandlers
    } = useMouse(emit, emitListeners);

    const {
      checkChange
    } = useCheckChange(emit, { days, lastStart, lastEnd });

    const {
      isKeyCode
    } = useEvents();

    const { tryFocus } = useKeyboard(props, {
      rootRef,
      focusRef,
      focusValue,
      datesRef,
      days,
      parsedView,
      parsedValue,
      emittedValue,
      weekdaySkips,
      direction,
      times
    });

    const parsedColumnCount = vue.computed(() => {
      return days.value.length
        + (isLeftColumnOptionsValid.value === true ? props.leftColumnOptions.length : 0)
        + (isRightColumnOptionsValid.value === true ? props.rightColumnOptions.length : 0)
        + days.value.length === 1 && parseInt(props.columnCount, 10) > 0 ? parseInt(props.columnCount, 10) : 0
    });

    const isLeftColumnOptionsValid = vue.computed(() => {
      return props.leftColumnOptions !== undefined && Array.isArray(props.leftColumnOptions)
    });

    const isRightColumnOptionsValid = vue.computed(() => {
      return props.rightColumnOptions !== undefined && Array.isArray(props.rightColumnOptions)
    });

    const computedWidth = vue.computed(() => {
      if (rootRef.value) {
        const width = size.width || rootRef.value.getBoundingClientRect().width;
        if (width && parsedColumnCount.value) {
          return (
            (width - scrollWidth.value) / parsedColumnCount.value
          ) + 'px'
        }
      }
      return (100 / parsedColumnCount.value) + '%'
    });

    vue.watch([days], checkChange, { deep: true, immediate: true });

    vue.watch(() => props.modelValue, (val, oldVal) => {
      if (emittedValue.value !== val) {
        if (props.animated === true) {
          const v1 = getDayIdentifier(parsed(val));
          const v2 = getDayIdentifier(parsed(oldVal));
          direction.value = v1 >= v2 ? 'next' : 'prev';
        }
        emittedValue.value = val;
      }
      focusRef.value = val;
    });

    vue.watch(emittedValue, (val, oldVal) => {
      if (emittedValue.value !== props.modelValue) {
        if (props.animated === true) {
          const v1 = getDayIdentifier(parsed(val));
          const v2 = getDayIdentifier(parsed(oldVal));
          direction.value = v1 >= v2 ? 'next' : 'prev';
        }
        emit('update:model-value', val);
      }
    });

    vue.watch(focusRef, val => {
      if (val) {
        focusValue.value = parseTimestamp(val);
      }
    });

    vue.watch(focusValue, (val) => {
      if (datesRef.value[ focusRef.value ]) {
        datesRef.value[ focusRef.value ].focus();
      }
      else {
        // if focusRef is not in the list of current dates of dateRef,
        // then assume month is changing
        tryFocus();
      }
    });

    vue.watch(() => props.maxDays, val => {
      maxDaysRendered.value = val;
    });

    vue.onBeforeUpdate(() => {
      datesRef.value = {};
    });

    vue.onMounted(() => {
      __initCalendar();
    });

    // public functions

    function moveToToday () {
      emittedValue.value = today();
    }

    function next (amount = 1) {
      move(amount);
    }

    function prev (amount = 1) {
      move(-amount);
    }

    // private functions

    function __onResize ({ width, height }) {
      size.width = width;
      size.height = height;
    }

    function __isActiveDate (day) {
      return day.date === emittedValue.value
    }

    // Render functions

    function __renderHeadColumn (column, index) {
      const slot = slots[ 'head-column' ];
      const scope = { column, index, days: days.value };
      const width = isSticky.value === true ? props.cellWidth : computedWidth.value;
      const isFocusable = props.focusable === true && props.focusType.includes('weekday');
      const id = (props.columnOptionsId !== undefined ? column[ props.columnOptionsId ] : undefined);

      const style = {
        maxWidth: width,
        width
      };

      return vue.h('div', {
        key: id,
        tabindex: isFocusable === true ? 0 : -1,
        class: {
          'q-calendar-agenda__head--day': true,
          'q-column-day': true,
          'q-calendar__hoverable': props.hoverable === true,
          'q-calendar__focusable': isFocusable === true
        },
        style,
        onDragenter: (e) => {
          if (props.dragEnterFunc !== undefined && typeof props.dragEnterFunc === 'function') {
            props.dragEnterFunc(e, 'head-column', scope) === true
              ? dragOverHeadDayRef.value = id
              : dragOverHeadDayRef.value = '';
          }
        },
        onDragover: (e) => {
          if (props.dragOverFunc !== undefined && typeof props.dragOverFunc === 'function') {
            props.dragOverFunc(e, 'head-column', scope) === true
              ? dragOverHeadDayRef.value = id
              : dragOverHeadDayRef.value = '';
          }
        },
        onDragleave: (e) => {
          if (props.dragLeaveFunc !== undefined && typeof props.dragLeaveFunc === 'function') {
            props.dragLeaveFunc(e, 'head-column', scope) === true
              ? dragOverHeadDayRef.value = id
              : dragOverHeadDayRef.value = '';
          }
        },
        onDrop: (e) => {
          if (props.dropFunc !== undefined && typeof props.dropFunc === 'function') {
            props.dropFunc(e, 'head-column', scope) === true
              ? dragOverHeadDayRef.value = id
              : dragOverHeadDayRef.value = '';
          }
        },
        ...getDefaultMouseEventHandlers('-head-column', (event, eventName) => {
          return { scope: { column, index }, event }
        })
      }, [
        props.noDefaultHeaderText !== true && __renderHeadColumnLabel(column),
        slot && slot(scope),
        useFocusHelper()
      ])
    }

    function __renderHeadColumnLabel (column) {
      const slot = slots[ 'head-column-label' ];
      const scope = { column };
      const label = props.columnOptionsLabel !== undefined ? column[ props.columnOptionsLabel ] : column.label;

      const vNode = vue.h('div', {
        class: {
          'q-calendar-agenda__head--weekday': true,
          [ 'q-calendar__' + props.weekdayAlign ]: true,
          ellipsis: true
        },
        style: {
          alignSelf: 'center'
        }
      }, [
        slot && slot({ scope }),
        !slot && vue.h('span', {
          class: 'ellipsis'
        }, label)
      ]);

      return props.dateHeader === 'stacked'
        ? vNode
        : vue.h('div', {
          class: 'q-calendar__header--inline',
          style: {
            height: '100%'
          }
        }, [
          vNode
        ])
    }

    // ---

    function __renderHead () {
      return vue.h('div', {
        roll: 'presentation',
        class: {
          'q-calendar-agenda__head': true,
          'q-calendar__sticky': isSticky.value === true
        },
        style: {
          marginRight: scrollWidth.value + 'px'
        }
      }, [
        __renderHeadDaysColumn()
      ])
    }

    function __renderHeadDaysColumn () {
      return vue.h('div', {
        ref: headerColumnRef,
        class: {
          'q-calendar-agenda__head--days__column': true
        }
      }, [
        __renderHeadDaysRow(),
        __renderHeadDaysEventsRow()
      ])
    }

    function __renderHeadDaysRow () {
      return vue.h('div', {
        class: {
          'q-calendar-agenda__head--days__weekdays': true
        }
      }, [
        ...__renderHeadDays()
      ])
    }

    function __renderHeadDaysEventsRow () {
      const slot = slots[ 'head-days-events' ];

      vue.nextTick(() => {
        if (headDayEventsChildRef.value && props.columnCount === 0 && window) {
          try {
            const styles = window.getComputedStyle(headDayEventsChildRef.value);
            headDayEventsParentRef.value.parentElement.style.height = styles.height;
            headDayEventsParentRef.value.style.height = styles.height;
          }
          catch (e) {}
        }
      });

      return vue.h('div', {
        class: {
          'q-calendar-agenda__head--days__event': true
        }
      }, [
        slot && vue.h('div', {
          // TODO: need a class
          ref: headDayEventsParentRef,
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            overflow: 'hidden',
            zIndex: 1
          }
        }, [
          slot({ scope: { days: days.value, ref: headDayEventsChildRef } })
        ]),
        ...__renderHeadDaysEvents()
      ])
    }

    function __renderHeadDays () {
      if (days.value.length === 1 && parseInt(props.columnCount, 10) > 0) {
        return [
          isLeftColumnOptionsValid.value === true && props.leftColumnOptions.map((column, index) => __renderHeadColumn(column, index)),
          Array.apply(null, new Array(parseInt(props.columnCount, 10)))
            .map((_, i) => i + parseInt(props.columnIndexStart, 10))
            .map(columnIndex => __renderHeadDay(days.value[ 0 ], columnIndex)),
          isRightColumnOptionsValid.value === true && props.rightColumnOptions.map((column, index) => __renderHeadColumn(column, index))
        ]
      }
      else {
        return [
          isLeftColumnOptionsValid.value === true && props.leftColumnOptions.map((column, index) => __renderHeadColumn(column, index)),
          days.value.map(day => __renderHeadDay(day)),
          isRightColumnOptionsValid.value === true && props.rightColumnOptions.map((column, index) => __renderHeadColumn(column, index))
        ]
      }
    }

    function __renderHeadDaysEvents () {
      if (days.value.length === 1 && parseInt(props.columnCount, 10) > 0) {
        return [
          Array.apply(null, new Array(parseInt(props.columnCount, 10)))
            .map((_, i) => i + parseInt(props.columnIndexStart, 10))
            .map(columnIndex => __renderHeadDayEvent(days.value[ 0 ], columnIndex))
        ]
      }
      else {
        return days.value.map(day => __renderHeadDayEvent(day))
      }
    }

    function __renderHeadDay (day, columnIndex) {
      const headDaySlot = slots[ 'head-day' ];
      const headDateSlot = slots[ 'head-date' ];
      const activeDate = props.noActiveDate !== true && __isActiveDate(day);

      const scope = getScopeForSlot(day, columnIndex);
      scope.activeDate = activeDate;
      scope.droppable = dragOverHeadDayRef.value === day.date;
      scope.disabled = (props.disabledWeekdays ? props.disabledWeekdays.includes(day.weekday) : false);

      const width = isSticky.value === true ? props.cellWidth : computedWidth.value;
      const styler = props.weekdayStyle || dayStyleDefault;
      const style = {
        width,
        maxWidth: width,
        ...styler({ scope })
      };
      if (isSticky.value === true) {
        style.minWidth = width;
      }
      const weekdayClass = typeof props.weekdayClass === 'function' ? props.weekdayClass({ scope }) : {};
      const isFocusable = props.focusable === true && props.focusType.includes('weekday');

      const data = {
        key: day.date + (columnIndex !== undefined ? '-' + columnIndex : ''),
        ref: (el) => { datesRef.value[ day.date ] = el; },
        tabindex: isFocusable === true ? 0 : -1,
        class: {
          'q-calendar-agenda__head--day': true,
          ...weekdayClass,
          ...getRelativeClasses(day),
          'q-active-date': activeDate,
          'q-calendar__hoverable': props.hoverable === true,
          'q-calendar__focusable': isFocusable === true
        },
        style,
        onDragenter: (e) => {
          if (props.dragEnterFunc !== undefined && typeof props.dragEnterFunc === 'function') {
            props.dragEnterFunc(e, 'head-day', scope) === true
              ? dragOverHeadDayRef.value = day.date
              : dragOverHeadDayRef.value = '';
          }
        },
        onDragover: (e) => {
          if (props.dragOverFunc !== undefined && typeof props.dragOverFunc === 'function') {
            props.dragOverFunc(e, 'head-day', scope) === true
              ? dragOverHeadDayRef.value = day.date
              : dragOverHeadDayRef.value = '';
          }
        },
        onDragleave: (e) => {
          if (props.dragLeaveFunc !== undefined && typeof props.dragLeaveFunc === 'function') {
            props.dragLeaveFunc(e, 'head-day', scope) === true
              ? dragOverHeadDayRef.value = day.date
              : dragOverHeadDayRef.value = '';
          }
        },
        onDrop: (e) => {
          if (props.dropFunc !== undefined && typeof props.dropFunc === 'function') {
            props.dropFunc(e, 'head-day', scope) === true
              ? dragOverHeadDayRef.value = day.date
              : dragOverHeadDayRef.value = '';
          }
        },
        onFocus: (e) => {
          if (isFocusable === true) {
            focusRef.value = day.date;
          }
        },
        ...getDefaultMouseEventHandlers('-head-day', event => {
          return { scope, event }
        })
      };

      return vue.h('div', data, [
        // head-day slot replaces everything below it
        headDaySlot !== undefined && headDaySlot({ scope }),
        headDaySlot === undefined && __renderDateHeader(day),
        headDaySlot === undefined && headDateSlot && headDateSlot({ scope }),
        useFocusHelper()
      ])
    }

    function __renderDateHeader (day) {
      if (props.dateHeader === 'stacked') {
        return [
          props.noDefaultHeaderText !== true && __renderHeadWeekday(day),
          props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day)
        ]
      }
      else if (props.dateHeader === 'inline') {
        if (props.weekdayAlign === 'left' && props.dateAlign === 'right') {
          return vue.h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day),
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day)
          ])
        }
        else if (props.weekdayAlign === 'right' && props.dateAlign === 'left') {
          return vue.h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day),
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day)
          ])
        }
        else {
          return vue.h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day),
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day)
          ])
        }
      }
      else if (props.dateHeader === 'inverted') {
        if (props.weekdayAlign === 'left' && props.dateAlign === 'right') {
          return vue.h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day),
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day)
          ])
        }
        else if (props.weekdayAlign === 'right' && props.dateAlign === 'left') {
          return vue.h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day),
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day)
          ])
        }
        else {
          return vue.h('div', {
            class: 'q-calendar__header--inline'
          }, [
            props.noDefaultHeaderBtn !== true && __renderHeadDayDate(day),
            props.noDefaultHeaderText !== true && __renderHeadWeekday(day)
          ])
        }
      }
    }

    function __renderHeadDayEvent (day, columnIndex) {
      const headDayEventSlot = slots[ 'head-day-event' ];
      const activeDate = props.noActiveDate !== true && __isActiveDate(day);

      const scope = getScopeForSlot(day, columnIndex);
      scope.activeDate = activeDate;
      scope.disabled = (props.disabledWeekdays ? props.disabledWeekdays.includes(day.weekday) : false);

      const width = isSticky.value === true ? props.cellWidth : computedWidth.value;
      const style = {
        width,
        maxWidth: width
      };
      if (isSticky.value === true) {
        style.minWidth = width;
      }

      return vue.h('div', {
        key: 'event-' + day.date + (columnIndex !== undefined ? '-' + columnIndex : ''),
        class: {
          'q-calendar-agenda__head--day__event': true,
          ...getRelativeClasses(day),
          'q-active-date': activeDate
        },
        style
      }, [
        headDayEventSlot && headDayEventSlot({ scope })
      ])
    }

    function __renderHeadWeekday (day) {
      const slot = slots[ 'head-weekday-label' ];
      const scope = getScopeForSlot(day);
      scope.shortWeekdayLabel = props.shortWeekdayLabel;

      const data = {
        class: {
          'q-calendar-agenda__head--weekday': true,
          [ 'q-calendar__' + props.weekdayAlign ]: true,
          'q-calendar__ellipsis': true
        }
      };

      return vue.h('div', data, (slot && slot({ scope })) || __renderHeadWeekdayLabel(day, props.shortWeekdayLabel))
    }

    function __renderHeadWeekdayLabel (day, shortWeekdayLabel) {
      const weekdayLabel = weekdayFormatter.value(day, shortWeekdayLabel || (props.weekdayBreakpoints[ 0 ] > 0 && parsedCellWidth.value <= props.weekdayBreakpoints[ 0 ]));
      return vue.h('span', {
        class: 'q-calendar__ellipsis'
      }, props.weekdayBreakpoints[ 1 ] > 0 && parsedCellWidth.value <= props.weekdayBreakpoints[ 1 ] ? minCharWidth(weekdayLabel, props.minWeekdayLabel) : weekdayLabel)
    }

    function __renderHeadDayDate (day) {
      const data = {
        class: {
          'q-calendar-agenda__head--date': true,
          [ 'q-calendar__' + props.dateAlign ]: true
        }
      };

      return vue.h('div', data, __renderHeadDayBtn(day))
    }

    function __renderHeadDayBtn (day) {
      const activeDate = props.noActiveDate !== true && __isActiveDate(day);
      const dayLabel = dayFormatter.value(day, false);
      const headDayLabelSlot = slots[ 'head-day-label' ];
      const headDayButtonSlot = slots[ 'head-day-button' ];

      const scope = {
        dayLabel,
        timestamp: day,
        activeDate,
        disabled: (props.disabledWeekdays ? props.disabledWeekdays.includes(day.weekday) : false)
      };

      const data = {
        class: {
          'q-calendar-agenda__head--day__label': true,
          'q-calendar__button': true,
          'q-calendar__button--round': props.dateType === 'round',
          'q-calendar__button--rounded': props.dateType === 'rounded',
          'q-calendar__button--bordered': day.current === true,
          'q-calendar__focusable': true
        },
        disabled: day.disabled,
        onKeydown: (e) => {
          if (day.disabled !== true
            && isKeyCode(e, [ 13, 32 ])) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
        onKeyup: (e) => {
          // allow selection of date via Enter or Space keys
          if (day.disabled !== true
            && isKeyCode(e, [ 13, 32 ])) {
            emittedValue.value = day.date;
            if (emitListeners.value.onClickDate !== undefined) {
              // eslint-disable-next-line vue/require-explicit-emits
              emit('click-date', { scope });
            }
          }
        },
        ...getDefaultMouseEventHandlers('-date', (event, eventName) => {
          if (eventName === 'click-date' || eventName === 'contextmenu-date') {
            emittedValue.value = day.date;
            if (eventName === 'click-date') {
              event.preventDefault();
            }
          }
          return { scope, event }
        })
      };

      if (props.noAria !== true) {
        data.ariaLabel = ariaDateFormatter.value(day);
      }

      return headDayButtonSlot
        ? headDayButtonSlot({ scope })
        : useButton(props, data, headDayLabelSlot ? headDayLabelSlot({ scope }) : dayLabel)
    }

    function __renderBody () {
      return vue.h('div', {
        class: 'q-calendar-agenda__body'
      }, [
        __renderScrollArea()
      ])
    }

    function __renderScrollArea () {
      if (isSticky.value === true) {
        return vue.h('div', {
          ref: scrollArea,
          class: {
            'q-calendar-agenda__scroll-area': true,
            'q-calendar__scroll': true
          }
        }, [
          __renderDayContainer()
        ])
      }
      else if (props.noScroll === true) {
        return __renderPane()
      }
      else {
        return vue.h('div', {
          ref: scrollArea,
          class: {
            'q-calendar-agenda__scroll-area': true,
            'q-calendar__scroll': true
          }
        }, [
          __renderPane()
        ])
      }
    }

    function __renderPane () {
      return vue.h('div', {
        ref: pane,
        class: 'q-calendar-agenda__pane'
      }, [
        __renderDayContainer()
      ])
    }

    function __renderDayContainer () {
      const slot = slots[ 'day-container' ];

      return vue.h('div', {
        class: 'q-calendar-agenda__day-container'
      }, [
        isSticky.value === true && props.noHeader !== true && __renderHead(),
        vue.h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            height: '100%'
          }
        }, [
          ...__renderDays()
        ]),
        slot && slot({ scope: { days: days.value } })
      ])
    }

    function __renderDays () {
      if (days.value.length === 1 && parseInt(props.columnCount, 10) > 0) {
        return [
          isLeftColumnOptionsValid.value === true && props.leftColumnOptions.map((column, index) => __renderColumn(column, index)),
          Array.apply(null, new Array(parseInt(props.columnCount, 10)))
            .map((_, i) => i + parseInt(props.columnIndexStart, 10))
            .map(i => __renderDay(days.value[ 0 ], 0, i)),
          isRightColumnOptionsValid.value === true && props.rightColumnOptions.map((column, index) => __renderColumn(column, index))
        ]
      }
      else {
        return [
          isLeftColumnOptionsValid.value === true && props.leftColumnOptions.map((column, index) => __renderColumn(column, index)),
          days.value.map((day, index) => __renderDay(day)),
          isRightColumnOptionsValid.value === true && props.rightColumnOptions.map((column, index) => __renderColumn(column, index))
        ]
      }
    }

    function __renderColumn (column, index) {
      const slot = slots.column;
      const scope = { column, days: days.value, index };
      const width = isSticky.value === true ? props.cellWidth : computedWidth.value;
      const isFocusable = props.focusable === true && props.focusType.includes('day');
      const id = (props.columnOptionsId !== undefined ? column[ props.columnOptionsId ] : undefined);

      return vue.h('div', {
        key: id,
        tabindex: isFocusable === true ? 0 : -1,
        class: {
          'q-calendar-agenda__day': true,
          'q-column-day': true,
          'q-calendar__hoverable': props.hoverable === true,
          'q-calendar__focusable': isFocusable === true
        },
        style: {
          maxWidth: width,
          width
        },
        onDragenter: (e) => {
          if (props.dragEnterFunc !== undefined && typeof props.dragEnterFunc === 'function') {
            props.dragEnterFunc(e, 'column', scope) === true
              ? dragOverHeadDayRef.value = id
              : dragOverHeadDayRef.value = '';
          }
        },
        onDragover: (e) => {
          if (props.dragOverFunc !== undefined && typeof props.dragOverFunc === 'function') {
            props.dragOverFunc(e, 'column', scope) === true
              ? dragOverHeadDayRef.value = id
              : dragOverHeadDayRef.value = '';
          }
        },
        onDragleave: (e) => {
          if (props.dragLeaveFunc !== undefined && typeof props.dragLeaveFunc === 'function') {
            props.dragLeaveFunc(e, 'column', scope) === true
              ? dragOverHeadDayRef.value = id
              : dragOverHeadDayRef.value = '';
          }
        },
        onDrop: (e) => {
          if (props.dropFunc !== undefined && typeof props.dropFunc === 'function') {
            props.dropFunc(e, 'column', scope) === true
              ? dragOverHeadDayRef.value = id
              : dragOverHeadDayRef.value = '';
          }
        },
        ...getDefaultMouseEventHandlers('-column', (event, eventName) => {
          return { scope, event }
        })
      }, [
        slot && slot({ scope })
      ])
    }

    function __renderDay (day, dayIndex, columnIndex) {
      const slot = slots.day;
      const scope = getScopeForSlot(day, columnIndex);
      const width = isSticky.value === true ? props.cellWidth : computedWidth.value;
      const style = {
        width,
        maxWidth: width
      };
      if (isSticky.value === true) {
        style.minWidth = width;
      }
      style.height = parseInt(props.dayHeight, 10) > 0 ? convertToUnit(parseInt(props.dayHeight, 10)) : 'auto';
      if (parseInt(props.dayMinHeight, 10) > 0) {
        style.minHeight = convertToUnit(parseInt(props.dayMinHeight, 10));
      }

      return vue.h('div', {
        key: day.date + (columnIndex !== undefined ? ':' + columnIndex : ''),
        class: {
          'q-calendar-agenda__day': true,
          ...getRelativeClasses(day)
        },
        style
      }, [
        slot && slot({ scope })
      ])
    }

    function __renderAgenda () {
      const { start, end, maxDays } = renderValues.value;
      if (startDate.value !== start.date || endDate.value !== end.date || maxDaysRendered.value !== maxDays) {
        startDate.value = start.date;
        endDate.value = end.date;
        maxDaysRendered.value = maxDays; 
      }

      const hasWidth = size.width > 0;

      const agenda = vue.withDirectives(vue.h('div', {
        class: 'q-calendar-agenda',
        key: startDate.value
      }, [
        hasWidth === true && isSticky.value !== true && props.noHeader !== true && __renderHead(),
        hasWidth === true && __renderBody()
      ]), [[
        ResizeObserver$1,
        __onResize
      ]]);

      if (props.animated === true) {
        const transition = 'q-calendar--' + (direction.value === 'prev' ? props.transitionPrev : props.transitionNext);
        return vue.h(vue.Transition, {
          name: transition,
          appear: true
        }, () => agenda)
      }

      return agenda
    }

    // expose public methods
    expose({
      prev,
      next,
      move,
      moveToToday,
      updateCurrent,
    });

    // Object.assign(vm.proxy, {
    //   prev,
    //   next,
    //   move,
    //   moveToToday,
    //   updateCurrent,
    // })

    return () => __renderCalendar()
  }
});

const version = '4.0.0-beta.16';

var Plugin = {
  version,
  QCalendarAgenda,

  PARSE_REGEX,
  PARSE_DATE,
  PARSE_TIME,
  DAYS_IN_MONTH,
  DAYS_IN_MONTH_LEAP,
  DAYS_IN_MONTH_MIN,
  DAYS_IN_MONTH_MAX,
  MONTH_MAX,
  MONTH_MIN,
  DAY_MIN,
  DAYS_IN_WEEK,
  MINUTES_IN_HOUR,
  HOURS_IN_DAY,
  FIRST_HOUR,
  MILLISECONDS_IN_MINUTE,
  MILLISECONDS_IN_HOUR,
  MILLISECONDS_IN_DAY,
  MILLISECONDS_IN_WEEK,
  Timestamp,
  TimeObject,
  today,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  parseTime,
  validateTimestamp,
  parsed,
  parseTimestamp,
  parseDate,
  getDayIdentifier,
  getTimeIdentifier,
  getDayTimeIdentifier,
  diffTimestamp,
  updateRelative,
  updateMinutes,
  updateWeekday,
  updateDayOfYear,
  updateWorkWeek,
  updateDisabled,
  updateFormatted,
  getDayOfYear,
  getWorkWeek,
  getWeekday,
  isLeapYear,
  daysInMonth,
  copyTimestamp,
  padNumber,
  getDate,
  getTime,
  getDateTime,
  nextDay,
  prevDay,
  moveRelativeDays,
  relativeDays,
  findWeekday,
  getWeekdaySkips,
  createDayList,
  createIntervalList,
  createNativeLocaleFormatter,
  makeDate,
  makeDateTime,
  validateNumber,
  maxTimestamp,
  minTimestamp,
  isBetweenDates,
  isOverlappingDates,
  daysBetween,
  weeksBetween,
  addToDate,
  compareTimestamps,
  compareDate,
  compareTime,
  compareDateTime,
  getWeekdayFormatter,
  getWeekdayNames,
  getMonthFormatter,
  getMonthNames,
  // helpers
  convertToUnit,
  indexOf,

  install (app) {
    app.component(QCalendarAgenda.name, QCalendarAgenda);
  }
};

module.exports = Plugin;

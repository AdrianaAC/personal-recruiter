function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

export function formatDateTimeInputValue(date: Date, hours = 9, minutes = 0) {
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);
  const shifted = new Date(
    localDate.getTime() - localDate.getTimezoneOffset() * 60000,
  );
  return shifted.toISOString().slice(0, 16);
}

export function formatWeekInputValue(date: Date) {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  current.setDate(current.getDate() + 4 - (current.getDay() || 7));
  const yearStart = new Date(current.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((current.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return `${current.getFullYear()}-W${pad(weekNumber)}`;
}

export function getFridayFromWeekInput(weekValue: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(year, 0, 4);
  const januaryFourthDay = januaryFourth.getDay() || 7;
  const mondayOfWeekOne = new Date(januaryFourth);
  mondayOfWeekOne.setDate(januaryFourth.getDate() - januaryFourthDay + 1);

  const friday = new Date(mondayOfWeekOne);
  friday.setDate(mondayOfWeekOne.getDate() + (week - 1) * 7 + 4);
  friday.setHours(9, 0, 0, 0);

  return friday;
}

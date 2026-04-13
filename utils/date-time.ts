const pad = (value: number) => value.toString().padStart(2, "0");

const toUtcLocalDateTimeString = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;

export const normalizeBackendUtcDateTime = (value?: string | null) => {
  if (!value) {
    return value ?? "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/z$/i.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}Z`;
};

export const localDateTimeInputToBackendUtc = (value: string) => {
  if (!value.trim()) {
    return value;
  }

  return toUtcLocalDateTimeString(new Date(value));
};

export const getDateTimeMillis = (value?: string | null) => {
  const normalized = normalizeBackendUtcDateTime(value);
  const milliseconds = normalized ? new Date(normalized).getTime() : Number.NaN;
  return Number.isFinite(milliseconds) ? milliseconds : Number.NaN;
};

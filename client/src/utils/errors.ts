import { HTTPError } from "ky";

export const isHTTPError = (
  error: unknown,
  code?: number | number[]
): error is HTTPError => {
  if (code === undefined) {
    return error instanceof HTTPError;
  }

  if (Array.isArray(code)) {
    return error instanceof HTTPError && code.includes(error.response.status);
  }

  return error instanceof HTTPError && error.response.status === code;
};

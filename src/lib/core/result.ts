export type AppResult<T, E extends string = string> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: E;
        message: string;
      };
    };

export function ok<T>(data: T): AppResult<T, never> {
  return { success: true, data };
}

export function fail<E extends string>(
  code: E,
  message: string,
): AppResult<never, E> {
  return {
    success: false,
    error: { code, message },
  };
}

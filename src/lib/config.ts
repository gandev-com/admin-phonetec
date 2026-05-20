export const AUTH_DISABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";

import "dotenv/config";
// Seeds are opt-in and do not bypass verification or persist a shared demo password.
if (process.env.NODE_ENV === "production")
  throw new Error("Development seed is disabled in production");
console.log(
  "No synthetic accounts are inserted. Register and verify an account using the development inbox; personal onboarding creates the initial workspace.",
);

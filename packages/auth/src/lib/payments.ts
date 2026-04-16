import { Polar } from "@polar-sh/sdk";

export function createPolarClient(opts: {
  accessToken: string;
  server?: "sandbox" | "production";
}) {
  return new Polar({
    accessToken: opts.accessToken,
    server: opts.server ?? "sandbox",
  });
}

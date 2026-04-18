export { cn } from "@workspace/ui/lib/utils";

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

export const convertToKababCase = (str: string) => str.replace(/ /g, "-").toLowerCase();

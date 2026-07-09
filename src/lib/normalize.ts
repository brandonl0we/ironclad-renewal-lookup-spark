export type NormalizedAccount = {
  original: string;
  normalizedHost: string;
  accountSlug: string;
};

export function normalizeAccountHost(input: string): NormalizedAccount {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Enter an ActiveCampaign account host.");
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid account host.");
  }

  const normalizedHost = url.hostname.toLowerCase();
  if (!/^[a-z0-9-]+\.activehosted\.com$/.test(normalizedHost)) {
    throw new Error("Use an account host like xxxx.activehosted.com.");
  }

  return {
    original: input,
    normalizedHost,
    accountSlug: normalizedHost.split(".")[0],
  };
}

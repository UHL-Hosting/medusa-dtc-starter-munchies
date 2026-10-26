"use client";
import type { ComponentProps } from "react";

import config from "@/config";
import {
  ALLOWED_URL_SCHEMES,
  getSafeHref,
  isAbsoluteUrl,
} from "@/utils/safe-href";
import Link from "next/link";

import { useCountryCode } from "../context/country-code-context";

export default function LocalizedLink({
  href,
  ...passThroughProps
}: ComponentProps<typeof Link>) {
  const countryCode = useCountryCode();

  const isDefault = countryCode === config.defaultCountryCode

  const safeHref =
    typeof href === "string"
      ? getSafeHref(href)
      : href &&
          (!href.protocol ||
            ALLOWED_URL_SCHEMES.includes(
              href.protocol.replace(/:$/, "").toLowerCase(),
            ))
        ? href
        : undefined;

  if (!safeHref) {
    return (
      <span className={passThroughProps.className}>
        {passThroughProps.children}
      </span>
    );
  }

  const normalizedPath = safeHref.toString();
  const isExternalLink = isAbsoluteUrl(normalizedPath);
  const isDeepLink = normalizedPath.startsWith("#");
  const localizedHref =
    isExternalLink || isDeepLink || isDefault
      ? safeHref
      : `/${countryCode}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;

  return <Link href={localizedHref} {...passThroughProps} />;
}

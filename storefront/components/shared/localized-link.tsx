"use client";
import type { ComponentProps } from "react";

import config from "@/config";
import { getSafeHref, isAbsoluteUrl } from "@/utils/safe-href";
import { formatUrl } from "next/dist/shared/lib/router/utils/format-url";
import Link from "next/link";

import { useCountryCode } from "../context/country-code-context";

export default function LocalizedLink({
  href,
  ...passThroughProps
}: ComponentProps<typeof Link>) {
  const countryCode = useCountryCode();

  const isDefault = countryCode === config.defaultCountryCode

  const safeHref = getSafeHref(
    typeof href === "string" ? href : formatUrl(href),
  );

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

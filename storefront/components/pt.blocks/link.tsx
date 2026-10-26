import type {PortableTextMarkComponentProps} from "@portabletext/react";

import {getSafeHref} from "@/utils/safe-href";

import LocalizedLink from "../shared/localized-link";

type linkData = {
  _key: string;
  _type: "link";
  href: string;
};
export function PtLink(props: PortableTextMarkComponentProps<linkData>) {
  const href = getSafeHref(props.value?.href);
  if (!href) return <>{props.children}</>;
  return (
    <LocalizedLink className="break-words underline" href={href}>
      {props.children}
    </LocalizedLink>
  );
}

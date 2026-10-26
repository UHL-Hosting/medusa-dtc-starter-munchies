import {getSafeHref} from "@/utils/safe-href";
import {LinkIcon} from "@sanity/icons";
import {defineType} from "sanity";

export const link = defineType({
  description: "e.g. https://example.com or /products/product-variant",
  icon: LinkIcon,
  name: "link",
  title: "Link",
  type: "string",
  validation: (Rule) =>
    Rule.required().custom((value) =>
      !value || getSafeHref(value)
        ? true
        : "Use a relative path (/...), an anchor (#...) or an http, https, mailto or tel URL",
    ),
});

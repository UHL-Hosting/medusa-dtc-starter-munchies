import {ALLOWED_URL_SCHEMES} from "@/utils/safe-href";
import {defineArrayMember, defineField} from "sanity";

import {imageBlock} from "./image";

const ptBlocks = [imageBlock];

const STYLE_LABELS = {
  blockquote: "Quote",
  h2: "Section heading",
  h3: "Sub-section",
};

const availableStyles = ["h2", "h3", "blockquote"];

export const ptBody = defineField({
  name: "ptBody",
  of: [
    defineArrayMember({
      lists: [
        {title: "Bullet list", value: "bullet"},
        {title: "Numbered list", value: "number"},
      ],
      marks: {
        annotations: [
          {
            fields: [
              {
                name: "href",
                title: "URL",
                type: "url",
                validation: (Rule) =>
                  Rule.uri({
                    allowRelative: true,
                    scheme: ALLOWED_URL_SCHEMES,
                  }),
              },
            ],
            name: "link",
            title: "Link",
            type: "object",
          },
        ],
      },
      styles: availableStyles.length
        ? [
            {title: "Paragraph", value: "normal"},
            ...availableStyles.map((h) => ({
              title: STYLE_LABELS[h as keyof typeof STYLE_LABELS] || h,
              value: h,
            })),
          ]
        : [],
      type: "block",
    }),
    ...ptBlocks.map((type) => defineArrayMember({...type, name: type.name})),
  ],

  title: "Rich Text with blocks",
  type: "array",
});

export const lightPtBody = defineField({
  name: "lightPtBody",
  of: [
    defineArrayMember({
      lists: [],
      marks: {
        annotations: [],
        decorators: [
          {title: "Strong", value: "strong"},
          {title: "Emphasis", value: "em"},
          {title: "Underline", value: "underline"},
          {title: "Strike", value: "strike-through"},
        ],
      },
      styles: [{title: "Paragraph", value: "normal"}],
      type: "block",
    }),
  ],

  title: "Rich Text",
  type: "array",
});

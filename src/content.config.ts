import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    readingTime: z.string(),
    tags: z.array(z.string()),
    lang: z.enum(['zh', 'en']),
    translationKey: z.string(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    sources: z.array(z.object({
      label: z.string(),
      url: z.url(),
    })).default([]),
  }),
});

export const collections = { blog };

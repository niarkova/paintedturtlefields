import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const stops = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stops' }),
  schema: z.object({
    number: z.number(),
    name: z.string(),
    subtitle: z.string(),
    plants: z.array(z.string()),
    accent: z.string().optional(),
  }),
});

export const collections = { stops };

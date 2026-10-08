import { z } from "zod";

export const eventCategorySchema = z.enum([
  "Party",
  "Concerti",
  "Mostre",
  "Aperitivi",
]);

const coordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3).max(70),
    venue: z.string().trim().min(2).max(120),
    category: eventCategorySchema,
    startsAt: z.string().datetime({ offset: true }),
    imageUrl: z.string().url().max(2_048).nullable().optional(),
    description: z.string().trim().min(1).max(1_500),
  })
  .merge(coordinatesSchema);

export const updateEventSchema = createEventSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  "At least one field is required",
);

export const eventIdSchema = z.string().uuid();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

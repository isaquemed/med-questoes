import { z } from 'zod';

export const questionFiltersSchema = z.object({
  source: z.string().optional(),
  year: z.string().regex(/^\d{4}$|^all$/).optional(),
  specialty: z.string().max(255).optional(),
  topic: z.string().max(255).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional(),
});

export const validateQuestionFilters = (data: any) => {
  return questionFiltersSchema.safeParse(data);
};

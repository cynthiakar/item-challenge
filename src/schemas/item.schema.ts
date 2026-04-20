import { z } from "zod";

const itemTypes = ["multiple-choice", "free-response", "essay"] as const;
const securityLevels = ["standard", "secure", "highly-secure"] as const;

export const CreateItemSchema = z.object({
  subject: z.string(),
  itemType: z.enum(itemTypes),
  difficulty: z.number().int().min(1, { message: "Difficulty must be in range 1-5" }).max(5, { message: "Difficulty must be in range 1-5" }),
  content: z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string()
  }),
  metadata: z.object({
    author: z.string(),
    status: z.string(),
    tags: z.array(z.string())
  }),
  securityLevel: z.enum(securityLevels),
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;
import { z } from "zod";

const itemTypes = ["multiple-choice", "free-response", "essay"] as const;
const securityLevels = ["standard", "secure", "highly-secure"] as const;

const ContentSchema = z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string()
});

const MetadataSchema = z.object({
    author: z.string(),
    status: z.string(),
    tags: z.array(z.string())
});

export const CreateItemSchema = z.object({
  subject: z.string(),
  itemType: z.enum(itemTypes),
  difficulty: z.number().int().min(1, { message: "Difficulty must be in range 1-5" }).max(5, { message: "Difficulty must be in range 1-5" }),
  content: ContentSchema,
  metadata: MetadataSchema,
  securityLevel: z.enum(securityLevels),
});
export type CreateItemInput = z.infer<typeof CreateItemSchema>;

export const IdSchema = z.string().uuid({ message: "Invalid ID format. Expected a UUID." });
export type ItemId = z.infer<typeof IdSchema>;

export const UpdateItemSchema = CreateItemSchema.deepPartial();
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
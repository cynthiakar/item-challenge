import { CreateItemSchema } from '../schemas/item.schema.js';

export async function createItemHandler(storage: any, data: any) {
  try {
    // Validate item request schema
    const validCreateItemRequest = CreateItemSchema.parse(data);
    const item = await storage.createItem(validCreateItemRequest);

    return {
      statusCode: 201,
      body: item,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { statusCode: 400, body: { errors: error.flatten().fieldErrors } };
    }
    console.error('[createItemHandler] Error creating item', error);
    return {
      statusCode: 500,
      body: { error: 'Internal server error' },
    };
  }
}
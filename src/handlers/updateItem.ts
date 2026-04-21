import { IdSchema, UpdateItemSchema } from '../schemas/item.schema.js';


export async function updateItemHandler(storage: any, id: string, data: any) {
  try {
    // Validate ID is UUID 
    const idValidation = IdSchema.safeParse(id);
    if (!idValidation.success) {
      return {
        statusCode: 400,
        body: { error: idValidation.error.errors[0].message },
      };
    }

    // Validate item request schema
    const dataValidation = UpdateItemSchema.safeParse(data);
    if (!dataValidation.success) {
      return {
        statusCode: 400,
        body: { error: dataValidation.error.flatten().fieldErrors },
      };
    }

    const validId = idValidation.data
    const item = await storage.updateItem(validId, dataValidation.data)

    return {
      statusCode: 201,
      body: item,
    };
  } catch (error) {
    console.error(`[updateItemHandler] Error updating item for ID: ${validId}`, error);
    return {
      statusCode: 500,
      body: { error: 'Internal server error' },
    };
  }
}
/**
 * Example Handler
 *
 * This demonstrates how to create a handler for the API.
 * You can use this as a template for implementing the required endpoints.
 */

import { z } from "zod";

import { createStorage } from '../storage/index.js';
import { CreateItemSchema } from '../schemas/item.schema.js';

const storage = createStorage();

export async function getItemHandler(id: string) {
  try {
    const item = await storage.getItem(id);

    if (!item) {
      return {
        statusCode: 404,
        body: { error: 'Item not found' },
      };
    }

    return {
      statusCode: 200,
      body: item,
    };
  } catch (error) {
    console.error('Error getting item:', error);
    return {
      statusCode: 500,
      body: { error: 'Internal server error' },
    };
  }
}

export async function createItemHandler(data: any) {
  try {
    // Validate using Zod
    const validCreateItemRequest = CreateItemSchema.parse(data);
    console.log(validCreateItemRequest);
    const item = await storage.createItem(validCreateItemRequest);

    return {
      statusCode: 201,
      body: item,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { statusCode: 400, body: { errors: error.flatten().fieldErrors } };
    }
    console.error('Error creating item:', error);
    return {
      statusCode: 500,
      body: { error: 'Internal server error' },
    };
  }
}

// TODO: Implement other handlers:
// - updateItemHandler
// - listItemsHandler
// - createVersionHandler
// - getAuditTrailHandler

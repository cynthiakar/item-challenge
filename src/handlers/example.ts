/**
 * Example Handler
 *
 * This demonstrates how to create a handler for the API.
 * You can use this as a template for implementing the required endpoints.
 */

import { z } from "zod";

import { createStorage } from '../storage/index.js';
import { CreateItemSchema, IdSchema, UpdateItemSchema } from '../schemas/item.schema.js';

const storage = createStorage();

export async function getItemHandler(id: string) {
  try {
    // Validate ID is UUID
    const validation = IdSchema.safeParse(id);

    if (!validation.success) {
      return {
        statusCode: 400,
        body: { error: validation.error.errors[0].message },
      };
    }

    const validId = validation.data
    const item = await storage.getItem(validId);

    if (!item) {
      return {
        statusCode: 404,
        body: { error: `Item with ${validId} not found` },
      };
    }

    return {
      statusCode: 200,
      body: item,
    };
  } catch (error) {
    console.error(`[getItemHandler] Error for ID: ${validId}`, error);
    return {
      statusCode: 500,
      body: { error: 'Internal server error' },
    };
  }
}

export async function createItemHandler(data: any) {
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

export async function updateItemHandler(id: string, data: any) {
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

// TODO: Implement other handlers:
// - listItemsHandler
// - createVersionHandler
// - getAuditTrailHandler

/**
 * Example Handler
 *
 * This demonstrates how to create a handler for the API.
 * You can use this as a template for implementing the required endpoints.
 */

import { z } from "zod";

import { IdSchema } from '../schemas/item.schema.js';

export async function getItemHandler(storage: any, id: string) {
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

// TODO: Implement other handlers:
// - listItemsHandler
// - createVersionHandler
// - getAuditTrailHandler

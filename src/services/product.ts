import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq, ilike, or, and, sql, type SQL } from 'drizzle-orm';
import type { IntentResult } from './llm.js';

export interface ProductRecord {
  id: string;
  name: string;
  category: string;
  specs: unknown;
  description: string;
  price: string | null;
  tags: string[] | null;
  status: string;
}

/**
 * Search products based on LLM-extracted intent filters.
 * Builds a dynamic WHERE clause from the structured filters.
 */
export async function searchProducts(
  intentResult: IntentResult,
  limit = 5,
): Promise<ProductRecord[]> {
  const conditions: SQL[] = [eq(products.status, 'active')];

  const { filters } = intentResult;

  if (filters.category) {
    conditions.push(ilike(products.category, `%${filters.category}%`));
  }

  if (filters.keywords && filters.keywords.length > 0) {
    const keywordConditions = filters.keywords.map((kw) =>
      or(
        ilike(products.name, `%${kw}%`),
        ilike(products.description, `%${kw}%`),
      ),
    );
    const validConditions = keywordConditions.filter(
      (c): c is SQL => c !== undefined,
    );
    if (validConditions.length > 0) {
      conditions.push(or(...validConditions)!);
    }
  }

  if (filters.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(
      (tag) => sql`${products.tags} @> ARRAY[${tag}]::text[]`,
    );
    conditions.push(or(...tagConditions)!);
  }

  if (filters.priceRange) {
    if (filters.priceRange.min !== null && filters.priceRange.min !== undefined) {
      conditions.push(
        sql`${products.price}::numeric >= ${filters.priceRange.min}`,
      );
    }
    if (filters.priceRange.max !== null && filters.priceRange.max !== undefined) {
      conditions.push(
        sql`${products.price}::numeric <= ${filters.priceRange.max}`,
      );
    }
  }

  const results = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .limit(limit);

  return results;
}

/**
 * Get a single product by ID.
 */
export async function getProductById(
  id: string,
): Promise<ProductRecord | undefined> {
  const results = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return results[0];
}

/**
 * Format product list as a readable string for LLM context.
 */
export function formatProductsForLLM(productList: ProductRecord[]): string {
  if (productList.length === 0) {
    return '暂无匹配的产品。';
  }

  return JSON.stringify(
    productList.map((p) => ({
      name: p.name,
      category: p.category,
      price: p.price,
      specs: p.specs,
      description: p.description,
      tags: p.tags,
    })),
    null,
    2,
  );
}

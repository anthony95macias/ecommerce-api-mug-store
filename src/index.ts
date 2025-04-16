// src/worker.ts

import { Hono } from 'hono';
import { createClient } from '@libsql/client/web';
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import { v4 as uuidv4 } from 'uuid';
import { categories, insertCategorySchema, insertMugsSchema, mugs } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface Env {
  TURSO_AUTH_TOKEN?: string;
  TURSO_URL?: string;
}

function buildDbClient(env: Env): LibSQLDatabase {
  const url = env.TURSO_URL?.trim();
  const authToken = env.TURSO_AUTH_TOKEN?.trim();

  if (!url) throw new Error('TURSO_URL is not defined');
  if (!authToken) throw new Error('TURSO_AUTH_TOKEN is not defined');

  return drizzle(createClient({ url, authToken }));
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.json({
    name: 'The Mugs Store API',
    endpoints: [
      { path: '/', method: 'GET', information: 'Get this endpoints index' },
      { path: '/mugs', method: 'GET', information: 'Get a list of all mugs' },
      { path: '/mug/:id', method: 'GET', information: 'Get mug by ID' },
      { path: '/categories', method: 'GET', information: 'List all mug categories' },
      { path: '/category/:id', method: 'GET', information: 'Get category by ID' },
    ],
  });
});

app.get('/mugs', async (c) => {
  const db = buildDbClient(c.env);
  const mugsData = await db.select().from(mugs).all();
  return c.json({ mugs: mugsData });
});

app.get('/mug/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 422);

  const db = buildDbClient(c.env);
  const mugData = await db.select().from(mugs).where(eq(mugs.id, id)).get();

  return mugData
    ? c.json({ mug: mugData })
    : c.json({ error: 'Mug not found!' }, 404);
});

app.post('/mug', async (c) => {
  const body = await c.req.json();
  const parsed = insertMugsSchema.safeParse({
    id: uuidv4(),
    categoryId: body.category_id,
    name: body.name,
    description: body.description,
    price: body.price,
    image: body.image,
  });

  if (!parsed.success) {
    const { message, path } = parsed.error.issues[0];
    return c.json({ error: `[${path}]: ${message}` }, path.length ? 422 : 400);
  }

  const db = buildDbClient(c.env);
  const newMug = await db.insert(mugs).values(parsed.data).returning().get();

  return c.json({ mug: newMug }, 201);
});

app.patch('/mug/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 422);

  const body = await c.req.json();
  if (!Object.keys(body).length) return c.json({ error: 'No data is being updated!' }, 400);

  const db = buildDbClient(c.env);
  const mug = await db
    .update(mugs)
    .set({ updatedAt: Math.floor(Date.now() / 1000), ...body })
    .where(eq(mugs.id, id))
    .returning()
    .get();

  return c.json({ mug });
});

app.delete('/mug/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 422);

  const db = buildDbClient(c.env);
  const mugData = await db.delete(mugs).where(eq(mugs.id, id)).returning().get();
  return c.json({ mug: mugData });
});

app.get('/categories', async (c) => {
  const db = buildDbClient(c.env);
  const categoryData = await db.select().from(categories).all();
  return c.json({ categories: categoryData });
});

app.get('/category/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 422);

  const db = buildDbClient(c.env);
  const categoryData = await db.select().from(categories).where(eq(categories.id, id)).get();

  return categoryData
    ? c.json({ category: categoryData })
    : c.json({ error: 'Category not found!' }, 404);
});

app.post('/category', async (c) => {
  const body = await c.req.json();
  const parsed = insertCategorySchema.safeParse({
    id: uuidv4(),
    ...body,
  });

  if (!parsed.success) {
    const { message, path } = parsed.error.issues[0];
    return c.json({ error: `[${path}]: ${message}` }, path.length ? 422 : 400);
  }

  const db = buildDbClient(c.env);
  const newCategory = await db.insert(categories).values(parsed.data).returning().get();

  return c.json({ category: newCategory }, 201);
});

app.patch('/category/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 422);

  const body = await c.req.json();
  if (!Object.keys(body).length) return c.json({ error: 'No data is being updated!' }, 400);

  const db = buildDbClient(c.env);
  const category = await db
    .update(categories)
    .set(body)
    .where(eq(categories.id, id))
    .returning()
    .get();

  return c.json({ category });
});

app.delete('/category/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'ID is required' }, 422);

  const db = buildDbClient(c.env);
  const categoryData = await db.delete(categories).where(eq(categories.id, id)).returning().get();

  return categoryData
    ? c.json({ category: categoryData })
    : c.json({ error: 'Category not found!' }, 404);
});

// Fallback 404
app.all('*', (c) => c.json({ error: 'Not Found' }, 404));

// Cloudflare Worker export
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};

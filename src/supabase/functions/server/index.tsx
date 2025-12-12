import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-fc601971/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all products for a user
app.get("/make-server-fc601971/products/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const products = await kv.get(`products_${username}`);
    return c.json({ products: products || [] });
  } catch (error) {
    console.error("Error fetching products:", error);
    return c.json({ error: "Failed to fetch products", details: String(error) }, 500);
  }
});

// Add a product
app.post("/make-server-fc601971/products/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const newProduct = await c.req.json();
    
    const products = await kv.get(`products_${username}`) || [];
    products.push(newProduct);
    
    await kv.set(`products_${username}`, products);
    return c.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    return c.json({ error: "Failed to add product", details: String(error) }, 500);
  }
});

// Update product quantity
app.put("/make-server-fc601971/products/:username/:productId", async (c) => {
  try {
    const username = c.req.param("username");
    const productId = c.req.param("productId");
    const { quantity } = await c.req.json();
    
    const products = await kv.get(`products_${username}`) || [];
    const updatedProducts = products.map((p: any) => 
      p.id === productId ? { ...p, quantity } : p
    );
    
    await kv.set(`products_${username}`, updatedProducts);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    return c.json({ error: "Failed to update product", details: String(error) }, 500);
  }
});

// Delete a product
app.delete("/make-server-fc601971/products/:username/:productId", async (c) => {
  try {
    const username = c.req.param("username");
    const productId = c.req.param("productId");
    
    const products = await kv.get(`products_${username}`) || [];
    const filteredProducts = products.filter((p: any) => p.id !== productId);
    
    await kv.set(`products_${username}`, filteredProducts);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return c.json({ error: "Failed to delete product", details: String(error) }, 500);
  }
});

// Get shopping list for a user
app.get("/make-server-fc601971/shopping/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const items = await kv.get(`shopping_${username}`);
    return c.json({ items: items || [] });
  } catch (error) {
    console.error("Error fetching shopping list:", error);
    return c.json({ error: "Failed to fetch shopping list", details: String(error) }, 500);
  }
});

// Add shopping item
app.post("/make-server-fc601971/shopping/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const newItem = await c.req.json();
    
    const items = await kv.get(`shopping_${username}`) || [];
    items.push(newItem);
    
    await kv.set(`shopping_${username}`, items);
    return c.json({ success: true, item: newItem });
  } catch (error) {
    console.error("Error adding shopping item:", error);
    return c.json({ error: "Failed to add shopping item", details: String(error) }, 500);
  }
});

// Toggle shopping item completion
app.put("/make-server-fc601971/shopping/:username/:itemId", async (c) => {
  try {
    const username = c.req.param("username");
    const itemId = c.req.param("itemId");
    const { completed } = await c.req.json();
    
    const items = await kv.get(`shopping_${username}`) || [];
    const updatedItems = items.map((item: any) => 
      item.id === itemId ? { ...item, completed } : item
    );
    
    await kv.set(`shopping_${username}`, updatedItems);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating shopping item:", error);
    return c.json({ error: "Failed to update shopping item", details: String(error) }, 500);
  }
});

// Delete shopping item
app.delete("/make-server-fc601971/shopping/:username/:itemId", async (c) => {
  try {
    const username = c.req.param("username");
    const itemId = c.req.param("itemId");
    
    const items = await kv.get(`shopping_${username}`) || [];
    const filteredItems = items.filter((item: any) => item.id !== itemId);
    
    await kv.set(`shopping_${username}`, filteredItems);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting shopping item:", error);
    return c.json({ error: "Failed to delete shopping item", details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
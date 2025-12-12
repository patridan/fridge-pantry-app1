import { projectId, publicAnonKey } from './supabase/info';
import { Product, ShoppingItem } from '../types';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-fc601971`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export async function getProducts(username: string): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${username}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching products:', error);
      throw new Error(error.error || 'Failed to fetch products');
    }
    
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
  }
}

export async function addProduct(username: string, product: Product): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${username}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error adding product:', error);
      throw new Error(error.error || 'Failed to add product');
    }
    
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error in addProduct:', error);
    throw error;
  }
}

export async function updateProductQuantity(
  username: string, 
  productId: string, 
  quantity: number
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${username}/${productId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ quantity }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error updating product:', error);
      throw new Error(error.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error in updateProductQuantity:', error);
    throw error;
  }
}

export async function deleteProduct(username: string, productId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${username}/${productId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error deleting product:', error);
      throw new Error(error.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    throw error;
  }
}

// Shopping list API functions
export async function getShoppingList(username: string): Promise<ShoppingItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopping/${username}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching shopping list:', error);
      throw new Error(error.error || 'Failed to fetch shopping list');
    }
    
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error in getShoppingList:', error);
    throw error;
  }
}

export async function addShoppingItem(username: string, item: ShoppingItem): Promise<ShoppingItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopping/${username}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error adding shopping item:', error);
      throw new Error(error.error || 'Failed to add shopping item');
    }
    
    const data = await response.json();
    return data.item;
  } catch (error) {
    console.error('Error in addShoppingItem:', error);
    throw error;
  }
}

export async function toggleShoppingItem(
  username: string, 
  itemId: string, 
  completed: boolean
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopping/${username}/${itemId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ completed }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error toggling shopping item:', error);
      throw new Error(error.error || 'Failed to toggle shopping item');
    }
  } catch (error) {
    console.error('Error in toggleShoppingItem:', error);
    throw error;
  }
}

export async function deleteShoppingItem(username: string, itemId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopping/${username}/${itemId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error deleting shopping item:', error);
      throw new Error(error.error || 'Failed to delete shopping item');
    }
  } catch (error) {
    console.error('Error in deleteShoppingItem:', error);
    throw error;
  }
}
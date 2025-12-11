import { projectId, publicAnonKey } from './supabase/info';
import { Product } from '../types';

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

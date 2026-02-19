import { api } from './api'

export type Product = {
  id: string
  name: string
  price: number
  stock: number
  tenantId: string
  createdAt?: string
  updatedAt?: string
}

export type CreateProductInput = {
  name: string
  price: number
  stock: number
}

export async function listProducts() {
  return api<Product[]>('/products')
}

export async function createProduct(input: CreateProductInput) {
  return api<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

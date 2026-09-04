export interface AdminProduct {
  seq: number
  wholesaleStoreSeq: number
  wholesaleStoreName: string | null
  categorySeq: number
  name: string
  description: string | null
  status: string
  minOrderQuantity: number
  createdAt: string
  updatedAt: string
  images: AdminProductImage[]
  options: AdminProductOption[]
  variants: AdminProductVariant[]
  viewCount: number
}

export interface AdminProductImage {
  seq: number
  imageUrl: string
  imageType: string
  sortOrder: number
}

export interface AdminProductOption {
  seq: number
  optionName: string
  optionValue: string
  sortOrder: number
}

export interface AdminProductVariant {
  seq: number
  sku: string
  color: string | null
  size: string | null
  supplyPrice: number
  salePrice: number
  status: string
}

export interface ProductViewCreateRequest {
  userId?: number | null
}

export interface ProductView {
  seq: number
  userId: number | null
  productSeq: number
  viewedAt: string
}

export interface AdminProductImageRequest {
  seq?: number
  imageUrl: string
  imageType?: string
  sortOrder?: number
}

export interface AdminProductOptionRequest {
  seq?: number
  optionName: string
  optionValue: string
  sortOrder?: number
}

export interface AdminProductVariantRequest {
  seq?: number
  sku: string
  color?: string | null
  size?: string | null
  supplyPrice?: number
  salePrice?: number
  status?: string
}

export interface AdminProductPage {
  content: AdminProduct[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface AdminProductCreateRequest {
  wholesaleStoreSeq: number
  categorySeq: number
  name: string
  description?: string | null
  status?: string
  minOrderQuantity?: number
  images: AdminProductImageRequest[]
  options: AdminProductOptionRequest[]
  variants: AdminProductVariantRequest[]
}

export interface AdminProductUpdateRequest {
  wholesaleStoreSeq: number
  categorySeq: number
  name: string
  description?: string | null
  status?: string
  minOrderQuantity: number
  images: AdminProductImageRequest[]
  options: AdminProductOptionRequest[]
  variants: AdminProductVariantRequest[]
}

export interface AdminProductListParams {
  page?: number
  size?: number
  wholesaleStoreSeq?: number
  categorySeq?: number
  status?: string
  name?: string
}

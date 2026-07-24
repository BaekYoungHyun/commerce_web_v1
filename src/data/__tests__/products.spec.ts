import { describe, expect, it } from 'vitest'
import { categories } from '../categories'
import { products } from '../products'

describe('도매 상품 샘플 데이터', () => {
  it('카테고리마다 상품이 20개씩 있다', () => {
    for (const category of categories) {
      expect(products.filter((product) => product.category === category.name)).toHaveLength(20)
    }
  })

  it('상품 ID가 중복되지 않는다', () => {
    expect(new Set(products.map((product) => product.id)).size).toBe(products.length)
  })

  it('모든 상품에 상세 이미지가 여러 장 있다', () => {
    for (const product of products) {
      expect(product.detailImages.length).toBeGreaterThanOrEqual(4)
    }
  })
})

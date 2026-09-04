import { apiRequest } from './httpClient'
import type {
  DeliveryCompanyOption,
  FulfillmentFilters,
  OrderItemFulfillmentStatus,
  Shipment,
  ShipmentStatus,
  WholesaleOrder,
  WholesaleOwnedStore,
} from '../types/wholesaleFulfillment'
import type { PageResponse } from '../types/page'

const headers = (token: string) => ({ Authorization: `Bearer ${token}` })
const query = (filters: FulfillmentFilters) => {
  const params = new URLSearchParams()
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.size !== undefined) params.set('size', String(filters.size))
  if (filters.wholesaleStoreSeq) params.set('wholesaleStoreSeq', String(filters.wholesaleStoreSeq))
  if (filters.status) params.set('status', filters.status)
  return params.size ? `?${params.toString()}` : ''
}

export const wholesaleFulfillmentApi = {
  stores(token: string) {
    return apiRequest<WholesaleOwnedStore[]>('/wholesale/stores', { headers: headers(token) })
  },
  orders(token: string, filters: FulfillmentFilters = {}) {
    return apiRequest<PageResponse<WholesaleOrder>>(`/wholesale/orders${query(filters)}`, {
      headers: headers(token),
    })
  },
  updateOrderItemStatus(
    token: string,
    orderSeq: number,
    orderItemSeq: number,
    status: OrderItemFulfillmentStatus,
  ) {
    return apiRequest<WholesaleOrder>(
      `/wholesale/orders/${orderSeq}/items/${orderItemSeq}/status`,
      {
        method: 'PATCH',
        headers: headers(token),
        body: JSON.stringify({ status }),
      },
    )
  },
  createShipment(
    token: string,
    orderSeq: number,
    body: {
      wholesaleStoreSeq: number
      deliveryCompanyCode: string | null
      trackingNumber: string | null
    },
  ) {
    return apiRequest<Shipment>(`/wholesale/orders/${orderSeq}/shipments`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    })
  },
  shipments(token: string, filters: FulfillmentFilters = {}) {
    return apiRequest<PageResponse<Shipment>>(`/wholesale/shipments${query(filters)}`, {
      headers: headers(token),
    })
  },
  deliveryCompanies(token: string) {
    return apiRequest<DeliveryCompanyOption[]>('/wholesale/delivery-companies', {
      headers: headers(token),
    })
  },
  updateShipmentStatus(
    token: string,
    shipmentSeq: number,
    body: {
      status: ShipmentStatus
      deliveryCompanyCode: string | null
      trackingNumber: string | null
    },
  ) {
    return apiRequest<Shipment>(`/wholesale/shipments/${shipmentSeq}/status`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify(body),
    })
  },
  updateShipmentQuantity(
    token: string,
    shipmentSeq: number,
    shipmentItemSeq: number,
    quantity: number,
  ) {
    return apiRequest<Shipment>(
      `/wholesale/shipments/${shipmentSeq}/items/${shipmentItemSeq}/quantity`,
      {
        method: 'PUT',
        headers: headers(token),
        body: JSON.stringify({ quantity }),
      },
    )
  },
}

export interface Inquiry {
  seq: number
  category: string
  title: string
  content: string
  status: string
}

export interface InquiryCreateRequest {
  category: string
  title: string
  content: string
}

export interface Notification {
  seq: number
  type: string
  title: string
  message: string
  readAt: string | null
}

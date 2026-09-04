export type InquiryStatus = 'OPEN' | 'ANSWERED' | 'CLOSED'

export interface AdminInquiry {
  seq: number
  userSeq: number
  userId: string
  userName: string
  businessType: 'WHOLESALE' | 'RETAIL'
  category: string
  title: string
  content: string
  status: InquiryStatus
  answer: string | null
  answeredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminInquiryAnswerRequest {
  content: string
}

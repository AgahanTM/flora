/**
 * Flora API Types
 */

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiPaginated<T> {
  data: T[];
  total: number;
}

export interface ApiError {
  error: string;
}

// ---------------------------------------------------------------------------
// Global Enums
// ---------------------------------------------------------------------------

export enum UserRole {
  CUSTOMER = 'customer',
  SELLER = 'seller',
  ADMIN = 'admin',
  COURIER = 'courier',
}

export enum SellerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  EN_ROUTE = 'en_route',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum AddonType {
  GREETING_CARD = 'greeting_card',
  CHOCOLATE = 'chocolate',
  BALLOON = 'balloon',
  TOY = 'toy',
  WRAPPER = 'wrapper',
  PERSONALIZATION = 'personalization',
  GIFT = 'gift',
  OTHER = 'other',
}

export enum PersonalizationStatus {
  PENDING = 'pending',
  IN_PRODUCTION = 'in_production',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum SubscriptionFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum IssueReportStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum VehicleType {
  BICYCLE = 'bicycle',
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  VAN = 'van',
}

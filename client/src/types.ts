export type Status =
  | "pending"
  | "confirmed"
  | "paid"
  | "completed"
  | "cancelled";
export interface Renter {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: "Standard" | "Silver" | "Gold";
  discountRate: number;
  completedBookings: number;
  bookings: number;
  balanceDue: number;
}
export interface Studio {
  images?: string[];
  image?: string;
  id: string;
  name: string;
  type: string;
  capacity: number;
  peakRate: number;
  offPeakRate: number;
  openHour: number;
  closeHour: number;
  description: string;
}
export interface Equipment {
  images?: string[];
  image?: string;
  type?: string;
  id: string;
  name: string;
  fee: number;
  quantity: number;
}
export interface Booking {
  id: string;
  renterId: string;
  renterName: string;
  studioId: string;
  studioName: string;
  date: string;
  startHour: number;
  endHour: number;
  guests: number;
  equipmentIds: string[];
  equipmentNames: string[];
  status: Status;
  hours: number;
  peakHours: number;
  subtotal: number;
  addOns: number;
  discountRate: number;
  discount: number;
  total: number;
  paid: number;
  balanceDue: number;
  overdue: boolean;
}
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: "cash" | "gcash" | "card";
  date: string;
  renterName?: string;
  studioName?: string;
  bookingDate?: string;
}
export interface Slot {
  hour: number;
  peak: boolean;
  rate: number;
  booked: boolean;
  bookingId: string | null;
  renterName: string | null;
}
export interface Availability {
  studioId: string;
  date: string;
  openHour: number;
  closeHour: number;
  slots: Slot[];
  freeHours: number;
  bookedHours: number;
}
export interface Quote {
  hours: number;
  peakHours: number;
  offPeakHours: number;
  subtotal: number;
  addOns: number;
  discountRate: number;
  discount: number;
  total: number;
}
export interface Overview {
  bookings: number;
  renters: number;
  studios: number;
  byStatus: Record<string, number>;
  booked: number;
  collected: number;
  outstanding: number;
  overdueCount: number;
}
export interface Utilization {
  studioId: string;
  name: string;
  type: string;
  bookings: number;
  bookedHours: number;
  availableHours: number;
  utilization: number;
  revenue: number;
}

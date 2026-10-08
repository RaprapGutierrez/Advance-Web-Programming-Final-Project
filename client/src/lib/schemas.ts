import { z } from 'zod';

export const TYPES = ['Music', 'Photo', 'Dance', 'Podcast'] as const;
export const METHODS = ['cash', 'gcash', 'card'] as const;
const num = (msg: string) => z.number({ message: msg });

export const studioSchema = z.object({
  name: z.string().trim().min(2, 'Studio name must be at least 2 characters'),
  type: z.enum(TYPES),
  capacity: num('Enter the capacity').int('Use a whole number').min(1, 'At least 1 person'),
  peakRate: num('Enter the peak rate').min(0, 'Rate cannot be negative'),
  offPeakRate: num('Enter the off-peak rate').min(0, 'Rate cannot be negative'),
  openHour: num('Choose opening hour'),
  closeHour: num('Choose closing hour'),
  description: z.string().max(200, 'Keep it under 200 characters'),
}).refine((v) => v.closeHour > v.openHour, { path: ['closeHour'], message: 'Closing must be after opening' });
export type StudioValues = z.infer<typeof studioSchema>;

export const renterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().min(7, 'Enter a valid phone number'),
});
export type RenterValues = z.infer<typeof renterSchema>;

export const equipmentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  fee: num('Enter the fee').min(0, 'Fee cannot be negative'),
  quantity: num('Enter the quantity').int('Use a whole number').min(1, 'At least 1'),
});
export type EquipmentValues = z.infer<typeof equipmentSchema>;

export const bookingSchema = z.object({
  renterId: z.string().min(1, 'Choose a renter'),
  studioId: z.string().min(1, 'Choose a studio'),
  date: z.string().min(1, 'Pick a date'),
  startHour: num('Choose a start time'),
  endHour: num('Choose an end time'),
  guests: num('Enter the number of guests').int('Use a whole number').min(1, 'At least 1 guest'),
  equipmentIds: z.array(z.string()),
}).refine((v) => v.endHour > v.startHour, { path: ['endHour'], message: 'End must be after the start' });
export type BookingValues = z.infer<typeof bookingSchema>;

export const paymentSchema = z.object({
  amount: num('Enter the amount').positive('Amount must be greater than 0'),
  method: z.enum(METHODS),
});
export type PaymentValues = z.infer<typeof paymentSchema>;

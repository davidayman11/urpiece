import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  phone: z.string().trim().max(20).optional().default(""),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(100),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().max(20).optional().default(""),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().default(""),
  fullName: z.string().trim().min(2, "Enter the recipient's name").max(80),
  phone: z.string().trim().min(6, "Enter a phone number").max(20),
  governorate: z.string().trim().max(60).optional().default(""),
  city: z.string().trim().max(60).optional().default(""),
  building: z.string().trim().max(80).optional().default(""),
  street: z.string().trim().max(160).optional().default(""),
  notes: z.string().trim().max(200).optional().default(""),
  isDefault: z.boolean().optional().default(false),
});

export const firstError = (e: z.ZodError) => e.issues[0]?.message || "Invalid input";

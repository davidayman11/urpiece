import { z } from "zod";
import type { TFunction } from "@/lib/texts/types";

export const registerSchema = (t: TFunction) => z.object({
  name: z.string().trim().min(2, t("account.val.name")).max(80),
  email: z.string().trim().toLowerCase().email(t("account.val.email")).max(120),
  phone: z.string().trim().max(20).optional().default(""),
  password: z.string().min(8, t("account.val.password")).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(100),
});

export const profileSchema = (t: TFunction) => z.object({
  name: z.string().trim().min(2, t("account.val.name")).max(80),
  phone: z.string().trim().max(20).optional().default(""),
});

export const passwordSchema = (t: TFunction) => z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, t("account.val.newPassword")).max(100),
});

export const addressSchema = (t: TFunction) => z.object({
  label: z.string().trim().max(40).optional().default(""),
  fullName: z.string().trim().min(2, t("account.val.recipient")).max(80),
  phone: z.string().trim().min(6, t("account.val.phone")).max(20),
  governorate: z.string().trim().max(60).optional().default(""),
  city: z.string().trim().max(60).optional().default(""),
  building: z.string().trim().max(80).optional().default(""),
  street: z.string().trim().max(160).optional().default(""),
  notes: z.string().trim().max(200).optional().default(""),
  isDefault: z.boolean().optional().default(false),
});

export const firstError = (e: z.ZodError, t: TFunction) => e.issues[0]?.message || t("account.api.invalid");

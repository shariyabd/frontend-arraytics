import type { ContactInput, Gender } from '../api/types'

export const GENDERS: Gender[] = ['Male', 'Female', 'Other']

const PHONE_RE = /^\+?(?=(?:.*\d){7,})[0-9\s\-()]{7,}$/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export function validateEmail(value: string): string | undefined {
  const v = value.trim()
  if (!v) return 'Email is required.'
  if (v.length > 255) return 'Email may not be longer than 255 characters.'
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.'
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required.'
}

export function validateNewPassword(value: string): string | undefined {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return 'Please confirm your password.'
  if (password !== confirmation) return 'Passwords do not match.'
}

export function validateName(value: string): string | undefined {
  const v = value.trim()
  if (!v) return 'Name is required.'
  if (v.length > 255) return 'Name may not be longer than 255 characters.'
}

function validatePhone(value: string): string | undefined {
  const v = value.trim()
  if (!v) return 'Phone is required.'
  if (v.length > 30) return 'Phone may not be longer than 30 characters.'
  if (!PHONE_RE.test(v))
    return 'Use digits (7+), optional +, spaces, dashes or parentheses.'
}

function validateWebsite(value: string): string | undefined {
  const v = value.trim()
  if (!v) return undefined
  if (v.length > 255) return 'Website may not be longer than 255 characters.'
  try {

    new URL(v)
  } catch {
    return 'Enter a valid URL (including http:// or https://).'
  }
}

function validateGender(value: string): string | undefined {
  if (!value) return 'Gender is required.'
  if (!GENDERS.includes(value as Gender)) return 'Select a valid gender.'
}

function validateAge(value: string): string | undefined {
  if (value === '' || value == null) return 'Age is required.'
  if (!/^\d+$/.test(String(value))) return 'Age must be a whole number.'
  const n = Number(value)
  if (n < 1 || n > 150) return 'Age must be between 1 and 150.'
}

function validateNationality(value: string): string | undefined {
  const v = value.trim()
  if (!v) return 'Nationality is required.'
  if (v.length > 255)
    return 'Nationality may not be longer than 255 characters.'
}

export interface ContactFormValues {
  name: string
  phone: string
  email: string
  website: string
  gender: string
  age: string
  nationality: string
}

export function validateContactForm(
  v: ContactFormValues,
): FieldErrors<ContactFormValues> {
  const errors: FieldErrors<ContactFormValues> = {}
  errors.name = validateName(v.name)
  errors.phone = validatePhone(v.phone)
  errors.email = validateEmail(v.email)
  errors.website = validateWebsite(v.website)
  errors.gender = validateGender(v.gender)
  errors.age = validateAge(v.age)
  errors.nationality = validateNationality(v.nationality)

  ;(Object.keys(errors) as (keyof ContactFormValues)[]).forEach((k) => {
    if (!errors[k]) delete errors[k]
  })
  return errors
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0
}

export function toContactInput(v: ContactFormValues): ContactInput {
  const website = v.website.trim()
  return {
    name: v.name.trim(),
    phone: v.phone.trim(),
    email: v.email.trim(),
    website: website ? website : null,
    gender: v.gender as Gender,
    age: Number(v.age),
    nationality: v.nationality.trim(),
  }
}

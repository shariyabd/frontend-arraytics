import { describe, it, expect } from 'vitest'
import {
  validateName,
  validateEmail,
  validateContactForm,
  hasErrors,
  toContactInput,
  GENDERS,
  type ContactFormValues,
} from './validation'

// The per-field validators for phone/website/gender/age/nationality are not
// exported, so they are exercised through validateContactForm by building a
// fully-valid base and overriding one field at a time.
const VALID: ContactFormValues = {
  name: 'Jane Doe',
  phone: '+1 555 123 4567',
  email: 'jane@example.com',
  website: 'https://example.com',
  gender: 'Female',
  age: '30',
  nationality: 'Canada',
}

function errorsFor(overrides: Partial<ContactFormValues>) {
  return validateContactForm({ ...VALID, ...overrides })
}

describe('validateName', () => {
  it('accepts a normal name', () => {
    expect(validateName('Jane Doe')).toBeUndefined()
  })
  it('requires a value', () => {
    expect(validateName('')).toBe('Name is required.')
    expect(validateName('   ')).toBe('Name is required.')
  })
  it('rejects names longer than 255 characters', () => {
    expect(validateName('a'.repeat(256))).toBe(
      'Name may not be longer than 255 characters.',
    )
  })
  it('accepts a name exactly 255 characters', () => {
    expect(validateName('a'.repeat(255))).toBeUndefined()
  })
})

describe('validateEmail', () => {
  it('accepts a valid email', () => {
    expect(validateEmail('jane@example.com')).toBeUndefined()
  })
  it('requires a value', () => {
    expect(validateEmail('')).toBe('Email is required.')
  })
  it.each(['plainaddress', 'no-at-sign.com', 'foo@bar', 'foo @bar.com'])(
    'rejects invalid email %s',
    (value) => {
      expect(validateEmail(value)).toBe('Enter a valid email address.')
    },
  )
  it('rejects emails longer than 255 characters', () => {
    const long = `${'a'.repeat(250)}@b.com`
    expect(validateEmail(long)).toBe(
      'Email may not be longer than 255 characters.',
    )
  })
})

describe('phone validation (via validateContactForm)', () => {
  it('accepts valid phone numbers', () => {
    for (const phone of [
      '+1 555 123 4567',
      '5551234567',
      '(555) 123-4567',
      '+1 (555) 123-4567',
    ]) {
      expect(errorsFor({ phone }).phone).toBeUndefined()
    }
  })
  it('requires a value', () => {
    expect(errorsFor({ phone: '' }).phone).toBe('Phone is required.')
  })
  it('rejects phones that fail the regex', () => {
    for (const phone of ['12345', 'abcdefg', '+']) {
      expect(errorsFor({ phone }).phone).toBe(
        'Use digits (7+), optional +, spaces, dashes or parentheses.',
      )
    }
  })
  it('rejects phones without digits (mirrors backend digit requirement)', () => {
    for (const phone of ['-------', '(((----)))', '  -  -  -  ']) {
      expect(errorsFor({ phone }).phone).toBe(
        'Use digits (7+), optional +, spaces, dashes or parentheses.',
      )
    }
  })
  it('rejects phones longer than 30 characters', () => {
    expect(errorsFor({ phone: '1'.repeat(31) }).phone).toBe(
      'Phone may not be longer than 30 characters.',
    )
  })
})

describe('website validation (via validateContactForm)', () => {
  it('is optional — empty is valid', () => {
    expect(errorsFor({ website: '' }).website).toBeUndefined()
  })
  it('accepts valid URLs', () => {
    for (const website of ['https://example.com', 'http://a.b/path?x=1']) {
      expect(errorsFor({ website }).website).toBeUndefined()
    }
  })
  it('rejects invalid URLs', () => {
    for (const website of ['not a url', 'example.com']) {
      expect(errorsFor({ website }).website).toBe(
        'Enter a valid URL (including http:// or https://).',
      )
    }
  })
  it('rejects URLs longer than 255 characters', () => {
    const long = `https://example.com/${'a'.repeat(250)}`
    expect(errorsFor({ website: long }).website).toBe(
      'Website may not be longer than 255 characters.',
    )
  })
})

describe('gender validation (via validateContactForm)', () => {
  it('accepts every enum value', () => {
    for (const gender of GENDERS) {
      expect(errorsFor({ gender }).gender).toBeUndefined()
    }
  })
  it('requires a value', () => {
    expect(errorsFor({ gender: '' }).gender).toBe('Gender is required.')
  })
  it('rejects values outside the enum', () => {
    for (const gender of ['male', 'Unknown', 'X']) {
      expect(errorsFor({ gender }).gender).toBe('Select a valid gender.')
    }
  })
})

describe('age validation (via validateContactForm)', () => {
  it('accepts boundary values 1 and 150', () => {
    expect(errorsFor({ age: '1' }).age).toBeUndefined()
    expect(errorsFor({ age: '150' }).age).toBeUndefined()
  })
  it('requires a value', () => {
    expect(errorsFor({ age: '' }).age).toBe('Age is required.')
  })
  it('rejects out-of-range 0 and 151', () => {
    expect(errorsFor({ age: '0' }).age).toBe('Age must be between 1 and 150.')
    expect(errorsFor({ age: '151' }).age).toBe('Age must be between 1 and 150.')
  })
  it('rejects non-numeric values', () => {
    for (const age of ['abc', '1.5', '-3']) {
      expect(errorsFor({ age }).age).toBe('Age must be a whole number.')
    }
  })
})

describe('nationality validation (via validateContactForm)', () => {
  it('accepts a normal value', () => {
    expect(errorsFor({ nationality: 'Canada' }).nationality).toBeUndefined()
  })
  it('requires a value', () => {
    expect(errorsFor({ nationality: '' }).nationality).toBe(
      'Nationality is required.',
    )
  })
  it('rejects values longer than 255 characters', () => {
    expect(errorsFor({ nationality: 'a'.repeat(256) }).nationality).toBe(
      'Nationality may not be longer than 255 characters.',
    )
  })
})

describe('validateContactForm aggregation', () => {
  it('returns no errors for a fully valid form', () => {
    const errors = validateContactForm(VALID)
    expect(hasErrors(errors)).toBe(false)
    expect(errors).toEqual({})
  })
  it('collects errors across multiple invalid fields', () => {
    const errors = validateContactForm({
      ...VALID,
      name: '',
      email: 'nope',
      age: '0',
    })
    expect(hasErrors(errors)).toBe(true)
    expect(errors.name).toBeDefined()
    expect(errors.email).toBeDefined()
    expect(errors.age).toBeDefined()
    expect(errors.phone).toBeUndefined()
  })
})

describe('hasErrors', () => {
  it('is false for an empty error object', () => {
    expect(hasErrors({})).toBe(false)
  })
  it('is true when at least one error is present', () => {
    expect(hasErrors({ name: 'Name is required.' })).toBe(true)
  })
})

describe('toContactInput', () => {
  it('trims fields, coerces age to number and normalises website', () => {
    const input = toContactInput({
      name: '  Jane Doe  ',
      phone: ' 5551234567 ',
      email: '  jane@example.com ',
      website: '',
      gender: 'Female',
      age: '30',
      nationality: '  Canada ',
    })
    expect(input).toEqual({
      name: 'Jane Doe',
      phone: '5551234567',
      email: 'jane@example.com',
      website: null,
      gender: 'Female',
      age: 30,
      nationality: 'Canada',
    })
  })
  it('keeps a non-empty website value', () => {
    expect(toContactInput(VALID).website).toBe('https://example.com')
  })
})

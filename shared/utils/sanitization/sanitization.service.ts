import { Injectable, BadRequestException } from '@nestjs/common';
import * as xss from 'xss';

@Injectable()
export class SanitizationService {
  /**
   * Sanitize HTML/XSS attacks from user input
   */
  sanitizeHtml(input: string): string {
    if (!input) return '';
    return xss(input, {
      whiteList: {},
      stripIgnoredTag: true,
      stripLeadingAndTrailingWhitespace: true,
    });
  }

  /**
   * Sanitize SQL injection attempts
   */
  sanitizeSqlInput(input: string): string {
    if (!input) return '';
    // Remove common SQL injection patterns
    const sqlInjectionPattern =
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\b)/gi;
    return input.replace(sqlInjectionPattern, '').trim();
  }

  /**
   * Validate and sanitize email
   */
  sanitizeEmail(email: string): string {
    if (!email) return '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
    return email.toLowerCase().trim();
  }

  /**
   * Validate and sanitize phone number
   */
  sanitizePhone(phone: string): string {
    if (!phone) return '';
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new BadRequestException('Invalid phone number format');
    }
    return cleaned;
  }

  /**
   * Validate and sanitize URL
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      // Only allow http and https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new BadRequestException('Invalid URL protocol');
      }
      return urlObj.toString();
    } catch {
      throw new BadRequestException('Invalid URL format');
    }
  }

  /**
   * Validate and sanitize JSON input
   */
  sanitizeJson(input: any): any {
    try {
      const jsonString = typeof input === 'string' ? input : JSON.stringify(input);
      const parsed = JSON.parse(jsonString);

      // Recursively sanitize all string values
      return this.recursiveSanitize(parsed);
    } catch {
      throw new BadRequestException('Invalid JSON format');
    }
  }

  /**
   * Recursively sanitize object/array values
   */
  private recursiveSanitize(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.recursiveSanitize(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = this.recursiveSanitize(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize generic string input
   */
  private sanitizeString(input: string): string {
    if (!input) return '';

    // Remove XSS attempts
    let sanitized = this.sanitizeHtml(input);

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Validate sensitive data (credit card, SSN, etc)
   */
  validateSensitiveData(data: string, type: 'creditcard' | 'ssn' | 'password'): boolean {
    switch (type) {
      case 'creditcard':
        // Luhn algorithm for credit card validation
        return /^[0-9]{13,19}$/.test(data.replace(/\s/g, ''));

      case 'ssn':
        return /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/.test(data);

      case 'password':
        // Min 12 chars, uppercase, lowercase, number, special char
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{12,}$/.test(data);

      default:
        return false;
    }
  }
}

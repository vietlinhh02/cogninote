import Joi from 'joi';

export class ValidationUtil {
  /**
   * Validate email format
   */
  static validateEmail(email: string): { valid: boolean; message?: string } {
    const schema = Joi.string().email().required();
    const { error } = schema.validate(email);

    if (error) {
      return {
        valid: false,
        message: 'Invalid email format',
      };
    }

    return { valid: true };
  }

  /**
   * Validate registration data
   */
  static validateRegister(data: {
    email: string;
    password: string;
    fullName?: string;
  }): { valid: boolean; message?: string } {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      fullName: Joi.string().optional().allow(null, ''),
    });

    const { error } = schema.validate(data);

    if (error) {
      return {
        valid: false,
        message: error.details[0].message,
      };
    }

    return { valid: true };
  }

  /**
   * Validate login data
   */
  static validateLogin(data: { email: string; password: string }): { valid: boolean; message?: string } {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { error } = schema.validate(data);

    if (error) {
      return {
        valid: false,
        message: error.details[0].message,
      };
    }

    return { valid: true };
  }
}

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Accepts a number or a string that parses to a finite number.
 * Used for public/externally-driven payloads (e.g. lead forms) where a
 * formatted value like "12500" must not be rejected outright.
 */
export function IsLooseNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLooseNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value === 'number') return Number.isFinite(value);
          if (typeof value === 'string') {
            const cleaned = value.replace(/[\s,]/g, '');
            return cleaned !== '' && Number.isFinite(Number(cleaned));
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a number or a numeric string`;
        },
      },
    });
  };
}

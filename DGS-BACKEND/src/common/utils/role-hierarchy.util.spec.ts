import { canTouchSystemUser, isSelf } from './role-hierarchy.util';

describe('role-hierarchy.util', () => {
  describe('isSelf', () => {
    it('returns true when the ids match', () => {
      expect(isSelf(1, 1)).toBe(true);
      expect(isSelf(7, 7)).toBe(true);
    });

    it('compares numeric strings as numbers', () => {
      expect(isSelf('5' as unknown as number, 5)).toBe(true);
    });

    it('returns false for different ids', () => {
      expect(isSelf(1, 2)).toBe(false);
      expect(isSelf(2, 1)).toBe(false);
    });
  });

  describe('canTouchSystemUser', () => {
    it('allows only the owner role', () => {
      expect(canTouchSystemUser('owner')).toBe(true);
      expect(canTouchSystemUser('OWNER')).toBe(true);
      expect(canTouchSystemUser('admin')).toBe(false);
      expect(canTouchSystemUser('editor')).toBe(false);
    });

    it('returns false when the role name is empty', () => {
      expect(canTouchSystemUser('')).toBe(false);
      expect(canTouchSystemUser(undefined as unknown as string)).toBe(false);
    });
  });
});

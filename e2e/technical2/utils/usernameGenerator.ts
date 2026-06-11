export const USERNAME_REGEX = /^qa_user_[a-z0-9]{6,14}$/;

export function generateUsername(): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const username = `qa_user_${suffix}`.toLowerCase();

  if (!USERNAME_REGEX.test(username) || /basia/i.test(username)) {
    throw new Error(`Generated username is invalid: ${username}`);
  }

  return username;
}

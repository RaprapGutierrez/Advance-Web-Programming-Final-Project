export interface Account {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const KEY = "studiospace_accounts";

// Demo owner account (test mode only)
export const OWNER = { email: "owner@studiospace.test", password: "owner123" };

export function getAccounts(): Account[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addAccount(a: Account) {
  localStorage.setItem(KEY, JSON.stringify([...getAccounts(), a]));
}

export function emailTaken(email: string) {
  const e = email.trim().toLowerCase();
  return e === OWNER.email || getAccounts().some((a) => a.email === e);
}

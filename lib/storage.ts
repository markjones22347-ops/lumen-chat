const USER_KEY = 'lumen_user';
const GROUP_KEY = 'lumen_group';

export const storage = {
  getUser: (): { id: string; nickname: string } | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: { id: string; nickname: string }): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getGroup: (): { id: string; name: string; code: string } | null => {
    if (typeof window === 'undefined') return null;
    const group = localStorage.getItem(GROUP_KEY);
    return group ? JSON.parse(group) : null;
  },

  setGroup: (group: { id: string; name: string; code: string }): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(GROUP_KEY, JSON.stringify(group));
  },

  clearGroup: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(GROUP_KEY);
  },

  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(GROUP_KEY);
  },
};

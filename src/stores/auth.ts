import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { mergeParsed, safeJSONStorage } from './persistence';

const STORAGE_KEY = 'bigdo-auth';

export const Role = z.enum(['admin', 'member']);
export type Role = z.infer<typeof Role>;

export const User = z.object({
  name: z.string().min(1),
  email: z.email(),
  role: Role,
});
export type User = z.infer<typeof User>;

export const DEMO_USERS: Record<Role, User> = {
  [Role.enum.admin]: { name: 'Sanford Chin', email: 'sanford@example.com', role: Role.enum.admin },
  [Role.enum.member]: { name: 'Vasco Monteiro', email: 'vasco@example.com', role: Role.enum.member },
};

const AuthData = z.object({
  user: User.nullable().catch(null),
  editMode: z.boolean().catch(false),
});
type AuthData = z.infer<typeof AuthData>;

interface AuthState extends AuthData {
  login: (user: User) => void;
  logout: () => void;
  setEditMode: (on: boolean) => void;
}

const DEFAULTS: AuthData = AuthData.parse({});

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      login: (user) => set({ user, editMode: false }),
      logout: () => set({ user: null, editMode: false }),
      setEditMode: (on) => set(({ user }) => ({ editMode: on && user?.role === Role.enum.admin })),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: safeJSONStorage<AuthData>(),
      partialize: ({ user, editMode }): AuthData => ({ user, editMode }),
      migrate: (persisted) => {
        const { user, editMode } = AuthData.parse(persisted ?? {});
        return { user: user && DEMO_USERS[user.role], editMode };
      },
      merge: mergeParsed(AuthData, () => DEFAULTS),
    },
  ),
);

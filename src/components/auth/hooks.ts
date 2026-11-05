import { Role, useAuth } from '~/stores/auth';

export const useUser = () => useAuth((s) => s.user);

export const useRole = () => useAuth((s) => s.user?.role);

export const useIsAdmin = () => useAuth((s) => s.user?.role === Role.enum.admin);

export const useCanEdit = () => useAuth((s) => s.editMode && s.user?.role === Role.enum.admin);

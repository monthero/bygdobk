const loadClient = async () => (await import('./instance')).supabase;

let client: ReturnType<typeof loadClient> | undefined;

export const getSupabase = () => (client ??= loadClient());

export type Supabase = Awaited<ReturnType<typeof getSupabase>>;

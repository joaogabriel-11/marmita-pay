export type AdminSession = {
  id: string;
  nome: string;
  email: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  return null;
}

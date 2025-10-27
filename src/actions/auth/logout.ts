import { cookies } from 'next/headers';
import { logoutHistorialSesion } from './histotial_login';

export const logout = async () => {
  'use server';
  (await logoutHistorialSesion());
  (await cookies()).delete('token');
};

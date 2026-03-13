import { cookies } from 'next/headers';
import { logoutHistorialSesion } from './histotial_login';
import { redirect } from 'next/navigation';

export const logout = async () => {
  'use server';
  (await logoutHistorialSesion());
  (await cookies()).delete('token');
  redirect('/login');
};

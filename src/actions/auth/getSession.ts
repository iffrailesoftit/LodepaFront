'use server';

import { User } from '@/interface/user';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const getSession = async () => {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    redirect('/login'); // Redirige si no hay token
  }
  if (!process.env.JWT_SECRET) {
    throw new Error(
      'La clave JWT_SECRET no está definida en las variables de entorno.'
    );
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as User;
    // console.log({ token: decoded });
    return decoded;
  } catch (error) {
    console.error('Error al verificar el token:', error);
    redirect('/login'); // Redirige si el token es inválido o expiró
  }
};

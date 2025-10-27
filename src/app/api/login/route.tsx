import { guardarHistorialSesion } from '@/actions/auth/histotial_login';
import { executeQuery } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  apellido: string;
  rol: number;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();


    // Verificar que el email y la contraseña están presentes
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Faltan credenciales' },
        { status: 400 }
      );
    }

    const result = await executeQuery('SELECT * FROM usuarios where email = ?', [
      email,
    ]);
    const users = result[0] as User[];
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    // console.log({ user })
    // Verificar la contraseña
    const isPasswordValid = user.password === password;
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error(
        'La clave JWT_SECRET no está definida en las variables de entorno.'
      );
    }

    const expirationTime = 3600; // 1 hora de expiración para la cookie y el token

    // Generar un token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        lastname: user.apellido,
        rol: user.rol,
      }, //al lado ortro campo para el token
      process.env.JWT_SECRET,
      {
        expiresIn: expirationTime,
      }
    );


    // console.log({ token })
    // Configurar el token como cookie
    const response = NextResponse.json({ message: 'Inicio de sesión exitoso' });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true, // TODO: habilitar esta opción en producción cuando se tengo un certificado SSL (https)
      maxAge: expirationTime,
      path: '/',
    });

    const { iat, exp } = jwt.decode(token) as jwt.JwtPayload;

    // Añadir Registro de sesión
    // console.log("token", iat)
    // const fechaEmision = new Date((Number(iat)) * 1000);
    // console.log('Emitido en:', fechaEmision.toISOString());

    await guardarHistorialSesion(user.id,Number(iat),Number(exp),token);


    // console.log(response)
    return response;
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

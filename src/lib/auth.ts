'use server';

import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectToDatabase } from './mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { User } from './data';
import { ObjectId } from 'mongodb';

const secretKey = process.env.AUTH_SECRET;
const key = new TextEncoder().encode(secretKey);

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});


export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch(e) {
    return null;
  }
}

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const { db } = await connectToDatabase();
  
  const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields.' };
  }
  
  const { email, password } = validatedFields.data;

  const user = await db.collection('users').findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Invalid email or password.' };
  }

  const session = {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  // Encrypt the session
  const encryptedSession = await encrypt(session);

  // Save the session in a cookie
  cookies().set('session', encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: session.expires,
    path: '/',
  });
  
  redirect('/dashboard');
}

export async function signup(prevState: { error: string } | undefined, formData: FormData) {
  const { db } = await connectToDatabase();
  
  const validatedFields = SignupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
      return { error: 'Invalid fields.' };
  }
  
  const { name, email, password } = validatedFields.data;
  
  const existingUser = await db.collection('users').findOne({ email });
  if (existingUser) {
    return { error: 'User with this email already exists.' };
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const randomAvatarSeed = Math.floor(Math.random() * 1000);

  await db.collection('users').insertOne({
    name,
    email,
    password: hashedPassword,
    avatarUrl: `https://picsum.photos/seed/${100 + randomAvatarSeed}/100/100`,
    createdAt: new Date(),
  });
  
  // After signup, automatically log the user in
  return login(undefined, formData);
}

export async function logout() {
  // Destroy the session
  cookies().set('session', '', { expires: new Date(0) });
  revalidatePath('/');
  redirect('/login');
}

export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  try {
    const decrypted = await decrypt(sessionCookie);
    if (decrypted && decrypted.user) {
       // Re-serialize user object to ensure it's a plain object
      return {
        ...decrypted,
        user: {
          id: decrypted.user.id,
          name: decrypted.user.name,
          email: decrypted.user.email,
          avatarUrl: decrypted.user.avatarUrl,
        } as User
      };
    }
    return null;
  } catch(e) {
    console.error("Session decryption failed:", e);
    return null;
  }
}

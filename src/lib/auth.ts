'use server';

import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectToDatabase } from './mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { User } from './data';
import { ObjectId } from 'mongodb';
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error('AUTH_SECRET environment variable is not set. Please add it to your .env file.');
}
const key = new TextEncoder().encode(secretKey);

async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}

async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (e) {
    return null; // Token is invalid or expired
  }
}


const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});


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

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    expires,
  };
  
  const sessionCookie = await encrypt(session);

  cookies().set('session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
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
  cookies().set('session', '', { expires: new Date(0), path: '/' });
  revalidatePath('/');
  redirect('/login');
}

export async function getSession() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;
  
  const session = await decrypt(sessionCookie);

  if (!session) return null;
  
  // Check if session is expired
  if (new Date(session.expires) < new Date()) {
    return null;
  }
  
  return session;
}

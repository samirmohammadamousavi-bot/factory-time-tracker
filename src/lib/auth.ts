import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './prisma';

interface AppToken {
  role?: string;
  workerId?: string;
  nationalId?: string;
}

declare module 'next-auth' {
  interface User {
    role: string;
    nationalId: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      nationalId: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Worker Login',
      credentials: {
        nationalId: { label: 'کد ملی', type: 'text' },
        password: { label: 'رمز عبور', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.nationalId || !credentials?.password) return null;

        const worker = await db.orm.public.Worker
          .where({ nationalId: credentials.nationalId as string })
          .first();

        if (!worker || !worker.isActive) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          worker.passwordHash
        );
        if (!valid) return null;

        return {
          id: String(worker.id),
          name: `${worker.firstName} ${worker.lastName}`,
          role: worker.role,
          nationalId: worker.nationalId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const t = token as AppToken;
        t.role = user.role;
        t.workerId = user.id;
        t.nationalId = user.nationalId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as AppToken;
        session.user.id = t.workerId ?? '';
        session.user.role = t.role ?? '';
        session.user.nationalId = t.nationalId ?? '';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  trustHost: true,
});
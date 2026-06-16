import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb } from './db';

export const authOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const db = await getDb();
        const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(credentials.email.toLowerCase());
        if (!user) return null;
        const ok = bcrypt.compareSync(credentials.password, user.password_hash);
        if (!ok) return null;
        if (user.status === 'suspended') return null;
        // For new clients, allow login only if accepted
        if (user.role === 'user' && user.status !== 'accepted') return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status, isSuperAdmin: !!user.is_super_admin };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.isSuperAdmin = user.isSuperAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.isSuperAdmin = token.isSuperAdmin;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getCurrentUser(req) {
  // Helper for API routes (not used directly here — we use getServerSession)
  return null;
}

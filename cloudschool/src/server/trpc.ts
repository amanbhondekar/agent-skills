import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId: string;
};

export async function createTRPCContext() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  return { session, user, prisma, institutionId: user?.institutionId ?? null };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router      = t.router;
export const publicProc  = t.procedure;

export const protectedProc = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.institutionId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user, institutionId: ctx.institutionId } });
});

export const adminProc = protectedProc.use(({ ctx, next }) => {
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

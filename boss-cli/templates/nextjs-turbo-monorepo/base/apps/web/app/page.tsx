import { Button } from "@repo/ui/components/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">
          Welcome to {{PROJECT_NAME}}
        </h1>
        <p className="mb-8">
          Next.js 15 Turborepo monorepo with shadcn/ui, Prisma, tRPC, NextAuth, and more.
        </p>
        <Button>Get Started</Button>
      </div>
    </main>
  );
}

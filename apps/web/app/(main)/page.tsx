// import { Suspense } from 'react';
import { Hero } from '@/components/hero';
import { HydrateClient, prefetch, trpc } from '@/trpc/server';
// import { ClientGreeting } from '@/components/client-greeting';

export default function Page() {
  prefetch(trpc.hello.queryOptions({ text: 'world' }));

  return (
    <HydrateClient>
      <div className="flex min-h-svh pt-14 p-6">
        <Hero />
      </div>
      {/* <Suspense fallback={<div>Loading...</div>}>
        <ClientGreeting />
      </Suspense> */}
    </HydrateClient>
  );
}

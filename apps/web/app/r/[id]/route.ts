// In-memory fallback store for when Redis is not configured (dev/preview)
const memStore = new Map<string, { value: string; expires: number }>();

function memSet(key: string, value: string, ttlSeconds: number) {
  memStore.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

function memGet(key: string): string | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}

const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

async function storeRegistry(key: string, value: object) {
  if (hasRedis) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    // Store as string so Upstash returns it as-is (no double-parse)
    await redis.set(key, JSON.stringify(value), { ex: 60 * 60 * 12 });
  } else {
    memSet(key, JSON.stringify(value), 60 * 60 * 12);
  }
}

async function getRegistry(key: string): Promise<string | object | null> {
  if (hasRedis) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const val = await redis.get(key);
    return val ?? null;
  }
  return memGet(key);
}

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registryId = id.endsWith(".json") ? id.slice(0, -5) : id;

  try {
    const raw = await getRegistry(registryId);
    if (!raw) {
      return new Response(JSON.stringify({ error: "Registry item not found" }), {
        status: 404,
        headers: responseHeaders,
      });
    }
    // Upstash auto-parses JSON strings into objects; normalize to string
    let value: string;
    if (typeof raw === "string") {
      // memStore or raw string from Redis
      try {
        JSON.parse(raw);
        value = raw;
      } catch {
        value = JSON.stringify(raw);
      }
    } else {
      // Upstash returned a parsed object
      value = JSON.stringify(raw);
    }
    return new Response(value, { status: 200, headers: responseHeaders });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: responseHeaders,
    });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { registryDependencies, dependencies, files, name } = body;
    const { id: key } = await params;

    const isDev = process.env.NODE_ENV === "development";
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (isDev ? "http://localhost:3000" : "https://designcn.vercel.app");

    const registry = {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      homepage: baseUrl,
      author: `designcn (${baseUrl})`,
      name,
      dependencies,
      registryDependencies,
      type: "registry:block",
      files,
      registry: `${baseUrl}/r/registry.json`,
    };

    await storeRegistry(key, registry);

    return new Response(
      JSON.stringify({
        data: { id: `${baseUrl}/r/${key}.json` },
        error: null,
      }),
      { status: 200, headers: responseHeaders },
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        data: null,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: responseHeaders },
    );
  }
}

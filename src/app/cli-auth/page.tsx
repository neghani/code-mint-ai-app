import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { createApiToken } from "@/lib/api-token";
import { Header } from "@/components/header";

const SAFE_PORT_MIN = 1024;
const SAFE_PORT_MAX = 65535;

function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= SAFE_PORT_MIN && port <= SAFE_PORT_MAX;
}

export default async function CliAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ port?: string }>;
}) {
  const session = await getSession();
  const { port: portParam } = await searchParams;

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/cli-auth" + (portParam ? `?port=${portParam}` : ""))}`);
  }

  const port = portParam ? parseInt(portParam, 10) : null;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-semibold text-white">Authorize CLI</h1>
        <p className="mt-2 text-gray-400">
          Generate a token for the CodeMintAI CLI. The token will be sent to your local CLI once.
        </p>

        <div className="mt-8 rounded-lg border border-charcoal-700 bg-charcoal-800/50 p-6">
          <p className="text-sm text-gray-400">
            Logged in as <span className="text-white">{session.email}</span>.
          </p>
          <form action={createTokenAction} className="mt-6 space-y-4">
            {portParam === undefined && (
              <div>
                <label htmlFor="port" className="block text-sm text-gray-400">
                  Port (CLI is listening on)
                </label>
                <input
                  id="port"
                  name="port"
                  type="number"
                  min={SAFE_PORT_MIN}
                  max={SAFE_PORT_MAX}
                  placeholder="e.g. 38472"
                  className="input-field mt-1"
                  required
                />
              </div>
            )}
            {portParam !== undefined && <input type="hidden" name="port" value={portParam} />}
            <button type="submit" className="btn-mint w-full">
              Generate token and authorize CLI
            </button>
          </form>
          {portParam !== undefined && port != null && !isValidPort(port) && (
            <p className="mt-4 text-sm text-amber-400">
              Invalid port. Use <code className="rounded bg-charcoal-700 px-1">?port=PORT</code> (e.g. 38472).
            </p>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Your CLI should open:{" "}
          <code className="rounded bg-charcoal-800 px-2 py-1 text-mint-400">
            {baseUrl}/cli-auth?port=PORT
          </code>
          <br />
          After you click above, the browser will redirect to localhost with the token. Store it and use:{" "}
          <code className="rounded bg-charcoal-800 px-2 py-1">Authorization: Bearer TOKEN</code>
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Then install rules or skills from Explore:{" "}
          <code className="rounded bg-charcoal-800 px-2 py-1 text-mint-400">
            codemint add @rule/&lt;slug&gt;
          </code>
          {" "}or{" "}
          <code className="rounded bg-charcoal-800 px-2 py-1 text-mint-400">
            codemint add @skill/&lt;slug&gt;
          </code>
          . Use &quot;Copy add command&quot; on any rule/skill that has a slug.
        </p>
        <Link href="/explore" className="mt-6 inline-block text-sm text-gray-500 hover:text-gray-400">
          ← Back to Explore
        </Link>
      </main>
    </div>
  );
}

async function createTokenAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login?next=/cli-auth");

  const portParam = formData.get("port")?.toString() ?? "";
  const port = portParam ? parseInt(portParam, 10) : null;

  const { rawToken } = await createApiToken(session.userId, "CLI");

  if (port != null && isValidPort(port)) {
    const callbackUrl = `http://127.0.0.1:${port}/?token=${encodeURIComponent(rawToken)}`;
    redirect(callbackUrl);
  }

  redirect("/cli-auth?error=invalid_port");
}

"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Header } from "@/components/header";

type ItemType = "rule" | "prompt" | "skill";

type ItemDetail = {
  id: string;
  title: string;
  content: string;
  type: ItemType;
  visibility: string;
  createdAt?: string;
  slug?: string | null;
  catalogId?: string | null;
  catalogVersion?: string | null;
  metadata?: Record<string, unknown>;
  downloadCount?: number;
  copyCount?: number;
  tags?: { id: string; name: string; category: string }[];
};

function extractRepository(catalogId: string | null | undefined): string | null {
  if (!catalogId) return null;
  // Pattern: "owner/repo:slug" or "owner/repo/slug"
  const match = catalogId.match(/^([^/:]+)\/([^/:]+)/);
  return match ? `${match[1]}/${match[2]}` : catalogId;
}

function formatWeeklyInstalls(
  metadata: Record<string, unknown> | undefined,
  downloadCount: number | undefined,
  copyCount: number | undefined
): string {
  // Check metadata first
  if (metadata?.weeklyInstalls && typeof metadata.weeklyInstalls === "number") {
    const value = metadata.weeklyInstalls;
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }
  // Fallback: calculate from total uses (placeholder)
  const total = (downloadCount ?? 0) + (copyCount ?? 0);
  const weekly = total / 7;
  if (weekly >= 1000) {
    return `${(weekly / 1000).toFixed(1)}K`;
  }
  return Math.round(weekly).toString();
}

function formatDate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function CodeBlock({
  language,
  children,
}: {
  language?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md border border-charcoal-600 bg-charcoal-800 px-2.5 py-1.5 text-xs text-gray-400 hover:border-mint-500 hover:bg-charcoal-700 hover:text-mint-400 transition-colors"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Copied</span>
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          padding: "1rem",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          background: "#1e1e1e",
        }}
        codeTagProps={{
          style: {
            fontFamily: "var(--font-geist-mono), monospace",
          },
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;

  const from = searchParams.get("from");
  const backHref =
    from === "rules" || from === "skills" || from === "prompts" || from === "all"
      ? `/explore/${from}`
      : "/explore/skills";

  const { data, isLoading, error } = useQuery<ItemDetail>({
    queryKey: ["item", id],
    queryFn: async () => {
      const res = await fetch(`/api/items/${id}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to load item");
      }
      return res.json();
    },
    enabled: !!id,
  });

  const createdDate = formatDate(data?.createdAt);
  const repository = extractRepository(data?.catalogId);
  const weeklyInstalls = formatWeeklyInstalls(data?.metadata, data?.downloadCount, data?.copyCount);
  
  // Extract installed on platforms from metadata (placeholder data structure)
  const installedOn = data?.metadata?.installedOn as
    | Record<string, number>
    | undefined;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link href={backHref} className="text-sm text-gray-500 hover:text-gray-300">
          &larr; Back to catalog
        </Link>

        {isLoading && (
          <div className="mt-8 text-gray-500">Loading item…</div>
        )}

        {error && !isLoading && (
          <div className="mt-8 text-red-400">Failed to load item.</div>
        )}

        {data && !isLoading && (
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-charcoal-800 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {data.type}
                </span>
                {createdDate && (
                  <span className="text-xs text-gray-500">Created {createdDate}</span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-semibold text-white">{data.title}</h1>

              {data.tags && data.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.tags.map((t, index) => (
                    <span
                      key={t.id || `tag-${index}-${t.name}`}
                      className="rounded bg-charcoal-700 px-2 py-0.5 text-xs text-gray-300"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              {(data.type === "rule" || data.type === "skill") && data.slug && (
                <div className="mt-6 rounded-xl border border-charcoal-700 bg-charcoal-900 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    CLI add command
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="flex-1 rounded bg-charcoal-800 px-3 py-2 font-mono text-sm text-mint-400">
                      codemint add @{data.type}/{data.slug}
                    </code>
                  </div>
                </div>
              )}

              <section className="mt-6">
                <div className="rounded-xl border border-charcoal-700 bg-charcoal-900 p-6 md:p-8">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold text-white mt-8 mb-4 first:mt-0 border-b border-charcoal-700 pb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold text-white mt-7 mb-3 first:mt-0 border-b border-charcoal-700 pb-2">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-semibold text-white mt-6 mb-2 first:mt-0">
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-lg font-medium text-white mt-5 mb-2 first:mt-0">
                          {children}
                        </h4>
                      ),
                      p: ({ children }: { children?: React.ReactNode }) => {
                        // Check if children contains a pre element (code block)
                        const childrenArray = React.Children.toArray(children);
                        const hasPreBlock = childrenArray.some(
                          (child) =>
                            React.isValidElement(child) &&
                            (child.type === "pre" ||
                              (typeof child.type === "function" && child.type.name === "pre"))
                        );

                        // Don't wrap pre blocks in p tags
                        if (hasPreBlock) {
                          return <>{children}</>;
                        }

                        return (
                          <p className="text-gray-300 mb-4 leading-relaxed first:mt-0">
                            {children}
                          </p>
                        );
                      },
                      ul: ({ children }) => (
                        <ul className="list-disc text-gray-300 mb-4 space-y-2 ml-6 first:mt-0">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal text-gray-300 mb-4 space-y-2 ml-6 first:mt-0">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-300 leading-relaxed">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-gray-300">{children}</em>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-mint-400 hover:text-mint-300 hover:underline transition-colors"
                          target={href?.startsWith("http") ? "_blank" : undefined}
                          rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-mint-500/50 bg-charcoal-800/50 pl-4 py-2 italic text-gray-300 my-4 rounded-r">
                          {children}
                        </blockquote>
                      ),
                      hr: () => (
                        <hr className="border-charcoal-700 my-8" />
                      ),
                      table: ({ children }) => (
                        <div className="my-6 overflow-x-auto">
                          <table className="min-w-full border-collapse border border-charcoal-700 rounded-lg overflow-hidden">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-charcoal-800">{children}</thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="bg-charcoal-900/50">{children}</tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="border-b border-charcoal-700 hover:bg-charcoal-800/50 transition-colors">
                          {children}
                        </tr>
                      ),
                      th: ({ children }) => (
                        <th className="border border-charcoal-700 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-charcoal-700 px-4 py-3 text-sm text-gray-300">
                          {children}
                        </td>
                      ),
                      code: ({
                        inline,
                        className,
                        children,
                        ...props
                      }: {
                        inline?: boolean;
                        className?: string;
                        children?: React.ReactNode;
                      }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const language = match ? match[1] : undefined;

                        if (inline) {
                          return (
                            <code
                              className="bg-charcoal-800 text-mint-400 px-1.5 py-0.5 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        }

                        // For block code, return the code element - pre will handle wrapping
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }: { children?: React.ReactNode }) => {
                        // Extract code element from pre
                        if (children && React.isValidElement(children)) {
                          const codeElement = children as React.ReactElement<any>;
                          if (codeElement.type === "code" || codeElement.props?.className?.includes("language-")) {
                            const codeProps = codeElement.props || {};
                            const codeChildren = codeProps.children;
                            const className = codeProps.className || "";
                            const match = /language-(\w+)/.exec(className);
                            const language = match ? match[1] : undefined;

                            return <CodeBlock language={language}>{codeChildren}</CodeBlock>;
                          }
                        }
                        return <pre className="bg-charcoal-800 text-gray-200 p-4 rounded overflow-x-auto">{children}</pre>;
                      },
                    }}
                  >
                    {data.content}
                  </ReactMarkdown>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Weekly Installs */}
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                    WEEKLY INSTALLS
                  </h3>
                  <p className="text-2xl font-semibold text-white">{weeklyInstalls}</p>
                </div>

                {/* Repository */}
                {repository && (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                      REPOSITORY
                    </h3>
                    <p className="text-sm text-gray-300 break-all">{repository}</p>
                  </div>
                )}

                {/* First Seen */}
                {createdDate && (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                      FIRST SEEN
                    </h3>
                    <p className="text-sm text-gray-300">{createdDate}</p>
                  </div>
                )}

                {/* Slug */}
                {data.slug && (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                      SLUG
                    </h3>
                    <p className="text-sm text-gray-300 font-mono">{data.slug}</p>
                  </div>
                )}

                {/* Installed On */}
                {installedOn && Object.keys(installedOn).length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">
                      INSTALLED ON
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(installedOn)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([platform, count]) => (
                          <div key={platform} className="flex justify-between items-center">
                            <span className="text-sm text-gray-300">{platform}</span>
                            <span className="text-sm text-gray-500">
                              {typeof count === "number" && count >= 1000
                                ? `${(count / 1000).toFixed(1)}K`
                                : count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}


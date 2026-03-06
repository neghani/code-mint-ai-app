"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Header } from "@/components/header";

type Tag = { id: string; name: string; category: string };
type Org = { id: string; name: string };

const MAX_TAGS = 20;

// Custom Radio Button Component
function RadioButton({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`relative flex cursor-pointer rounded-lg border-2 p-3 transition-all flex-1 ${
        checked
          ? "border-mint-500 bg-mint-500/10"
          : "border-charcoal-700 bg-charcoal-800/50 hover:border-charcoal-600"
      }`}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div
          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            checked ? "border-mint-500" : "border-charcoal-600"
          }`}
        >
          {checked && (
            <div className="h-2 w-2 rounded-full bg-mint-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{label}</div>
          {description && (
            <div className="mt-0.5 text-xs text-gray-400 truncate">{description}</div>
          )}
        </div>
      </div>
    </label>
  );
}

// Code Block Component for Preview
function CodeBlock({
  language,
  children,
}: {
  language?: string;
  children?: React.ReactNode;
}) {
  const codeString = String(children).replace(/\n$/, "");
  return (
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
  );
}

function TagInput({
  tags,
  onChange,
  suggestions,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: Tag[];
}) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = input.trim()
    ? suggestions
        .filter(
          (s) =>
            s.name.includes(input.toLowerCase()) && !tags.includes(s.name)
        )
        .slice(0, 8)
    : [];

  function addTag(name: string) {
    const clean = name.toLowerCase().trim().replace(/[^a-z0-9:_-]/g, "");
    if (!clean || tags.includes(clean) || tags.length >= MAX_TAGS) return;
    onChange([...tags, clean]);
    setInput("");
  }

  function removeTag(name: string) {
    onChange(tags.filter((t) => t !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (input.trim()) {
        e.preventDefault();
        addTag(input);
      }
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="relative">
      <div
        className="input-field mt-1 flex min-h-[42px] flex-wrap items-center gap-1.5 px-2 py-1.5 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-mint-500/15 px-2 py-0.5 text-xs font-medium text-mint-400 border border-mint-500/30"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 text-mint-400/60 hover:text-mint-300 text-sm leading-none"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={tags.length === 0 ? "Type a tag and press Enter (e.g. lang:typescript, nextjs)" : tags.length >= MAX_TAGS ? "Max tags reached" : "Add tag..."}
          disabled={tags.length >= MAX_TAGS}
          className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-600"
        />
      </div>
      {focused && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-charcoal-700 bg-charcoal-900 py-1 shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(s.name);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-charcoal-800 hover:text-white"
              >
                {s.name}
                <span className="ml-2 text-xs text-gray-600">{s.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-xs text-gray-600">
        {tags.length}/{MAX_TAGS} &middot; Press Enter or comma to add &middot; New tags are created automatically
      </p>
    </div>
  );
}

export default function MintPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"rule" | "prompt" | "skill">("prompt");
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "org">("public");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: existingTags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tags");
      return res.json();
    },
  });

  const { data: me } = useQuery<{ user: unknown }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.json();
    },
  });
  const isLoggedIn = !!me?.user;

  const { data: orgs = [] } = useQuery<Org[]>({
    queryKey: ["org", "my"],
    queryFn: async () => {
      const res = await fetch("/api/org/my", { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((o: Org) => ({ id: o.id, name: o.name }));
    },
  });

  const createItem = useMutation({
    mutationFn: async (body: {
      title: string;
      content: string;
      type: string;
      visibility: string;
      orgId: string | null;
      tagNames: string[];
    }) => {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        const msg = d.error?.message || (typeof d.error === "object" ? JSON.stringify(d.error) : d.error) || "Failed to create";
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", "search"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      router.push("/explore/skills");
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
    }
    setError("");
    const finalOrgId = visibility === "org" ? orgId : null;
    if (visibility === "org" && !finalOrgId) {
      setError("Select an organization when visibility is org");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    createItem.mutate({
      title: title.trim(),
      content: content.trim(),
      type,
      visibility,
      orgId: finalOrgId,
      tagNames,
    });
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <p className="text-gray-400">Log in to mint prompts, rules, and skills.</p>
          <Link href="/login" className="btn-mint mt-4 inline-block">
            Log in
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Top Bar */}
        <div className="mb-6">
          <Link
            href="/explore/skills"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            &larr; Back to Explore
          </Link>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Mint New Item</h1>
              <p className="mt-1 text-sm text-gray-400">
                Create a prompt, rule, or skill with live markdown preview
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/explore/skills" className="btn-outline">
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="btn-mint"
                disabled={createItem.isPending || !title.trim() || !content.trim()}
              >
                {createItem.isPending ? "Minting…" : "Mint Item"}
              </button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Section */}
          <div className="rounded-xl border border-charcoal-700 bg-charcoal-900/60 p-6">
            {/* Title Row */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. Safe API route pattern"
                required
              />
            </div>

            {/* Type and Visibility Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Type */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["rule", "prompt", "skill"] as const).map((t) => (
                    <RadioButton
                      key={t}
                      id={`type-${t}`}
                      name="type"
                      value={t}
                      checked={type === t}
                      onChange={() => setType(t)}
                      label={t.charAt(0).toUpperCase() + t.slice(1)}
                    />
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">
                  Visibility
                </label>
                <div className="flex flex-wrap gap-2">
                  <RadioButton
                    id="visibility-public"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    label="Public"
                    description="Everyone"
                  />
                  <RadioButton
                    id="visibility-org"
                    name="visibility"
                    value="org"
                    checked={visibility === "org"}
                    onChange={() => setVisibility("org")}
                    label="Org Only"
                    description="Private"
                  />
                </div>
                {visibility === "org" && orgs.length > 0 && (
                  <select
                    value={orgId ?? ""}
                    onChange={(e) => setOrgId(e.target.value || null)}
                    className="input-field mt-3 w-full"
                    required={visibility === "org"}
                  >
                    <option value="">Select organization</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                Tags
              </label>
              <TagInput tags={tagNames} onChange={setTagNames} suggestions={existingTags} />
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Editor and Preview Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor */}
            <div className="flex flex-col rounded-xl border border-charcoal-700 bg-charcoal-900 overflow-hidden">
              <div className="px-4 py-2 border-b border-charcoal-700 bg-charcoal-800/50">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Editor
                  </span>
                </div>
              </div>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[600px] w-full bg-charcoal-900 text-gray-200 font-mono text-sm p-4 resize-none outline-none border-0"
                placeholder="Write your markdown content here...

# Example Heading

This is a **markdown** editor with live preview.

\`\`\`typescript
const example = 'code block';
\`\`\`"
                required
              />
            </div>

            {/* Preview */}
            <div className="flex flex-col rounded-xl border border-charcoal-700 bg-charcoal-900 overflow-hidden">
              <div className="px-4 py-2 border-b border-charcoal-700 bg-charcoal-800/50">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Preview
                  </span>
                </div>
              </div>
              <div className="min-h-[600px] max-h-[600px] overflow-y-auto p-6 bg-charcoal-900">
                {content.trim() ? (
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
                      hr: () => <hr className="border-charcoal-700 my-8" />,
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
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <svg
                        className="w-12 h-12 mx-auto mb-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-sm">Start typing to see preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  if (!content) return null;

  return (
    <div className={`space-y-1 text-sm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-foreground mt-3 mb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-foreground mt-3 mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-foreground mt-2 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-semibold text-muted-foreground mt-2 mb-1">{children}</h6>
          ),
          p: ({ children }) => <p className="leading-relaxed my-1">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5 my-2">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border my-3" />,
          pre: ({ children }) => (
            <pre className="bg-muted-foreground/10 rounded-lg p-3 overflow-x-auto my-2">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-') || String(children).includes('\n');
            if (isBlock) {
              return <code className={`text-xs font-mono ${className ?? ''}`}>{children}</code>;
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-muted-foreground/15 text-primary text-xs font-mono font-medium border border-primary/20">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2 py-1">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

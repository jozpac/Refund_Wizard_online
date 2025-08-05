import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./button";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "json", className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Simple JSON syntax highlighting
  const highlightJson = (jsonString: string) => {
    return jsonString
      .replace(/(".*?")\s*:/g, '<span class="text-blue-400">$1</span>:')
      .replace(/:\s*(".*?")/g, ': <span class="text-green-400">$1</span>')
      .replace(/:\s*(\d+)/g, ': <span class="text-yellow-400">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="text-red-400">$1</span>')
      .replace(/([{}[\],])/g, '<span class="text-slate-300">$1</span>');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
      
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed max-h-96 overflow-y-auto">
        <code
          dangerouslySetInnerHTML={{
            __html: language === "json" ? highlightJson(code) : code
          }}
        />
      </pre>
    </div>
  );
}

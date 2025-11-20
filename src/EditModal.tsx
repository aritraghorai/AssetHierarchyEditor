import type { TreeNode } from "./types/Tree";
import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  X,
  Save,
  AlertCircle,
  Code2,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";

interface EditModalProps {
  node: TreeNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updatedAttributes: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
}) => {
  const [attributes, setAttributes] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (node && isOpen) {
      setAttributes(node.Attributes);
      setCopied(false);
      // Validate immediately on open
      try {
        JSON.parse(node.Attributes);
        setError("");
      } catch {
        const errorMsg = "Invalid JSON format - please check syntax";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  }, [node, isOpen]);

  const handleSave = () => {
    if (!node) return;

    // Validate JSON before saving
    try {
      JSON.parse(attributes);
      setError("");
      onSave(node.id, attributes);
      onClose();
    } catch (e) {
      const errorMsg = "Invalid JSON format - please check syntax";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const tryParseJson = (str: string) => {
    if (typeof str !== "string") return str;
    try {
      return JSON.parse(str);
    } catch {
      return str; // not valid JSON, keep as string
    }
  };

  const formatRecursively = (value: any, indent = 2, level = 1): string => {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      // Recursively format array elements
      const items = value.map((v) => formatRecursively(v, indent, level + 1));
      return `[${items.join(", ")}]`;
    }

    // It's an object
    const spaces = " ".repeat(indent * level);
    const entries = Object.entries(value).map(([k, v]) => {
      const parsed = typeof v === "string" ? tryParseJson(v) : v;
      return `${spaces}"${k}": ${formatRecursively(parsed, indent, level + 1)}`;
    });

    const closingSpaces = " ".repeat(indent * (level - 1));
    return `{\n${entries.join(",\n")}\n${closingSpaces}}`;
  };

  const formatJson = () => {
    if (!attributes?.trim()) {
      setError("JSON input is empty");
      return;
    }

    try {
      const parsed = JSON.parse(attributes);
      const formatted = formatRecursively(parsed, 2, 1);
      setAttributes(formatted);
      setError("");
    } catch (e: any) {
      const errorMsg = `Invalid JSON: ${e.message}`;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const resetToOriginal = () => {
    if (node) {
      setAttributes(node.Attributes);
      setError("");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(attributes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const validateJson = (value: string) => {
    try {
      JSON.parse(value);
      setError("");
    } catch (e) {
      setError("Invalid JSON syntax");
    }
  };

  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel rounded-xl shadow-2xl w-full h-full max-w-none max-h-full overflow-auto flex flex-col border border-white/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Code2 size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Edit Node Attributes
                </h3>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-gray-300 font-medium">
                    {node.name}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 uppercase tracking-wider">
                    {node.entityType.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded border uppercase tracking-wider ${
                      node.action === "INSERT"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {node.action}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-white/5 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={formatJson}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-white/5"
                title="Format JSON"
              >
                <Code2 size={14} />
                <span>Format</span>
              </button>
              <button
                onClick={resetToOriginal}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-white/5"
                title="Reset to original"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-white/5"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span>
                Node ID: <code className="text-gray-300 bg-white/5 px-1 py-0.5 rounded">{node.id}</code>
              </span>
              <span>
                Source: <code className="text-gray-300 bg-white/5 px-1 py-0.5 rounded">{node.source}</code>
              </span>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-auto bg-[#282c34]">
          <div className="h-full">
            <CodeMirror
              value={attributes}
              height="100%"
              theme={oneDark}
              extensions={[json()]}
              onChange={(value) => {
                setAttributes(value);
                // Debounced validation
                setTimeout(() => validateJson(value), 300);
              }}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: true,
                searchKeymap: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: true,
              }}
              style={{
                fontSize: "14px",
                fontFamily:
                  "JetBrains Mono, Fira Code, Monaco, Consolas, monospace",
                height: "100%"
              }}
            />
          </div>
        </div>

        {/* Status Bar */}
        {error && (
          <div className="px-6 py-3 border-t border-red-500/20 bg-red-500/10 backdrop-blur-sm absolute bottom-[72px] left-0 right-0">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {attributes.split("\n").length} lines • {attributes.length}{" "}
              characters
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!!error}
                className={`
                  flex items-center space-x-2 px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${
                    error
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                  }
                `}
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;

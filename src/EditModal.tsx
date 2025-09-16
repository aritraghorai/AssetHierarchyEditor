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
      setError("");
      setCopied(false);
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
      setError("Invalid JSON format - please check syntax");
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
      setError(`Invalid JSON: ${e.message}`);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Code2 size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-100">
                  Edit Node Attributes
                </h3>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-gray-300 font-medium">
                    {node.name}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                    {node.entityType.type}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${
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
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-700/30 bg-gray-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={formatJson}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                title="Format JSON"
              >
                <Code2 size={14} />
                <span>Format</span>
              </button>
              <button
                onClick={resetToOriginal}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                title="Reset to original"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
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
                Node ID: <code className="text-gray-300">{node.id}</code>
              </span>
              <span>
                Source: <code className="text-gray-300">{node.source}</code>
              </span>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full border-gray-700/30">
            <CodeMirror
              value={attributes}
              height="500px"
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
              }}
            />
          </div>
        </div>

        {/* Status Bar */}
        {error && (
          <div className="px-6 py-3 border-t border-red-500/20 bg-red-500/5">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700/30 bg-gray-800/20">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {attributes.split("\n").length} lines • {attributes.length}{" "}
              characters
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
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
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25"
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

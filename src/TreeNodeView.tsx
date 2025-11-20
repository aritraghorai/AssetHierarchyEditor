import type { TreeNode } from "./types/Tree";
import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Link2,
  Edit3,
  Trash2,
  FileText,
  MoreHorizontal,
  Box,
  AlertTriangle
} from "lucide-react";
import EditModal from "./EditModal";

const TreeNodeView: React.FC<{
  node: TreeNode;
  onEdit?: (node: TreeNode) => void;
  onDelete?: (node: TreeNode) => void;
  sheetType: string;
  level?: number;
}> = ({ node, onEdit, onDelete, sheetType, level = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const hasChildren = node.children.length > 0;
  const hasLinks = node.links.length > 0;

  const getActionColor = (action: string) => {
    return action === "INSERT"
      ? "bg-green-500/10 text-green-400 border-green-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20";
  };

  return (
    <div className="group select-none">
      <div
        className={`
          flex items-center justify-between rounded-lg px-3 py-2 mb-1
          transition-all duration-200 ease-in-out
          hover:bg-white/5 border border-transparent
          ${showActions ? "bg-white/5 border-white/5" : ""}
        `}
        style={{ marginLeft: `${level * 12}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            className={`
              flex-shrink-0 p-1 rounded transition-colors
              ${
                hasChildren
                  ? "hover:bg-white/10 cursor-pointer text-gray-400 hover:text-gray-200"
                  : "cursor-default opacity-0"
              }
            `}
            onClick={() => hasChildren && setExpanded(!expanded)}
            disabled={!hasChildren}
          >
            {hasChildren && (
              expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
          </button>

          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-1.5 rounded-md ${hasChildren ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'}`}>
              <Box size={14} />
            </div>
            
            <span className="font-medium text-gray-200 truncate text-sm flex items-center gap-2">
              {node.name}
              {!node.isValidJson() && (
                <div className="group/tooltip relative">
                  <AlertTriangle size={14} className="text-yellow-500" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-xs text-white rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
                    Invalid JSON Attributes
                  </div>
                </div>
              )}
            </span>

            <span className="px-2 py-0.5 text-[10px] font-medium bg-white/5 text-gray-400 rounded border border-white/10 flex-shrink-0 uppercase tracking-wider">
              {node.entityType.type}
            </span>

            <span
              className={`px-2 py-0.5 text-[10px] font-medium rounded border flex-shrink-0 uppercase tracking-wider ${getActionColor(
                node.action
              )}`}
            >
              {node.action}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {hasLinks && (
            <div className="flex items-center space-x-1 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
              <Link2 size={12} className="text-indigo-400" />
              <span className="text-xs text-indigo-300 font-medium">{node.links.length}</span>
            </div>
          )}

          <div
            className={`flex items-center space-x-1 transition-all duration-200 ${
              showActions ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
            }`}
          >
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(node);
                }}
                className="p-1.5 rounded hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors"
                title="Edit attributes"
              >
                <Edit3 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node);
                }}
                className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Delete node"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-2 w-px bg-white/5" style={{ left: `${(level * 12) + 19}px` }} />
          {node.children.map((child) => (
            <TreeNodeView
              sheetType={sheetType}
              key={child.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main EntityTree component
interface EntityTreeProps {
  entities: Map<string, TreeNode>;
  onEditNode?: (nodeId: string, updatedAttributes: string) => void;
  onDeleteNode?: (node: TreeNode) => void;
  sheetType: string;
}

const EntityTree: React.FC<EntityTreeProps> = ({
  entities,
  onEditNode,
  onDeleteNode,
  sheetType,
}) => {
  const [editingNode, setEditingNode] = useState<TreeNode | null>(null);

  const roots = Array.from(entities.values()).filter((node) => {
    const isChild = Array.from(entities.values()).some((other) =>
      other.children.includes(node)
    );
    return !isChild && node.children.length > 0;
  });

  const handleEdit = (node: TreeNode) => {
    setEditingNode(node);
  };

  const handleSaveEdit = (nodeId: string, updatedAttributes: string) => {
    if (onEditNode) {
      onEditNode(nodeId, updatedAttributes);
    }
    setEditingNode(null);
  };

  const totalNodes = entities.size;
  const totalRoots = roots.length;

  return (
    <>
      <div className="glass-panel rounded-xl h-[calc(100vh-8rem)] flex flex-col">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Hierarchy Explorer
                <span className="px-2 py-0.5 rounded text-xs font-normal bg-blue-500/20 text-blue-400 border border-blue-500/20">Beta</span>
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {totalNodes} entities • {totalRoots} root nodes
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          {roots.length > 0 ? (
            <div className="space-y-1">
              {roots.map((node) => (
                <TreeNodeView
                  sheetType={sheetType}
                  key={node.id}
                  node={node}
                  onEdit={handleEdit}
                  onDelete={onDeleteNode}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="p-4 rounded-full bg-white/5 mb-4">
                <FileText size={32} className="opacity-50" />
              </div>
              <p className="text-lg font-medium text-gray-400">No entities found</p>
              <p className="text-sm mt-2">Import an Excel file to get started</p>
            </div>
          )}
        </div>
      </div>

      <EditModal
        node={editingNode}
        isOpen={!!editingNode}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveEdit}
      />
    </>
  );
};

export default EntityTree;

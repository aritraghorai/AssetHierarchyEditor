import type { TreeNode } from "./types/Tree";
import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Link2,
  Edit3,
  Trash2,
  FileText,
} from "lucide-react";
import EditModal from "./EditModal";

const TreeNodeView: React.FC<{
  node: TreeNode;
  onEdit?: (node: TreeNode) => void;
  onDelete?: (node: TreeNode) => void;
  sheetType: string;
}> = ({ node, onEdit, onDelete, sheetType }) => {
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
    <div className="group">
      <div
        className={`
          flex items-center justify-between rounded-lg px-3 py-2 mb-1
          transition-all duration-200 ease-in-out
          hover:bg-gray-800/50 border border-transparent
          ${showActions ? "bg-gray-800/30 border-gray-700/50" : ""}
        `}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            className={`
              flex-shrink-0 p-1 rounded transition-colors
              ${
                hasChildren
                  ? "hover:bg-gray-700 cursor-pointer text-gray-400 hover:text-gray-200"
                  : "cursor-default"
              }
            `}
            onClick={() => hasChildren && setExpanded(!expanded)}
          >
            {hasChildren ? (
              expanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )
            ) : (
              <FileText size={14} className="text-gray-500" />
            )}
          </button>

          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span className="font-medium text-gray-100 truncate">
              {node.name}
            </span>

            <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 flex-shrink-0">
              {node.entityType.type}
            </span>

            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 ${getActionColor(
                node.action
              )}`}
            >
              {node.action}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {hasLinks && (
            <div className="flex items-center space-x-1">
              <Link2 size={14} className="text-blue-400" />
              <span className="text-xs text-gray-400">{node.links.length}</span>
            </div>
          )}

          <div
            className={`flex items-center space-x-1 transition-opacity duration-200 ${
              showActions ? "opacity-100" : "opacity-0"
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
        <div className="ml-6 pl-3 border-l border-gray-700/50">
          {node.children.map((child) => (
            <TreeNodeView
              sheetType={sheetType}
              key={child.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
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
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-100 rounded-xl border border-gray-700/50 shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-100">
                Baker Hughes Customer Tenant1
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {totalNodes} entities • {totalRoots} root nodes
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 max-h-full overflow-y-auto custom-scrollbar">
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
            <div className="text-center py-8 text-gray-500">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No entities found</p>
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

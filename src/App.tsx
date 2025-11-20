/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Download, Upload, Layout, Database, Link as LinkIcon, FileSpreadsheet, Settings, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { DataFrame, readExcel } from "danfojs";
import { EntityType, TreeNode, type Action } from "./types/Tree";
import EntityTree from "./TreeNodeView";

const AssetHierarchyManager = () => {
  const [activeTab, setActiveTab] = useState("hierarchy");
  const [excelType, setExcelType] = useState("INSERT");
  const [hierarchy, setHierarchy] = useState<Map<string, TreeNode>>(new Map());

  // Initialize with sample data based on your documents
  useEffect(() => {}, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const entityTypes = new Map<string, EntityType>();
    const entities = new Map<string, TreeNode>();

    const entityTypeSheet = (await readExcel(file, {
      sheet: 0,
      frameConfig: {},
      parsingOptions: {},
    })) as DataFrame;

    for (const value of entityTypeSheet.values as [[string, string]]) {
      entityTypes.set(value[0], new EntityType(value[0], value[1]));
    }

    const entitySheet = (await readExcel(file, {
      sheet: 1,
      frameConfig: {},
      parsingOptions: {},
    })) as DataFrame;

    for (const value of entitySheet.values as [
      [string, string, string, string, string, string]
    ]) {
      if (entityTypes.has(value[2]) === true) {
        const node = new TreeNode(
          value[0],
          value[1],
          entityTypes.get(value[2]) as EntityType,
          value[3],
          value[4],
          value[5] as Action
        );
        entities.set(value[0], node);
      }
    }

    const entityRelationshipSheet = (await readExcel(file, {
      sheet: 2,
    })) as DataFrame;

    const relationships = entityRelationshipSheet.values as [
      [string, string, string]
    ];

    for (const value of relationships) {
      const parent = entities.get(value[0]);
      const child = entities.get(value[1]);
      if (value[2] === "HAS") {
        if (parent && child) {
          parent.children.push(child);
        }
      } else {
        if (parent && child) {
          parent.links.push(child);
        }
      }
    }

    console.log(entities);

    // Check for invalid JSON in attributes
    const invalidNodes: string[] = [];
    for (const [_, node] of entities) {
      if (!node.isValidJson()) {
        invalidNodes.push(node.name);
      }
    }

    if (invalidNodes.length > 0) {
      toast.error(
        <div>
          <strong>Invalid JSON Attributes detected!</strong>
          <ul className="mt-2 list-disc pl-4 text-sm max-h-40 overflow-y-auto">
            {invalidNodes.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
          className: "bg-gray-800 text-white border border-red-500/30",
        }
      );
    }

    setHierarchy(entities);
  };

  const exportToExcel = () => {
    if (hierarchy.size === 0) {
      toast.error("No hierarchy to export!");
      return;
    }

    // -------------------
    // Sheet 1: Entity Types
    // -------------------
    const entityTypeSet = new Map<string, EntityType>();
    for (const [, node] of hierarchy) {
      entityTypeSet.set(node.entityType.type, node.entityType);
    }
    const entityTypesData = [["Type", "Attributes"]];
    entityTypeSet.forEach((et) => {
      entityTypesData.push([et.type, et.Attributes]);
    });

    // -------------------
    // Sheet 2: Entities
    // -------------------
    const entitiesData = [
      ["ID", "Name", "EntityType", "Source", "Attributes", "Action"],
    ];
    for (const [, node] of hierarchy) {
      entitiesData.push([
        node.id,
        node.name,
        node.entityType.type,
        node.source,
        node.Attributes,
        excelType,
      ]);
    }

    // -------------------
    // Sheet 3: Relationships
    // -------------------
    const relationshipsData = [["ParentID", "ChildID", "Type", "Action"]];
    for (const [, node] of hierarchy) {
      node.children.forEach((child) => {
        relationshipsData.push([node.id, child.id, "HAS", excelType]);
      });
      node.links.forEach((link) => {
        relationshipsData.push([node.id, link.id, "LINK", excelType]);
      });
    }

    // -------------------
    // Create workbook & add sheets
    // -------------------
    const wb = XLSX.utils.book_new();

    const wsEntityTypes = XLSX.utils.aoa_to_sheet(entityTypesData);
    XLSX.utils.book_append_sheet(wb, wsEntityTypes, "EntityTypes");

    const wsEntities = XLSX.utils.aoa_to_sheet(entitiesData);
    XLSX.utils.book_append_sheet(wb, wsEntities, "Entities");

    const wsRelationships = XLSX.utils.aoa_to_sheet(relationshipsData);
    XLSX.utils.book_append_sheet(wb, wsRelationships, "Relationships");

    // -------------------
    // Save to file
    // -------------------
    XLSX.writeFile(wb, "AssetHierarchy.xlsx", { compression: true });
  };

  const navItems = [
    { id: "hierarchy", label: "Hierarchy", icon: Layout },
    { id: "entities", label: "Entities", icon: Database },
    { id: "relationships", label: "Relationships", icon: LinkIcon },
    { id: "types", label: "Entity Types", icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer theme="dark" position="top-right" />
      {/* Top Navigation Bar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Asset Hierarchy Manager
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-white/5">
              {["INSERT", "DELETE"].map((type) => (
                <button
                  key={type}
                  onClick={() => setExcelType(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    excelType === type
                      ? type === "INSERT" 
                        ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm" 
                        : "bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-white/10 mx-2" />

            <div className="flex items-center gap-3">
              <label className="glass-button flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium text-gray-300 hover:text-white group">
                <Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                Import
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <aside className="col-span-3">
          <nav className="glass-panel rounded-xl p-2 space-y-1 sticky top-24">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? "text-blue-400" : "text-gray-500"} />
                    {item.label}
                  </div>
                  {isActive && <ChevronRight size={14} className="text-blue-400" />}
                </button>
              );
            })}
          </nav>
          
          <div className="mt-6 glass-panel rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Settings size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">{hierarchy.size}</div>
                <div className="text-xs text-gray-500">Total Entities</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {Array.from(hierarchy.values()).filter(n => n.entityType.type === 'Root').length}
                </div>
                <div className="text-xs text-gray-500">Root Nodes</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="col-span-9">
          <EntityTree
            entities={hierarchy}
            sheetType={excelType}
            onDeleteNode={(data) => {
              setHierarchy((prevHierarchy) => {
                const newHierarchy = new Map(prevHierarchy);
                const collectNodesToDelete = (
                  nodeId: string,
                  toDelete: Set<string>
                ) => {
                  const node = newHierarchy.get(nodeId);
                  if (node) {
                    toDelete.add(nodeId);
                    node.children.forEach((child) => {
                      collectNodesToDelete(child.id, toDelete);
                    });
                  }
                };
                const nodesToDelete = new Set<string>();
                collectNodesToDelete(data.id, nodesToDelete);
                nodesToDelete.forEach((nodeId) => {
                  newHierarchy.delete(nodeId);
                });
                for (const [_, node] of newHierarchy) {
                  node.children = node.children.filter(
                    (child) => !nodesToDelete.has(child.id)
                  );
                  node.links = node.links.filter(
                    (link) => !nodesToDelete.has(link.id)
                  );
                }
                return newHierarchy;
              });
            }}
            onEditNode={(id, updatedAttributes) => {
              setHierarchy((prevHierarchy) => {
                const newHierarchy = new Map(prevHierarchy);
                const node = newHierarchy.get(id);
                if (node) {
                  node.setAttributes(updatedAttributes);
                }
                return newHierarchy;
              });
            }}
          />
        </main>
      </div>
    </div>
  );
};

export default AssetHierarchyManager;

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";

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

    setHierarchy(entities);

    // In a real implementation, you would use a library like SheetJS to parse Excel files
    // For now, we'll just show a placeholder
  };

  // inside AssetHierarchyManager

  const exportToExcel = () => {
    if (hierarchy.size === 0) {
      alert("No hierarchy to export!");
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
    XLSX.writeFile(wb, "AssetHierarchy.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Asset Hierarchy Manager
          </h1>
          <div className="flex gap-4 items-center">
            <label className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 cursor-pointer flex items-center gap-2">
              <Upload size={16} />
              Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={exportToExcel}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <Download size={16} /> Export to Excel
            </button>
            <select
              value={excelType}
              onChange={(e) => setExcelType(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2"
            >
              <option value="INSERT">INSERT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </header>

        <nav className="mb-6">
          <div className="flex border-b">
            {[
              { id: "hierarchy", label: "Hierarchy View" },
              { id: "entities", label: "Entities" },
              { id: "relationships", label: "Relationships" },
              { id: "types", label: "Entity Types" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium border-b-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="">
          <EntityTree
            entities={hierarchy}
            sheetType={excelType}
            onDeleteNode={(data) => {
              setHierarchy((prevHierarchy) => {
                const newHierarchy = new Map(prevHierarchy);

                // Recursive function to collect all nodes to delete
                const collectNodesToDelete = (
                  nodeId: string,
                  toDelete: Set<string>
                ) => {
                  const node = newHierarchy.get(nodeId);
                  if (node) {
                    toDelete.add(nodeId);
                    // Recursively add all children
                    node.children.forEach((child) => {
                      collectNodesToDelete(child.id, toDelete);
                    });
                  }
                };

                // Collect all nodes that need to be deleted
                const nodesToDelete = new Set<string>();
                collectNodesToDelete(data.id, nodesToDelete);

                // Remove all collected nodes from the map
                nodesToDelete.forEach((nodeId) => {
                  newHierarchy.delete(nodeId);
                });

                // Clean up relationships - remove deleted nodes from all remaining nodes
                for (const [_, node] of newHierarchy) {
                  // Remove deleted nodes from children arrays
                  node.children = node.children.filter(
                    (child) => !nodesToDelete.has(child.id)
                  );

                  // Remove deleted nodes from links arrays
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

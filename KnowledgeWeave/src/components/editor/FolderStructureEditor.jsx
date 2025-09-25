import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  Upload,
  FolderPlus,
  FilePlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FolderStructureEditor({ value, onChange }) {
  const [structure, setStructure] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(new Set(["root"]));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState("folder");
  const [currentPath, setCurrentPath] = useState([]);

  useEffect(() => {
    setStructure(value || {});
  }, [value]);

  const updateStructure = (newStructure) => {
    setStructure(newStructure);
    onChange?.(newStructure);
  };

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newStructure = {};

    files.forEach((file) => {
      if (file.webkitRelativePath) {
        const pathParts = file.webkitRelativePath.split("/");
        let current = newStructure;

        pathParts.forEach((part, index) => {
          if (index === pathParts.length - 1) {
            // It's a file
            if (!current._files) current._files = [];
            current._files.push({
              name: part,
              type: "file",
              id: Math.random().toString(36).substr(2, 9),
            });
          } else {
            // It's a folder
            if (!current[part]) {
              current[part] = {
                type: "folder",
                id: Math.random().toString(36).substr(2, 9),
                children: {},
              };
            }
            current = current[part].children;
          }
        });
      }
    });

    updateStructure(newStructure);
    // Expand all folders by default
    const allPaths = getAllFolderPaths(newStructure);
    setExpandedFolders(new Set([...expandedFolders, ...allPaths]));
  };

  const getAllFolderPaths = (struct, basePath = "") => {
    const paths = [];
    Object.entries(struct).forEach(([key, value]) => {
      if (key !== "_files" && value.type === "folder") {
        const currentPath = basePath ? `${basePath}/${key}` : key;
        paths.push(currentPath);
        if (value.children) {
          paths.push(...getAllFolderPaths(value.children, currentPath));
        }
      }
    });
    return paths;
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const addItem = (path, name, type) => {
    if (!name.trim()) return;

    const newStructure = JSON.parse(JSON.stringify(structure));
    let current = newStructure;

    // Navigate to the target location
    for (const pathPart of path) {
      if (pathPart && current[pathPart]) {
        current = current[pathPart].children;
      }
    }

    if (type === "folder") {
      current[name] = {
        type: "folder",
        id: Math.random().toString(36).substr(2, 9),
        children: {},
      };
    } else {
      if (!current._files) current._files = [];
      current._files.push({
        name: name,
        type: "file",
        id: Math.random().toString(36).substr(2, 9),
      });
    }

    updateStructure(newStructure);
  };

  const removeItem = (path, itemName, itemType) => {
    const newStructure = JSON.parse(JSON.stringify(structure));
    let current = newStructure;

    // Navigate to parent
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i] && current[path[i]]) {
        current = current[path[i]].children;
      }
    }

    if (itemType === "folder") {
      delete current[itemName];
    } else {
      if (current._files) {
        current._files = current._files.filter(
          (file) => file.name !== itemName
        );
      }
    }

    updateStructure(newStructure);
  };

  const handleAddClick = (path) => {
    setCurrentPath(path);
    setNewItemName("");
    setNewItemType("folder");
    setShowAddDialog(true);
  };

  const handleAddSubmit = () => {
    addItem(currentPath, newItemName, newItemType);
    setShowAddDialog(false);
    setNewItemName("");
  };

  const renderStructure = (struct, path = []) => {
    const items = [];

    // Render folders
    Object.entries(struct).forEach(([key, value]) => {
      if (key !== "_files" && value.type === "folder") {
        const currentPath = [...path, key];
        const pathString = currentPath.join("/");
        const isExpanded = expandedFolders.has(pathString);

        items.push(
          <div key={value.id} className="select-none">
            <div className="flex items-center gap-1 p-1 hover:bg-slate-50 rounded group">
              <button
                onClick={() => toggleFolder(pathString)}
                className="flex items-center gap-1 flex-1 text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {key}
                </span>
              </button>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <button
                  onClick={() => handleAddClick(currentPath)}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeItem(path, key, "folder")}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="ml-4 border-l border-slate-200 pl-2">
                {renderStructure(value.children, currentPath)}
              </div>
            )}
          </div>
        );
      }
    });

    // Render files
    if (struct._files) {
      struct._files.forEach((file) => {
        items.push(
          <div
            key={file.id}
            className="flex items-center gap-1 p-1 ml-4 hover:bg-slate-50 rounded group"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 flex-1">{file.name}</span>
            <div className="opacity-0 group-hover:opacity-100">
              <button
                onClick={() => removeItem(path, file.name, "file")}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      });
    }

    return items;
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Folder className="w-5 h-5" />
          Folder Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.keys(structure).length === 0 ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderUpload}
                className="hidden"
                id="folder-structure-upload"
              />
              <Button
                variant="outline"
                onClick={() =>
                  document.getElementById("folder-structure-upload").click()
                }
                className="border-slate-300"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Structure
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddClick([])}
                className="border-slate-300"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Add Root Folder
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Import a folder structure or manually create one. This shows
              organization without uploading actual files.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">
                Project Structure
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddClick([])}
                className="border-slate-300"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 max-h-96 overflow-y-auto border">
              <div className="space-y-1">{renderStructure(structure)}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateStructure({})}
              className="text-slate-500 hover:text-red-600"
            >
              Clear Structure
            </Button>
          </div>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Type
                </label>
                <Select value={newItemType} onValueChange={setNewItemType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-blue-500" />
                        Folder
                      </div>
                    </SelectItem>
                    <SelectItem value="file">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        File
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Name
                </label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter ${newItemType} name...`}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSubmit()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSubmit}
                  disabled={!newItemName.trim()}
                >
                  Add{" "}
                  {newItemType === "folder" ? (
                    <FolderPlus className="w-4 h-4 ml-1" />
                  ) : (
                    <FilePlus className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

import React, { useState } from "react";
import { Article } from "@/entities/Article";
import { Intern } from "@/entities/Intern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Database, Loader2 } from "lucide-react";
import { formatISO } from "date-fns";

export default function ExportData() {
  const [exportStatus, setExportStatus] = useState("idle"); // idle, loading, success, error
  const [sqlOutput, setSqlOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Helper to escape strings for SQL INSERT statements
  const escapeSqlString = (str) => {
    if (str === null || str === undefined) return "NULL";
    // Convert to string and escape single quotes by doubling them
    return `'${String(str).replace(/'/g, "''")}'`;
  };

  // Helper to format JavaScript objects/arrays to JSONB for PostgreSQL
  const toSqlJsonb = (obj) => {
    if (obj === null || obj === undefined) return "NULL";
    // Stringify the object and escape single quotes within the JSON string
    const jsonString = JSON.stringify(obj).replace(/'/g, "''");
    return `'${jsonString}'::jsonb`;
  };

  const generateSql = async () => {
    setExportStatus("loading");
    setErrorMessage("");
    setSqlOutput("");
    let allSqlStatements = [];

    try {
      // --- Export Article Data ---
      const articles = await Article.list();
      if (articles.length > 0) {
        allSqlStatements.push(`-- Data for 'Article' table`);
        // Assuming the table 'Article' has columns: id, created_date, updated_date, created_by,
        // title, content, summary, author, category, tags, parent_id, status, priority, attachments, folder_structure
        const articleColumns = [
          "id",
          "created_date",
          "updated_date",
          "created_by",
          "title",
          "content",
          "summary",
          "author",
          "category",
          "tags",
          "parent_id",
          "status",
          "priority",
          "attachments",
          "folder_structure",
        ];
        allSqlStatements.push(
          `INSERT INTO "Article" (${articleColumns
            .map((col) => `"${col}"`)
            .join(", ")}) VALUES`
        );
        const articleValues = articles.map((article) => {
          const values = articleColumns.map((col) => {
            if (col === "created_date" || col === "updated_date") {
              return article[col]
                ? `'${formatISO(new Date(article[col]))}'`
                : "NULL";
            }
            if (col === "tags") {
              return article[col] && article[col].length > 0
                ? `'{"${article[col]
                    .map((t) => escapeSqlString(t).slice(1, -1))
                    .join('", "')}"}'`
                : "NULL";
            }
            if (col === "attachments" || col === "folder_structure") {
              return toSqlJsonb(article[col]);
            }
            return escapeSqlString(article[col]);
          });
          return `(${values.join(", ")})`;
        });
        allSqlStatements.push(articleValues.join(",\n") + ";\n");
      }

      // --- Export Intern Data ---
      const interns = await Intern.list();
      if (interns.length > 0) {
        allSqlStatements.push(`-- Data for 'Intern' table`);
        // Assuming the table 'Intern' has columns: id, created_date, updated_date, created_by,
        // name, email, start_date, program, requirements, status, mentor, notes
        const internColumns = [
          "id",
          "created_date",
          "updated_date",
          "created_by",
          "name",
          "email",
          "start_date",
          "program",
          "requirements",
          "status",
          "mentor",
          "notes",
        ];
        allSqlStatements.push(
          `INSERT INTO "Intern" (${internColumns
            .map((col) => `"${col}"`)
            .join(", ")}) VALUES`
        );
        const internValues = interns.map((intern) => {
          const values = internColumns.map((col) => {
            if (
              col === "created_date" ||
              col === "updated_date" ||
              col === "start_date"
            ) {
              return intern[col]
                ? `'${formatISO(new Date(intern[col]))}'`
                : "NULL";
            }
            if (col === "requirements") {
              return toSqlJsonb(intern[col]);
            }
            return escapeSqlString(intern[col]);
          });
          return `(${values.join(", ")})`;
        });
        allSqlStatements.push(internValues.join(",\n") + ";\n");
      }

      const finalSql = allSqlStatements.join("\n\n");
      setSqlOutput(finalSql);
      setExportStatus("success");
    } catch (error) {
      console.error("Error during data export:", error);
      setErrorMessage(`Failed to export data: ${error.message}`);
      setExportStatus("error");
    }
  };

  const downloadSqlFile = () => {
    if (!sqlOutput) return;
    const blob = new Blob([sqlOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `base44_export_${formatISO(new Date(), {
      representation: "date",
    })}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          Export Application Data
        </h1>
        <p className="text-slate-600">
          Generate SQL `INSERT` statements for your application's data,
          compatible with PostgreSQL. This allows you to migrate your data to
          other databases like Supabase.
        </p>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={generateSql}
              disabled={exportStatus === "loading"}
              className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
            >
              {exportStatus === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Generate SQL Export
            </Button>

            {exportStatus === "success" && (
              <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200 flex items-center justify-between">
                <span>Export generated successfully!</span>
                <Button
                  variant="outline"
                  onClick={downloadSqlFile}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download SQL File
                </Button>
              </div>
            )}

            {exportStatus === "error" && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
                <p className="font-semibold">Error:</p>
                <p>{errorMessage}</p>
              </div>
            )}

            {sqlOutput && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  Generated SQL Preview:
                </h3>
                <pre className="bg-slate-800 text-white p-4 rounded-md text-sm overflow-x-auto max-h-96">
                  <code>{sqlOutput}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

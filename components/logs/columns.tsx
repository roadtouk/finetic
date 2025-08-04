"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogViewerDialog } from "./log-viewer-dialog";
import { LogFile } from "@jellyfin/sdk/lib/generated-client/models";
import { useState } from "react";

// We need to create a wrapper component to manage the dialog state
function LogActionsCell({ log }: { log: LogFile }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(log.Name!)}
          >
            Copy log name
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <Eye className="h-4 w-4" />
            View log
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              try {
                const { serverUrl, user } = await import(
                  "@/app/actions/utils"
                ).then((m) => m.getAuthData());
                const authData = await (
                  await import("@/app/actions/utils")
                ).getAuthData();
                const url = `${authData.serverUrl}/System/Logs/Log?name=${log.Name}&api_key=${authData.user.accessToken}`;
                const a = document.createElement("a");
                a.href = url;
                a.download = log.Name!;
                a.click();
              } catch (error) {
                console.error("Failed to download log:", error);
              }
            }}
          >
            <Download className="h-4 w-4" />
            Download log
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <LogViewerDialog 
        log={log} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      >
        <div />
      </LogViewerDialog>
    </>
  );
}

export const logColumns: ColumnDef<LogFile>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "Name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Log Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("Name") as string;
      const isFFmpegLog = name.startsWith("FFmpeg");
      const isMainLog = name.startsWith("log_");

      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          {isFFmpegLog && (
            <Badge variant="secondary" className="text-xs">
              FFmpeg
            </Badge>
          )}
          {isMainLog && (
            <Badge variant="default" className="text-xs">
              System
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "Size",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Size
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const size = row.getValue("Size") as number;
      const formatted = formatFileSize(size);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "DateCreated",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("DateCreated") as string);
      return <div className="text-sm">{date.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "DateModified",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Modified
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("DateModified") as string);
      return <div className="text-sm">{date.toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const log = row.original;
      return <LogActionsCell log={log} />;
    },
  },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

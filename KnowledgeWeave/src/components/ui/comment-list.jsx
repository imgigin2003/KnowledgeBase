import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { format } from "date-fns";
import {
  Edit3,
  Trash2,
  Check,
  X,
  User as UserIcon,
  Calendar,
} from "lucide-react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper function to safely format date
const safeFormatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? "Invalid Date"
      : format(d, "MMM d, yyyy 'at' hh:mm a");
  } catch {
    return "Invalid Date";
  }
};

// CommentItem component for individual comment display/edit/delete
function CommentItem({ comment, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(comment.content);

  const handleSave = () => {
    if (editedContent.trim() && editedContent !== comment.content) {
      onUpdate(comment.id, { content: editedContent });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="border-b last:border-b-0 border-slate-100 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800">{comment.name}</span>
          <span className="text-sm text-slate-500">
            {comment.email && `(${comment.email})`}
          </span>
          <Calendar className="w-3 h-3 text-slate-400 ml-2" />
          <span className="text-xs text-slate-400">
            {safeFormatDate(comment.createdAt)}
            {comment.updatedAt &&
              comment.updatedAt !== comment.createdAt &&
              ` (Edited: ${safeFormatDate(comment.updatedAt)})`}
          </span>
        </div>
        <div className="flex gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                className="text-green-600 hover:bg-green-50"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:bg-blue-50"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your comment.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(comment.id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
      <div className="text-slate-700 text-sm">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={4}
            className="w-full mt-2 border-slate-300 focus:border-slate-500"
          />
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
            rehypePlugins={[rehypeRaw]}
            remarkPlugins={[remarkGfm, remarkBreaks]}
          >
            {comment.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export function CommentList({ comments, onUpdateComment, onDeleteComment }) {
  if (!comments || comments.length === 0) {
    return (
      <p className="text-slate-500 text-center py-4">
        No comments yet. Be the first to comment!
      </p>
    );
  }

  // Sort comments by creation date, newest first
  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="space-y-4">
      {sortedComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onUpdate={onUpdateComment}
          onDelete={onDeleteComment}
        />
      ))}
    </div>
  );
}

import { format } from "date-fns";
import { User, Calendar } from "lucide-react";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";

export function CommentList({ comments = [] }) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        There's no comment... Write the first one!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id} className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-900">
                  {comment.name}
                </span>
                {comment.email && (
                  <Badge variant="outline" className="text-xs">
                    {comment.email}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>
                  {format(new Date(comment.createdAt), "MMM d, yyyy HH:mm")}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {comment.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

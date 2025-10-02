import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { User, Mail, Send } from "lucide-react";

export function CommentForm({ onSubmit, isSubmitting, error }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      alert("Name and Comment Text are Required!");
      return;
    }
    onSubmit({
      name: name.trim(),
      email: email.trim() || null,
      content: content.trim(),
    });
    setName("");
    setEmail("");
    setContent("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 border rounded-lg bg-slate-50"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <User className="w-4 h-4" /> Name (Required)
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Mail className="w-4 h-4" /> Email (Optional)
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Comment Text
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write what you think of this article..."
          rows={4}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="submit"
        className="w-full md:w-auto"
        disabled={isSubmitting}
      >
        <Send className="w-4 h-4 mr-2" />
        {isSubmitting ? "Posting..." : "Post"}
      </Button>
    </form>
  );
}

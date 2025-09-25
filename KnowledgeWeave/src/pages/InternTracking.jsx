import { useState, useEffect } from "react";
import { Intern } from "@/entities/Intern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Plus,
  User,
  Calendar,
  CheckCircle2,
  Circle,
  BookOpen,
  FileText,
  Briefcase,
  Target,
} from "lucide-react";
import { format } from "date-fns";

const REQUIREMENT_TYPES = [
  { value: "course", label: "Course", icon: BookOpen },
  { value: "exercise", label: "Exercise", icon: FileText },
  { value: "project", label: "Project", icon: Briefcase },
  { value: "assessment", label: "Assessment", icon: Target },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  {
    value: "completed",
    label: "Completed",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "on_hold",
    label: "On Hold",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "terminated",
    label: "Terminated",
    color: "bg-red-100 text-red-800",
  },
];

export default function InternTracking() {
  const [interns, setInterns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [newIntern, setNewIntern] = useState({
    name: "",
    email: "",
    start_date: "",
    program: "",
    mentor: "",
    status: "active",
    requirements: [],
    notes: "",
  });
  const [newRequirement, setNewRequirement] = useState({
    title: "",
    description: "",
    type: "course",
  });

  const loadInterns = async () => {
    try {
      const fetchedInterns = await Intern.list();
      setInterns(fetchedInterns || []);
    } catch (error) {
      console.error("Error loading interns:", error);
      setInterns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInterns();
  }, []);

  const addRequirement = () => {
    if (!newRequirement.title.trim()) return;
    const newReq = {
      id: Date.now().toString(),
      title: newRequirement.title,
      description: newRequirement.description,
      type: newRequirement.type,
      completed: false,
    };
    setNewIntern((prev) => ({
      ...prev,
      requirements: [...prev.requirements, newReq],
    }));
    setNewRequirement({ title: "", description: "", type: "course" });
  };

  const handleSaveIntern = async () => {
    if (!newIntern.name.trim() || !newIntern.email.trim()) return;

    try {
      if (editingIntern) {
        await Intern.update(editingIntern.id, newIntern);
      } else {
        await Intern.create(newIntern);
      }
      setShowAddDialog(false);
      setEditingIntern(null);
      setNewIntern({
        name: "",
        email: "",
        start_date: "",
        program: "",
        mentor: "",
        status: "active",
        requirements: [],
        notes: "",
      });
      await loadInterns();
    } catch (error) {
      console.error("Error saving intern:", error);
    }
  };

  const calculateCompletion = (requirements) => {
    if (!requirements.length) return 0;
    const completed = requirements.filter((req) => req.completed).length;
    return Math.round((completed / requirements.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Intern Tracking</h2>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Intern
          </Button>
        </div>

        {interns.length > 0 ? (
          interns.map((intern) => (
            <Card key={intern.id} className="border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <GraduationCap className="w-6 h-6 text-slate-600" />
                  <h3 className="text-lg font-semibold">{intern.name}</h3>
                  <Badge
                    className={
                      STATUS_OPTIONS.find((s) => s.value === intern.status)
                        .color
                    }
                  >
                    {intern.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Email</span>
                  </div>
                  <p className="text-slate-900">{intern.email}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Start Date</span>
                  </div>
                  <p className="text-slate-900">
                    {intern.start_date
                      ? format(new Date(intern.start_date), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-600">Program</span>
                  </div>
                  <p className="text-slate-900">{intern.program || "N/A"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-600">Mentor</span>
                  </div>
                  <p className="text-slate-900">{intern.mentor || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-600">
                      Requirements Completion
                    </span>
                  </div>
                  <div className="space-y-2">
                    {intern.requirements.map((req) => (
                      <div key={req.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`req-${req.id}`}
                          checked={req.completed}
                          onCheckedChange={(checked) => {
                            const updatedInterns = interns.map((i) =>
                              i.id === intern.id
                                ? {
                                    ...i,
                                    requirements: i.requirements.map((r) =>
                                      r.id === req.id
                                        ? { ...r, completed: checked }
                                        : r
                                    ),
                                  }
                                : i
                            );
                            setInterns(updatedInterns);
                            // Save to backend (optional real-time)
                            Intern.update(intern.id, {
                              ...intern,
                              requirements: intern.requirements.map((r) =>
                                r.id === req.id
                                  ? { ...r, completed: checked }
                                  : r
                              ),
                            });
                          }}
                        />
                        <Label htmlFor={`req-${req.id}`}>
                          {req.title} ({req.type})
                          {req.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 ml-2 inline" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400 ml-2 inline" />
                          )}
                        </Label>
                      </div>
                    ))}
                    <Badge variant="secondary" className="mt-2">
                      {calculateCompletion(intern.requirements)}% Complete
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-600">Notes</span>
                  </div>
                  <p className="text-slate-900">{intern.notes || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-slate-200">
            <CardContent className="p-6 text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No interns yet
              </h3>
              <p className="text-slate-600 mb-4">Start tracking your interns</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Intern
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIntern ? "Edit Intern" : "Add New Intern"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newIntern.name}
                  onChange={(e) =>
                    setNewIntern((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter intern's name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newIntern.email}
                  onChange={(e) =>
                    setNewIntern((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter intern's email"
                />
              </div>
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newIntern.start_date}
                  onChange={(e) =>
                    setNewIntern((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="program">Program</Label>
                <Input
                  id="program"
                  value={newIntern.program}
                  onChange={(e) =>
                    setNewIntern((prev) => ({
                      ...prev,
                      program: e.target.value,
                    }))
                  }
                  placeholder="Enter program name"
                />
              </div>
              <div>
                <Label htmlFor="mentor">Mentor</Label>
                <Input
                  id="mentor"
                  value={newIntern.mentor}
                  onChange={(e) =>
                    setNewIntern((prev) => ({
                      ...prev,
                      mentor: e.target.value,
                    }))
                  }
                  placeholder="Enter mentor's name"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newIntern.status}
                  onValueChange={(value) =>
                    setNewIntern((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Requirements</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    placeholder="Title"
                    value={newRequirement.title}
                    onChange={(e) =>
                      setNewRequirement((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                  <Select
                    value={newRequirement.type}
                    onValueChange={(value) =>
                      setNewRequirement((prev) => ({
                        ...prev,
                        type: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUIREMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addRequirement}
                    disabled={!newRequirement.title.trim()}
                  >
                    Add
                  </Button>
                </div>
                <Input
                  placeholder="Description (optional)"
                  value={newRequirement.description}
                  onChange={(e) =>
                    setNewRequirement((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
                <div className="mt-2 space-y-2">
                  {newIntern.requirements.map((req) => (
                    <div key={req.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`req-${req.id}`}
                        checked={req.completed}
                        onCheckedChange={(checked) =>
                          setNewIntern((prev) => ({
                            ...prev,
                            requirements: prev.requirements.map((r) =>
                              r.id === req.id ? { ...r, completed: checked } : r
                            ),
                          }))
                        }
                      />
                      <Label htmlFor={`req-${req.id}`}>
                        {req.title} ({req.type})
                        {req.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 ml-2 inline" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400 ml-2 inline" />
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newIntern.notes}
                  onChange={(e) =>
                    setNewIntern((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes about the intern"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveIntern}
                  disabled={!newIntern.name.trim() || !newIntern.email.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingIntern ? "Update Intern" : "Add Intern"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

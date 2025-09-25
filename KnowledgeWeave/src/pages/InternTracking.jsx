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
      await loadInterns(); // reload بعد save
    } catch (error) {
      console.error("Error saving intern:", error);
    }
  };

  const handleEditIntern = (intern) => {
    setEditingIntern(intern);
    setNewIntern(intern);
    setShowAddDialog(true);
  };

  const addRequirement = async () => {
    if (!newRequirement.title.trim()) return;
    setNewIntern((prev) => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        { ...newRequirement, completed: false },
      ],
    }));
    setNewRequirement({ title: "", description: "", type: "course" });
  };

  const removeRequirement = (requirementId) => {
    setNewIntern((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((req) => req.id !== requirementId),
    }));
  };

  const toggleRequirementCompletion = async (
    internId,
    requirementId,
    completed
  ) => {
    const intern = interns.find((i) => i.id === internId);
    if (!intern) return;

    const updatedRequirements = intern.requirements.map((req) =>
      req.id === requirementId
        ? {
            ...req,
            completed,
            completion_date: completed
              ? new Date().toISOString().split("T")[0]
              : "",
          }
        : req
    );

    try {
      await Intern.update(internId, {
        ...intern,
        requirements: updatedRequirements,
      });
      loadInterns();
    } catch (error) {
      console.error("Error updating requirement:", error);
    }
  };

  const getCompletionStats = (requirements = []) => {
    const total = requirements.length;
    const completed = requirements.filter((req) => req.completed).length;
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              Intern Progress Tracking
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor internship requirements and progress
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Intern
          </Button>
        </div>

        {interns.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No interns yet
              </h3>
              <p className="text-slate-600 mb-4">
                Start tracking intern progress by adding your first intern
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add First Intern
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {interns.map((intern) => {
              const stats = getCompletionStats(intern.requirements);
              const statusConfig = STATUS_OPTIONS.find(
                (s) => s.value === intern.status
              );

              return (
                <Card key={intern.id} className="border-slate-200">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-slate-900">
                            {intern.name}
                          </h3>
                          <Badge className={`${statusConfig.color} border-0`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{intern.email}</span>
                          </div>
                          {intern.start_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Started{" "}
                                {format(
                                  new Date(intern.start_date),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </div>
                          )}
                          {intern.mentor && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              <span>Mentor: {intern.mentor}</span>
                            </div>
                          )}
                        </div>
                        {intern.program && (
                          <p className="text-sm text-slate-600 mt-1">
                            Program: {intern.program}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.percentage}%
                        </div>
                        <div className="text-xs text-slate-500">
                          {stats.completed}/{stats.total} completed
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditIntern(intern)}
                          className="mt-2"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {intern.requirements && intern.requirements.length > 0 ? (
                      <div className="space-y-3">
                        {intern.requirements.map((requirement) => {
                          const TypeIcon =
                            REQUIREMENT_TYPES.find(
                              (t) => t.value === requirement.type
                            )?.icon || BookOpen;

                          return (
                            <div
                              key={requirement.id}
                              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                            >
                              <Checkbox
                                checked={requirement.completed}
                                onCheckedChange={(checked) =>
                                  toggleRequirementCompletion(
                                    intern.id,
                                    requirement.id,
                                    checked
                                  )
                                }
                                className="mt-0.5"
                              />
                              <div className="flex items-center gap-2 mb-1">
                                <TypeIcon className="w-4 h-4 text-slate-500" />
                                <Badge variant="outline" className="text-xs">
                                  {
                                    REQUIREMENT_TYPES.find(
                                      (t) => t.value === requirement.type
                                    )?.label
                                  }
                                </Badge>
                              </div>
                              <div className="flex-1">
                                <h4
                                  className={`font-medium ${
                                    requirement.completed
                                      ? "line-through text-slate-500"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {requirement.title}
                                </h4>
                                {requirement.description && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    {requirement.description}
                                  </p>
                                )}
                                {requirement.completed &&
                                  requirement.completion_date && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Completed on{" "}
                                      {format(
                                        new Date(requirement.completion_date),
                                        "MMM d, yyyy"
                                      )}
                                    </p>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">
                        No requirements defined yet
                      </p>
                    )}

                    {intern.notes && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-600">{intern.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIntern ? "Edit Intern" : "Add New Intern"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newIntern.name}
                    onChange={(e) =>
                      setNewIntern((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newIntern.email}
                    onChange={(e) =>
                      setNewIntern((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newIntern.status}
                    onValueChange={(value) =>
                      setNewIntern((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program">Program/Track</Label>
                  <Input
                    id="program"
                    value={newIntern.program}
                    onChange={(e) =>
                      setNewIntern((prev) => ({
                        ...prev,
                        program: e.target.value,
                      }))
                    }
                    placeholder="e.g., Software Development"
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
                    placeholder="Assigned mentor name"
                  />
                </div>
              </div>

              <div>
                <Label>Requirements</Label>
                <div className="mt-2 space-y-3">
                  {newIntern.requirements?.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {
                              REQUIREMENT_TYPES.find(
                                (t) => t.value === req.type
                              )?.label
                            }
                          </Badge>
                        </div>
                        <h4 className="font-medium">{req.title}</h4>
                        {req.description && (
                          <p className="text-sm text-slate-600">
                            {req.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequirement(req.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <Input
                        placeholder="Requirement title"
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
                  </div>
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

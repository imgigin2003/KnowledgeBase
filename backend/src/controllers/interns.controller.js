import { internsDb } from "../db/index.js";

export async function listInterns(req, res) {
  await internsDb.read();
  res.json(internsDb.data.interns || []);
}

export async function getIntern(req, res) {
  await internsDb.read();
  const intern = internsDb.data.interns.find((i) => i.id === req.params.id);
  intern ? res.json(intern) : res.status(404).json({ error: "Not found" });
}

export async function createIntern(req, res) {
  await internsDb.read();
  const intern = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  internsDb.data.interns.push(intern);
  await internsDb.write();
  res.json(intern);
}

export async function updateIntern(req, res) {
  await internsDb.read();
  const idx = internsDb.data.interns.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  internsDb.data.interns[idx] = {
    ...internsDb.data.interns[idx],
    ...req.body,
  };
  await internsDb.write();
  res.json(internsDb.data.interns[idx]);
}

export async function deleteIntern(req, res) {
  await internsDb.read();
  internsDb.data.interns = internsDb.data.interns.filter(
    (i) => i.id !== req.params.id,
  );
  await internsDb.write();
  res.json({ success: true });
}

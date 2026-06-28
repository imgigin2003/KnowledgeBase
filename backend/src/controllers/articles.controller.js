import { articlesDb } from "../db/index.js";

export async function listArticles(req, res) {
  await articlesDb.read();
  res.json(articlesDb.data.articles || []);
}

export async function getArticle(req, res) {
  await articlesDb.read();
  const article = articlesDb.data.articles.find((a) => a.id === req.params.id);
  article ? res.json(article) : res.status(404).json({ error: "Not found" });
}

export async function createArticle(req, res) {
  await articlesDb.read();
  const article = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  articlesDb.data.articles.push(article);
  await articlesDb.write();
  res.json(article);
}

export async function updateArticle(req, res) {
  await articlesDb.read();
  const idx = articlesDb.data.articles.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  articlesDb.data.articles[idx] = {
    ...articlesDb.data.articles[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  await articlesDb.write();
  res.json(articlesDb.data.articles[idx]);
}

export async function deleteArticle(req, res) {
  await articlesDb.read();
  articlesDb.data.articles = articlesDb.data.articles.filter(
    (a) => a.id !== req.params.id,
  );
  await articlesDb.write();
  res.json({ success: true });
}

export async function addComment(req, res) {
  await articlesDb.read();
  const idx = articlesDb.data.articles.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const comment = {
    id: Date.now().toString() + Math.random(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  articlesDb.data.articles[idx].comments =
    articlesDb.data.articles[idx].comments || [];
  articlesDb.data.articles[idx].comments.push(comment);
  await articlesDb.write();
  res.json(articlesDb.data.articles[idx]);
}

export async function updateComment(req, res) {
  await articlesDb.read();
  const aIdx = articlesDb.data.articles.findIndex(
    (a) => a.id === req.params.aid,
  );
  if (aIdx === -1) return res.status(404).json({ error: "Article not found" });

  const comments = articlesDb.data.articles[aIdx].comments || [];
  const cIdx = comments.findIndex((c) => c.id === req.params.cid);
  if (cIdx === -1) return res.status(404).json({ error: "Comment not found" });

  comments[cIdx] = {
    ...comments[cIdx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  await articlesDb.write();
  res.json(comments[cIdx]);
}

export async function deleteComment(req, res) {
  await articlesDb.read();
  const aIdx = articlesDb.data.articles.findIndex(
    (a) => a.id === req.params.aid,
  );
  if (aIdx === -1) return res.status(404).json({ error: "Article not found" });

  const initial = articlesDb.data.articles[aIdx].comments?.length || 0;
  articlesDb.data.articles[aIdx].comments =
    articlesDb.data.articles[aIdx].comments?.filter(
      (c) => c.id !== req.params.cid,
    ) || [];
  if (articlesDb.data.articles[aIdx].comments.length === initial)
    return res.status(404).json({ error: "Comment not found" });

  await articlesDb.write();
  res.json({ success: true });
}

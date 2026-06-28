import app from "./app.js";
import { initDB } from "./db/index.js";
import { PORT } from "./config.js";

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

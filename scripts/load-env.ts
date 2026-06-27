// Side-effect import: load .env.local before any module that reads process.env
// at import time. Must be the first import in scripts that need it.
import { config } from "dotenv";

config({ path: ".env.local" });

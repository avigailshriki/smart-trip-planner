import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${env.PORT}`);
  console.log(`   Health check: http://localhost:${env.PORT}/api/health`);
});

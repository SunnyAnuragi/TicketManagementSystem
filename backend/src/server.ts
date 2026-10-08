import app from "./app.js";
// import { testDatabaseConnection } from "./db/connection.js";

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// testDatabaseConnection();
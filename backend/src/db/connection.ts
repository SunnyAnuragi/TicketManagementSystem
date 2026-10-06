import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
});

// export const testDatabaseConnection = async () => {
//     try {
//         const connection = await pool.getConnection();

//         console.log("MySQL connected successfully");

//         connection.release();
//     } catch (error) {
//         console.error("MySQL connection failed:", error);
//     }
// };

export default pool;
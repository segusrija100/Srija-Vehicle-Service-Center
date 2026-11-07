require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Srija@200715",
  database: process.env.DB_NAME || "srija_vehicle_service",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const tables = {
  customers: { sql: "Customers", fields: ["name","phone","email","address"], required: ["name","phone"] },
  vehicles: { sql: "Vehicles", fields: ["customer_id","vehicle_number","vehicle_model","vehicle_type"], required: ["customer_id","vehicle_number","vehicle_model"] },
  services: { sql: "Services", fields: ["vehicle_id","service_type","service_date","description","service_charge","status"], required: ["vehicle_id","service_type","service_date"] },
  payments: { sql: "Payments", fields: ["service_id","amount","payment_date","payment_method","status"], required: ["service_id","amount"] }
};

app.get("/api/health", asyncRoute(async (req,res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, message: "Database connected" });
}));

app.get("/api/dashboard", asyncRoute(async (req,res) => {
  const [[customers]] = await pool.query("SELECT COUNT(*) total FROM Customers");
  const [[vehicles]] = await pool.query("SELECT COUNT(*) total FROM Vehicles");
  const [[services]] = await pool.query("SELECT COUNT(*) total FROM Services");
  const [[pending]] = await pool.query("SELECT COUNT(*) total FROM Services WHERE status NOT IN ('Completed','Cancelled')");
  const [[revenue]] = await pool.query("SELECT COALESCE(SUM(amount),0) total FROM Payments WHERE status='Paid'");
  const [recent] = await pool.query(`
    SELECT s.service_id, s.service_type, s.service_date, s.status, s.service_charge,
           v.vehicle_number, v.vehicle_model, c.name customer_name
    FROM Services s JOIN Vehicles v ON s.vehicle_id=v.vehicle_id
    JOIN Customers c ON v.customer_id=c.customer_id
    ORDER BY s.service_id DESC LIMIT 8`);
  res.json({ customers: customers.total, vehicles: vehicles.total, services: services.total,
    pending: pending.total, revenue: Number(revenue.total), recent });
}));

app.get("/api/lookups", asyncRoute(async (req,res) => {
  const [customers] = await pool.query("SELECT customer_id,name,phone FROM Customers ORDER BY name");
  const [vehicles] = await pool.query(`SELECT v.vehicle_id,v.vehicle_number,v.vehicle_model,c.name customer_name
    FROM Vehicles v JOIN Customers c ON v.customer_id=c.customer_id ORDER BY v.vehicle_id DESC`);
  const [services] = await pool.query(`SELECT s.service_id,s.service_type,v.vehicle_number,c.name customer_name
    FROM Services s JOIN Vehicles v ON s.vehicle_id=v.vehicle_id
    JOIN Customers c ON v.customer_id=c.customer_id ORDER BY s.service_id DESC`);
  res.json({customers, vehicles, services});
}));

app.get("/api/:resource", asyncRoute(async (req,res) => {
  const cfg = tables[req.params.resource];
  if (!cfg) return res.status(404).json({error:"Unknown resource"});
  let query;
  if (req.params.resource === "vehicles") query = `SELECT v.*, c.name customer_name FROM Vehicles v JOIN Customers c ON v.customer_id=c.customer_id ORDER BY v.vehicle_id DESC`;
  else if (req.params.resource === "services") query = `SELECT s.*, v.vehicle_number, v.vehicle_model, c.name customer_name FROM Services s JOIN Vehicles v ON s.vehicle_id=v.vehicle_id JOIN Customers c ON v.customer_id=c.customer_id ORDER BY s.service_id DESC`;
  else if (req.params.resource === "payments") query = `SELECT p.*, s.service_type, v.vehicle_number, c.name customer_name FROM Payments p JOIN Services s ON p.service_id=s.service_id JOIN Vehicles v ON s.vehicle_id=v.vehicle_id JOIN Customers c ON v.customer_id=c.customer_id ORDER BY p.payment_id DESC`;
  else query = "SELECT * FROM Customers ORDER BY customer_id DESC";
  const [rows] = await pool.query(query);
  res.json(rows);
}));

app.post("/api/:resource", asyncRoute(async (req,res) => {
  const cfg = tables[req.params.resource];
  if (!cfg) return res.status(404).json({error:"Unknown resource"});
  for (const f of cfg.required) if (req.body[f] === undefined || req.body[f] === "") return res.status(400).json({error:`${f} is required`});
  const fields = cfg.fields.filter(f => req.body[f] !== undefined);
  const values = fields.map(f => req.body[f] === "" ? null : req.body[f]);
  const [result] = await pool.query(`INSERT INTO ${cfg.sql} (${fields.join(",")}) VALUES (${fields.map(()=>"?").join(",")})`, values);
  res.status(201).json({id:result.insertId, message:"Record created"});
}));

app.put("/api/:resource/:id", asyncRoute(async (req,res) => {
  const cfg = tables[req.params.resource];
  if (!cfg) return res.status(404).json({error:"Unknown resource"});
  const fields = cfg.fields.filter(f => req.body[f] !== undefined);
  if (!fields.length) return res.status(400).json({error:"No fields supplied"});
  const values = fields.map(f => req.body[f] === "" ? null : req.body[f]);
  const [result] = await pool.query(`UPDATE ${cfg.sql} SET ${fields.map(f=>`${f}=?`).join(",")} WHERE ${req.params.resource === "customers" ? "customer_id" : req.params.resource === "vehicles" ? "vehicle_id" : req.params.resource === "services" ? "service_id" : "payment_id"}=?`, [...values, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({error:"Record not found"});
  res.json({message:"Record updated"});
}));

app.delete("/api/:resource/:id", asyncRoute(async (req,res) => {
  const cfg = tables[req.params.resource];
  if (!cfg) return res.status(404).json({error:"Unknown resource"});
  const idField = req.params.resource === "customers" ? "customer_id" : req.params.resource === "vehicles" ? "vehicle_id" : req.params.resource === "services" ? "service_id" : "payment_id";
  const [result] = await pool.query(`DELETE FROM ${cfg.sql} WHERE ${idField}=?`, [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({error:"Record not found"});
  res.json({message:"Record deleted"});
}));

app.use((err,req,res,next) => {
  console.error(err);
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({error:"That vehicle number already exists."});
  if (err.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({error:"Please select a valid related record."});
  res.status(500).json({error: err.message || "Server error"});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Srija Vehicle Service Center running at http://localhost:${PORT}`));

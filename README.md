# Srija Vehicle Service Center Management System

A redesigned, extended vehicle service center dashboard with a forest-green, ivory and coral theme built with HTML, CSS, JavaScript, Express.js and MySQL.

## Features
- Extended dashboard with live totals, service workflow, quick actions, popular services and recent activity.
- Full create, read, update and delete (CRUD) for all four modules.
- Customer-to-vehicle, vehicle-to-service and service-to-payment relationships.
- Search records, update job status, service charges and payment status.
- MySQL is the source of truth: edits made in the website are written to MySQL, and database edits appear after refreshing the website.

## 1. Create the database in MySQL Workbench
1. Open MySQL Workbench and connect to your local MySQL server.
2. Open `database.sql`.
3. Execute the script (lightning icon). It creates `srija_vehicle_service`, all four tables and optional sample rows.
4. To inspect the tables, run:
   ```sql
   USE srija_vehicle_service;
   SHOW TABLES;
   SELECT * FROM Customers;
   SELECT * FROM Vehicles;
   SELECT * FROM Services;
   SELECT * FROM Payments;
   ```

The sample rows are optional. If you do not want them, remove or skip the four `INSERT` statements at the bottom of `database.sql`.

## 2. Configure the app
1. Install Node.js (LTS).
2. Open this project folder in VS Code.
3. Open the VS Code terminal and run:
   ```bash
   npm install
   ```
4. Copy `.env.example` to a new file named `.env`.
5. Edit `.env` with your MySQL credentials. Example:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_actual_mysql_password
   DB_NAME=srija_vehicle_service
   ```
   Do not put quotation marks around values unless they are part of your password. Never upload `.env` to GitHub.
6. Start the server:
   ```bash
   npm start
   ```
7. Open `http://localhost:3000` in your browser.

## 3. Table relationship and entry order
- `Customers.customer_id` → `Vehicles.customer_id`
- `Vehicles.vehicle_id` → `Services.vehicle_id`
- `Services.service_id` → `Payments.service_id`

Add records in this order: **Customer → Vehicle → Service → Payment**. A vehicle must have an existing customer; a service must have an existing vehicle; a payment must have an existing service.

## 4. Example values to enter manually in Workbench

**Customers**
| name | phone | email | address |
|---|---|---|---|
| Kiran Reddy | 9876501234 | kiran@example.com | Kurnool, AP |
| Sneha Rao | 9123405678 | sneha@example.com | Hyderabad, TS |

**Vehicles** (use the actual customer IDs created by MySQL)
| customer_id | vehicle_number | vehicle_model | vehicle_type |
|---:|---|---|---|
| 1 | AP 21 XY 1111 | Maruti Swift | Car |
| 2 | TS 09 ZZ 2222 | TVS Jupiter | Scooter |

**Services** (use actual vehicle IDs)
| vehicle_id | service_type | service_date | description | service_charge | status |
|---:|---|---|---|---:|---|
| 1 | Oil change | 2026-11-12 | Engine oil and filter replacement | 1200.00 | Requested |
| 2 | Full service | 2026-11-13 | General inspection and cleaning | 1800.00 | Scheduled |

**Payments** (use actual service IDs)
| service_id | amount | payment_date | payment_method | status |
|---:|---:|---|---|---|
| 1 | 1200.00 | 2026-11-12 | UPI | Paid |
| 2 | 500.00 | 2026-11-13 | Cash | Pending |

## 5. GitHub upload
Create a new public or private repository named `srija-vehicle-service-center`.
Then run these commands in the VS Code terminal from the project folder:
```bash
git init
git add .
git commit -m "Initial commit - Srija Vehicle Service Center"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/srija-vehicle-service-center.git
git push -u origin main
```
Replace `YOUR-USERNAME` with your GitHub username. Check that `.env` is not included in the files being pushed.

## Notes
- This is a local development project. For public deployment, use a hosted MySQL database and configure environment variables on the hosting platform.
- Use strong validation and authentication before exposing it to the public internet. This starter project does not include login/role-based access.

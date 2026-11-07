CREATE DATABASE IF NOT EXISTS srija_vehicle_service;
USE srija_vehicle_service;

CREATE TABLE IF NOT EXISTS Customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(100),
  address VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Vehicles (
  vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  vehicle_number VARCHAR(30) NOT NULL UNIQUE,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_type VARCHAR(50),
  CONSTRAINT fk_vehicles_customer FOREIGN KEY (customer_id)
    REFERENCES Customers(customer_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Services (
  service_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  service_date DATE NOT NULL,
  description TEXT,
  service_charge DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(30) DEFAULT 'Requested',
  CONSTRAINT fk_services_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES Vehicles(vehicle_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  payment_method VARCHAR(30),
  status VARCHAR(20) DEFAULT 'Pending',
  CONSTRAINT fk_payments_service FOREIGN KEY (service_id)
    REFERENCES Services(service_id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Optional sample data. Run this section only once.
INSERT INTO Customers (name, phone, email, address) VALUES
('Rahul Kumar', '9876543210', 'rahul@example.com', 'Kurnool, Andhra Pradesh'),
('Ananya Reddy', '9123456780', 'ananya@example.com', 'Hyderabad, Telangana');

INSERT INTO Vehicles (customer_id, vehicle_number, vehicle_model, vehicle_type) VALUES
(1, 'AP 21 AB 1234', 'Hyundai i20', 'Car'),
(2, 'TS 09 CD 5678', 'Honda Activa', 'Bike');

INSERT INTO Services (vehicle_id, service_type, service_date, description, service_charge, status) VALUES
(1, 'General Service', '2026-11-10', 'Oil change, filters and inspection', 2500.00, 'In Progress'),
(2, 'Brake Inspection', '2026-11-08', 'Check front and rear brakes', 800.00, 'Requested');

INSERT INTO Payments (service_id, amount, payment_date, payment_method, status) VALUES
(1, 2500.00, '2026-11-10', 'UPI', 'Paid');

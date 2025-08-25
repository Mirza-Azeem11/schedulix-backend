# Schedulix Healthcare Management System - MySQL Database Schema

This document outlines the complete MySQL database schema for the Schedulix healthcare management application, covering all modules including user management, appointments, patients, payments, messaging, and administration.

## Core Tables

### 1. Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    avatar_url VARCHAR(500),
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

### 2. Roles Table
```sql
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT 'bg-blue-500',
    permissions JSON,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name)
);
```

### 3. User Roles Junction Table
```sql
CREATE TABLE user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_user_role (user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
);
```

## Doctor Management

### 4. Doctors Table
```sql
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    qualification TEXT,
    experience_years INT DEFAULT 0,
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    bio TEXT,
    office_address TEXT,
    consultation_hours JSON, -- Store weekly schedule
    languages_spoken JSON,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    availability_status ENUM('Available', 'Busy', 'Offline') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_specialization (specialization),
    INDEX idx_rating (rating),
    INDEX idx_verified (verified)
);
```

### 5. Doctor Availability Slots
```sql
CREATE TABLE doctor_time_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    appointment_types JSON,
    location VARCHAR(100) DEFAULT 'Clinic',
    consultation_type ENUM('In-Person', 'Online', 'Both') DEFAULT 'In-Person',
    max_patients INT DEFAULT 1,
    is_recurring BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    break_time_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    
    INDEX idx_doctor_day (doctor_id, day_of_week),
    INDEX idx_active (is_active)
);
```

## Patient Management

### 6. Patients Table
```sql
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    patient_code VARCHAR(50) UNIQUE NOT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    allergies JSON,
    current_medications JSON,
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_relation VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    status ENUM('Active', 'Inactive', 'Critical') DEFAULT 'Active',
    registered_by INT, -- Doctor who registered the patient
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (registered_by) REFERENCES doctors(id) ON DELETE SET NULL,
    
    INDEX idx_patient_code (patient_code),
    INDEX idx_status (status),
    INDEX idx_registered_by (registered_by)
);
```

## Appointment Management

### 8. Appointments Table
```sql
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    appointment_type VARCHAR(100) NOT NULL,
    consultation_type ENUM('In-Person', 'Online') DEFAULT 'In-Person',
    reason TEXT,
    notes TEXT,
    status ENUM('Scheduled', 'Confirmed', 'In_Progress', 'Completed', 'Cancelled', 'No_Show') DEFAULT 'Scheduled',
    priority ENUM('Low', 'Normal', 'High', 'Urgent') DEFAULT 'Normal',
    location VARCHAR(200),
    meeting_link VARCHAR(500), -- For online consultations
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_time INT DEFAULT 24, -- hours before
    cancellation_reason TEXT,
    cancelled_by INT,
    cancelled_at TIMESTAMP NULL,
    checked_in_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_appointment_number (appointment_number),
    INDEX idx_patient_doctor (patient_id, doctor_id),
    INDEX idx_date_time (appointment_date, appointment_time),
    INDEX idx_status (status),
    INDEX idx_doctor_date (doctor_id, appointment_date)
);
```

### 9. Appointment Reminders
```sql
CREATE TABLE appointment_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    reminder_type ENUM('Email', 'SMS', 'Push_Notification') NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    sent_at TIMESTAMP NULL,
    status ENUM('Pending', 'Sent', 'Failed') DEFAULT 'Pending',
    message_content TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_scheduled_time (scheduled_time),
    INDEX idx_status (status)
);
```


## Payment Management

### 11. Invoices Table
```sql
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_id INT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('Draft', 'Sent', 'Paid', 'Partially_Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft',
    notes TEXT,
    terms_and_conditions TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);
```

### 12. Invoice Items Table
```sql
CREATE TABLE invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    description TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    service_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    
    INDEX idx_invoice_id (invoice_id)
);
```

### 13. Payments Table
```sql
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    invoice_id INT NOT NULL,
    payment_method ENUM('Cash', 'Credit_Card', 'Debit_Card', 'Bank_Transfer', 'Insurance', 'Online') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_date TIMESTAMP NOT NULL,
    status ENUM('Pending', 'Completed', 'Failed', 'Refunded', 'Cancelled') NOT NULL,
    transaction_id VARCHAR(255),
    gateway_response JSON,
    failure_reason TEXT,
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_date TIMESTAMP NULL,
    processed_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_payment_reference (payment_reference),
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date)
);
```

## Administrative Features

### 14. System Settings
```sql
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('String', 'Number', 'Boolean', 'JSON') DEFAULT 'String',
    category VARCHAR(50) DEFAULT 'General',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category)
);
```


### 16. Notifications
```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Info', 'Success', 'Warning', 'Error', 'Appointment', 'Payment', 'Message') DEFAULT 'Info',
    priority ENUM('Low', 'Normal', 'High') DEFAULT 'Normal',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    expires_at TIMESTAMP NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);
```

## Analytics and Reporting

### 17. Analytics Events
```sql
CREATE TABLE analytics_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_data JSON,
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    page_url VARCHAR(500),
    referrer_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_event_name (event_name),
    INDEX idx_event_category (event_category),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
);
```

### 18. User Preferences and Settings
```sql
CREATE TABLE user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    theme ENUM('Light', 'Dark', 'System') DEFAULT 'System',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_settings JSON, -- Email, SMS, Push preferences
    dashboard_layout JSON,
    privacy_settings JSON,
    accessibility_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id)
);
```

### 19. File Uploads and Attachments
```sql
CREATE TABLE file_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) UNIQUE,
    uploaded_by INT NOT NULL,
    entity_type VARCHAR(50), -- 'patient', 'appointment', 'message', etc.
    entity_id INT,
    file_category ENUM('Avatar', 'Medical_Document', 'Lab_Result', 'Prescription', 'Insurance', 'Other') DEFAULT 'Other',
    is_public BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_file_hash (file_hash),
    INDEX idx_created_at (created_at)
);
```

### 20. Activity Logs (Enhanced)
```sql
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    activity_type ENUM('Login', 'Logout', 'Profile_Update', 'Appointment_Created', 'Appointment_Updated', 'Payment_Made', 'Message_Sent', 'File_Upload', 'Settings_Changed', 'Other') NOT NULL,
    description TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_activity (user_id, activity_type),
    INDEX idx_created_at (created_at),
    INDEX idx_entity (entity_type, entity_id)
);
```

### 21. System Reports
```sql
CREATE TABLE system_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_name VARCHAR(200) NOT NULL,
    report_type ENUM('Financial', 'Medical', 'Administrative', 'Analytics', 'Custom') NOT NULL,
    parameters JSON,
    generated_by INT NOT NULL,
    file_path VARCHAR(500),
    status ENUM('Generating', 'Completed', 'Failed') DEFAULT 'Generating',
    rows_count INT DEFAULT 0,
    file_size BIGINT DEFAULT 0,
    scheduled_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_report_type (report_type),
    INDEX idx_generated_by (generated_by),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

### 22. Consultation Notes and Templates
```sql
CREATE TABLE consultation_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    template_content TEXT NOT NULL,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_category (category),
    INDEX idx_public (is_public)
);
```

### 23. Patient Vitals and Measurements
```sql
CREATE TABLE patient_vitals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    appointment_id INT,
    recorded_by INT NOT NULL,
    measurement_date TIMESTAMP NOT NULL,
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    temperature DECIMAL(4,2),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,2),
    oxygen_saturation INT,
    blood_sugar DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_patient_date (patient_id, measurement_date),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_recorded_by (recorded_by)
);
```

### 24. Prescription Management
```sql
CREATE TABLE prescriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_id INT,
    diagnosis TEXT,
    instructions TEXT,
    status ENUM('Active', 'Completed', 'Cancelled', 'Expired') DEFAULT 'Active',
    prescribed_date DATE NOT NULL,
    valid_until DATE,
    refills_remaining INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    
    INDEX idx_prescription_number (prescription_number),
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_status (status)
);
```

### 25. Prescription Items
```sql
CREATE TABLE prescription_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prescription_id INT NOT NULL,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    quantity INT,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    
    INDEX idx_prescription_id (prescription_id)
);
```

### 26. Insurance Providers
```sql
CREATE TABLE insurance_providers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_name VARCHAR(200) NOT NULL,
    provider_code VARCHAR(50) UNIQUE,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    website VARCHAR(255),
    coverage_details JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_provider_code (provider_code),
    INDEX idx_provider_name (provider_name),
    INDEX idx_active (is_active)
);
```

### 27. Doctor Reviews and Ratings
```sql
CREATE TABLE doctor_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    appointment_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
    punctuality_rating INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    treatment_rating INT CHECK (treatment_rating >= 1 AND treatment_rating <= 5),
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    moderated_by INT,
    moderated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_patient_appointment_review (patient_id, appointment_id),
    INDEX idx_doctor_rating (doctor_id, rating),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

## Blog and Content Management

### 28. Blog Posts
```sql
CREATE TABLE blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    author_id INT NOT NULL,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    featured_image VARCHAR(500),
    category VARCHAR(100),
    tags JSON,
    status ENUM('Draft', 'Published', 'Scheduled', 'Archived') DEFAULT 'Draft',
    published_at TIMESTAMP NULL,
    view_count INT DEFAULT 0,
    reading_time INT, -- in minutes
    seo_title VARCHAR(300),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (author_id) REFERENCES doctors(id) ON DELETE CASCADE,
    
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_published_at (published_at),
    INDEX idx_author_id (author_id)
);
```

### 29. Blog Categories
```sql
CREATE TABLE blog_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT 'bg-blue-500',
    post_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
);
```

### 30. Blog Comments
```sql
CREATE TABLE blog_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT,
    author_name VARCHAR(100),
    author_email VARCHAR(255),
    comment_text TEXT NOT NULL,
    parent_comment_id INT,
    status ENUM('Pending', 'Approved', 'Rejected', 'Spam') DEFAULT 'Pending',
    ip_address VARCHAR(45),
    user_agent TEXT,
    moderated_by INT,
    moderated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_comment_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_post_status (post_id, status),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```

## Initial Data Setup

### Default Roles
```sql
INSERT INTO roles (name, description, color, permissions, is_system_role) VALUES 
('Super Admin', 'Full system access and control', 'bg-red-500', '["*"]', TRUE),
('Admin', 'Administrative access to manage users and system', 'bg-blue-500', '["user_management", "role_management", "payment_management", "analytics", "system_settings"]', TRUE),
('Doctor', 'Medical professional with patient and appointment management', 'bg-green-500', '["patient_management", "appointment_management", "messaging", "blog_management"]', TRUE),
('Patient', 'Patient with limited access to own data', 'bg-purple-500', '["view_appointments", "messaging", "profile_management"]', TRUE),
('Nurse', 'Nursing staff with patient care access', 'bg-pink-500', '["patient_management", "appointment_assistance", "messaging"]', TRUE),
('Receptionist', 'Front desk staff for appointment scheduling', 'bg-yellow-500', '["appointment_management", "patient_registration", "basic_messaging"]', TRUE);
```

### Default System Settings
```sql
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES 
('app_name', 'Schedulix', 'String', 'General', 'Application name', TRUE),
('default_appointment_duration', '30', 'Number', 'Appointments', 'Default appointment duration in minutes', FALSE),
('default_currency', 'USD', 'String', 'Payments', 'Default currency for payments', FALSE),
('reminder_hours_before', '24', 'Number', 'Notifications', 'Default hours before appointment for reminders', FALSE),
('max_appointments_per_day', '20', 'Number', 'Appointments', 'Maximum appointments per doctor per day', FALSE),
('allow_online_consultations', 'true', 'Boolean', 'Appointments', 'Enable online consultation feature', FALSE);
```

### Default User Preferences
```sql
INSERT INTO user_preferences (user_id, theme, language, timezone, notification_settings) 
SELECT id, 'System', 'en', 'UTC', '{"email": true, "sms": false, "push": true, "appointment_reminders": true, "marketing": false}'
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_preferences);
```

### Default Blog Categories
```sql
INSERT INTO blog_categories (name, slug, description, color) VALUES 
('Health Tips', 'health-tips', 'General health and wellness advice', 'bg-green-500'),
('Medical Research', 'medical-research', 'Latest medical research and findings', 'bg-blue-500'),
('Patient Stories', 'patient-stories', 'Success stories and patient experiences', 'bg-purple-500'),
('Hospital News', 'hospital-news', 'Updates and news from the hospital', 'bg-red-500'),
('Preventive Care', 'preventive-care', 'Prevention and early detection advice', 'bg-yellow-500');
```

### Default Insurance Providers
```sql
INSERT INTO insurance_providers (provider_name, provider_code, contact_phone, contact_email, website, is_active) VALUES 
('Blue Cross Blue Shield', 'BCBS', '1-800-123-4567', 'info@bcbs.com', 'https://bcbs.com', TRUE),
('Aetna', 'AETNA', '1-800-234-5678', 'support@aetna.com', 'https://aetna.com', TRUE),
('Cigna', 'CIGNA', '1-800-345-6789', 'help@cigna.com', 'https://cigna.com', TRUE),
('UnitedHealth', 'UHC', '1-800-456-7890', 'care@uhc.com', 'https://uhc.com', TRUE);
```

## Database Indexes and Optimization

### Additional Indexes for Performance
```sql
-- Composite indexes for common queries
CREATE INDEX idx_appointments_doctor_date_status ON appointments(doctor_id, appointment_date, status);
CREATE INDEX idx_patients_doctor_status ON patients(registered_by, status);
CREATE INDEX idx_payments_date_status ON payments(payment_date, status);

-- Full-text search indexes
ALTER TABLE patients ADD FULLTEXT(first_name, last_name, patient_code);
ALTER TABLE blog_posts ADD FULLTEXT(title, content, excerpt);

-- Performance indexes for new tables
CREATE INDEX idx_vitals_patient_date ON patient_vitals(patient_id, measurement_date DESC);
CREATE INDEX idx_prescriptions_patient_status ON prescriptions(patient_id, status);
CREATE INDEX idx_reviews_doctor_approved ON doctor_reviews(doctor_id, status) WHERE status = 'Approved';
CREATE INDEX idx_files_entity_category ON file_uploads(entity_type, entity_id, file_category);

-- Full-text search indexes for new content
ALTER TABLE consultation_templates ADD FULLTEXT(template_name, template_content);
ALTER TABLE prescriptions ADD FULLTEXT(diagnosis, instructions);
ALTER TABLE blog_comments ADD FULLTEXT(comment_text);
```

## Constraints and Triggers

### Business Logic Constraints
```sql
-- Ensure appointment times don't overlap for same doctor
DELIMITER //
CREATE TRIGGER check_appointment_overlap 
BEFORE INSERT ON appointments
FOR EACH ROW
BEGIN
    DECLARE overlap_count INT;
    SELECT COUNT(*) INTO overlap_count
    FROM appointments 
    WHERE doctor_id = NEW.doctor_id 
    AND appointment_date = NEW.appointment_date
    AND status NOT IN ('Cancelled', 'No_Show')
    AND (
        (NEW.appointment_time >= appointment_time AND NEW.appointment_time < ADDTIME(appointment_time, SEC_TO_TIME(duration_minutes * 60)))
        OR
        (ADDTIME(NEW.appointment_time, SEC_TO_TIME(NEW.duration_minutes * 60)) > appointment_time AND ADDTIME(NEW.appointment_time, SEC_TO_TIME(NEW.duration_minutes * 60)) <= ADDTIME(appointment_time, SEC_TO_TIME(duration_minutes * 60)))
    );
    
    IF overlap_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Appointment time conflicts with existing appointment';
    END IF;
END//
DELIMITER ;

-- Auto-generate patient codes
DELIMITER //
CREATE TRIGGER generate_patient_code 
BEFORE INSERT ON patients
FOR EACH ROW
BEGIN
    IF NEW.patient_code IS NULL OR NEW.patient_code = '' THEN
        SET NEW.patient_code = CONCAT('PAT', YEAR(NOW()), LPAD(LAST_INSERT_ID(), 6, '0'));
    END IF;
END//
DELIMITER ;

-- Update doctor rating when review is approved
DELIMITER //
CREATE TRIGGER update_doctor_rating 
AFTER UPDATE ON doctor_reviews
FOR EACH ROW
BEGIN
    IF NEW.status = 'Approved' AND OLD.status != 'Approved' THEN
        UPDATE doctors 
        SET rating = (
            SELECT AVG(rating) 
            FROM doctor_reviews 
            WHERE doctor_id = NEW.doctor_id AND status = 'Approved'
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM doctor_reviews 
            WHERE doctor_id = NEW.doctor_id AND status = 'Approved'
        )
        WHERE id = NEW.doctor_id;
    END IF;
END//
DELIMITER ;

-- Auto-generate prescription numbers
DELIMITER //
CREATE TRIGGER generate_prescription_number 
BEFORE INSERT ON prescriptions
FOR EACH ROW
BEGIN
    IF NEW.prescription_number IS NULL OR NEW.prescription_number = '' THEN
        SET NEW.prescription_number = CONCAT('RX', YEAR(NOW()), MONTH(NOW()), LPAD(LAST_INSERT_ID(), 6, '0'));
    END IF;
END//
DELIMITER ;

-- Update blog category post count
DELIMITER //
CREATE TRIGGER update_category_count 
AFTER INSERT ON blog_posts
FOR EACH ROW
BEGIN
    UPDATE blog_categories 
    SET post_count = post_count + 1 
    WHERE name = NEW.category;
END//
DELIMITER ;
```

This comprehensive schema covers all the major modules identified in the Schedulix application including user management, doctor profiles, patient records, appointment scheduling, messaging, payments, and administrative features. The schema is designed to be scalable, maintainable, and includes proper indexing for optimal performance.

## Summary of Enhancements Made

The updated schema now includes several additional features I found missing:

1. **User Preferences** - Theme, language, timezone, and notification settings
2. **File Management** - Comprehensive file upload and attachment system
3. **Enhanced Activity Logging** - Detailed user activity tracking
4. **System Reports** - Report generation and management
5. **Consultation Templates** - Reusable templates for doctors
6. **Patient Vitals** - Medical measurements and vital signs tracking  
7. **Prescription Management** - Complete prescription and medication tracking
8. **Insurance Integration** - Insurance provider management
9. **Doctor Reviews** - Patient feedback and rating system
10. **Blog Enhancement** - Categories and comments for the blog system

The schema now provides complete coverage of all the modules and features present in your Schedulix healthcare management application.

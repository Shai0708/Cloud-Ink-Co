
import React from 'react';
import {
    PatientIcon,
    BillingIcon,
    AppointmentIcon,
    PharmacyIcon,
    HRIcon,
    UsersIcon,
    BedIcon,
    ReportsIcon,
    MedicineIcon,
    CalendarIcon
} from './components/icons';

export interface Announcement {
  id?: number;
  title: string;
  content: string;
  created_at?: string;
}

export enum Department {
    PATIENT_RECORDS = "Patient Records",
    BILLING = "Billing and Insurance",
    APPOINTMENTS = "Appointments and Scheduling",
    PHARMACY = "Pharmacy and Inventory",
    HR = "Human Resources"
}

export const departments: Department[] = [
    Department.PATIENT_RECORDS,
    Department.BILLING,
    Department.APPOINTMENTS,
    Department.PHARMACY,
    Department.HR
];

export const departmentDescriptions: { [key in Department]: string } = {
    [Department.PATIENT_RECORDS]: "Manage and access comprehensive patient medical histories, records, and documents securely.",
    [Department.BILLING]: "Handle all billing inquiries, insurance claims, and payment processing with our integrated system.",
    [Department.APPOINTMENTS]: "Schedule, reschedule, and manage all patient appointments and provider availability.",
    [Department.PHARMACY]: "Oversee medication dispensing, track inventory levels, and manage pharmacy operations.",
    [Department.HR]: "Access employee information, manage payroll, and handle all human resources-related tasks."
};

export const departmentIconComponents: { [key in Department]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    [Department.PATIENT_RECORDS]: PatientIcon,
    [Department.BILLING]: BillingIcon,
    [Department.APPOINTMENTS]: AppointmentIcon,
    [Department.PHARMACY]: PharmacyIcon,
    [Department.HR]: HRIcon,
};

export interface DepartmentConfig {
  table: string;
  headers: string[];
  dataKeys: string[];
  selectQuery?: string;
  searchableColumns: string[];
}

// Configuration for each department's data fetching and display
export const departmentDataConfig: { [key in Department]: DepartmentConfig } = {
  [Department.PATIENT_RECORDS]: {
    table: 'patients',
    headers: ['Patient ID', 'First Name', 'Last Name', 'Birthday', 'Age', 'Gender', 'Phone', 'Address', 'Emergency Contact', 'Emergency Phone'],
    dataKeys: ['patient_id', 'first_name', 'last_name', 'birthday', 'age', 'gender', 'phone_number', 'address', 'emergency_contact_name', 'emergency_contact_number'],
    selectQuery: '*',
    searchableColumns: ['first_name', 'last_name', 'phone_number', 'address'],
  },
  [Department.BILLING]: {
    table: 'billing_and_insurance',
    headers: ['Billing #', 'Patient Name', 'Patient ID', 'Admission', 'Discharge', 'Total Charges', 'Covered', 'Paid', 'Balance', 'Status', 'Provider', 'Policy #', 'Service', 'Address', 'DOB', 'Email', 'Gender', 'Phone'],
    dataKeys: ['billing_number', 'patient_name', 'patient_id', 'admission_date', 'discharge_date', 'total_charges', 'amount_covered_by_insurance', 'amount_paid', 'running_balance', 'payment_status', 'insurance_provider', 'policy_number', 'service_description', 'address', 'date_of_birth', 'email', 'gender', 'phone_number'],
    selectQuery: '*',
    searchableColumns: ['billing_number', 'patient_name', 'insurance_provider', 'policy_number', 'payment_status'],
  },
  [Department.APPOINTMENTS]: {
    table: 'appointments',
    headers: ['Appt ID', 'Patient First Name', 'Patient Last Name', 'Employee', 'Date & Time', 'Type', 'Status', 'Room', 'Check-in', 'Complaint', 'Patient ID', 'Employee ID'],
    dataKeys: ['appt_id', 'patients.first_name', 'patients.last_name', 'employees.full_name', 'appt_datetime', 'appt_type', 'status', 'room', 'check_in_time', 'chief_complaint', 'patient_id', 'employee_id'],
    // Modified to remove explicit join syntax due to missing FK constraint
    selectQuery: '*', 
    // Removed related columns from search to avoid join errors
    searchableColumns: ['appt_type', 'status'], 
  },
  [Department.PHARMACY]: {
    table: 'medications',
    headers: ['ID', 'Generic Name', 'Description', 'Formulation', 'Dosage', 'Manufacturer', 'In Stock', 'Price/Unit'],
    dataKeys: ['medication_id', 'generic_name', 'description', 'formulation', 'dosage', 'manufacturer', 'quantity_stock', 'price_per_unit'],
    selectQuery: '*',
    searchableColumns: ['generic_name', 'manufacturer', 'formulation'],
  },
  [Department.HR]: {
    table: 'employees',
    headers: ['ID', 'Full Name', 'Job Title', 'Department', 'Location', 'Status', 'Hire Date', 'DOB', 'Salary', 'Email', 'Phone', 'Street', 'City', 'State', 'ZIP', 'Manager ID', 'Manager Activity'],
    dataKeys: ['employee_id', 'full_name', 'job_title', 'department_name', 'department_location', 'status', 'hire_date', 'date_of_birth', 'salary', 'email', 'phone_number', 'address_street', 'address_city', 'address_state', 'address_zip_code', 'manager_id', 'manager_activity'],
    selectQuery: '*',
    searchableColumns: ['full_name', 'job_title', 'department_name', 'status', 'email'],
  },
};

export const factIconColors: string[] = [
    '#22d3ee', // cyan-400
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#22c55e', // green-500
    '#a855f7'  // purple-500
];

export const factTitles: string[] = [
    "Total Employees",
    "Patients Admitted",
    "Pending Bills",
    "Medicine Stocks",
    "Appointments Scheduled"
];

// FIX: Replaced JSX syntax with React.createElement to be compatible with a .ts file.
export const factIcons: React.ReactNode[] = [
  React.createElement(UsersIcon, { className: "h-8 w-8", style: { color: factIconColors[0] } }),
  React.createElement(BedIcon, { className: "h-8 w-8", style: { color: factIconColors[1] } }),
  React.createElement(ReportsIcon, { className: "h-8 w-8", style: { color: factIconColors[2] } }),
  React.createElement(MedicineIcon, { className: "h-8 w-8", style: { color: factIconColors[3] } }),
  React.createElement(CalendarIcon, { className: "h-8 w-8", style: { color: factIconColors[4] } })
];

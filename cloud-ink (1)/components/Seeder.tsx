
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { faker } from '@faker-js/faker';
import { SpinnerIcon, ReportsIcon } from './icons';
import AnimatedWrapper from './AnimatedWrapper';
import { Department } from '../constants';

interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  address: string;
  birthday: string;
  gender: string;
  phone_number: string;
  age: number;
}

interface Employee {
  employee_id: number;
  full_name: string;
}

interface Medication {
  medication_id: number;
}

const Seeder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const generateData = async () => {
    setLoading(true);
    setLogs([]);
    setProgress(0);
    
    try {
      addLog("Starting data generation...");

      // 1. Generate Patients
      addLog("Generating 200 Patients...");
      const patients = [];
      for (let i = 0; i < 200; i++) {
        const birthDate = faker.date.birthdate({ min: 1, max: 90, mode: 'age' });
        const age = new Date().getFullYear() - birthDate.getFullYear();
        
        patients.push({
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          birthday: birthDate.toISOString().split('T')[0],
          age: age,
          gender: faker.person.sex(),
          phone_number: faker.phone.number(),
          address: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.state({ abbreviated: true }),
          emergency_contact_name: faker.person.fullName(),
          emergency_contact_number: faker.phone.number()
        });
      }
      const { data: insertedPatientsData, error: patientError } = await supabase
        .from('patients')
        .insert(patients)
        .select('patient_id, first_name, last_name, address, birthday, gender, phone_number, age');

      if (patientError) throw patientError;
      
      const insertedPatients = insertedPatientsData as Patient[] | null;
      
      addLog(`Successfully inserted ${insertedPatients?.length} patients.`);
      setProgress(20);

      // 2. Generate Employees
      addLog("Generating 200 Employees...");
      const employees = [];
      const jobTitles = ['Doctor', 'Nurse', 'Surgeon', 'Administrator', 'Pharmacist', 'Lab Technician', 'Radiologist', 'HR Specialist', 'Accountant'];
      
      // Use actual Department enums to ensure permissions work, plus Administration for Executives
      const depts = [
        Department.PATIENT_RECORDS,
        Department.BILLING,
        Department.APPOINTMENTS,
        Department.PHARMACY,
        Department.HR,
        'Administration' // Executive level
      ];
      
      for (let i = 0; i < 200; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        employees.push({
          full_name: `${firstName} ${lastName}`,
          job_title: faker.helpers.arrayElement(jobTitles),
          department_name: faker.helpers.arrayElement(depts),
          department_location: `Building ${faker.string.alpha({ length: 1, casing: 'upper' })}`,
          status: faker.helpers.arrayElement(['Active', 'On Leave', 'Sabbatical']),
          hire_date: faker.date.past({ years: 10 }).toISOString().split('T')[0],
          date_of_birth: faker.date.birthdate({ min: 22, max: 65, mode: 'age' }).toISOString().split('T')[0],
          salary: faker.number.int({ min: 40000, max: 250000 }),
          email: faker.internet.email({ firstName, lastName, provider: 'cloudink.hospital' }),
          phone_number: faker.phone.number(),
          address_street: faker.location.streetAddress(),
          address_city: faker.location.city(),
          address_state: faker.location.state({ abbreviated: true }),
          address_zip_code: faker.location.zipCode(),
          manager_activity: faker.lorem.sentence()
        });
      }
      
      const { data: insertedEmployeesData, error: employeeError } = await supabase
        .from('employees')
        .insert(employees)
        .select('employee_id, full_name');

      if (employeeError) throw employeeError;
      
      const insertedEmployees = insertedEmployeesData as Employee[] | null;

      addLog(`Successfully inserted ${insertedEmployees?.length} employees.`);
      setProgress(40);

      // 3. Generate Medications
      addLog("Generating 200 Medications...");
      const medications = [];
      const forms = ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream', 'Inhaler'];
      
      for (let i = 0; i < 200; i++) {
        medications.push({
          generic_name: faker.science.chemicalElement().name + ' ' + faker.helpers.arrayElement(['HCL', 'Sodium', 'Potassium']),
          description: faker.commerce.productDescription(),
          formulation: faker.helpers.arrayElement(forms),
          dosage: faker.number.int({ min: 5, max: 500 }) + 'mg',
          manufacturer: faker.company.name() + ' Pharma',
          quantity_stock: faker.number.int({ min: 0, max: 5000 }),
          price_per_unit: parseFloat(faker.commerce.price({ min: 1, max: 500 }))
        });
      }
      
      // Select medication_id so we can use it for prescriptions
      const { data: insertedMedicationsData, error: medError } = await supabase
        .from('medications')
        .insert(medications)
        .select('medication_id');

      if (medError) throw medError;
      
      const insertedMedications = insertedMedicationsData as Medication[] | null;
      
      addLog(`Successfully inserted ${medications.length} medications.`);
      setProgress(50);

      if (!insertedPatients || !insertedEmployees || !insertedMedications) throw new Error("Missing prerequisite data.");

      // 4. Generate Appointments
      addLog("Generating 200 Appointments...");
      const appointments = [];
      const apptTypes = ['Check-up', 'Emergency', 'Surgery', 'Follow-up', 'Consultation'];
      const statuses = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];

      for (let i = 0; i < 200; i++) {
        const randomPatient = faker.helpers.arrayElement(insertedPatients);
        const randomEmployee = faker.helpers.arrayElement(insertedEmployees);
        const isPast = faker.datatype.boolean();
        const date = isPast ? faker.date.recent({ days: 30 }) : faker.date.soon({ days: 30 });

        appointments.push({
          appt_datetime: date.toISOString(),
          appt_type: faker.helpers.arrayElement(apptTypes),
          status: isPast ? 'Completed' : faker.helpers.arrayElement(statuses),
          room: `Room ${faker.number.int({ min: 100, max: 500 })}`,
          check_in_time: isPast ? date.toISOString() : null,
          chief_complaint: faker.lorem.sentence(),
          patient_id: randomPatient.patient_id,
          employee_id: randomEmployee.employee_id
        });
      }

      const { error: apptError } = await supabase
        .from('appointments')
        .insert(appointments);

      if (apptError) throw apptError;
      addLog(`Successfully inserted ${appointments.length} appointments.`);
      setProgress(70);

      // 5. Generate Billing
      addLog("Generating 200 Billing Records...");
      const billings = [];
      const paymentStatuses = ['Paid', 'Pending', 'Overdue', 'Insurance Processing'];
      const insuranceProviders = ['Blue Cross', 'Aetna', 'UnitedHealth', 'Cigna', 'Medicare'];

      for (let i = 0; i < 200; i++) {
        const randomPatient = faker.helpers.arrayElement(insertedPatients);
        const admission = faker.date.past({ years: 1 });
        const discharge = new Date(admission);
        discharge.setDate(admission.getDate() + faker.number.int({ min: 1, max: 10 }));
        
        const total = parseFloat(faker.commerce.price({ min: 500, max: 50000 }));
        const covered = total * faker.number.float({ min: 0.5, max: 0.9 });
        const paid = total - covered; // Simplified

        billings.push({
          billing_number: `INV-${faker.string.numeric(6)}`,
          patient_name: `${randomPatient.first_name} ${randomPatient.last_name}`,
          patient_id: randomPatient.patient_id,
          admission_date: admission.toISOString().split('T')[0],
          discharge_date: discharge.toISOString().split('T')[0],
          total_charges: total,
          amount_covered_by_insurance: covered,
          amount_paid: paid,
          running_balance: 0,
          payment_status: faker.helpers.arrayElement(paymentStatuses),
          insurance_provider: faker.helpers.arrayElement(insuranceProviders),
          policy_number: faker.string.alphanumeric(10).toUpperCase(),
          service_description: faker.commerce.productName() + ' Treatment',
          address: randomPatient.address,
          date_of_birth: randomPatient.birthday,
          email: faker.internet.email({ firstName: randomPatient.first_name, lastName: randomPatient.last_name }),
          gender: randomPatient.gender,
          phone_number: randomPatient.phone_number
        });
      }

      const { error: billingError } = await supabase
        .from('billing_and_insurance')
        .insert(billings);

      if (billingError) throw billingError;
      addLog(`Successfully inserted ${billings.length} billing records.`);
      setProgress(85);

      // 6. Generate Prescriptions
      addLog("Generating 300 Prescriptions...");
      const prescriptions = [];
      for (let i = 0; i < 300; i++) {
          const randomPatient = faker.helpers.arrayElement(insertedPatients);
          const randomEmployee = faker.helpers.arrayElement(insertedEmployees);
          const randomMed = faker.helpers.arrayElement(insertedMedications);
          // Ensure some dates are very recent for the dashboard "This Month" chart
          const date = faker.date.recent({ days: 60 }); 
          
          prescriptions.push({
              patient_id: randomPatient.patient_id,
              employee_id: randomEmployee.employee_id,
              medication_id: randomMed.medication_id,
              prescription_date: date.toISOString(),
              dosage_instructions: `${faker.number.int({min:1, max:3})} times daily`
          });
      }

      const { error: rxError } = await supabase
        .from('prescriptions')
        .insert(prescriptions);

      if (rxError) {
          // Log warning but continue if table doesn't exist yet
          if (rxError.code === '42P01') {
             addLog("Warning: 'prescriptions' table not found. Skipping.");
          } else {
             throw rxError;
          }
      } else {
          addLog(`Successfully inserted ${prescriptions.length} prescriptions.`);
      }
      setProgress(95);

      // 7. Generate Announcements
      addLog("Generating 10 Announcements...");
      const announcements = [];
      for (let i = 0; i < 10; i++) {
          announcements.push({
              title: faker.company.catchPhrase(),
              content: faker.lorem.paragraph(),
          });
      }
      
      const { error: annError } = await supabase
        .from('announcements')
        .insert(announcements);

      if (annError) throw annError;
      addLog(`Successfully inserted ${announcements.length} announcements.`);

      setProgress(100);
      addLog("Data generation complete!");

    } catch (e: any) {
      console.error(e);
      addLog(`ERROR: ${e.message || e}`);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
      if(!confirm("Are you sure? This will delete ALL data from the main tables.")) return;
      
      setLoading(true);
      setLogs([]);
      addLog("Clearing data...");
      try {
           // Delete in reverse order of dependencies
           await supabase.from('prescriptions').delete().neq('prescription_id', 0); // Removed incorrect .catch()
           addLog("Cleared Prescriptions.");
           await supabase.from('billing_and_insurance').delete().neq('billing_number', '000000'); 
           addLog("Cleared Billing.");
           await supabase.from('appointments').delete().neq('appt_id', 0);
           addLog("Cleared Appointments.");
           await supabase.from('medications').delete().neq('medication_id', 0);
           addLog("Cleared Medications.");
           await supabase.from('employees').delete().neq('employee_id', 0);
           addLog("Cleared Employees.");
           await supabase.from('patients').delete().neq('patient_id', 0);
           addLog("Cleared Patients.");
           await supabase.from('announcements').delete().neq('id', 0);
           addLog("Cleared Announcements.");
           addLog("All tables cleared.");
      } catch (e: any) {
          console.error(e);
          addLog(`Error clearing data: ${e.message || e}`);
      } finally {
          setLoading(false);
      }
  }

  return (
    <AnimatedWrapper delay={0}>
      <div className="max-w-4xl mx-auto">
        <div className="p-8 bg-[#111827]/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center gap-6 mb-8 border-b border-gray-700 pb-6">
            <ReportsIcon className="h-16 w-16 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wider">Data Generator</h1>
              <p className="mt-2 text-md text-[#A9B4C2]">
                Populate your database with realistic dummy data for testing purposes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-[#1F2937] p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-400 mb-2">
                        Clicking generate will insert records into patients, employees, medications, appointments, billing, prescriptions, and announcements.
                    </p>
                  <button
                    onClick={generateData}
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                        Generating Data... {progress}%
                      </>
                    ) : (
                      'Generate Demo Data'
                    )}
                  </button>
                  
                   <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center">
                        <span className="px-2 bg-[#1F2937] text-sm text-gray-500">Danger Zone</span>
                        </div>
                    </div>

                  <button
                    onClick={clearData}
                    disabled={loading}
                    className="w-full py-2 px-4 border border-red-700 rounded-md shadow-sm text-sm font-medium text-red-400 hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-300"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-black/30 p-6 rounded-lg border border-gray-800 font-mono text-sm h-96 overflow-y-auto">
              <h3 className="text-gray-400 mb-2 sticky top-0 bg-black/80 p-2 -mx-2 -mt-2">Activity Log</h3>
              {logs.length === 0 ? (
                <span className="text-gray-600 italic">Ready to start...</span>
              ) : (
                <ul className="space-y-1">
                  {logs.map((log, index) => (
                    <li key={index} className="text-cyan-300 border-l-2 border-cyan-800 pl-2">
                      {log}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedWrapper>
  );
};

export default Seeder;

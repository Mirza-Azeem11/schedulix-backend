const { User, Doctor, Patient } = require('../models');
const bcrypt = require('bcryptjs');

const createTestPatients = async () => {
  try {
    console.log('Creating test patients...');

    // First, let's get an existing doctor to associate patients with
    const doctor = await Doctor.findOne({
      include: [{ model: User }]
    });

    if (!doctor) {
      console.log('No doctor found. Creating a test doctor first...');

      // Create a test doctor user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const doctorUser = await User.create({
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'doctor@test.com',
        password_hash: hashedPassword,
        role: 'Doctor',
        status: 'Active'
      });

      const newDoctor = await Doctor.create({
        user_id: doctorUser.id,
        license_number: 'DOC-123456',
        specialization: 'General Medicine',
        years_of_experience: 10,
        consultation_fee: 100.00,
        status: 'Active'
      });

      console.log('Test doctor created:', {
        id: newDoctor.id,
        name: `${doctorUser.first_name} ${doctorUser.last_name}`,
        email: doctorUser.email
      });
    }

    const doctorForPatients = await Doctor.findOne({
      include: [{ model: User }]
    });

    // Create test patient users
    const patientUsers = [];
    const patients = [];

    for (let i = 1; i <= 3; i++) {
      // Create user for patient
      const hashedPassword = await bcrypt.hash('password123', 10);
      const patientUser = await User.create({
        first_name: `Patient${i}`,
        last_name: `Test${i}`,
        email: `patient${i}@test.com`,
        password_hash: hashedPassword,
        role: 'Patient',
        status: 'Active'
      });

      patientUsers.push(patientUser);

      // Create patient profile
      const patient = await Patient.create({
        user_id: patientUser.id,
        patient_code: `PAT-${Date.now()}-${i}`,
        blood_type: ['A+', 'B+', 'O+'][i-1],
        height: 170 + i,
        weight: 70 + i,
        allergies: ['None', 'Penicillin', 'Peanuts'][i-1],
        emergency_contact_name: `Emergency Contact ${i}`,
        emergency_contact_relation: 'Family',
        emergency_contact_phone: `+1234567890${i}`,
        address: `${i}23 Test Street`,
        city: 'Test City',
        state: 'Test State',
        postal_code: `1234${i}`,
        country: 'Test Country',
        registered_by: doctorForPatients.id,
        status: 'Active'
      });

      patients.push(patient);
    }

    console.log('Test patients created successfully:');
    for (let i = 0; i < patients.length; i++) {
      console.log(`- ${patientUsers[i].first_name} ${patientUsers[i].last_name} (${patientUsers[i].email}) - Code: ${patients[i].patient_code}`);
    }

    console.log(`\nAll patients registered by Doctor ID: ${doctorForPatients.id}`);
    console.log('You can now test the patient selection in the appointment form.');

  } catch (error) {
    console.error('Error creating test patients:', error);
  }
};

// Run the script
createTestPatients().then(() => {
  console.log('Test patient creation completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});

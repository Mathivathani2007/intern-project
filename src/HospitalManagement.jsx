import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Task 62: Develop hospital management app
 * Hospital resource and patient management
 */

export const HospitalManagement = ({ user }) => {
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    medicalHistory: '',
    department: '',
    admissionDate: ''
  });

  useEffect(() => {
    fetchPatients();
    fetchDepartments();
  }, []);

  const fetchPatients = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'patients'));
      const patientList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(patientList);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'departments'));
      const deptList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(deptList);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleAdmitPatient = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'patients'), {
        ...newPatient,
        admissionDate: new Date().toISOString(),
        status: 'admitted'
      });
      alert('Patient admitted successfully!');
      setNewPatient({
        name: '',
        age: '',
        medicalHistory: '',
        department: '',
        admissionDate: ''
      });
      fetchPatients();
    } catch (error) {
      console.error('Error admitting patient:', error);
    }
  };

  const handleDischargePatient = async (patientId) => {
    try {
      await updateDoc(doc(db, 'patients', patientId), {
        status: 'discharged',
        dischargeDate: new Date().toISOString()
      });
      fetchPatients();
    } catch (error) {
      console.error('Error discharging patient:', error);
    }
  };

  return (
    <div className="hospital-management">
      <h2>Hospital Management System</h2>

      <form onSubmit={handleAdmitPatient} className="patient-form">
        <input
          type="text"
          placeholder="Patient Name"
          value={newPatient.name}
          onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={newPatient.age}
          onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
          required
        />
        <textarea
          placeholder="Medical History"
          value={newPatient.medicalHistory}
          onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})}
        />
        <select
          value={newPatient.department}
          onChange={(e) => setNewPatient({...newPatient, department: e.target.value})}
          required
        >
          <option value="">Select Department</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
        <button type="submit">Admit Patient</button>
      </form>

      <div className="patients-list">
        <h3>Current Patients</h3>
        {patients.filter(p => p.status === 'admitted').map(patient => (
          <div key={patient.id} className="patient-card">
            <h4>{patient.name}</h4>
            <p>Age: {patient.age}</p>
            <p>Department: {patient.department}</p>
            <p>Status: {patient.status}</p>
            <button onClick={() => handleDischargePatient(patient.id)}>Discharge</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HospitalManagement;

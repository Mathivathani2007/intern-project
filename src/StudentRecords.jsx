import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function StudentRecords() {
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [grade, setGrade] = useState('');
  const [department, setDepartment] = useState('');
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const studentsCollection = collection(db, 'studentRecords');

  const resetForm = () => {
    setName('');
    setRoll('');
    setGrade('');
    setDepartment('');
    setEditingId(null);
  };

  const fetchRecords = async () => {
    try {
      const snapshot = await getDocs(studentsCollection);
      const loaded = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
      setRecords(loaded);
    } catch (error) {
      console.error('Error loading student records:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !roll) return;

    try {
      if (editingId) {
        const recordDoc = doc(db, 'studentRecords', editingId);
        await updateDoc(recordDoc, {
          name,
          roll,
          grade,
          department,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(studentsCollection, {
          name,
          roll,
          grade,
          department,
          createdAt: new Date().toISOString(),
        });
      }
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error('Error saving student record:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'studentRecords', id));
      fetchRecords();
    } catch (error) {
      console.error('Error deleting student record:', error);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setName(record.name || '');
    setRoll(record.roll || '');
    setGrade(record.grade || '');
    setDepartment(record.department || '');
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="student-records card">
      <div className="section-header">
        <h2>📚 Student Record Manager</h2>
        <p className="section-subtitle">Add, update, and remove student records with a clean, responsive form layout.</p>
      </div>

      <form onSubmit={handleSave} className="student-form">
        <div className="form-group">
          <label>Student Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Student Name"
            required
          />
        </div>
        <div className="form-group">
          <label>Roll Number</label>
          <input
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="Roll Number"
            required
          />
        </div>
        <div className="form-group">
          <label>Grade</label>
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Grade"
          />
        </div>
        <div className="form-group">
          <label>Department</label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department"
          />
        </div>
        <button type="submit" className="primary-button">
          {editingId ? 'Update Record' : 'Add Student Record'}
        </button>
      </form>

      <div className="record-list">
        {records.length === 0 ? (
          <p className="empty-state">No student records found.</p>
        ) : (
          records.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-title">
                <strong>{record.name}</strong>
                <span>{record.roll}</span>
              </div>
              <div className="record-metadata">
                <span>{record.grade || 'Grade N/A'}</span>
                <span>{record.department || 'Department N/A'}</span>
              </div>
              <div className="record-actions">
                <button type="button" className="secondary-button" onClick={() => handleEdit(record)}>Edit</button>
                <button type="button" className="danger-button" onClick={() => handleDelete(record.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

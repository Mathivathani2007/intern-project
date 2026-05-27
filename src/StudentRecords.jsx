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
    <div style={{ padding: '20px', maxWidth: '420px' }}>
      <h2>📚 Task 29: Student Record Manager</h2>
      <form onSubmit={handleSave} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Student Name'
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder='Roll Number'
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder='Grade'
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder='Department'
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type='submit' style={{ padding: '10px 16px', width: '100%', cursor: 'pointer' }}>
          {editingId ? 'Update Record' : 'Add Student Record'}
        </button>
      </form>

      <div>
        {records.length === 0 ? (
          <p>No student records found.</p>
        ) : (
          <div>
            {records.map((record) => (
              <div key={record.id} style={{ marginBottom: '12px', padding: '12px', background: '#1f1f1f', borderRadius: '10px' }}>
                <div style={{ marginBottom: '6px' }}><strong>{record.name}</strong> - {record.roll}</div>
                <div style={{ fontSize: '0.9rem', color: '#ccc' }}>{record.grade || 'Grade N/A'} • {record.department || 'Department N/A'}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button onClick={() => handleEdit(record)} style={{ cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(record.id)} style={{ cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

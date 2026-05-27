import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Imports the database connection you just fixed
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'; 
export default function Attendance() {
  const [studentName, setStudentName] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Get today's date formatted as YYYY-MM-DD
  const todayDate = new Date().toISOString().split('T')[0];
  const handleMarkPresent = async (e) => {
    e.preventDefault(); // Prevents the browser page from refreshing
    
    if (studentName.trim() === '') return alert('Please enter a student name!');

    try {
      // 1. Point to your specific collection
      const attendanceRef = collection(db, "attendance");

      // 2. Add the document data payload
      await addDoc(attendanceRef, {
        name: studentName,
        date: todayDate,
        status: "Present"
      });

      alert(`Success! Marked ${studentName} as present.`);
      setStudentName(''); // Clear the input field box
      fetchTodayAttendance(); // Refresh our list immediately
    } catch (error) {
      console.error("Error adding document to Firestore: ", error);
    }
  };
  const fetchTodayAttendance = async () => {
    try {
      const attendanceRef = collection(db, "attendance");
      
      // Filter Firestore to only match documents where the date field equals today's date
      const q = query(attendanceRef, where("date", "==", todayDate));
      
      const querySnapshot = await getDocs(q);
      const records = [];
      
      // Loop through documents and extract data
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      
      setAttendanceRecords(records); // Put the data array into React state
    } catch (error) {
      console.error("Error fetching documents from Firestore: ", error);
    }
  };

  // Run the read function automatically when the page first loads up
  useEffect(() => {
    fetchTodayAttendance();
  }, []);
  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>📋 Task 28: Attendance Tracker</h2>
      <p>Today's Date: <strong>{todayDate}</strong></p>

      {/* Form to Create New Attendance Record */}
      <form onSubmit={handleMarkPresent} style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Enter Student Name" 
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '200px' }}
        />
        <button type="submit" style={{ padding: '8px 12px', cursor: 'pointer' }}>
          Mark Present
        </button>
      </form>

      {/* List to View Extracted Attendance Records */}
      <h3>Today's Present Students:</h3>
      {attendanceRecords.length === 0 ? <p>No logs recorded yet.</p> : (
        <ul>
          {attendanceRecords.map((record) => (
            <li key={record.id} style={{ marginBottom: '5px' }}>
              ✅ {record.name} ({record.status})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

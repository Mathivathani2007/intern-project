import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Task 61: Create appointment booking app
 * Appointment scheduling and management system
 */

export const AppointmentBooking = ({ user }) => {
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    serviceType: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    provider: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const appts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(appts.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        ...formData,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        bookedBy: user.email
      });

      alert('Appointment booked successfully!');
      setFormData({
        serviceType: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: '',
        provider: ''
      });
      fetchAppointments();
    } catch (error) {
      console.error('Booking error:', error);
      alert('Error booking appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
      fetchAppointments();
      alert('Appointment cancelled');
    } catch (error) {
      console.error('Cancellation error:', error);
    }
  };

  return (
    <div className="appointment-booking">
      <h2>Book an Appointment</h2>

      <form onSubmit={handleBookAppointment} className="booking-form">
        <input
          type="text"
          name="serviceType"
          placeholder="Service Type (e.g., Consultation, Checkup)"
          value={formData.serviceType}
          onChange={handleInputChange}
          required
        />
        <input
          type="date"
          name="appointmentDate"
          value={formData.appointmentDate}
          onChange={handleInputChange}
          required
        />
        <input
          type="time"
          name="appointmentTime"
          value={formData.appointmentTime}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="provider"
          placeholder="Provider/Professional Name"
          value={formData.provider}
          onChange={handleInputChange}
          required
        />
        <textarea
          name="notes"
          placeholder="Additional notes"
          value={formData.notes}
          onChange={handleInputChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>

      <div className="appointments-list">
        <h3>Your Appointments</h3>
        {appointments.length === 0 ? (
          <p>No appointments booked</p>
        ) : (
          appointments.map(appt => (
            <div key={appt.id} className="appointment-card">
              <p><strong>{appt.serviceType}</strong> - {appt.provider}</p>
              <p>{new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime}</p>
              <p>Status: <span className={`status ${appt.status}`}>{appt.status}</span></p>
              {appt.status === 'scheduled' && (
                <button onClick={() => handleCancelAppointment(appt.id)}>Cancel</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentBooking;

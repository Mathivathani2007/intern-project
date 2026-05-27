import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Task 63: Build event management system
 * Event creation, registration, and management
 */

export const EventManagement = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    capacity: 0,
    category: 'general'
  });

  useEffect(() => {
    fetchEvents();
    fetchRegisteredEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'events'));
      const eventList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventList);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const q = query(collection(db, 'eventRegistrations'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const registered = snapshot.docs.map(doc => doc.data().eventId);
      setRegisteredEvents(registered);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'events'), {
        ...formData,
        createdBy: user.uid,
        creatorEmail: user.email,
        registrations: 0,
        createdAt: new Date().toISOString()
      });
      alert('Event created successfully!');
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        eventTime: '',
        location: '',
        capacity: 0,
        category: 'general'
      });
      setShowCreateForm(false);
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      await addDoc(collection(db, 'eventRegistrations'), {
        eventId,
        userId: user.uid,
        userEmail: user.email,
        registeredAt: new Date().toISOString()
      });
      
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await (await import('firebase/firestore')).getDoc(eventRef);
      await updateDoc(eventRef, {
        registrations: (eventDoc.data().registrations || 0) + 1
      });
      
      alert('Registered for event!');
      fetchRegisteredEvents();
      fetchEvents();
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="event-management">
      <h2>Event Management</h2>

      <button onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? 'Close' : 'Create Event'}
      </button>

      {showCreateForm && (
        <form onSubmit={handleCreateEvent} className="event-form">
          <input
            type="text"
            placeholder="Event Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Event Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
          <input
            type="date"
            value={formData.eventDate}
            onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
            required
          />
          <input
            type="time"
            value={formData.eventTime}
            onChange={(e) => setFormData({...formData, eventTime: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="general">General</option>
            <option value="conference">Conference</option>
            <option value="workshop">Workshop</option>
            <option value="meetup">Meetup</option>
            <option value="webinar">Webinar</option>
          </select>
          <button type="submit">Create Event</button>
        </form>
      )}

      <div className="events-list">
        <h3>Available Events</h3>
        {events.map(event => (
          <div key={event.id} className="event-card">
            <h4>{event.title}</h4>
            <p>{event.description}</p>
            <p>📅 {new Date(event.eventDate).toLocaleDateString()} at {event.eventTime}</p>
            <p>📍 {event.location}</p>
            <p>👥 {event.registrations || 0} / {event.capacity} registered</p>
            <button
              onClick={() => handleRegisterEvent(event.id)}
              disabled={registeredEvents.includes(event.id)}
            >
              {registeredEvents.includes(event.id) ? 'Already Registered' : 'Register'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventManagement;

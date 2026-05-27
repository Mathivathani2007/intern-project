import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Task 65: Develop internship portal
 * Internship listing, application, and tracking
 */

export const InternshipPortal = ({ user }) => {
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [formData, setFormData] = useState({
    resume: '',
    coverLetter: '',
    availability: ''
  });

  useEffect(() => {
    fetchInternships();
    fetchApplications();
  }, [user]);

  const fetchInternships = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'internships'));
      const internshipList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInternships(internshipList);
    } catch (error) {
      console.error('Error fetching internships:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const q = query(collection(db, 'internshipApplications'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const appList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(appList);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleApplyInternship = async (internshipId) => {
    try {
      await addDoc(collection(db, 'internshipApplications'), {
        userId: user.uid,
        userEmail: user.email,
        internshipId,
        ...formData,
        status: 'applied',
        appliedAt: new Date().toISOString()
      });

      alert('Application submitted!');
      setFormData({ resume: '', coverLetter: '', availability: '' });
      fetchApplications();
    } catch (error) {
      console.error('Application error:', error);
    }
  };

  return (
    <div className="internship-portal">
      <h2>Internship Portal</h2>

      <div className="internships-list">
        <h3>Available Internships</h3>
        {internships.map(internship => {
          const hasApplied = applications.some(app => app.internshipId === internship.id);
          return (
            <div key={internship.id} className="internship-card">
              <h4>{internship.position}</h4>
              <p>Company: {internship.company}</p>
              <p>Duration: {internship.duration}</p>
              <p>Stipend: ₹{internship.stipend || 'Unpaid'}</p>
              <p>{internship.description}</p>
              <p>Requirements: {internship.requirements}</p>
              
              {!hasApplied ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleApplyInternship(internship.id);
                }}>
                  <textarea
                    placeholder="Cover Letter"
                    value={formData.coverLetter}
                    onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Upload Resume (URL or path)"
                    value={formData.resume}
                    onChange={(e) => setFormData({...formData, resume: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Availability"
                    value={formData.availability}
                    onChange={(e) => setFormData({...formData, availability: e.target.value})}
                    required
                  />
                  <button type="submit">Apply Now</button>
                </form>
              ) : (
                <p className="already-applied">✓ Already Applied</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="applications-list">
        <h3>Your Applications</h3>
        {applications.map(app => (
          <div key={app.id} className="application-card">
            <p><strong>{app.internshipId}</strong></p>
            <p>Status: <span className={`status ${app.status}`}>{app.status}</span></p>
            <p>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternshipPortal;

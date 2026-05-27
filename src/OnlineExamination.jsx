import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Task 64: Create online examination app
 * Exam creation, submission, and grading
 */

export const OnlineExamination = ({ user }) => {
  const [exams, setExams] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchExams();
    fetchSubmissions();
  }, [user]);

  const fetchExams = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'exams'));
      const examList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExams(examList);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const q = query(collection(db, 'examSubmissions'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const submissionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(submissionList);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleStartExam = (exam) => {
    setCurrentExam(exam);
    setAnswers({});
  };

  const handleAnswerQuestion = (questionId, answer) => {
    setAnswers({...answers, [questionId]: answer});
  };

  const handleSubmitExam = async () => {
    try {
      const correctAnswers = currentExam.questions.filter(q => 
        answers[q.id] === q.correctAnswer
      ).length;
      const score = (correctAnswers / currentExam.questions.length) * 100;

      await addDoc(collection(db, 'examSubmissions'), {
        userId: user.uid,
        examId: currentExam.id,
        examTitle: currentExam.title,
        answers,
        score,
        totalQuestions: currentExam.questions.length,
        correctAnswers,
        submittedAt: new Date().toISOString()
      });

      alert(`Exam submitted! Your score: ${score.toFixed(2)}%`);
      setCurrentExam(null);
      fetchSubmissions();
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  if (currentExam) {
    return (
      <div className="exam-container">
        <div className="exam-header">
          <h2>{currentExam.title}</h2>
          <p>Time limit: {currentExam.timeLimit} minutes</p>
          <button onClick={() => setCurrentExam(null)}>Exit Exam</button>
        </div>

        <div className="exam-questions">
          {currentExam.questions.map((question, idx) => (
            <div key={idx} className="question-card">
              <p><strong>Q{idx + 1}. {question.question}</strong></p>
              <div className="options">
                {question.options.map((option, optIdx) => (
                  <label key={optIdx}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerQuestion(question.id, e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSubmitExam} className="submit-btn">Submit Exam</button>
      </div>
    );
  }

  return (
    <div className="online-examination">
      <h2>Online Examination System</h2>

      <div className="available-exams">
        <h3>Available Exams</h3>
        {exams.map(exam => (
          <div key={exam.id} className="exam-card">
            <h4>{exam.title}</h4>
            <p>Questions: {exam.questions?.length || 0}</p>
            <p>Duration: {exam.timeLimit} minutes</p>
            <button onClick={() => handleStartExam(exam)}>Start Exam</button>
          </div>
        ))}
      </div>

      <div className="submission-history">
        <h3>Your Submissions</h3>
        {submissions.map(submission => (
          <div key={submission.id} className="submission-card">
            <p><strong>{submission.examTitle}</strong></p>
            <p>Score: {submission.score.toFixed(2)}%</p>
            <p>Correct: {submission.correctAnswers}/{submission.totalQuestions}</p>
            <p>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineExamination;

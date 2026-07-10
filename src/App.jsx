import { useState, useEffect } from 'react';
import { getLast7Days, getFriendlyDayName, getShortDateName, computeAverage } from './utils';

const PLAN_ITEMS = [
  { id: 'morningOffering', label: 'Morning offering' },
  { id: 'mentalPrayer', label: 'Mental prayer' },
  { id: 'mass', label: 'Mass' },
  { id: 'rosary', label: 'Rosary' },
  { id: 'angelus', label: 'Angelus' },
  { id: 'spiritualReading', label: 'Spiritual reading' },
  { id: 'hailMarys', label: '3 Hail Mary prayers' },
];

const DEFAULT_SCORES = {
  morningOffering: 1,
  mentalPrayer: 1,
  mass: 1,
  rosary: 1,
  angelus: 1,
  spiritualReading: 1,
  hailMarys: 1,
};

export default function App() {
  // App state
  const [appData, setAppData] = useState(() => {
    const saved = localStorage.getItem('spiritualJournalData');
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'walkthrough'
  const [activeDate, setActiveDate] = useState(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('spiritualJournalData', JSON.stringify(appData));
  }, [appData]);

  const handleStartDay = (dateString) => {
    setActiveDate(dateString);
    setCurrentView('walkthrough');
  };

  const handleFinishDay = (dateString, dayData) => {
    setAppData(prev => ({
      ...prev,
      [dateString]: {
        ...dayData,
        completed: true
      }
    }));
    setCurrentView('dashboard');
    setActiveDate(null);
  };

  const handleCancel = () => {
    setCurrentView('dashboard');
    setActiveDate(null);
  };

  if (currentView === 'dashboard') {
    return <Dashboard appData={appData} onStartDay={handleStartDay} />;
  }

  return (
    <Walkthrough 
      dateString={activeDate} 
      initialData={appData[activeDate]} 
      onFinish={(data) => handleFinishDay(activeDate, data)} 
      onCancel={handleCancel}
    />
  );
}

function Dashboard({ appData, onStartDay }) {
  const last7Days = getLast7Days();

  // Compute Weekly Average (only for completed days)
  let totalScore = 0;
  let completedDaysCount = 0;

  last7Days.forEach(dateStr => {
    const data = appData[dateStr];
    if (data && data.completed) {
      const avg = computeAverage(data.scores);
      totalScore += avg;
      completedDaysCount++;
    }
  });

  const weeklyAverage = completedDaysCount === 0 ? 0 : Number((totalScore / completedDaysCount).toFixed(1));

  return (
    <div className="dashboard-container step-container">
      <h1 className="serif">Begin Again</h1>
      
      <div className="glass-card weekly-summary">
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Weekly Average</h3>
        <div className="day-score" style={{ fontSize: '3rem' }}>
           {completedDaysCount > 0 ? `${weeklyAverage}` : '-'} <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/ 5</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Based on last 7 days</div>
      </div>

      <div className="day-list">
        {last7Days.map(dateStr => {
          const data = appData[dateStr];
          const isCompleted = data && data.completed;
          const avgScore = isCompleted ? computeAverage(data.scores) : 0;
          const resolution = data && data.resolution;

          return (
            <div 
              key={dateStr} 
              className="glass-card interactive day-item"
              onClick={() => onStartDay(dateStr)}
            >
              <div className="day-item-left">
                <span className="day-name">{getFriendlyDayName(dateStr)}</span>
                <span className="day-date">{getShortDateName(dateStr)}</span>
                {resolution && (
                   <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', marginTop: '8px', fontStyle: 'italic' }}>
                     "{resolution}"
                   </span>
                )}
              </div>
              <div className="day-score">
                {isCompleted ? `${avgScore} / 5` : '-'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Walkthrough({ dateString, initialData, onFinish, onCancel }) {
  const [step, setStep] = useState(1);
  const [scores, setScores] = useState(initialData?.scores || DEFAULT_SCORES);
  const [resolution, setResolution] = useState(initialData?.resolution || '');

  const totalSteps = 7;
  const currentAvg = computeAverage(scores);

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = () => {
    onFinish({ scores, resolution });
  };

  const updateScore = (id, value) => {
    setScores(prev => ({ ...prev, [id]: Number(value) }));
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <button className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }} onClick={onCancel}>
           Close
        </button>
        <span className="step-progress">Step {step} of {totalSteps}</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>{getFriendlyDayName(dateString)}</h2>
      <div className="subtitle">{getShortDateName(dateString)}</div>

      {step === 1 && (
        <div className="step-content glass-card">
          <h1 className="serif" style={{ color: 'var(--accent-gold-light)', margin: '40px 0' }}>Come, Holy Spirit!</h1>
          <div className="prayer-text" style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>
            Take a deep breath and invite the Holy Spirit to guide your reflection.
          </div>
          <div className="button-group">
            <button className="btn btn-primary" onClick={nextStep}>Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-content glass-card">
          <h2 className="serif">Thanksgiving</h2>
          <div className="step-prompt">
            Thank you, Lord, for all the good things today.
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '40px' }}>
            (Think about at least 2 of them.)
          </p>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn btn-primary" onClick={nextStep}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step-content glass-card">
          <h2 className="serif">Repentance</h2>
          <div className="step-prompt">
            I’m sorry, Lord, for the wrong things I did today.
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '40px' }}>
            (Think about at least 2 of them.)
          </p>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn btn-primary" onClick={nextStep}>Next</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="step-content glass-card" style={{ padding: '30px 24px' }}>
          <h2 className="serif" style={{ textAlign: 'center' }}>Plan of Life</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Score your plan of life from 1 to 5
          </p>

          {PLAN_ITEMS.map(item => (
            <div key={item.id} className="plan-item">
              <div className="plan-item-header">
                <span className="plan-item-title">{item.label}</span>
              </div>
              <div className="segmented-control">
                {[1, 2, 3, 4, 5].map(val => (
                  <button 
                    key={val}
                    className={`segment-btn ${scores[item.id] === val ? 'active' : ''}`}
                    onClick={() => updateScore(item.id, val)}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="average-display">
            <h3>Average Today</h3>
            <div className="big-score">{currentAvg} <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/ 5</span></div>
          </div>

          <div className="button-group" style={{ marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn btn-primary" onClick={nextStep}>Next</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="step-content glass-card">
          <h2 className="serif">Charity</h2>
          <div className="step-prompt">
            Did I show love for those around me with deeds?
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '40px' }}>
            (Think about it)
          </p>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn btn-primary" onClick={nextStep}>Next</button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="step-content glass-card">
          <h2 className="serif">Act of Contrition</h2>
          <div className="prayer-text" style={{ margin: '40px 0' }}>
            "Lord, have mercy on me, a sinner."
            <br /><br />
            "Lord, you know all things, you know that I love you."
          </div>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn btn-primary" onClick={nextStep}>Next</button>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="step-content glass-card">
          <h2 className="serif">Resolution</h2>
          <div className="step-prompt" style={{ fontSize: '1.2rem', margin: '20px 0' }}>
            Think about a resolution for tomorrow.
          </div>
          
          <div className="button-group">
            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn btn-primary" onClick={handleFinish}>Finish & Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getLast7Days, getFriendlyDayName, getShortDateName, computeAverage } from './utils';

const PLAN_ITEMS = [
  { id: 'getUpOnTime', label: 'Get up on time' },
  { id: 'morningOffering', label: 'Morning offering' },
  { id: 'mass', label: 'Mass' },
  { id: 'mentalPrayer', label: 'Mental prayer' },
  { id: 'rosary', label: 'Rosary' },
  { id: 'angelus', label: 'Angelus' },
  { id: 'spiritualReading', label: 'Spiritual reading' },
  { id: 'mortifications', label: 'Mortifications' },
  { id: 'hailMarys', label: '3 Hail Mary prayers' },
  { id: 'goBedOnTime', label: 'Go to bed on time' },
];

const DEFAULT_SCORES = PLAN_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: false }), {});

export default function App() {
  const [appData, setAppData] = useState(() => {
    const saved = localStorage.getItem('spiritualJournalData');
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('beginAgainTheme');
    return savedTheme || 'dark';
  });

  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'walkthrough' | 'review'
  const [activeDate, setActiveDate] = useState(null);

  useEffect(() => {
    localStorage.setItem('spiritualJournalData', JSON.stringify(appData));
  }, [appData]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('beginAgainTheme', theme);
  }, [theme]);

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Begin Again',
          text: 'Begin Again - A simple spiritual journal & plan of life tracking app.',
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleStartDay = (dateString) => {
    setActiveDate(dateString);
    if (appData[dateString]?.completed) {
      setCurrentView('review');
    } else {
      setCurrentView('walkthrough');
    }
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

  const handleUpdateDay = (dateString, dayData) => {
    setAppData(prev => ({
      ...prev,
      [dateString]: {
        ...dayData,
        completed: true
      }
    }));
  };

  const handleCancel = () => {
    setCurrentView('dashboard');
    setActiveDate(null);
  };

  return (
    <>
      {currentView === 'dashboard' && (
        <Dashboard 
          appData={appData} 
          onStartDay={handleStartDay} 
          theme={theme} 
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} 
          onShareClick={handleShareClick}
        />
      )}
      
      {currentView === 'review' && (
        <DailyReview 
          dateString={activeDate} 
          data={appData[activeDate]} 
          onUpdate={(data) => handleUpdateDay(activeDate, data)}
          onClose={handleCancel}
        />
      )}

      {currentView === 'walkthrough' && (
        <Walkthrough 
          dateString={activeDate} 
          initialData={appData[activeDate]} 
          onFinish={(data) => handleFinishDay(activeDate, data)} 
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

function Dashboard({ appData, onStartDay, theme, onToggleTheme, onShareClick }) {
  const last7Days = getLast7Days();
  const [perfExpanded, setPerfExpanded] = useState(false);

  let totalScore = 0;
  let completedDaysCount = 0;

  let itemTotals = {};
  let itemCounts = {};
  PLAN_ITEMS.forEach(item => { itemTotals[item.id] = 0; itemCounts[item.id] = 0; });

  last7Days.forEach(dateStr => {
    const data = appData[dateStr];
    if (data && data.completed) {
      const scoreCount = computeAverage(data.scores);
      totalScore += scoreCount;
      completedDaysCount++;

      if (data.scores) {
        PLAN_ITEMS.forEach(item => {
          if (data.scores[item.id] !== undefined) {
            itemTotals[item.id] += data.scores[item.id] ? 1 : 0;
            itemCounts[item.id]++;
          }
        });
      }
    }
  });

  const weeklyAverage = completedDaysCount === 0 ? 0 : Number((totalScore / completedDaysCount).toFixed(1));

  // Build sorted item list (descending by score)
  const sortedItems = PLAN_ITEMS.map(item => ({
    label: item.label,
    total: itemTotals[item.id],
    count: itemCounts[item.id],
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="dashboard-container step-container">
      <div className="dashboard-header">
        <h1 className="serif">Begin Again</h1>
        <div className="header-controls">
          <button className="control-btn" onClick={onShareClick} aria-label="Share app">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <button className="control-btn" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="glass-card weekly-summary">
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Weekly Average</h3>
        <div className="day-score" style={{ fontSize: '3rem' }}>
           {completedDaysCount > 0 ? `${weeklyAverage}` : '-'} <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/ 10</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Based on last 7 days</div>

        {completedDaysCount > 0 && (
          <>
            {!perfExpanded && (
              <div
                className="performance-overview"
                onClick={() => setPerfExpanded(true)}
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  View detailed breakdown ▾
                </div>
              </div>
            )}

            {perfExpanded && (
              <div className="performance-overview" onClick={() => setPerfExpanded(false)} style={{ cursor: 'pointer' }}>
                {sortedItems.map((item, i) => (
                  <div key={item.label} className="perf-item">
                    <span className="perf-label">{item.label}</span>
                    <span className="perf-value">
                      {item.total} / {item.count || '-'}
                    </span>
                  </div>
                ))}
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Tap to collapse ▴
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="day-list">
        {last7Days.map(dateStr => {
          const data = appData[dateStr];
          const isCompleted = data && data.completed;
          const scoreCount = isCompleted ? computeAverage(data.scores) : 0;
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
                {isCompleted ? `${scoreCount} / 10` : '-'}
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
  const [thanksgiving, setThanksgiving] = useState(initialData?.thanksgiving || '');
  const [repentance, setRepentance] = useState(initialData?.repentance || '');
  const [resolution, setResolution] = useState(initialData?.resolution || '');
  const [charity, setCharity] = useState(initialData?.charity || '');

  const totalSteps = 7;
  const currentTotal = computeAverage(scores);

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = () => {
    onFinish({ scores, thanksgiving, repentance, resolution, charity });
  };

  const toggleScore = (id) => {
    setScores(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const onCancelClick = () => {
    if (window.confirm("Are you sure you want to cancel? Any unsaved input will be lost.")) {
      onCancel();
    }
  };

  return (
    <div className="step-container">
      <div className="sticky-header">
        <div className="sticky-header-inner">
          <div className="step-header">
            <button className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }} onClick={onCancelClick}>
               Cancel
            </button>
            <span className="step-progress">Step {step} of {totalSteps}</span>
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>{getFriendlyDayName(dateString)}</h2>
          <div className="subtitle" style={{ marginBottom: '0' }}>{getShortDateName(dateString)}</div>
        </div>
      </div>
      <div className="scroll-content">

      {step === 1 && (
        <div className="step-content glass-card">
          <h2 className="serif">Act of Presence of God</h2>
          <div className="prayer-text" style={{ margin: '40px 0' }}>
            "Let me see with your eyes, Jesus, love of my heart, so I can recognize where I walked with you today and where I walked away from you."
            <br/><br/>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)'}}>
              or
            </div>
            <br/>
            "Come, Holy Spirit!"
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
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            (Try to recall at least 2 of them.)
          </p>
          <textarea 
            className="text-input"
            value={thanksgiving}
            onChange={(e) => setThanksgiving(e.target.value)}
            placeholder="Write your notes here..."
          />
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
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            (Try to recall at least 2 of them.)
          </p>
          <textarea 
            className="text-input"
            value={repentance}
            onChange={(e) => setRepentance(e.target.value)}
            placeholder="Write your notes here..."
          />
          <div className="button-group">
            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn btn-primary" onClick={nextStep}>Next</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="step-content glass-card" style={{ padding: '30px 24px' }}>
          <h2 className="serif">Plan of Life</h2>
          
          <div className="plan-list">
            {PLAN_ITEMS.map(item => (
              <div 
                key={item.id} 
                className="plan-item-toggle" 
                onClick={() => toggleScore(item.id)}
              >
                <span className="plan-item-title">{item.label}</span>
                <HeartIcon active={scores[item.id]} />
              </div>
            ))}
          </div>

          <div className="average-display">
            <h3>Completed Today</h3>
            <div className="big-score">{currentTotal} <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/ 10</span></div>
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
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            (Try to recall at least 2 of them.)
          </p>
          
          <textarea 
            className="text-input"
            value={charity}
            onChange={(e) => setCharity(e.target.value)}
            placeholder="Write your notes here..."
          />

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
          
          <textarea 
            className="text-input"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Write your resolution here..."
          />

          <div className="button-group">
            <button className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn btn-primary" onClick={handleFinish}>Finish & Save</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function DailyReview({ dateString, data, onUpdate, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [scores, setScores] = useState(data?.scores || DEFAULT_SCORES);
  const [thanksgiving, setThanksgiving] = useState(data?.thanksgiving || '');
  const [repentance, setRepentance] = useState(data?.repentance || '');
  const [resolution, setResolution] = useState(data?.resolution || '');
  const [charity, setCharity] = useState(data?.charity || '');

  const currentTotal = computeAverage(scores);

  const toggleScore = (id) => {
    if (!isEditing) return;
    setScores(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    onUpdate({ scores, thanksgiving, repentance, resolution, charity });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setScores(data?.scores || DEFAULT_SCORES);
    setThanksgiving(data?.thanksgiving || '');
    setRepentance(data?.repentance || '');
    setResolution(data?.resolution || '');
    setCharity(data?.charity || '');
    setIsEditing(false);
  };

  const handleCancelEditClick = () => {
    if (window.confirm("Are you sure you want to discard your changes?")) {
      handleCancelEdit();
    }
  };

  const handleCloseClick = () => {
    if (isEditing) {
      if (window.confirm("You have unsaved changes. Are you sure you want to go back to the dashboard?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="step-container">
      <div className="sticky-header">
        <div className="sticky-header-inner">
          <div className="step-header">
            <button className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }} onClick={handleCloseClick}>
               ← Dashboard
            </button>
            <span className="step-progress">{isEditing ? 'Editing' : 'Review'}</span>
            <button 
              className="btn btn-primary" 
              style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }} 
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>{getFriendlyDayName(dateString)}</h2>
          <div className="subtitle" style={{ marginBottom: '0' }}>{getShortDateName(dateString)}</div>
        </div>
      </div>
      <div className="scroll-content">
        {isEditing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.75rem', width: 'auto' }} 
              onClick={handleCancelEditClick}
            >
              Cancel Edit
            </button>
          </div>
        )}

        <div className="review-section glass-card">
          <h3 className="serif section-title">Thanksgiving</h3>
          {isEditing ? (
            <textarea 
              className="text-input"
              value={thanksgiving}
              onChange={(e) => setThanksgiving(e.target.value)}
              placeholder="Write your notes here..."
            />
          ) : (
            <div className="review-text-display">
              {thanksgiving || <span className="empty-placeholder">No notes added</span>}
            </div>
          )}
        </div>

        <div className="review-section glass-card">
          <h3 className="serif section-title">Repentance</h3>
          {isEditing ? (
            <textarea 
              className="text-input"
              value={repentance}
              onChange={(e) => setRepentance(e.target.value)}
              placeholder="Write your notes here..."
            />
          ) : (
            <div className="review-text-display">
              {repentance || <span className="empty-placeholder">No notes added</span>}
            </div>
          )}
        </div>

        <div className="review-section glass-card" style={{ padding: '30px 24px' }}>
          <h3 className="serif section-title" style={{ textAlign: 'center' }}>Plan of Life</h3>
          <div className="plan-list">
            {PLAN_ITEMS.map(item => (
              <div 
                key={item.id} 
                className={`plan-item-toggle ${!isEditing ? 'read-only' : ''}`} 
                onClick={() => toggleScore(item.id)}
              >
                <span className="plan-item-title">{item.label}</span>
                <HeartIcon active={scores[item.id]} />
              </div>
            ))}
          </div>
          <div className="average-display">
            <h3>Completed</h3>
            <div className="big-score">{currentTotal} <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/ 10</span></div>
          </div>
        </div>

        <div className="review-section glass-card">
          <h3 className="serif section-title">Charity</h3>
          {isEditing ? (
            <textarea 
              className="text-input"
              value={charity}
              onChange={(e) => setCharity(e.target.value)}
              placeholder="Write your deeds here..."
            />
          ) : (
            <div className="review-text-display">
              {charity || <span className="empty-placeholder">No notes added</span>}
            </div>
          )}
        </div>

        <div className="review-section glass-card">
          <h3 className="serif section-title">Resolution</h3>
          {isEditing ? (
            <textarea 
              className="text-input"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Write your resolution here..."
            />
          ) : (
            <div className="review-text-display">
              {resolution || <span className="empty-placeholder">No notes added</span>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function HeartIcon({ active }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="22" 
      height="22" 
      className={`heart-svg ${active ? 'active' : ''}`}
      fill={active ? "var(--accent-gold)" : "none"}
      stroke={active ? "var(--accent-gold)" : "var(--text-secondary)"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

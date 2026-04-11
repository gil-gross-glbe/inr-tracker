import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { getTodayDateString, parseDateLocal } from '../utils/pillLog';
import { computePrediction, getPredictionStatus } from '../utils/prediction';
import { Card, CardTitle, Badge } from '../components/Shared';

export const PredictScreen: React.FC = () => {
  const { pillLog: log, inrResults: results, targetRange: range, isLoading } = useDataContext();
  
  const [showCalculation, setShowCalculation] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 bg-screenBg min-h-[calc(100vh-60px)] pb-12 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todayStr = getTodayDateString();
  const prediction = computePrediction(results, log, todayStr);

  if (results.length < 2) {
    return (
      <div className="p-4 bg-screenBg min-h-[calc(100vh-60px)] pb-12 flex items-center justify-center">
        <div className="text-center text-textMuted text-sm px-6">
          Add at least 2 INR results on the INR tab to see your prediction.
        </div>
      </div>
    );
  }

  if (!prediction) return null; // Defensive guard

  const pStatus = getPredictionStatus(prediction.estimatedINR, range);
  
  let labelBadge = '';
  let badgeColor: 'green' | 'orange' | 'red' = 'green';
  let valueColor = 'text-primary';
  
  if (pStatus === 'in-range') {
    labelBadge = 'Likely in range';
  } else if (pStatus === 'high-warning' || pStatus === 'above') {
    labelBadge = 'Likely above range';
    badgeColor = pStatus === 'high-warning' ? 'red' : 'orange';
    valueColor = pStatus === 'high-warning' ? 'text-danger' : 'text-warning';
  } else {
    labelBadge = 'Likely below range';
    badgeColor = pStatus === 'low-warning' ? 'orange' : 'orange'; // low-warning specs say orange
    valueColor = pStatus === 'low-warning' ? 'text-warning' : 'text-warning';
  }

  // Warning Cards
  let warningCard = null;
  if (pStatus === 'high-warning') {
    warningCard = (
      <Card className="bg-dangerBg border-dangerBorder">
        <div className="text-danger text-xs font-medium text-center">
          Predicted INR is high. Consider contacting your doctor.
        </div>
      </Card>
    );
  } else if (pStatus === 'low-warning') {
    warningCard = (
      <Card className="bg-warningBg border-warning border-opacity-30">
        <div className="text-warning text-xs font-medium text-center">
          Predicted INR may be low. Consider contacting your doctor.
        </div>
      </Card>
    );
  }

  const formatD = (dStr: string) => parseDateLocal(dStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="p-4 bg-screenBg min-h-[calc(100vh-60px)] pb-12">
      {warningCard}
      
      <Card className="text-center pt-5 pb-3">
        <div className="text-xs text-textMuted mb-2">Estimated INR today</div>
        <div className={`text-[52px] font-medium leading-none ${valueColor} mb-2`}>
          {prediction.estimatedINR.toFixed(1)}
        </div>
        <Badge variant={badgeColor}>{labelBadge}</Badge>
        
        <div className="text-xs text-textMuted mt-3 leading-relaxed">
          Last test was {prediction.inrEnd} on {formatD(prediction.periodEndDate)}<br />
          You've taken {prediction.doseSinceLastTest}mg since then
          {prediction.doseSinceLastTest === 0 ? (
             <span className="block mt-1 text-warning">— No doses logged since your last test —<br/>showing last known INR.</span>
          ) : null}
        </div>
        
        <div className="h-px bg-borderLight my-4 w-full" />
        <div className="text-[11px] text-textMuted mt-2">
          Estimate only — always confirm with a blood test.
        </div>
      </Card>
      
      <Card>
        <div className="flex justify-between items-center mb-3">
          <CardTitle>How it was calculated</CardTitle>
          <button onClick={() => setShowCalculation(!showCalculation)} className="text-[11px] text-primary focus:outline-none">
            {showCalculation ? 'Hide' : 'Show details'}
          </button>
        </div>
        
        {showCalculation ? (
          <div className="space-y-2 text-xs">
             <div className="flex justify-between border-b border-borderLight py-1.5">
               <span className="text-textMuted">Reference period</span>
               <span className="font-medium">{formatD(prediction.periodStartDate)} → {formatD(prediction.periodEndDate)} ({prediction.daysInPeriod} days)</span>
             </div>
             <div className="flex justify-between border-b border-borderLight py-1.5">
               <span className="text-textMuted">Total dose that period</span>
               <span className="font-medium">{prediction.totalDoseInPeriod}mg</span>
             </div>
             <div className="flex justify-between border-b border-borderLight py-1.5">
               <span className="text-textMuted">INR change that period</span>
               <span className="font-medium">{prediction.inrStart} → {prediction.inrEnd} ({(prediction.inrEnd - prediction.inrStart) > 0 ? '+' : ''}{(prediction.inrEnd - prediction.inrStart).toFixed(1)})</span>
             </div>
             <div className="flex justify-between border-b border-borderLight py-1.5">
               <span className="text-textMuted">INR change per mg</span>
               <span className="font-medium">
                 {prediction.rate > 0 ? '+' : ''}{(prediction.rate).toFixed(4)}
               </span>
             </div>
             <div className="flex justify-between border-b border-borderLight py-1.5">
               <span className="text-textMuted">Dose since last test</span>
               <span className="font-medium">{prediction.doseSinceLastTest}mg</span>
             </div>
             <div className="flex justify-between border-b border-borderLight py-1.5">
               <span className="text-textMuted">Predicted change</span>
               <span className="font-medium">{(prediction.doseSinceLastTest * prediction.rate) > 0 ? '+' : ''}{(prediction.doseSinceLastTest * prediction.rate).toFixed(2)}</span>
             </div>
             <div className="flex justify-between py-1.5">
               <span className="font-medium text-textMain">Prediction</span>
               <span className="font-medium text-primary text-sm">{prediction.inrEnd} + {((prediction.doseSinceLastTest * prediction.rate)).toFixed(2)} = {prediction.estimatedINR.toFixed(2)}</span>
             </div>
             
             <div className="mt-3 p-2 bg-screenBg rounded-lg text-textSub text-xs leading-5">
               <b>Formula:</b> Last INR + (dose since last test × rate)<br/>
               Rate = INR change ÷ total dose in reference period
             </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

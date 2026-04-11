import React, { useState, useEffect } from 'react';
import { INRResult, TargetRange } from '../types';
import { useDataContext } from '../contexts/DataContext';
import { getTodayDateString, getWeeklyDose, parseDateLocal } from '../utils/pillLog';
import { validateINRForm, getINRStatus, sortINRResultsByDate, INRStatus } from '../utils/inrResults';
import { Card, CardTitle, ButtonPrimary, Input, Label, Badge } from '../components/Shared';
import { LineChart, Line, XAxis, YAxis, ReferenceArea, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';

const getStatusVisuals = (status: INRStatus) => {
  switch (status) {
    case 'in-range': return { colorClass: 'text-success', badgeVariant: 'green' as const, textOut: 'In range', fillC: '#0F6E56' };
    case 'above': return { colorClass: 'text-warning', badgeVariant: 'orange' as const, textOut: 'Above', fillC: '#854F0B' };
    case 'below': return { colorClass: 'text-warning', badgeVariant: 'orange' as const, textOut: 'Below', fillC: '#854F0B' };
    case 'above-danger': return { colorClass: 'text-danger', badgeVariant: 'red' as const, textOut: 'High Danger', fillC: '#A32D2D' };
    case 'below-danger': return { colorClass: 'text-danger', badgeVariant: 'red' as const, textOut: 'Low Danger', fillC: '#A32D2D' };
  }
};

const CustomDot = (props: { cx?: number; cy?: number; payload?: { value: number }; range: TargetRange }) => {
  const { cx, cy, payload, range } = props;
  const { fillC } = getStatusVisuals(getINRStatus(payload?.value ?? 0, range));
  return <circle cx={cx} cy={cy} r={4} fill={fillC} stroke="none" />;
};

export const INRScreen: React.FC = () => {
  const { pillLog: log, inrResults: results, saveINRResults, targetRange: range, saveTargetRange, isLoading } = useDataContext();
  
  const [inrValue, setInrValue] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [weeklyDose, setWeeklyDose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (date) {
      const calcDose = getWeeklyDose(log, date);
      setWeeklyDose(calcDose.toFixed(1));
    }
  }, [date, log]);

  if (isLoading) {
    return (
      <div className="p-4 bg-screenBg min-h-[calc(100vh-60px)] pb-12 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSaveResult = async () => {
    const val = parseFloat(inrValue);
    const validationErrors = validateINRForm(val, date);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    
    const newEntry: INRResult = {
      id: Date.now().toString(),
      date,
      value: val,
      weeklyDoseMg: parseFloat(weeklyDose) || 0,
      weeklyDoseOverridden: parseFloat(weeklyDose) !== getWeeklyDose(log, date),
      notes,
      createdAt: Date.now()
    };
    
    let newResults = [...results, newEntry];
    newResults = sortINRResultsByDate(newResults);
    await saveINRResults(newResults); // Real-time listener handles state update
    
    setInrValue('');
    setDate(getTodayDateString());
    setNotes('');
  };

  const handleUpdateRange = async (min: string, max: string) => {
    const r = { min: parseFloat(min) || range.min, max: parseFloat(max) || range.max };
    await saveTargetRange(r);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this result?")) {
      const newResults = results.filter(r => r.id !== id);
      await saveINRResults(newResults);
    }
  };

  const chartData = results.map(r => ({
    ...r,
    displayDate: parseDateLocal(r.date).toLocaleDateString('en-US', { month: 'short' })
  }));

  const sortedResultsDesc = [...results].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);

  return (
    <div className="p-4 bg-screenBg min-h-[calc(100vh-60px)] pb-12">
      <Card>
        <CardTitle>Add INR result</CardTitle>
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <Label>INR value</Label>
            <Input type="number" step="0.1" value={inrValue} onChange={e => setInrValue(e.target.value)} placeholder="0.0" />
          </div>
          <div className="flex-1">
            <Label>Date of test</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        
        <div className="mb-2">
           <Label rightText={`${weeklyDose}mg ✓`}>Weekly dose (auto)</Label>
           <Input type="number" step="0.1" value={weeklyDose} onChange={e => setWeeklyDose(e.target.value)} />
        </div>
        
        <div className="mb-2">
           <Label>Target range</Label>
           <div className="flex items-center gap-2">
             <Input type="number" step="0.1" className="w-[60px]" value={range.min} onChange={e => handleUpdateRange(e.target.value, String(range.max))} />
             <span className="text-xs text-textMuted">to</span>
             <Input type="number" step="0.1" className="w-[60px]" value={range.max} onChange={e => handleUpdateRange(String(range.min), e.target.value)} />
           </div>
        </div>
        
        <div className="mb-3">
           <Label>Notes (optional)</Label>
           <textarea className="w-full py-2.5 px-3 border border-borderDark rounded-xl text-[15px] bg-white text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary shadow-sm min-h-[44px]" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Doctor comments..." />
        </div>
        
        {errors.length > 0 ? (
          <div className="mb-3 text-danger text-xs p-2 bg-dangerBg rounded border border-dangerBorder">
            {errors.map((e,i) => <div key={i}>• {e}</div>)}
          </div>
        ) : null}
        
        <ButtonPrimary onClick={handleSaveResult}>Save result</ButtonPrimary>
      </Card>

      {chartData.length > 0 ? (
        <Card>
          <CardTitle>Trend — all tests</CardTitle>
          <div className="h-32 w-full mt-2 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#aaa' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#aaa' }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
                <ReferenceArea y1={range.min} y2={range.max} fill="#EAF3DE" fillOpacity={0.7} />
                <Line type="linear" dataKey="value" stroke="#0F6E56" strokeWidth={2} dot={<CustomDot range={range} />} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardTitle>History</CardTitle>
        {sortedResultsDesc.length === 0 ? (
          <div className="text-center text-xs text-textMuted py-4">No INR results yet. Add your first result above.</div>
        ) : (
          <div className="divide-y divide-borderLight">
            {sortedResultsDesc.map(r => {
              const status = getINRStatus(r.value, range);
              const { colorClass, badgeVariant, textOut } = getStatusVisuals(status);
              const dStr = parseDateLocal(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <div key={r.id} className="py-2.5 flex justify-between items-center group">
                  <div className="flex-1 mr-2">
                    <div className="text-xs text-textMuted">{dStr}</div>
                    {r.notes ? <div className="text-[11px] text-textSub mt-0.5 pr-2 leading-tight">{r.notes}</div> : null}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className={`text-xl font-medium leading-none mb-1 ${colorClass}`}>{r.value.toFixed(1)}</div>
                      <Badge variant={badgeVariant}>{textOut}</Badge>
                    </div>
                    <button onClick={() => handleDelete(r.id)} className="text-dangerBorder hover:text-danger hover:bg-dangerBg rounded p-1 transition-colors focus:outline-none">
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

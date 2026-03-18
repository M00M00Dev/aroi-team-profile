'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Star, Camera, X, Loader2, Globe,
  ChevronDown, Phone, Mail, Copy, Check, Trash2, CheckCircle2, BookOpen
} from 'lucide-react';

interface TrainingRecord {
  program_name: string;
  status: 'red' | 'yellow' | 'green';
  completion_date: string;
}

interface StaffMember {
  staff_id: string;
  name: string;
  phone: string;
  email: string;
  pay_type?: string;
  rate_weekday?: string;
  rate_weekend?: string;
  visa_status?: string;
  visa_exp?: string;
  bank_acc?: string;
  tfn_number?: string;
  super_name?: string;
  super_membership?: string;
  dob?: string;
  start_date?: string;
  training_step?: number;
  training_records?: TrainingRecord[];
}

const TRAINING_PROGRAMS = [
  "New Team Orientation",
  "New Team Assessment",
  "RSA",
  "Food Safety Handling",
  "Food Safety Supervisor",
  "Task List Enhancement",
  "Photo Enhancement"
];

// Helper: Normalizes old DD/MM/YYYY dates to standard YYYY-MM-DD for the Calendar Input
const normalizeDateForInput = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }
  return dateStr;
};

// Helper: Merges DB records with the Master List
const getFullTrainingRecords = (records?: TrainingRecord[]): TrainingRecord[] => {
  return TRAINING_PROGRAMS.map(progName => {
    const existing = records?.find(r => r.program_name === progName);
    return existing 
      ? { ...existing, completion_date: normalizeDateForInput(existing.completion_date) }
      : { program_name: progName, status: 'red', completion_date: '' };
  });
};

export default function TeamDashboard() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [submittingTraining, setSubmittingTraining] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // VERSION MARK - Updated with deployment crash protection
  const VERSION = "2603181220-PART3-DEPLOY-FIX"; 

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      
      // SAFETY CHECK: Only set staff if data is actually an array
      if (Array.isArray(data)) {
        setStaff(data);
      } else {
        console.error("API Error Response:", data);
        setStaff([]); // Keep it as an empty array to prevent crashes
      }
    } catch (err) { 
      console.error('Fetch error:', err);
      setStaff([]); 
    } 
    finally { setLoading(false); }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReviewSubmit = async () => {
    if (!rating || !selectedStaff) return alert('Please select a rating');
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/staff', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: selectedStaff.staff_id,
          name: selectedStaff.name,
          rating: rating,
          comment: comment,
          photoBase64: photoPreview 
        })
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setShowReviewModal(false);
          setIsSuccess(false);
          setRating(0);
          setComment('');
          setPhotoPreview(null);
          setSubmittingReview(false);
        }, 1500);
      } else {
        const errData = await res.json();
        alert(`Sync failed: ${errData.details || 'Server error'}`);
        setSubmittingReview(false);
      }
    } catch (err) { 
      alert('Network error.'); 
      setSubmittingReview(false); 
    }
  };

  const openTrainingModal = (person: StaffMember) => {
    setSelectedStaff(person);
    setTrainingRecords(getFullTrainingRecords(person.training_records));
    setShowTrainingModal(true);
  };

  const cycleTrainingStatus = (programName: string) => {
    setTrainingRecords(prev => prev.map(record => {
      if (record.program_name !== programName) return record;
      
      let newStatus: 'red' | 'yellow' | 'green' = 'red';
      let newDate = '';

      if (record.status === 'red') {
        newStatus = 'yellow';
      } else if (record.status === 'yellow') {
        newStatus = 'green'; 
        const today = new Date();
        newDate = today.toISOString().split('T')[0]; 
      } else if (record.status === 'green') {
        newStatus = 'red'; 
      }

      return { ...record, status: newStatus, completion_date: newDate };
    }));
  };

  const handleDateChange = (programName: string, dateVal: string) => {
    setTrainingRecords(prev => prev.map(record => 
      record.program_name === programName 
        ? { ...record, completion_date: dateVal } 
        : record
    ));
  };

  const handleTrainingSubmit = async () => {
    if (!selectedStaff) return;
    setSubmittingTraining(true);
    
    try {
      const res = await fetch('/api/staff', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: selectedStaff.staff_id,
          training_records: trainingRecords 
        })
      });

      if (res.ok) {
        setIsSuccess(true);
        await fetchStaff(); 
        
        setTimeout(() => {
          setShowTrainingModal(false);
          setIsSuccess(false);
          setSubmittingTraining(false);
        }, 1500);
      } else {
        const errData = await res.json();
        alert(`Sync failed: ${errData.details || 'Server error'}`);
        setSubmittingTraining(false);
      }
    } catch (err) { 
      alert('Network error.'); 
      setSubmittingTraining(false); 
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const formatDate = (dateStr: string | undefined, calculateRelative: boolean = false) => {
    if (!dateStr || dateStr.trim() === '' || dateStr === '—') return '—';
    let date: Date;
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/');
      date = new Date(`${y}-${m}-${d}`);
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) return dateStr; 
    const baseDate = `${date.getDate()} ${date.toLocaleString('en-GB', { month: 'short' })} ${date.getFullYear()}`;
    if (calculateRelative) {
      const today = new Date();
      let totalMonths = (today.getFullYear() - date.getFullYear()) * 12 + (today.getMonth() - date.getMonth());
      if (today.getDate() < date.getDate()) totalMonths--;
      return totalMonths < 12 ? `${baseDate} (${totalMonths <= 0 ? 0 : totalMonths} months)` : `${baseDate} (${Math.floor(totalMonths / 12)} years)`;
    }
    return baseDate;
  };

  const TrainingProgressBar = ({ records }: { records: TrainingRecord[] | undefined }) => {
    const fullRecords = getFullTrainingRecords(records);
    const completedCount = fullRecords.filter(r => r.status === 'green').length;

    return (
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="flex gap-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`h-1 w-5 rounded-full transition-all duration-700 ${i < completedCount ? 'bg-[#FFA448] shadow-[0_0_8px_rgba(255,164,72,0.4)]' : 'bg-white/10'}`} />
            ))}
          </div>
          <span className="text-[8px] font-black text-white/30 ml-2 uppercase tracking-tighter">Step {completedCount}/7</span>
        </div>
      </div>
    );
  };

  const DetailBlock = ({ label, value, color = "text-white" }: { label: string, value: string | undefined, color?: string }) => {
    const displayValue = value || '—';
    const isCopied = copiedText === displayValue;
    return (
      <div onClick={() => copyToClipboard(displayValue)} className={`relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer overflow-hidden group ${isCopied ? 'border-[#FFA448] ring-2 ring-[#FFA448]/20 bg-[#FFA448]/5' : 'bg-white/5 border-white/5 hover:bg-white/[0.07] active:scale-[0.97]'}`}>
        <div className={`transition-transform duration-300 ${isCopied ? '-translate-y-1 opacity-40 scale-95' : 'translate-y-0'}`}>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 flex justify-between items-center text-white/20">{label} <Copy size={10} className={`transition-opacity ${isCopied ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} /></p>
          <p className={`text-sm font-bold uppercase tracking-tight truncate ${color}`}>{displayValue}</p>
        </div>
        <div className={`absolute inset-x-0 bottom-0 h-1/2 flex items-center justify-center bg-gradient-to-t from-[#FFA448] to-[#FFA448]/80 transition-transform duration-300 ease-out ${isCopied ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center gap-1.5 font-black text-[9px] text-[#152232] uppercase"><Check size={12} strokeWidth={4} /> Copied</div>
        </div>
      </div>
    );
  };

  const filteredStaff = staff.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#0B1622] text-white p-4 md:p-10 font-sans tracking-tight">
      <div className="max-w-xl mx-auto mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#FFA448]">AROI <span className="text-white">TEAM</span></h1>
          <p className="text-[10px] text-white/20 tracking-[0.3em] font-bold uppercase">Profile Dashboard</p>
        </div>
        <div className="text-[9px] font-mono text-white/10 tracking-widest uppercase font-bold border-l border-white/10 pl-4">v.{VERSION}</div>
      </div>

      <div className="max-w-xl mx-auto mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#FFA448]" size={18} />
          <input type="text" placeholder="Search team member..." className="w-full bg-[#152232] border border-white/5 rounded-[24px] py-4 pl-12 pr-12 outline-none focus:ring-1 ring-[#FFA448] transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20"><X size={18} /></button>}
        </div>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#FFA448]" /></div>
        ) : (
          filteredStaff.map((person) => {
             const isExpanded = expandedId === person.staff_id;
             const bankBSB = (person.bank_acc || '').replace(/\D/g, '').substring(0, 6);
             const bankACC = (person.bank_acc || '').replace(/\D/g, '').substring(6);
             return (
              <div key={person.staff_id} className="bg-[#152232] border border-white/5 rounded-[40px] overflow-hidden transition-all duration-300 shadow-xl shadow-black/20">
                <div className="p-7">
                  <div className="flex justify-between items-start">
                    <div className="cursor-pointer flex-1" onClick={() => setExpandedId(isExpanded ? null : person.staff_id)}>
                      <div className="flex items-baseline gap-2 mb-4">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{person.name?.split(' ')[0]}</h2>
                        <span className="text-[10px] font-bold uppercase text-white/20 tracking-widest">{person.name?.split(' ').slice(1).join(' ')}</span>
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-0 text-[#FFA448]' : '-rotate-90 text-white/20'}`}><ChevronDown size={14} strokeWidth={3} /></div>
                      </div>
                      <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
                        <a href={`tel:${person.phone}`} className="flex items-center gap-2 text-white/40 font-mono hover:text-[#FFA448] transition-colors" style={{ fontSize: '11pt' }}><Phone size={13} className="opacity-40" />{(person.phone || '').replace(/\D/g, '').replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3')}</a>
                        <div className="flex items-center gap-3">
                          <a href={`mailto:${person.email}`} className="flex items-center gap-2 text-white/40 font-medium hover:text-[#FFA448] transition-colors" style={{ fontSize: '11pt' }}><Globe size={13} className="opacity-40" />{person.email?.split('@')[0]}</a>
                          {person.pay_type && (<span className="bg-white/5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md text-white/30 border border-white/5">{person.pay_type}</span>)}
                        </div>
                      </div>
                      
                      <TrainingProgressBar records={person.training_records} />
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button onClick={() => openTrainingModal(person)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black px-5 py-3 rounded-2xl uppercase text-[9px] tracking-widest active:scale-90 transition-all flex items-center justify-center gap-1.5">
                        <BookOpen size={12} className="opacity-60" /> Train
                      </button>
                      <button onClick={() => { setSelectedStaff(person); setShowReviewModal(true); }} className="bg-[#FFA448] text-[#152232] font-black px-5 py-3 rounded-2xl uppercase text-[9px] tracking-widest active:scale-90 shadow-lg shadow-[#FFA448]/10 flex items-center justify-center gap-1.5">
                        <Star size={12} className="fill-[#152232]" /> Review
                      </button>
                    </div>

                  </div>
                </div>

                <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-7 pb-10 pt-4 border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02] space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <DetailBlock label="Weekday Rate" value={person.rate_weekday} color="text-[#FFA448]" />
                      <DetailBlock label="Weekend Rate" value={person.rate_weekend} color="text-[#FFA448]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailBlock label="Visa Status" value={person.visa_status} />
                      <DetailBlock label="Expiry Date" value={formatDate(person.visa_exp)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailBlock label="BSB" value={bankBSB} />
                      <DetailBlock label="Account" value={bankACC} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <DetailBlock label="Date of Birth" value={formatDate(person.dob, true)} />
                      <DetailBlock label="Joined Date" value={formatDate(person.start_date, true)} />
                    </div>
                  </div>
                </div>
              </div>
             );
          })
        )}
      </div>

      {/* TRAINING POPUP */}
      {showTrainingModal && selectedStaff && (
        <div className="fixed inset-0 bg-[#0B1622]/95 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#152232] border border-white/10 w-full max-w-md rounded-[48px] p-8 relative shadow-2xl overflow-hidden">
            {isSuccess && (
              <div className="absolute inset-0 bg-[#FFA448] z-[60] flex flex-col items-center justify-center text-[#152232] animate-in zoom-in duration-300">
                <CheckCircle2 size={64} strokeWidth={3} className="mb-4 animate-bounce" />
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Records Updated</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Synced to Cloud</p>
              </div>
            )}
            <button className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors" onClick={() => setShowTrainingModal(false)}><X size={24} /></button>
            <h2 className="text-3xl font-black italic uppercase text-center mb-6 tracking-tighter">{selectedStaff.name?.split(' ')[0]} <span className="text-white/20">Training</span></h2>
            
            <div className="space-y-1 mb-8">
              <div className="flex text-[8px] font-black uppercase tracking-[0.2em] text-white/30 px-2 pb-2 border-b border-white/5">
                <div className="flex-1">Program</div>
                <div className="w-20 text-center">Status</div>
                <div className="w-28 text-right">Completion</div>
              </div>

              <div className="space-y-2 pt-2">
                {trainingRecords.map((record, idx) => (
                  <div key={idx} className="flex items-center bg-white/5 hover:bg-white/[0.07] border border-white/5 rounded-2xl p-3 transition-colors h-14">
                    <div className="flex-1 text-sm font-medium tracking-tight truncate pr-2 text-white/90">
                      {record.program_name}
                    </div>
                    
                    <div className="w-20 flex justify-center">
                      <div 
                        onClick={() => cycleTrainingStatus(record.program_name)}
                        className="flex gap-1.5 bg-[#0B1622] px-2 py-1.5 rounded-full cursor-pointer border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${record.status === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-red-500/20'}`} />
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${record.status === 'yellow' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'bg-yellow-400/20'}`} />
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${record.status === 'green' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-green-500/20'}`} />
                      </div>
                    </div>

                    <div className="w-28 flex justify-end">
                      {record.status === 'green' ? (
                        <input 
                          type="date"
                          value={record.completion_date || ''}
                          onChange={(e) => handleDateChange(record.program_name, e.target.value)}
                          className="bg-[#0B1622] text-white/80 text-[10px] p-1.5 rounded-md border border-white/10 outline-none focus:border-green-500 font-mono [color-scheme:dark] w-full text-right cursor-pointer"
                        />
                      ) : (
                        <span className="text-[10px] font-mono font-medium text-white/40 mr-2">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              disabled={submittingTraining || isSuccess} 
              onClick={handleTrainingSubmit} 
              className="w-full bg-white/10 hover:bg-white/15 text-white font-black py-5 rounded-[28px] uppercase tracking-widest text-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/5"
            >
              {submittingTraining ? <><Loader2 className="animate-spin text-[#FFA448]" size={18} /> Syncing...</> : 'Save Updates'}
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK POPUP */}
      {showReviewModal && selectedStaff && (
        <div className="fixed inset-0 bg-[#0B1622]/95 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#152232] border border-white/10 w-full max-w-md rounded-[48px] p-8 relative shadow-2xl overflow-hidden">
            {isSuccess && (
              <div className="absolute inset-0 bg-[#FFA448] z-[60] flex flex-col items-center justify-center text-[#152232] animate-in zoom-in duration-300">
                <CheckCircle2 size={64} strokeWidth={3} className="mb-4 animate-bounce" />
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Transfer Complete</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Synced to Cloud</p>
              </div>
            )}
            <button className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors" onClick={() => setShowReviewModal(false)}><X size={24} /></button>
            <h2 className="text-3xl font-black italic uppercase text-center mb-8 tracking-tighter">{selectedStaff.name?.split(' ')[0]} <span className="text-white/20">Review</span></h2>
            
            <div className="space-y-4">
              <textarea 
                className="w-full bg-white/5 border border-white/5 rounded-[32px] p-6 min-h-[160px] outline-none focus:ring-1 ring-[#FFA448] text-sm text-white/80 placeholder:text-white/10" 
                placeholder="Manager comments..." 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
              />
              
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[32px] border border-white/5">
                <div className="flex flex-1 justify-center items-center gap-1.5 px-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Star 
                      key={num} 
                      size={20} 
                      className={`cursor-pointer transition-all ${num <= rating ? 'fill-[#FFA448] text-[#FFA448] scale-110' : 'text-white/5 hover:text-white/20'}`} 
                      onClick={() => setRating(num)} 
                    />
                  ))}
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="pr-1 flex items-center">
                  {!photoPreview ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/20 border border-white/5 transition-all"
                    >
                      <Camera size={16} />
                      <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full border border-[#FFA448]/50 overflow-hidden relative group">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setPhotoPreview(null)}
                          className="absolute inset-0 bg-red-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                disabled={submittingReview || isSuccess} 
                onClick={handleReviewSubmit} 
                className="w-full bg-[#FFA448] text-[#152232] font-black py-5 rounded-[28px] uppercase tracking-widest text-sm disabled:opacity-50 active:scale-[0.98] shadow-xl shadow-[#FFA448]/10 flex items-center justify-center gap-2 transition-all"
              >
                {submittingReview ? <><Loader2 className="animate-spin" size={18} /> Syncing...</> : 'Save Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
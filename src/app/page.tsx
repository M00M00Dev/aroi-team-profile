'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Star, Camera, X, Loader2, Globe,
  ChevronDown, Phone, Mail, Copy, Check, Trash2, 
  CheckCircle2, BookOpen, MessageSquare, ShieldCheck, Calendar, Image as ImageIcon
} from 'lucide-react';

// --- INTERFACES ---
interface TrainingRecord {
  program_name: string;
  status: 'red' | 'yellow' | 'green' | 'grey';
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
  feedback_records?: any[]; 
}

// --- UTILS ---
const normalizeDateForInput = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }
  return dateStr;
};

const getFullTrainingRecords = (records: TrainingRecord[] | undefined, programsList: string[]): TrainingRecord[] => {
  return programsList.map(progName => {
    const existing = records?.find(r => r.program_name === progName);
    return existing 
      ? { ...existing, completion_date: normalizeDateForInput(existing.completion_date) }
      : { program_name: progName, status: 'red', completion_date: '' };
  });
};

export default function TeamDashboard() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [submittingTraining, setSubmittingTraining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const VERSION = "2603231330-LIGHT-BLUE-DATE"; 

  useEffect(() => { 
    fetchStaff(); 
    fetchPrograms(); 
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      const uniqueStaff = Array.isArray(data) ? data.filter((v, i, a) => 
        a.findIndex(t => t.staff_id === v.staff_id) === i
      ) : [];
      setStaff(uniqueStaff);
    } catch (err) { setStaff([]); } 
    finally { setLoading(false); }
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      const data = await res.json();
      if (data.success) setPrograms(data.programs);
    } catch (err) { console.error(err); }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const filteredStaff = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return staff;
    return staff.filter(s => 
      (s.name || '').toLowerCase().includes(query) || 
      (s.staff_id || '').toLowerCase().includes(query)
    );
  }, [search, staff]);

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
          rating,
          comment,
          date: reviewDate,
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
          setReviewDate(new Date().toISOString().split('T')[0]);
          setPhotoPreview(null);
          setSubmittingReview(false);
        }, 1500);
      }
    } catch (err) { setSubmittingReview(false); }
  };

  const openTrainingModal = (person: StaffMember) => {
    setSelectedStaff(person);
    setTrainingRecords(getFullTrainingRecords(person.training_records, programs));
    setShowTrainingModal(true);
  };

  const cycleTrainingStatus = (programName: string) => {
    setTrainingRecords(prev => prev.map(record => {
      if (record.program_name !== programName) return record;
      let newStatus: 'red' | 'yellow' | 'green' | 'grey' = 'red';
      let newDate = '';
      if (record.status === 'red') newStatus = 'yellow';
      else if (record.status === 'yellow') {
        newStatus = 'green'; 
        newDate = new Date().toISOString().split('T')[0]; 
      } 
      else if (record.status === 'green') newStatus = 'grey';
      else if (record.status === 'grey') newStatus = 'red';
      return { ...record, status: newStatus, completion_date: newDate };
    }));
  };

  const handleDateChange = (programName: string, dateVal: string) => {
    setTrainingRecords(prev => prev.map(record => 
      record.program_name === programName ? { ...record, completion_date: dateVal } : record
    ));
  };

  const handleTrainingSubmit = async () => {
    if (!selectedStaff) return;
    setSubmittingTraining(true);
    try {
      const res = await fetch('/api/staff', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: selectedStaff.staff_id, training_records: trainingRecords })
      });
      if (res.ok) {
        setIsSuccess(true);
        await fetchStaff(); 
        setTimeout(() => {
          setShowTrainingModal(false);
          setIsSuccess(false);
          setSubmittingTraining(false);
        }, 1500);
      }
    } catch (err) { setSubmittingTraining(false); }
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

  // --- UI COMPONENTS ---

  const TrainingProgressBar = ({ records }: { records: TrainingRecord[] | undefined }) => {
    const fullRecords = getFullTrainingRecords(records, programs);
    const completedCount = fullRecords.filter(r => r.status === 'green').length;
    const activeProgramsCount = fullRecords.filter(r => r.status !== 'grey').length;
    
    return (
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="flex gap-1">
            {fullRecords.map((record, i) => {
              let pillClass = 'bg-slate-100';
              if (record.status === 'red') pillClass = 'bg-red-100';
              if (record.status === 'yellow') pillClass = 'bg-yellow-400';
              if (record.status === 'green') pillClass = 'bg-green-500';
              if (record.status === 'grey') pillClass = 'bg-slate-200 opacity-30';
              return <div key={i} className={`h-1 w-5 rounded-full transition-all duration-700 ${pillClass}`} />;
            })}
          </div>
          <span className="text-[8px] font-black text-slate-400 ml-2 uppercase tracking-tighter">
            {completedCount}/{activeProgramsCount} PROGS
          </span>
        </div>
      </div>
    );
  };

  const DetailBlock = ({ label, value, color = "text-slate-900" }: { label: string, value: string | undefined, color?: string }) => {
    const displayValue = value || '—';
    const isCopied = copiedText === displayValue;
    return (
      <div onClick={() => copyToClipboard(displayValue)} className={`relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer overflow-hidden group ${isCopied ? 'border-[#FFA448] bg-[#FFA448]/5' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 active:scale-[0.97]'}`}>
        <div className={`transition-transform duration-300 ${isCopied ? '-translate-y-1 opacity-40 scale-95' : 'translate-y-0'}`}>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 flex justify-between items-center text-slate-400">{label} <Copy size={10} className={`transition-opacity ${isCopied ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} /></p>
          <p className={`text-sm font-bold uppercase tracking-tight truncate ${color}`}>{displayValue}</p>
        </div>
        <div className={`absolute inset-x-0 bottom-0 h-1/2 flex items-center justify-center bg-[#FFA448] transition-transform duration-300 ease-out ${isCopied ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center gap-1.5 font-black text-[9px] text-white uppercase font-sans tracking-widest"><Check size={12} strokeWidth={4} /> Copied</div>
        </div>
      </div>
    );
  };

  const BlueDetailBlock = ({ label, value }: { label: string, value: string | undefined }) => {
    const displayValue = value || '—';
    const isCopied = copiedText === displayValue;
    return (
      <div onClick={() => copyToClipboard(displayValue)} className={`relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer overflow-hidden group ${isCopied ? 'border-orange-500 bg-orange-500/10' : 'bg-blue-600 border-blue-700 hover:bg-blue-700 active:scale-[0.97] shadow-lg shadow-blue-500/20'}`}>
        <div className={`transition-transform duration-300 ${isCopied ? '-translate-y-1 opacity-40 scale-95' : 'translate-y-0'}`}>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 flex justify-between items-center text-white/50">{label} <Copy size={10} className={`text-white/50 transition-opacity ${isCopied ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} /></p>
          <p className="text-sm font-mono tracking-[0.2em] text-white break-all font-bold">
             {displayValue === '—' ? '—' : `***${displayValue.replace(/\D/g, '').substring(5)}`}
          </p>
        </div>
        <div className={`absolute inset-x-0 bottom-0 h-1/2 flex items-center justify-center bg-[#FFA448] transition-transform duration-300 ease-out ${isCopied ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center gap-1.5 font-black text-[9px] text-white uppercase tracking-widest"><Check size={12} strokeWidth={4} /> Copied</div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-screen max-w-full overflow-x-hidden min-h-screen bg-[#F8FAFC] text-slate-900 font-sans tracking-tight">
      <main className="p-4 md:p-10 w-full max-w-xl mx-auto pb-32">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8 mt-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#FFA448]">AROI <span className="text-slate-900">TEAM</span></h1>
            <p className="text-[10px] text-slate-400 tracking-[0.3em] font-bold uppercase font-sans">Profile Dashboard</p>
          </div>
          <div className="text-[9px] font-mono text-slate-300 tracking-widest uppercase font-bold border-l border-slate-200 pl-4">v.{VERSION}</div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FFA448]" size={18} />
            <input 
              type="text" 
              placeholder="Search team member..." 
              className="w-full bg-white border border-slate-200 rounded-[24px] py-4 pl-12 pr-12 outline-none focus:ring-2 ring-[#FFA448]/20 focus:border-[#FFA448] transition-all text-slate-900 placeholder:text-slate-400 shadow-sm" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X size={18} /></button>}
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#FFA448]" /></div>
          ) : (
            filteredStaff.map((person) => {
              const isExpanded = expandedId === person.staff_id;
              return (
                <div key={person.staff_id} className={`bg-white border transition-all duration-300 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 ${isExpanded ? 'border-[#FFA448]/30 ring-4 ring-[#FFA448]/5' : 'border-slate-100'}`}>
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                      
                      <div className="cursor-pointer flex-1 w-full min-w-0" onClick={() => setExpandedId(isExpanded ? null : person.staff_id)}>
                        <div className="flex items-start gap-2 mb-4">
                          <div className="min-w-0 flex-1">
                            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none break-words text-slate-900">
                              {person.name?.split(' ')[0]}
                              <span className="text-[10px] md:text-[12px] font-bold uppercase text-slate-300 tracking-widest ml-2 block sm:inline font-sans">
                                {person.name?.split(' ').slice(1).join(' ')}
                              </span>
                            </h2>
                          </div>
                          <div className={`mt-2 transition-transform duration-300 ${isExpanded ? 'rotate-0 text-[#FFA448]' : '-rotate-90 text-slate-300'}`}>
                            <ChevronDown size={16} strokeWidth={3} />
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 font-sans">
                          <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
                            <a href={`tel:${person.phone}`} className="flex items-center gap-2 text-slate-500 font-mono hover:text-[#FFA448] transition-colors text-sm font-semibold">
                              <Phone size={14} className="text-[#FFA448]" />
                              {(person.phone || '').replace(/\D/g, '').replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3')}
                            </a>
                            <a href={`mailto:${person.email}`} className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#FFA448] transition-colors text-sm truncate max-w-[150px]">
                              <Globe size={14} className="text-[#FFA448]" />
                              {person.email?.split('@')[0]}
                            </a>
                          </div>
                          {person.pay_type && (
                            <span className="w-fit bg-slate-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-slate-500 border border-slate-200">
                              {person.pay_type}
                            </span>
                          )}
                        </div>
                        <TrainingProgressBar records={person.training_records} />
                      </div>
                      
                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto pt-2 sm:pt-0">
                        <button onClick={(e) => { e.stopPropagation(); openTrainingModal(person); }} className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-900 font-black px-5 py-3.5 rounded-2xl uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm font-sans">
                          <BookOpen size={14} className="text-slate-400" /> Training
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedStaff(person); setShowReviewModal(true); }} className="flex-1 sm:flex-none bg-[#FFA448] text-white font-black px-5 py-3.5 rounded-2xl uppercase text-[10px] tracking-widest active:scale-95 shadow-lg shadow-[#FFA448]/20 flex items-center justify-center gap-2 transition-all font-sans">
                          <Star size={14} className="fill-white" /> Review
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 md:px-8 pb-10 pt-4 border-t border-slate-50 bg-slate-50/30 space-y-5 font-sans">
                      {person.feedback_records && person.feedback_records.length > 0 && (
                        <div className="mb-6 pt-2">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFA448] mb-4 flex items-center gap-2">
                            <MessageSquare size={12} /> Performance Feedback
                          </h3>
                          <div className="space-y-4">
                            {person.feedback_records.map((feed, fidx) => (
                              <div key={fidx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                <div className="flex justify-between mb-3 items-center">
                                  <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={12} className={i < feed.rating ? "fill-[#FFA448] text-[#FFA448]" : "text-slate-100"} />
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{feed.date}</span>
                                </div>
                                <p className="text-sm text-slate-600 italic leading-relaxed font-medium">"{feed.ai_refined_text || feed.comment}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <DetailBlock label="Weekday Rate" value={person.rate_weekday} color="text-[#FFA448]" />
                        <DetailBlock label="Weekend Rate" value={person.rate_weekend} color="text-[#FFA448]" />
                      </div>
                      
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                         <BlueDetailBlock label="TFN Number (Encrypted)" value={person.tfn_number} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <DetailBlock label="Visa Status" value={person.visa_status} />
                        <DetailBlock label="Expiry Date" value={formatDate(person.visa_exp)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailBlock label="BSB" value={(person.bank_acc || '').replace(/\D/g, '').substring(0, 6)} />
                        <DetailBlock label="Account" value={(person.bank_acc || '').replace(/\D/g, '').substring(6)} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
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

        {/* --- BOTTOM ACTION BAR --- */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-100 p-2.5 rounded-3xl shadow-2xl flex justify-between items-center shadow-slate-300/40">
            <button className="flex-1 py-3 text-[#FFA448] flex justify-center active:scale-95 transition-transform"><Search size={22} /></button>
            <button className="flex-1 py-3 text-slate-400 hover:text-slate-700 transition-colors flex justify-center"><ImageIcon size={22} /></button>
            <button className="flex-1 py-3 text-slate-400 hover:text-slate-700 transition-colors flex justify-center"><MessageSquare size={22} /></button>
          </div>
        </div>

        {/* --- MODALS --- */}
        {showTrainingModal && selectedStaff && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-[40px] p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
              {isSuccess && <div className="absolute inset-0 bg-[#FFA448] z-[60] flex items-center justify-center rounded-[40px] text-white font-black uppercase text-2xl animate-in zoom-in">Records Synced!</div>}
              <button className="absolute top-8 right-8 text-slate-300 hover:text-slate-500" onClick={() => setShowTrainingModal(false)}><X size={24} /></button>
              <h2 className="text-3xl font-black italic uppercase text-center mb-8 tracking-tighter text-slate-900">{selectedStaff.name?.split(' ')[0]} <span className="text-slate-200">Log</span></h2>
              
              <div className="space-y-3">
                 {trainingRecords.map((record, idx) => (
                    <div key={idx} className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <div className="flex-1 text-sm font-bold text-slate-700 break-words">{record.program_name}</div>
                      <div onClick={() => cycleTrainingStatus(record.program_name)} className="flex gap-1.5 bg-white px-2 py-1.5 rounded-full cursor-pointer border border-slate-200 items-center transition-colors hover:border-slate-300">
                        <div className={`w-2.5 h-2.5 rounded-full ${record.status === 'red' ? 'bg-red-500' : 'bg-red-100'}`} />
                        <div className={`w-2.5 h-2.5 rounded-full ${record.status === 'yellow' ? 'bg-yellow-400' : 'bg-yellow-100'}`} />
                        <div className={`w-2.5 h-2.5 rounded-full ${record.status === 'green' ? 'bg-green-500' : 'bg-green-100'}`} />
                      </div>
                    </div>
                  ))}
              </div>
              <button onClick={handleTrainingSubmit} className="mt-10 w-full bg-slate-900 text-white font-black py-4.5 rounded-3xl uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all">Save Records</button>
            </div>
          </div>
        )}

        {showReviewModal && selectedStaff && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-md rounded-[40px] p-8 relative shadow-2xl font-sans">
              {isSuccess && <div className="absolute inset-0 bg-[#FFA448] z-[60] flex items-center justify-center rounded-[40px] text-white font-black uppercase text-2xl animate-in zoom-in">Feedback Sent</div>}
              <button className="absolute top-8 right-8 text-slate-300 hover:text-slate-500" onClick={() => setShowReviewModal(false)}><X size={24} /></button>
              <h2 className="text-3xl font-black italic uppercase text-center mb-6 tracking-tighter text-slate-900">{selectedStaff.name?.split(' ')[0]} <span className="text-slate-200">Review</span></h2>

              {/* DATE PICKER */}
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 mb-2 block">Shift Date</label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-[#FFA448]" size={16} />
                  <input 
                    type="date" 
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 ring-[#FFA448]/10 focus:border-[#FFA448] text-sm font-bold text-slate-700 shadow-sm transition-all appearance-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <textarea className="w-full bg-slate-50 border border-slate-100 rounded-[28px] p-6 min-h-[140px] outline-none focus:ring-2 ring-[#FFA448]/20 focus:border-[#FFA448] text-slate-700 placeholder:text-slate-300 text-sm leading-relaxed" placeholder="Manager comments..." value={comment} onChange={(e) => setComment(e.target.value)} />
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-full border border-slate-100 mb-6">
                  <div className="flex-1 flex justify-center gap-2">
                     {[1, 2, 3, 4, 5].map((num) => (
                      <Star key={num} size={22} className={`cursor-pointer transition-all ${num <= rating ? 'fill-[#FFA448] text-[#FFA448] scale-110' : 'text-slate-200'}`} onClick={() => setRating(num)} />
                    ))}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#FFA448] shadow-sm active:scale-90 transition-transform">
                     {photoPreview ? <img src={photoPreview} className="w-full h-full rounded-full object-cover" /> : <Camera size={20} />}
                     <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} />
                  </button>
                </div>
                <button disabled={submittingReview} onClick={handleReviewSubmit} className="w-full bg-[#FFA448] text-white font-black py-4.5 rounded-3xl uppercase tracking-widest text-sm shadow-xl shadow-[#FFA448]/30 active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                  {submittingReview ? <><Loader2 className="animate-spin text-white" size={18} /> Syncing...</> : 'Send Shift Feedback'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
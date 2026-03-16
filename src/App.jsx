import React, { useState, useRef, useEffect } from 'react';
import { Download, GraduationCap, User, BookOpen, Briefcase, ZoomIn, Loader2, RefreshCcw } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const reportTypes = [
  { id: 'theory-assignment', name: 'Theory Assignment Report', total: 5, criteria: [{ name: 'Clarity', mark: 1 }, { name: 'Content Quality', mark: 2 }, { name: 'Spelling & Grammar', mark: 1 }, { name: 'Organization and Formatting', mark: 1 }] },
  { id: 'lab-assignment', name: 'Lab Assignment Report', total: 10, criteria: [{ name: 'Clarity', mark: 2 }, { name: 'Content Quality', mark: 4 }, { name: 'Spelling & Grammar', mark: 2 }, { name: 'Organization and Formatting', mark: 2 }] },
  { id: 'lab-report', name: 'Lab Report', total: 25, criteria: [{ name: 'Understanding', mark: 3 }, { name: 'Analysis', mark: 4 }, { name: 'Implementation', mark: 8 }, { name: 'Report Writing', mark: 10 }] },
  { id: 'lab-final', name: 'Lab Final Report', total: 40, criteria: [{ name: 'Understanding/Analysis', mark: 10 }, { name: 'Implementation', mark: 15 }, { name: 'Accuracy', mark: 10 }, { name: 'Task Efficiency', mark: 5 }] }
];

function App() {
  const printRef = useRef();
  const [zoom, setZoom] = useState(0.85);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialize state from LocalStorage or empty strings
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('diu_cover_gen_data');
    return savedData ? JSON.parse(savedData) : {
      type: 'theory-assignment', studentName: '', studentId: '', batch: '', section: '', courseCode: '', courseName: '', teacherName: '', designation: '', semester: '', submissionDate: ''
    };
  });

  // Save to LocalStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem('diu_cover_gen_data', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleReset = () => { 
    if(window.confirm("This will clear all fields. Are you sure?")) {
      const resetData = { type: 'theory-assignment', studentName: '', studentId: '', batch: '', section: '', courseCode: '', courseName: '', teacherName: '', designation: '', semester: '', submissionDate: '' };
      setFormData(resetData);
      localStorage.removeItem('diu_cover_gen_data');
    }
  };

  const generatePDF = () => {
    const requiredFields = Object.keys(formData);
    const emptyFields = requiredFields.filter(field => !formData[field].trim());
    if (emptyFields.length > 0) { alert("Please fill in all fields before generating the PDF."); return; }
    
    setIsGenerating(true);
    const element = printRef.current;
    const opt = {
      margin: 0,
      filename: `DIU_Cover_${formData.studentId}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 4, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };
    html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = totalPages; i > 1; i--) { pdf.deletePage(i); }
    }).save().then(() => { setIsGenerating(false); });
  };

  const currentType = reportTypes.find(t => t.id === formData.type);
  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', boxSizing: 'border-box' };
  
  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <style>{`
        .sidebar-hide-scroll::-webkit-scrollbar { display: none; }
        .sidebar-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .input-field { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-size: 14px; outline: none; color: #1e293b; box-sizing: border-box; transition: all 0.2s ease; }
        .input-field:hover, .input-field:focus { border-color: #004184; background-color: #fff; }
        .input-field:focus { box-shadow: 0 0 0 3px rgba(0, 65, 132, 0.1); }
        .cat-btn { transition: all 0.2s ease; cursor: pointer; border: none; }
        .cat-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .gen-btn { transition: all 0.3s ease; cursor: pointer; border: none; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .gen-btn:hover:not(:disabled) { background-color: #003366 !important; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0, 65, 132, 0.3) !important; }
        .reset-btn { transition: all 0.2s ease; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; }
        .reset-btn:hover { background-color: #fca5a5 !important; transform: translateY(-2px); }
      `}</style>
      
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', zIndex: 50, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#004184', padding: '10px', borderRadius: '12px', color: 'white' }}><GraduationCap size={24} /></div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#000000', margin: 0 }}>DIU CoverGen</h1>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', width: '100%' }}>
        <div className="sidebar-hide-scroll" style={{ width: '30%', minWidth: '400px', height: '100%', overflowY: 'auto', padding: '32px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
            {reportTypes.map((type) => (
              <button key={type.id} onClick={() => setFormData({ ...formData, type: type.id })} className="cat-btn" style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: formData.type === type.id ? '#39b54a' : '#ffffff', color: formData.type === type.id ? '#ffffff' : '#64748b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{type.name}</button>
            ))}
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#004184', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase' }}><User size={16} /> Student Identity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Full Student Name *" className="input-field" />
              <input name="studentId" value={formData.studentId} onChange={handleChange} placeholder="Student ID *" className="input-field" />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{width: '50%'}}><input name="batch" value={formData.batch} onChange={handleChange} placeholder="Batch *" className="input-field" /></div>
                <div style={{width: '50%'}}><input name="section" value={formData.section} onChange={handleChange} placeholder="Section *" className="input-field" /></div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#004184', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase' }}><BookOpen size={16} /> Academic Context</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input name="semester" value={formData.semester} onChange={handleChange} placeholder="Semester (e.g. Fall 2025) *" className="input-field" />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{width: '30%'}}><input name="courseCode" value={formData.courseCode} onChange={handleChange} placeholder="Code *" className="input-field" /></div>
                <div style={{width: '70%'}}><input name="courseName" value={formData.courseName} onChange={handleChange} placeholder="Course Title *" className="input-field" /></div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#004184', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase' }}><Briefcase size={16} /> Faculty Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input name="teacherName" value={formData.teacherName} onChange={handleChange} placeholder="Course Teacher Name *" className="input-field" />
              <input name="designation" value={formData.designation} onChange={handleChange} placeholder="Designation *" className="input-field" />
              <input type="text" name="submissionDate" value={formData.submissionDate} onChange={handleChange} placeholder="Submission Date (e.g. 21st Aug, 2025) *" className="input-field" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
            <button onClick={generatePDF} disabled={isGenerating} className="gen-btn" style={{ flex: 3, backgroundColor: isGenerating ? '#64748b' : '#004184', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '15px', boxShadow: '0 20px 25px -5px rgba(0, 65, 132, 0.2)' }}>
              {isGenerating ? <><Loader2 size={20} className="animate-spin" /> Generating...</> : <><Download size={18} /> Generate PDF</>}
            </button>
            <button onClick={handleReset} className="reset-btn" style={{ flex: 1, backgroundColor: '#fecaca', color: '#991b1b', padding: '16px', borderRadius: '16px', fontSize: '14px' }}>
              <RefreshCcw size={16} /> Reset
            </button>
          </div>

          {/* UPDATED COPYRIGHT FOOTER */}
          <div style={{ marginTop: 'auto', textAlign: 'center', padding: '20px 0', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>
            © 2026 Md Nadim Mahmud. All rights reserved.
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: '#cbd5e1', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '10px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 5 }}>
            <ZoomIn size={18} color="#004184" />
            <input type="range" min="0.5" max="1.5" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ cursor: 'pointer', width: '150px' }} />
            <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '40px' }}>{Math.round(zoom * 100)}%</span>
          </div>

          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transition: 'transform 0.1s ease-out' }}>
            <div ref={printRef} style={{ width: '210mm', height: '297mm', padding: '20mm', backgroundColor: '#ffffff', color: '#000000', fontFamily: "'Times New Roman', serif", display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}><img src="/diu-logo.png" alt="DIU" style={{ width: '160px', height: 'auto' }} /></div>
              <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '25px', color: '#000000' }}>{currentType.name}</h1>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '2.3px solid black', fontSize: '11px', marginBottom: '35px', color: '#000000' }}>
                <thead>
                  <tr><th colSpan="7" style={{ border: '2.3px solid black', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>ONLY FOR COURSE TEACHER</th></tr>
                  <tr style={{ textAlign: 'center' }}>
                    <th style={{ border: '2.3px solid black', width: '35%' }}></th>
                    <th style={{ border: '2.3px solid black' }}>Needs Improvement</th>
                    <th style={{ border: '2.3px solid black' }}>Developing</th>
                    <th style={{ border: '2.3px solid black' }}>Sufficient</th>
                    <th style={{ border: '2.3px solid black' }}>Above Average</th>
                    <th style={{ border: '2.3px solid black', width: '60px' }}>Total Mark</th>
                  </tr>
                  <tr style={{ height: '30px' }}><th style={{ border: '2.3px solid black', textAlign: 'left', paddingLeft: '8px', fontWeight: 'bold' }}>ALLOCATE MARK & PERCENTAGE</th><th style={{ border: '2.3px solid black', textAlign: 'center' }}>25%</th><th style={{ border: '2.3px solid black', textAlign: 'center' }}>50%</th><th style={{ border: '2.3px solid black', textAlign: 'center' }}>75%</th><th style={{ border: '2.3px solid black', textAlign: 'center' }}>100%</th><th style={{ border: '2.3px solid black', textAlign: 'center' }}>{currentType.total}</th></tr>
                </thead>
                <tbody>
                  {currentType.criteria.map((item, idx) => (
                    <tr key={idx} style={{ height: '35px' }}>
                      <td style={{ border: '2.3px solid black', paddingLeft: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{paddingTop: '6px'}}>{item.name}</span>
                        <span style={{ borderLeft: '2px solid black', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.mark}</span>
                      </td>
                      <td style={{ border: '2.3px solid black' }}></td><td style={{ border: '2.3px solid black' }}></td><td style={{ border: '2.3px solid black' }}></td><td style={{ border: '2.3px solid black' }}></td><td style={{ border: '2.3px solid black' }}></td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'bold' }}><td colSpan="5" style={{ border: '2.3px solid black', textAlign: 'right', paddingRight: '12px', height: '30px' }}>TOTAL OBTAINED MARK</td><td style={{ border: '2.3px solid black' }}></td></tr>
                  <tr style={{ height: '55px' }}><td style={{ border: '2.3px solid black', padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>COMMENTS</td><td colSpan="5" style={{ border: '2.3px solid black' }}></td></tr>
                </tbody>
              </table>
              <div style={{ width: '100%', fontSize: '19px', lineHeight: '2.2', fontWeight: 'bold', paddingLeft: '10px', color: '#000000' }}>
                <p style={{ fontSize: '22px', marginBottom: '8px' }}>Semester: {formData.semester || '..........'}</p>
                <p>Student Name: {formData.studentName || '..........................................................'}</p>
                <p>Student ID: {formData.studentId || '..........................................................'}</p>
                <div style={{ display: 'flex', width: '100%' }}><div style={{ width: '45%' }}>Batch: {formData.batch || '.....'}</div><div>Section: {formData.section || '.....'}</div></div>
                <div style={{ display: 'flex', width: '100%' }}><div style={{ width: '45%' }}>Course Code: {formData.courseCode || '..........'}</div><div>Course Name: {formData.courseName || '...................................'}</div></div>
                <div style={{ marginTop: '15px' }}><p>Course Teacher Name: {formData.teacherName || '................................................'}</p><p>Designation: {formData.designation || '................................................'}</p><p>Submission Date: {formData.submissionDate || '....................'}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
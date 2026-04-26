import React, { useState, useRef, useEffect } from 'react';
import { Download, GraduationCap, User, BookOpen, Briefcase, ZoomIn, Loader2, RefreshCcw, FilePlus, FileCheck, MessageSquare, X, Mail, Linkedin, Send, Image as ImageIcon, Trash2, Move, Sun, Moon, Calculator } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { PDFDocument } from 'pdf-lib';

const StarTrail = () => {
  const [stars, setStars] = useState([]);
  useEffect(() => {
    setStars(Array.from({ length: 50 }).map((_, i) => ({
      id: i, left: `${Math.random() * 100}vw`, top: `${Math.random() * 100}vh`,
      animationDuration: `${Math.random() * 5 + 3}s`, animationDelay: `${Math.random() * 5}s`
    })));
  }, []);
  return (
    <div className="star-container">
      {stars.map(star => (
        <div key={star.id} className="star" style={{ left: star.left, top: star.top, animationDuration: star.animationDuration, animationDelay: star.animationDelay }}></div>
      ))}
    </div>
  );
};

const reportTypes = [
  { id: 'theory-assignment', name: 'Theory Assignment Report', total: 5, criteria: [{ name: 'Clarity', mark: 1 }, { name: 'Content Quality', mark: 2 }, { name: 'Spelling & Grammar', mark: 1 }, { name: 'Organization and Formatting', mark: 1 }] },
  { id: 'lab-assignment', name: 'Lab Assignment Report', total: 10, criteria: [{ name: 'Clarity', mark: 2 }, { name: 'Content Quality', mark: 4 }, { name: 'Spelling & Grammar', mark: 2 }, { name: 'Organization and Formatting', mark: 2 }] },
  { id: 'lab-report', name: 'Lab Report', total: 25, criteria: [{ name: 'Understanding', mark: 3 }, { name: 'Analysis', mark: 4 }, { name: 'Implementation', mark: 8 }, { name: 'Report Writing', mark: 10 }] },
  { id: 'lab-final', name: 'Lab Final Report', total: 40, criteria: [{ name: 'Understanding/Analysis', mark: 10 }, { name: 'Implementation', mark: 15 }, { name: 'Accuracy', mark: 10 }, { name: 'Task Efficiency', mark: 5 }] }
];

function App() {
  const printRef = useRef();
  const infoSectionRef = useRef();
  const [zoom, setZoom] = useState(0.85);
  const [dynamicFontSize, setDynamicFontSize] = useState(19);
  const [isGenerating, setIsGenerating] = useState(false);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('diu_theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const [mergeMode, setMergeMode] = useState('pdf'); 
  const [imageFiles, setImageFiles] = useState([]);
  const [autoEnhance, setAutoEnhance] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [pdfFormat, setPdfFormat] = useState('a4');

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('diu_cover_gen_data');
    return savedData ? JSON.parse(savedData) : {
      type: 'theory-assignment', studentName: '', studentId: '', batch: '', section: '', courseCode: '', courseName: '', teacherName: '', designation: '', semester: '', submissionDate: ''
    };
  });

  useEffect(() => { document.title = "DIU CoverGen"; }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('diu_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (infoSectionRef.current) {
      const containerHeight = 350; 
      const currentHeight = infoSectionRef.current.scrollHeight;
      if (currentHeight > containerHeight && dynamicFontSize > 14) { setDynamicFontSize(prev => prev - 0.5); }
      else if (currentHeight < containerHeight - 50 && dynamicFontSize < 19) { setDynamicFontSize(prev => prev + 0.5); }
    }
    localStorage.setItem('diu_cover_gen_data', JSON.stringify(formData));
  }, [formData, dynamicFontSize]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") { setAssignmentFile(file); }
    else { alert("Please upload a valid PDF file."); e.target.value = null; }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        preview: URL.createObjectURL(file)
    }));
    setImageFiles((prev) => [...prev, ...files]);
  };

  // DRAG AND DROP LOGIC
  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (index) => {
    const updatedImages = [...imageFiles];
    const [draggedItem] = updatedImages.splice(draggedIndex, 1);
    updatedImages.splice(index, 0, draggedItem);
    setImageFiles(updatedImages);
    setDraggedIndex(null);
  };

  const removeImage = (id) => {
    setImageFiles(prev => prev.filter(img => img.id !== id));
  };
  
  const handleReset = () => { 
    if(window.confirm("This will clear all fields. Are you sure?")) {
      setFormData({ type: 'theory-assignment', studentName: '', studentId: '', batch: '', section: '', courseCode: '', courseName: '', teacherName: '', designation: '', semester: '', submissionDate: '' });
      setAssignmentFile(null);
      setImageFiles([]);
      setDynamicFontSize(19);
      setPdfFormat('a4');
      localStorage.removeItem('diu_cover_gen_data');
    }
  };

  const generatePDF = async () => {
    const requiredFields = Object.keys(formData);
    const emptyFields = requiredFields.filter(field => !formData[field].trim());
    if (emptyFields.length > 0) { alert("Please fill in all fields."); return; }
    
    if (mergeMode === 'images' && imageFiles.length === 0) {
        alert("Please upload at least one image or switch to PDF mode.");
        return;
    }

    setIsGenerating(true);
    const element = printRef.current;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const opt = { margin: 0, filename: `temp_cover.pdf`, image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 4, useCORS: true, backgroundColor: '#ffffff', y: isMobile ? 1 : 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: false } };

    try {
      const coverBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const mergedPdf = await PDFDocument.create();
      const coverPdfDoc = await PDFDocument.load(await coverBlob.arrayBuffer());
      const [coverPage] = await mergedPdf.copyPages(coverPdfDoc, [0]);
      mergedPdf.addPage(coverPage);

      if (mergeMode === 'pdf' && assignmentFile) {
        const assignmentBuffer = await assignmentFile.arrayBuffer();
        const mainPdfDoc = await PDFDocument.load(assignmentBuffer);
        
        if (pdfFormat === 'a4') {
          const pageIndices = mainPdfDoc.getPageIndices();
          const embeddedPages = await mergedPdf.embedPdf(assignmentBuffer, pageIndices);
          
          embeddedPages.forEach((embeddedPage) => {
            const page = mergedPdf.addPage([595.28, 841.89]); 
            const scaleX = 555 / embeddedPage.width;
            const scaleY = 801 / embeddedPage.height;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = embeddedPage.width * scale;
            const scaledHeight = embeddedPage.height * scale;

            page.drawPage(embeddedPage, {
              x: 595.28 / 2 - scaledWidth / 2,
              y: 841.89 / 2 - scaledHeight / 2,
              width: scaledWidth,
              height: scaledHeight,
            });
          });
        } else {
          const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
          mainPages.forEach((page) => mergedPdf.addPage(page));
        }
      } 
      else if (mergeMode === 'images') {
        for (const imgObj of imageFiles) {
          const processedImgData = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              if (autoEnhance) { ctx.filter = 'contrast(1.4) brightness(1.1) saturate(1.2)'; }
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = imgObj.preview;
          });
          const img = await mergedPdf.embedJpg(processedImgData);
          const page = mergedPdf.addPage([595.28, 841.89]); 
          const { width, height } = img.scaleToFit(555, 801); 
          page.drawImage(img, { x: 595.28 / 2 - width / 2, y: 841.89 / 2 - height / 2, width, height });
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `DIU_Assignment_${formData.studentId}.pdf`;
      link.click();
    } catch (error) { alert("Error generating PDF."); } finally { setIsGenerating(false); }
  };

  const currentType = reportTypes.find(t => t.id === formData.type);
  const cardStyle = { backgroundColor: 'var(--card-bg)', borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', boxSizing: 'border-box', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' };
  
  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: 'var(--app-bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', top: 0, left: 0, transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <StarTrail />
      <style>{`
        .sidebar-hide-scroll::-webkit-scrollbar { display: none; }
        .sidebar-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 768px) {
          .main-container { flex-direction: column !important; overflow-y: auto !important; }
          .sidebar-container { width: 100% !important; min-width: 100% !important; height: auto !important; overflow: visible !important; }
          .preview-panel { width: 100% !important; height: auto !important; padding: 20px 10px !important; overflow: visible !important; }
        }
        .input-field { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--input-border); background-color: var(--input-bg); font-size: 14px; outline: none; color: var(--input-text); box-sizing: border-box; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .input-field:hover, .input-field:focus { border-color: var(--primary); background-color: var(--card-bg); box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); }
        .input-card:hover { transform: translateY(-4px); box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.15), 0 0 15px rgba(59, 130, 246, 0.15); border-color: var(--primary) !important; }
        .cat-btn { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none; }
        .cat-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15), 0 0 10px rgba(59, 130, 246, 0.3); }
        .gen-btn { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .gen-btn:hover:not(:disabled) { background-color: var(--primary-hover) !important; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4), 0 0 15px rgba(59, 130, 246, 0.5) !important; }
        .reset-btn { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .reset-btn:hover { background-color: var(--btn-danger) !important; color: var(--btn-danger-text) !important; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3); }
        .cgpa-btn { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
        .cgpa-btn:hover { background-color: #4f46e5 !important; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4), 0 0 15px rgba(99, 102, 241, 0.5) !important; }
        .feedback-btn { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-muted); padding: 10px; borderRadius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 600; width: 100%; }
        .feedback-btn:hover { background: var(--input-bg); color: var(--primary); border-color: var(--primary); transform: translateY(-1px); box-shadow: 0 5px 15px rgba(59, 130, 246, 0.2); }
        .contact-link { display: flex; align-items: center; gap: 8px; color: var(--text-muted); text-decoration: none; transition: all 0.3s ease; font-size: 13px; font-weight: 500; }
        .contact-link:hover { color: var(--primary); transform: translateY(-1px); text-shadow: 0 0 8px rgba(59, 130, 246, 0.4); }
        .file-upload-label { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); display: block; background: var(--card-bg); }
        .file-upload-label:hover { border-color: var(--primary) !important; background: var(--accent-bg) !important; box-shadow: 0 0 15px rgba(59, 130, 246, 0.15); }
        .img-thumb { position: relative; width: 68px; height: 85px; border-radius: 8px; overflow: hidden; border: 2px solid #e2e8f0; cursor: grab; transition: transform 0.2s; }
        .img-thumb:active { cursor: grabbing; }
        .img-thumb:hover { border-color: #39b54a; transform: scale(1.05); }
        .img-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .img-del { position: absolute; top: 2px; right: 2px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 4px; padding: 2px; cursor: pointer; z-index: 10; }
        .img-num { position: absolute; bottom: 2px; left: 2px; background: rgba(0, 65, 132, 0.8); color: white; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 3px; }
      `}</style>

      <header style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50, width: '100%', boxSizing: 'border-box', transition: 'background-color 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--primary)', padding: '10px', borderRadius: '12px', color: 'white', transition: 'background-color 0.3s ease' }}><GraduationCap size={24} /></div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-h)', margin: 0, transition: 'color 0.3s ease' }}>DIU CoverGen</h1>
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="cat-btn" style={{ background: 'var(--input-bg)', color: 'var(--text-h)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="main-container" style={{ flex: 1, display: 'flex', overflow: 'hidden', width: '100%' }}>
        <div className="sidebar-container sidebar-hide-scroll" style={{ width: '30%', minWidth: '400px', height: '100%', overflowY: 'auto', padding: '32px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--sidebar-bg)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s ease' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
            {reportTypes.map((type) => (
              <button key={type.id} onClick={() => setFormData({ ...formData, type: type.id })} className="cat-btn" style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: formData.type === type.id ? 'var(--secondary)' : 'var(--card-bg)', color: formData.type === type.id ? '#ffffff' : 'var(--text-muted)' }}>{type.name}</button>
            ))}
          </div>

          {/* Standard Form Cards */}
          <div className="input-card" style={cardStyle}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase' }}><User size={16} /> Student Identity</div><div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}><input name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Full Student Name *" className="input-field" /><input name="studentId" value={formData.studentId} onChange={handleChange} placeholder="Student ID *" className="input-field" /><div style={{ display: 'flex', gap: '12px' }}><input name="batch" value={formData.batch} onChange={handleChange} placeholder="Batch *" className="input-field" style={{width: '50%'}} /><input name="section" value={formData.section} onChange={handleChange} placeholder="Section *" className="input-field" style={{width: '50%'}} /></div></div></div>
          <div className="input-card" style={cardStyle}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase' }}><BookOpen size={16} /> Academic Context</div><div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}><input name="semester" value={formData.semester} onChange={handleChange} placeholder="Semester (e.g. Fall 2025) *" className="input-field" /><div style={{ display: 'flex', gap: '12px' }}><input name="courseCode" value={formData.courseCode} onChange={handleChange} placeholder="Code *" className="input-field" style={{width: '30%'}} /><input name="courseName" value={formData.courseName} onChange={handleChange} placeholder="Course Title *" className="input-field" style={{width: '70%'}} /></div></div></div>
          <div className="input-card" style={cardStyle}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase' }}><Briefcase size={16} /> Faculty Details</div><div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}><input name="teacherName" value={formData.teacherName} onChange={handleChange} placeholder="Course Teacher Name *" className="input-field" /><input name="designation" value={formData.designation} onChange={handleChange} placeholder="Designation *" className="input-field" /><input name="submissionDate" value={formData.submissionDate} onChange={handleChange} placeholder="Submission Date *" className="input-field" /></div></div>

          {/* DRAG & DROP HYBRID MERGE CARD */}
          <div className="input-card" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}><FilePlus size={16} /> Merge Assignment</div>
                <div style={{ display: 'flex', backgroundColor: 'var(--input-bg)', padding: '4px', borderRadius: '10px' }}>
                    <button onClick={() => setMergeMode('pdf')} style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', border: 'none', borderRadius: '7px', cursor: 'pointer', backgroundColor: mergeMode === 'pdf' ? 'var(--card-bg)' : 'transparent', color: mergeMode === 'pdf' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: mergeMode === 'pdf' ? 'var(--shadow)' : 'none' }}>PDF</button>
                    <button onClick={() => setMergeMode('images')} style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', border: 'none', borderRadius: '7px', cursor: 'pointer', backgroundColor: mergeMode === 'images' ? 'var(--card-bg)' : 'transparent', color: mergeMode === 'images' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: mergeMode === 'images' ? 'var(--shadow)' : 'none' }}>PHOTOS</button>
                </div>
            </div>

            {mergeMode === 'pdf' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="file" id="assignment-upload" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                    <label htmlFor="assignment-upload" className="file-upload-label" style={{ border: '2px dashed #004184', borderRadius: '16px', padding: '20px', textAlign: 'center', cursor: 'pointer', display: 'block' }}>{assignmentFile ? <div style={{ color: '#39b54a', fontWeight: 'bold' }}><FileCheck size={20} style={{ margin: '0 auto 5px' }} /> {assignmentFile.name}</div> : <div style={{ color: '#64748b', fontSize: '13px' }}>Upload assignment PDF</div>}</label>
                    {assignmentFile && (
                        <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={pdfFormat === 'a4'} onChange={(e) => setPdfFormat(e.target.checked ? 'a4' : 'original')} style={{ accentColor: '#004184' }} />
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#004184' }}>Convert to A4 Size Canvas</span>
                            </label>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="file" id="image-upload" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                    <label htmlFor="image-upload" className="file-upload-label" style={{ border: '2px dashed #39b54a', borderRadius: '16px', padding: '15px', textAlign: 'center', cursor: 'pointer', display: 'block' }}>
                        <div style={{ color: '#64748b', fontSize: '12px' }}><ImageIcon size={18} style={{margin: '0 auto 5px'}}/> Add Pages (JPG/PNG)</div>
                    </label>

                    {imageFiles.length > 0 && (
                        <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '8px', textAlign: 'center' }}>Drag and Drop to reorder pages</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', justifyContent: 'center' }}>
                                {imageFiles.map((img, index) => (
                                    <div 
                                      key={img.id} 
                                      className="img-thumb"
                                      draggable
                                      onDragStart={() => handleDragStart(index)}
                                      onDragOver={handleDragOver}
                                      onDrop={() => handleDrop(index)}
                                    >
                                        <img src={img.preview} alt="page" />
                                        <span className="img-num">P.{index + 1}</span>
                                        <button onClick={() => removeImage(img.id)} className="img-del"><Trash2 size={10}/></button>
                                    </div>
                                ))}
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={autoEnhance} onChange={(e) => setAutoEnhance(e.target.checked)} style={{ accentColor: '#39b54a' }} />
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#004184' }}>Auto-Enhance (Magic Color)</span>
                            </label>
                        </div>
                    )}
                </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}><button onClick={generatePDF} disabled={isGenerating} className="gen-btn" style={{ flex: 3, backgroundColor: isGenerating ? 'var(--text-muted)' : 'var(--primary)', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '15px' }}>{isGenerating ? <><Loader2 className="animate-spin" /> Processing...</> : <><Download size={18} /> Download PDF</>}</button><button onClick={handleReset} className="reset-btn" style={{ flex: 1, backgroundColor: 'var(--btn-danger)', color: 'var(--btn-danger-text)', padding: '16px', borderRadius: '16px' }}><RefreshCcw size={18} /> Reset</button></div>
          
          <a href="https://bd-cgpa-calculator.vercel.app/" target="_blank" rel="noreferrer" className="cgpa-btn" style={{ width: '100%', backgroundColor: '#6366f1', color: 'white', padding: '14px', borderRadius: '16px', marginBottom: '32px', boxSizing: 'border-box' }}><Calculator size={18} /> Calculate CGPA</a>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}><button className="feedback-btn" onClick={() => setIsFeedbackOpen(true)} style={{ marginBottom: '16px' }}><MessageSquare size={16} /> Feedback or Report Issue</button><div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>Connect me</div><div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}><a href="mailto:nadimmahmud036@gmail.com" className="contact-link"><Mail size={16} /> Gmail</a><a href="https://www.linkedin.com/in/nadimmahmudofficial/" target="_blank" rel="noreferrer" className="contact-link"><Linkedin size={16} /> LinkedIn</a></div><div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'bold' }}>© 2026 Md Nadim Mahmud. All rights reserved.</div></div>
        </div>

        {/* PREVIEW PANEL */}
        <div className="preview-panel" style={{ flex: 1, backgroundColor: 'var(--preview-bg)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', transition: 'background-color 0.3s ease' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '10px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', boxShadow: 'var(--shadow)', color: 'var(--text-h)' }}><ZoomIn size={18} color="var(--primary)" /><input type="range" min="0.3" max="1.5" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: '150px' }} /><span style={{ fontSize: '12px', fontWeight: 'bold' }}>{Math.round(zoom * 100)}%</span></div>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div ref={printRef} style={{ width: '210mm', height: '296.8mm', padding: '20mm', backgroundColor: '#ffffff', color: '#000000', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif", display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}><img src="/diu-logo.png" alt="DIU" style={{ width: '160px' }} /></div>
              <h1 style={{ textAlign: 'center', fontSize: '38px', fontWeight: 'bold', marginBottom: '25px', color: '#000000', letterSpacing: 'normal' }}>{currentType.name}</h1>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '11px', marginBottom: '35px', color: '#000000' }}><thead><tr><th colSpan="7" style={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', padding: '5px' }}>ONLY FOR COURSE TEACHER</th></tr><tr style={{ textAlign: 'center' }}><th style={{ border: '1px solid black', width: '35%' }}></th><th style={{ border: '1px solid black' }}>Needs Improvement</th><th style={{ border: '1px solid black' }}>Developing</th><th style={{ border: '1px solid black' }}>Sufficient</th><th style={{ border: '1px solid black' }}>Above Average</th><th style={{ border: '1px solid black', width: '60px' }}>Total Mark</th></tr><tr style={{ height: '30px' }}><th style={{ border: '1px solid black', textAlign: 'left', paddingLeft: '8px', fontWeight: 'bold' }}>ALLOCATE MARK & PERCENTAGE</th><th style={{ border: '1px solid black', textAlign: 'center' }}>25%</th><th style={{ border: '1px solid black', textAlign: 'center' }}>50%</th><th style={{ border: '1px solid black', textAlign: 'center' }}>75%</th><th style={{ border: '1px solid black', textAlign: 'center' }}>100%</th><th style={{ border: '1px solid black', textAlign: 'center' }}>{currentType.total}</th></tr></thead><tbody>{currentType.criteria.map((item, idx) => (<tr key={idx} style={{ height: '35px' }}><td style={{ border: '1px solid black', paddingLeft: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{item.name}</span><span style={{ borderLeft: '1px solid black', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.mark}</span></td><td style={{ border: '1px solid black' }}></td><td style={{ border: '1px solid black' }}></td><td style={{ border: '1px solid black' }}></td><td style={{ border: '1px solid black' }}></td><td style={{ border: '1px solid black' }}></td></tr>))}<tr style={{ fontWeight: 'bold' }}><td colSpan="5" style={{ border: '1px solid black', textAlign: 'right', paddingRight: '12px', height: '30px' }}>TOTAL OBTAINED MARK</td><td style={{ border: '1px solid black' }}></td></tr><tr style={{ height: '55px' }}><td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>COMMENTS</td><td colSpan="5" style={{ border: '1px solid black' }}></td></tr></tbody></table>
              <div ref={infoSectionRef} style={{ width: '100%', fontSize: `${dynamicFontSize}px`, lineHeight: '1.8', fontWeight: 'bold', paddingLeft: '10px', color: '#000000' }}><p style={{ fontSize: `${dynamicFontSize + 3}px`, marginBottom: '5px' }}>Semester: {formData.semester || '..........'}</p><p>Student Name: {formData.studentName || '..........................................................'}</p><p>Student ID: {formData.studentId || '..........................................................'}</p><div style={{ display: 'flex', width: '100%' }}><div style={{ width: '45%' }}>Batch: {formData.batch || '.....'}</div><div>Section: {formData.section || '.....'}</div></div><div style={{ display: 'flex', width: '100%' }}><div style={{ width: '45%' }}>Course Code: {formData.courseCode || '..........'}</div><div>Course Name: {formData.courseName || '...................................'}</div></div><div style={{ marginTop: '10px' }}><p>Course Teacher Name: {formData.teacherName || '................................................'}</p><p>Designation: {formData.designation || '................................................'}</p><p>Submission Date: {formData.submissionDate || '....................'}</p></div></div>
            </div>
          </div>
        </div>
      </div>

      {isFeedbackOpen && (<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}><div style={{ backgroundColor: 'white', width: '90%', maxWidth: '500px', borderRadius: '24px', padding: '32px', position: 'relative' }}><button onClick={() => setIsFeedbackOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', cursor: 'pointer' }}><X /></button><h2 style={{ color: '#004184', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}><MessageSquare /> Feedback & Support</h2><form action="https://formspree.io/f/nadimmahmud036@gmail.com" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}><input type="text" name="name" placeholder="Your Name (Optional)" className="input-field" /><select name="subject" required className="input-field"><option value="">Select Subject *</option><option value="Bug Report">Report a Bug</option><option value="Feature Suggestion">Feature Suggestion</option><option value="General Feedback">General Feedback</option></select><textarea name="description" required placeholder="Description... *" className="input-field" style={{ minHeight: '120px' }}></textarea><button type="submit" className="gen-btn" style={{ backgroundColor: '#39b54a', color: 'white', padding: '14px', borderRadius: '12px' }}><Send size={18} /> Send Feedback</button></form></div></div>)}
    </div>
  );
}

export default App;
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Question, Subject, Passage } from '@/types/exam';
import { getCatalogSubjects } from '@/lib/education-catalog';
import { parseExTestLatex, parseRawVietnameseText } from '@/lib/exam-parser';
import { MathRenderer } from './MathRenderer';
import { accountFetch } from '@/lib/account-fetch';
import { isAccountFailure, RequestGate } from '@/lib/template-request-context';
import { 
  X, 
  FileText, 
  Sparkles, 
  Code, 
  Upload, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Image as ImageIcon,
  FileCode,
  Trash2,
  ZoomIn,
  CheckCircle2,
  Eye,
  Layers
} from 'lucide-react';

interface ImportModalProps {
  ownerId: string;
  documentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: Question[], context: { subject: Subject; grade: number; passages?: Passage[] }) => void;
  context?: { subject: Subject; grade: number };
  apiKey: string;
}

type ImportSourceType = 'image' | 'word' | 'text' | 'latex';

export const ImportModal: React.FC<ImportModalProps> = props => <ImportModalContent key={`${props.ownerId}:${props.documentId ?? 'new'}`} {...props} />;
const ImportModalContent: React.FC<ImportModalProps> = ({
  ownerId,
  isOpen,
  onClose,
  onImportQuestions,
  apiKey,
  context,
}) => {
  const [importGrade, setImportGrade] = useState(context?.grade ?? 0);
  const [importSubject, setImportSubject] = useState<Subject | ''>(context?.subject ?? '');
  const [sourceType, setSourceType] = useState<ImportSourceType>('image');
  
  // State cho ảnh
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  
  // State cho Word & Text & LaTeX
  const [rawText, setRawText] = useState('');
  const [wordFileName, setWordFileName] = useState<string>('');
  const [wordFile, setWordFile] = useState<File | null>(null);

  // State kết quả bóc tách
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [parsedPassages, setParsedPassages] = useState<Passage[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const parseRequest = useRef(0);
  const requestGate = useRef<RequestGate | null>(null);
  const imageRead = useRef(0), textRead = useRef(0);
  const readContext = useRef(0);
  const [accountLocked, setAccountLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const gate = new RequestGate(); requestGate.current = gate;
    parseRequest.current += 1;
    setParsedQuestions([]); setParsedPassages([]); setImportWarnings([]);
    setStatusMessage(null); setErrorMessage(null); setIsLoading(false);
    return () => { gate.dispose(); parseRequest.current++; };
  }, [sourceType, rawText, selectedImage, wordFile, isOpen]);
  useEffect(() => () => { readContext.current++; imageRead.current++; textRead.current++; }, [isOpen, sourceType]);

  if (!isOpen) return null;
  const handleClose = () => { requestGate.current?.dispose(); parseRequest.current++; imageRead.current++; textRead.current++; onClose(); };

  // Xử lý chọn ảnh
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    setSelectedImage(null);
    setErrorMessage(null);
    setStatusMessage(null);

    const reader = new FileReader();
    const readId = ++imageRead.current, contextId = readContext.current;
    reader.onload = (event) => {
      if (readId !== imageRead.current || contextId !== readContext.current) return;
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Xử lý chọn file Word docx
  const handleWordSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setWordFile(file);
    setWordFileName(file.name);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  // Xử lý đọc file text/latex
  const handleTextFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setRawText('');
    const readId = ++textRead.current, contextId = readContext.current;
    reader.onload = (event) => {
      if (readId !== textRead.current || contextId !== readContext.current) return;
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        if (content.includes('\\begin{ex}') || content.includes('\\choice')) {
          setSourceType('latex');
        }
      }
    };
    reader.readAsText(file);
  };

  // Bắt đầu quá trình bóc tách
  const handleStartParsing = async () => {
    if (accountLocked) return;
    const gate = requestGate.current, token = gate?.begin();
    if (!gate || !token) return;
    const requestId = ++parseRequest.current;
    setIsLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    const send = async (url: string, init: RequestInit) => {
      const res = await accountFetch(ownerId, url, { ...init, signal: token.signal });
      const data = await res.json();
      if (token.isLive() && isAccountFailure(res.status, data)) {
        gate.lock(); setAccountLocked(true); setIsLoading(false);
        setErrorMessage('Phiên hoặc tài khoản đã thay đổi. Nguồn đang nhập vẫn giữ; hãy tải lại trang bằng đúng tài khoản.');
      }
      return { res, data };
    };

    try {
      if (sourceType === 'image') {
        if (!selectedImage) {
          setErrorMessage('Vui lòng chọn hoặc kéo thả một hình ảnh đề thi.');
          setIsLoading(false);
          return;
        }

        const { res, data } = await send('/api/ocr-exam-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: selectedImage,
            userApiKey: apiKey,
          }),
        });

        if (!token.isLive() || requestId !== parseRequest.current) return;
        if (res.ok && data.success && Array.isArray(data.questions)) {
          setParsedQuestions(data.questions);
          setParsedPassages(data.passages ?? []);
          setImportWarnings(data.warnings ?? []);
          setStatusMessage(`AI Vision đã nhận diện thành công ${data.questions.length} câu hỏi từ ảnh chụp!`);
        } else {
          setErrorMessage(data.error || 'Không thể bóc tách câu hỏi từ ảnh.');
        }
      } else if (sourceType === 'word') {
        if (!wordFile) {
          setErrorMessage('Vui lòng chọn file Word (.docx) của bạn.');
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', wordFile);
        if (apiKey) formData.append('userApiKey', apiKey);

        const { res, data } = await send('/api/parse-docx', {
          method: 'POST',
          body: formData,
        });

        if (!token.isLive() || requestId !== parseRequest.current) return;
        if (res.ok && data.success && Array.isArray(data.questions)) {
          setParsedQuestions(data.questions);
          setParsedPassages(data.passages ?? []);
          setImportWarnings(data.warnings ?? []);
          setStatusMessage(`Đã bóc tách thành công ${data.questions.length} câu hỏi từ file Word!`);
        } else {
          setErrorMessage(data.error || 'Không thể phân rã nội dung từ file Word.');
        }
      } else if (sourceType === 'latex') {
        if (!rawText.trim()) {
          setErrorMessage('Vui lòng dán mã LaTeX câu hỏi.');
          setIsLoading(false);
          return;
        }

        const questions = parseExTestLatex(rawText);
        if (questions.length > 0) {
          setParsedQuestions(questions);
          setStatusMessage(`Thành công! Đã bóc tách ${questions.length} câu hỏi chuẩn LaTeX EX_Test.`);
        } else {
          setErrorMessage('Không tìm thấy cấu trúc \\begin{ex}...\\end{ex} hợp lệ.');
        }
      } else {
        // Text thô AI
        if (!rawText.trim()) {
          setErrorMessage('Vui lòng dán văn bản đề thi thô.');
          setIsLoading(false);
          return;
        }

        const { res, data } = await send('/api/parse-exam-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText,
            customApiKey: apiKey,
          }),
        });

        if (!token.isLive() || requestId !== parseRequest.current) return;
        if (res.ok && data.success && Array.isArray(data.questions)) {
          setParsedQuestions(data.questions);
          setParsedPassages(data.passages ?? []);
          setImportWarnings(data.warnings ?? []);
          setStatusMessage(`AI đã chuyển đổi thành công ${data.questions.length} câu hỏi có công thức KaTeX!`);
        } else {
          setErrorMessage(data.error || 'AI chưa đọc được tài liệu. Kết quả bên dưới chỉ là tách văn bản cơ bản, cần kiểm tra lại.');
          const fallback = parseRawVietnameseText(rawText);
          setParsedQuestions(fallback);
          setStatusMessage(`Bóc tách cơ bản ${fallback.length} câu hỏi theo mẫu tiếng Việt.`);
        }
      }
    } catch (err: unknown) {
      if (token.isLive() && requestId === parseRequest.current) setErrorMessage(err instanceof Error ? err.message : 'Chưa đọc được tài liệu.');
    } finally {
      if (token.isLive() && requestId === parseRequest.current) setIsLoading(false);
      token.release();
    }
  };

  // Xóa bớt một câu hỏi khỏi danh sách xem trước
  const handleDeleteQuestion = (id: string) => {
    if (requestGate.current?.busy) return;
    setParsedQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Thêm tất cả vào đề thi hiện tại
  const handleConfirmImport = async () => {
    if (accountLocked) return;
    if (!importGrade || !importSubject || !getCatalogSubjects(importGrade).some(s => s.key === importSubject)) {
      setErrorMessage('Hãy chọn môn và lớp của tài liệu trước khi đưa câu hỏi vào đề.'); return;
    }
    if (parsedQuestions.length > 0) {
      const gate = requestGate.current, token = gate?.begin();
      if (!gate || !token) return;
      setIsLoading(true);
      try {
      const response = await accountFetch(ownerId, '/api/auth/me', { signal: token.signal, cache: 'no-store' });
      const data = await response.json();
      if (!token.isLive()) return;
      if (!response.ok || data.user?.id !== ownerId) {
        gate.lock(); setAccountLocked(true); setIsLoading(false);
        setErrorMessage('Chưa xác nhận đúng tài khoản để nhập câu hỏi. Nguồn và bản xem trước được giữ; hãy tải lại trang bằng đúng tài khoản.'); return;
      }
      onImportQuestions(parsedQuestions.map(q => ({ ...q, id: `q_${crypto.randomUUID()}`, subject: importSubject, grade: importGrade, status: 'draft', verifiedBy: 'none' })), { subject: importSubject, grade: importGrade, passages: parsedPassages.filter(p => parsedQuestions.some(q => q.passageId === p.id)) });
      setParsedQuestions([]);
      handleClose();
      } catch (error) { if (token.isLive()) setErrorMessage(error instanceof Error ? error.message : 'Chưa xác nhận được tài khoản; bản xem trước vẫn giữ.'); }
      finally { if (token.isLive()) setIsLoading(false); token.release(); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-6xl w-full p-5 sm:p-6 shadow-2xl border border-[#dadce0] dark:border-[#3c4043] relative max-h-[92vh] flex flex-col text-[#202124] dark:text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] dark:border-[#3c4043]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#29425e] flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5 text-[#1a73e8] dark:text-[#8ab4f8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#202124] dark:text-[#e3e3e3] text-lg">Phòng Số Hóa & Bóc Tách Đề Thi (AI Ingestion Studio)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#29425e]">
                  Multimodal OCR + Word
                </span>
              </div>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Chuyển đổi ảnh chụp, file Word .docx hoặc văn bản thô thành câu hỏi KaTeX chuẩn mực</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 py-2 text-sm">
          <label>Lớp của tài liệu <select aria-label="Lớp tài liệu nhập" disabled={isLoading || accountLocked} className="border rounded p-2 bg-transparent" value={importGrade} onChange={e => { setImportGrade(Number(e.target.value)); setImportSubject(''); }}><option value={0}>Chọn lớp</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Lớp {i + 1}</option>)}</select></label>
          <label>Môn <select aria-label="Môn tài liệu nhập" disabled={isLoading || accountLocked} className="border rounded p-2 bg-transparent" value={importSubject} onChange={e => setImportSubject(e.target.value as Subject)}><option value="">Chọn môn</option>{getCatalogSubjects(importGrade || undefined).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></label>
        </div>
        {/* Thanh chọn 4 định dạng nguồn (Tabs) */}
        <div className="flex flex-wrap items-center gap-2 pt-3 pb-2 border-b border-[#dadce0] dark:border-[#3c4043]">
          <button
            disabled={isLoading || accountLocked} onClick={() => setSourceType('image')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              sourceType === 'image'
                ? 'bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124] shadow-xs'
                : 'bg-[#f1f3f4] dark:bg-[#282828] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#303134]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Ảnh chụp đề thi (Gemini Vision OCR)</span>
          </button>

          <button
            disabled={isLoading || accountLocked} onClick={() => setSourceType('word')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              sourceType === 'word'
                ? 'bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124] shadow-xs'
                : 'bg-[#f1f3f4] dark:bg-[#282828] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#303134]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>File Word (.docx)</span>
          </button>

          <button
            disabled={isLoading || accountLocked} onClick={() => setSourceType('text')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              sourceType === 'text'
                ? 'bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124] shadow-xs'
                : 'bg-[#f1f3f4] dark:bg-[#282828] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#303134]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dán văn bản thô (AI Parser)</span>
          </button>

          <button
            disabled={isLoading || accountLocked} onClick={() => setSourceType('latex')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              sourceType === 'latex'
                ? 'bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124] shadow-xs'
                : 'bg-[#f1f3f4] dark:bg-[#282828] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#303134]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Mã LaTeX / EX_Test (VTeX)</span>
          </button>
        </div>

        {/* Màn hình chia 2 cột: Trái (Nguồn gốc) | Phải (Kết quả AI bóc tách) */}
        <div className="grow overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4 py-3 min-h-[380px]">
          {/* CỘT TRÁI: KHUNG NGUỒN GỐC */}
          <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#181818] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3.5 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#dadce0] dark:border-[#3c4043]">
              <span className="font-bold text-xs uppercase tracking-wider text-[#3c4043] dark:text-[#e3e3e3] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                <span>Nguồn đầu vào ({sourceType.toUpperCase()})</span>
              </span>

              {sourceType === 'image' && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer"
                >
                  {selectedImage ? 'Chọn ảnh khác' : 'Tải ảnh lên'}
                </button>
              )}

              {sourceType === 'word' && (
                <button
                  onClick={() => wordInputRef.current?.click()}
                  className="text-xs font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer"
                >
                  {wordFile ? 'Chọn file khác' : 'Chọn file Word'}
                </button>
              )}
            </div>

            {/* Vùng nội dung theo từng chế độ */}
            <div className="grow overflow-auto py-2 flex flex-col justify-center">
              {/* 1. CHẾ ĐỘ ẢNH CHỤP */}
              {sourceType === 'image' && (
                <>
                  {selectedImage ? (
                    <div className="h-full flex flex-col items-center justify-center relative group">
                      <img
                        src={selectedImage}
                        alt="Ảnh đề thi"
                        className="max-h-72 w-auto object-contain rounded-xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs"
                      />
                      <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-2 truncate max-w-xs">{imageFileName}</span>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-full border-2 border-dashed border-[#dadce0] dark:border-[#3c4043] hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-[#e8f0fe]/30 dark:hover:bg-[#1e2a38]/40"
                    >
                      <ImageIcon className="w-12 h-12 text-[#5f6368] dark:text-[#9aa0a6] mb-2 opacity-50" />
                      <p className="font-bold text-sm text-[#202124] dark:text-[#e3e3e3]">Kéo thả hoặc nhấp để tải ảnh đề thi</p>
                      <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1">Hỗ trợ ảnh PNG, JPG, JPEG, WebP (Rõ nét công thức)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </>
              )}

              {/* 2. CHẾ ĐỘ FILE WORD */}
              {sourceType === 'word' && (
                <>
                  {wordFile ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-[#282828] rounded-2xl border border-[#dadce0] dark:border-[#3c4043]">
                      <FileText className="w-14 h-14 text-[#1a73e8] dark:text-[#8ab4f8] mb-2" />
                      <p className="font-bold text-sm text-[#202124] dark:text-[#e3e3e3]">{wordFileName}</p>
                      <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1">Kích thước: {(wordFile.size / 1024).toFixed(1)} KB</p>
                      <span className="mt-3 px-3 py-1 rounded-full text-xs font-medium bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1d4834]">
                        Sẵn sàng bóc tách bằng mammoth
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => wordInputRef.current?.click()}
                      className="h-full border-2 border-dashed border-[#dadce0] dark:border-[#3c4043] hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-[#e8f0fe]/30 dark:hover:bg-[#1e2a38]/40"
                    >
                      <FileText className="w-12 h-12 text-[#5f6368] dark:text-[#9aa0a6] mb-2 opacity-50" />
                      <p className="font-bold text-sm text-[#202124] dark:text-[#e3e3e3]">Tải lên file đề thi Word (.docx)</p>
                      <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1">Tự động nhận diện câu hỏi, bảng biểu và phương án A-B-C-D</p>
                    </div>
                  )}
                  <input
                    ref={wordInputRef}
                    type="file"
                    accept=".docx"
                    onChange={handleWordSelect}
                    className="hidden"
                  />
                </>
              )}

              {/* 3. CHẾ ĐỘ TEXT HOẶC LATEX */}
              {(sourceType === 'text' || sourceType === 'latex') && (
                <div className="h-full flex flex-col">
                  <textarea
                    value={rawText}
                    onChange={(e) => { textRead.current++; setRawText(e.target.value); }}
                    placeholder={
                      sourceType === 'latex'
                        ? 'Dán mã LaTeX câu hỏi EX_Test tại đây:\n\\begin{ex}%[2D1B1-1]\nCho hàm số y = f(x)...\n\\choice\n{Đáp án A}\n{\\True Đáp án B}\n{Đáp án C}\n{Đáp án D}\n\\loigiai{...}\n\\end{ex}'
                        : 'Dán đoạn văn bản đề thi thô tại đây (copy từ Word, PDF, Web):\nCâu 1: Cho hàm số y = (2x+1)/(x-1). Đạo hàm là:\nA. y\' = -3/(x-1)^2\nB. y\' = 1\nC. ...\n\nCâu 2: ...'
                    }
                    className="w-full grow text-xs p-3 border border-[#dadce0] dark:border-[#3c4043] rounded-xl focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] outline-hidden font-mono leading-relaxed resize-none bg-white dark:bg-[#282828] text-[#202124] dark:text-[#e3e3e3]"
                  />
                  <div className="flex justify-between items-center text-[11px] text-[#5f6368] dark:text-[#9aa0a6] pt-2">
                    <span>{rawText.length} ký tự</span>
                    <label className="cursor-pointer text-[#1a73e8] dark:text-[#8ab4f8] hover:underline">
                      Tải file .txt / .tex
                      <input type="file" accept=".txt,.tex,.md" onChange={handleTextFileSelect} className="hidden" />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Nút Kích hoạt phân tích */}
            <div className="pt-2 border-t border-[#dadce0] dark:border-[#3c4043] flex justify-end">
              <button
                onClick={handleStartParsing}
                disabled={isLoading || accountLocked}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] dark:text-[#202124] rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang bóc tách bằng AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bắt đầu phân rã thành câu hỏi</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ CÂU HỎI BÓC TÁCH */}
          <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#181818] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-3.5 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#dadce0] dark:border-[#3c4043]">
              <span className="font-bold text-xs uppercase tracking-wider text-[#3c4043] dark:text-[#e3e3e3] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                <span>Kết quả bóc tách ({parsedQuestions.length} câu hỏi)</span>
              </span>

              {parsedQuestions.length > 0 && (
                <button
                  onClick={() => setParsedQuestions([])}
                  className="text-[11px] text-[#5f6368] hover:text-[#c5221f] dark:text-[#9aa0a6] dark:hover:text-[#f28b82] transition-colors cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Thông báo trạng thái hoặc lỗi */}
            {statusMessage && (
              <div className="mt-2 p-2.5 bg-[#e6f4ea] dark:bg-[#0f291e] border border-[#ceead6] dark:border-[#1d4834] text-[#137333] dark:text-[#5bb98c] rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#137333] dark:text-[#5bb98c] shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
            {(errorMessage || accountLocked) && (
              <div className="mt-2 p-2.5 bg-[#fce8e6] dark:bg-[#371918] border border-[#fad2cf] dark:border-[#5c2523] text-[#c5221f] dark:text-[#f28b82] rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#c5221f] dark:text-[#f28b82] shrink-0" />
                <span>{errorMessage || 'Phiên hoặc tài khoản đã thay đổi; nguồn và bản xem trước vẫn giữ. Hãy tải lại trang bằng đúng tài khoản.'}</span>
              </div>
            )}

            {importWarnings.length > 0 && <div role="note" className="text-xs border border-amber-400 rounded p-2 my-2"><p className="font-semibold">Cần đối chiếu tài liệu gốc</p>{importWarnings.map((warning, i) => <p key={i}>{warning}</p>)}</div>}
            {parsedPassages.length > 0 && <details className="my-2 text-sm"><summary>Ngữ liệu dùng chung ({parsedPassages.length})</summary>{parsedPassages.map(p => <div key={p.id} className="border rounded p-2 my-2"><strong>{p.title}</strong><p className="whitespace-pre-wrap">{p.content}</p></div>)}</details>}
            {/* Danh sách thẻ câu hỏi */}
            <div className="grow overflow-y-auto py-2 space-y-2.5 pr-1">
              {parsedQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-3 bg-white dark:bg-[#282828] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] shadow-xs transition-all space-y-2 relative group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1a73e8] dark:text-[#8ab4f8]">Câu {idx + 1}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#f1f3f4] dark:bg-[#1e1e1e] text-[#5f6368] dark:text-[#9aa0a6] border border-[#dadce0] dark:border-[#3c4043]">
                        {q.type}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Xóa câu này"
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#5f6368] hover:text-[#c5221f] dark:text-[#9aa0a6] dark:hover:text-[#f28b82] transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Nội dung câu hỏi KaTeX */}
                  <div className="text-xs text-[#202124] dark:text-[#e3e3e3] leading-relaxed">
                    <MathRenderer content={q.content} inline />
                  </div>

                  {/* Các phương án A, B, C, D */}
                  {q.choices && q.choices.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                      {q.choices.map((c) => (
                        <div
                          key={c.key}
                          className={`p-2 rounded-xl border flex items-baseline gap-1.5 ${
                            c.key === q.correct_answer
                              ? 'bg-[#e6f4ea] dark:bg-[#0f291e] border-[#ceead6] dark:border-[#1d4834] text-[#137333] dark:text-[#5bb98c] font-bold'
                              : 'bg-[#f8f9fa] dark:bg-[#1e1e1e] border-[#dadce0] dark:border-[#3c4043] text-[#3c4043] dark:text-[#e3e3e3]'
                          }`}
                        >
                          <span className="font-bold">{c.key}.</span>
                          <MathRenderer content={c.text} inline />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ý Đúng / Sai */}
                  {q.sub_questions && q.sub_questions.length > 0 && (
                    <div className="space-y-1.5 pt-1 text-xs">
                      {q.sub_questions.map((sub) => (
                        <div key={sub.key} className="flex items-baseline gap-2 bg-[#f8f9fa] dark:bg-[#1e1e1e] p-2 rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
                          <span className="font-bold">{sub.key})</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            sub.isCorrect 
                              ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1d4834]' 
                              : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border border-[#fad2cf] dark:border-[#5c2523]'
                          }`}>
                            {sub.isCorrect === undefined ? 'CHƯA ĐẶT' : sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                          </span>
                          <MathRenderer content={sub.content} inline />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lời giải tóm tắt */}
                  {q.step_by_step_solution && (
                    <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] pt-1.5 border-t border-[#dadce0] dark:border-[#3c4043] italic truncate">
                      Lời giải: {q.step_by_step_solution}
                    </div>
                  )}
                </div>
              ))}

              {parsedQuestions.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#5f6368] dark:text-[#9aa0a6]">
                  <Layers className="w-10 h-10 text-[#5f6368] dark:text-[#9aa0a6] mb-2 opacity-40" />
                  <p className="text-xs">Chưa có câu hỏi nào được bóc tách.</p>
                  <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-1">Chọn nguồn bên trái và bấm "Bắt đầu phân rã" để xem kết quả tại đây.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
          <button
              onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] rounded-full transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {parsedQuestions.length > 0 && (
            <button
              onClick={handleConfirmImport}
              disabled={isLoading || accountLocked}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-[#137333] hover:bg-[#0d5925] dark:bg-[#5bb98c] dark:hover:bg-[#4ea77d] dark:text-[#0f291e] rounded-full shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm {parsedQuestions.length} câu hỏi vào Đề thi hiện tại</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

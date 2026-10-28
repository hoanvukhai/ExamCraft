'use client';

import { applyCopilotSubmission } from '@/lib/copilot-submission';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Question } from '@/types/exam';
import { Header } from '@/components/Header';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { EditorToolbar, type ExportView } from '@/components/EditorToolbar';
import { QuestionEditor } from '@/components/QuestionEditor';
import { previewHeaderDraft, appendManualQuestion } from '@/lib/editor-draft-preview';
import type { HeaderSubmission } from '@/lib/header-layout';
import { listQuestionDrafts } from '@/lib/question-draft';
import { QuestionCard } from '@/components/QuestionCard';
import { accountFetch } from '@/lib/account-fetch';
import { applyQuestionManualSubmission, hasPendingQuestionDrafts, questionDraftSourceStamp, retireSavedQuestionDrafts } from '@/lib/question-draft';


import { applyQuestionOrderCommand } from '@/lib/question-commands';
import { A4Preview } from '@/components/A4Preview';
import { GenerateModal } from '@/components/GenerateModal';
import { ShuffleModal } from '@/components/ShuffleModal';
import { ImportModal } from '@/components/ImportModal';

import { EditorSettings } from '@/components/editor/EditorSettings';
import { subjectLabel } from '@/lib/teacher-ui';
import { QuestionBankModal } from '@/components/QuestionBankModal';
import { RightCompanionRail } from '@/components/RightCompanionRail';
import { ShareModal } from '@/components/ShareModal';
import { StudentResultsModal } from '@/components/StudentResultsModal';
import { exportExamToDocx } from '@/lib/docx-export';
import { prepareExportFigures } from '@/lib/export-figures';
import { useExamPersistence } from '@/components/useExamPersistence';
import { ExamCollaboratorsPanel } from '@/components/ExamCollaboratorsPanel';
import { freezeExamScoring } from '@/lib/snapshot-scoring';
import { requiresNumericScore } from '@/lib/education-catalog';

import type { BankQuestion } from '@/lib/question-client';
import { ExamPresentation } from '@/components/ExamPresentation';
import { EditorReview } from '@/components/editor/EditorReview';
import { reviewExam } from '@/lib/exam-review';
import { PhonePreview } from '@/components/editor/PhonePreview';
import { EditorQuestionList, EditorQuestionHeading } from '@/components/editor/EditorQuestionList';
import { EditorSaveStatus } from '@/components/editor/EditorSaveStatus';
import { EditorRequirements, EditorTemplate } from '@/components/editor/EditorRequirements';
import { ExamStructureEditor } from '@/components/ExamStructureEditor';
import { EditorStart } from '@/components/editor/EditorStart';
import { EditorPending } from '@/components/editor/EditorPending';




import { applyGeneratedDraft, generationDocumentStamp } from '@/lib/generation-plan';
import { Trash2, Link2, CheckSquare, Square, X } from 'lucide-react';

interface ExamWorkspaceProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  examId?: string;
}

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = ({ currentUser, examId }) => {
  const creationFolder = useSearchParams().get('folder');
  const { exam, editorSessionKey, setExam, save, ensureSaved, saveCopy, openLatest, acceptServerDocument, state: saveState, message: saveMessage, folderUnavailable, recoveredDraft, dismissRecoveredDraft, ready } = useExamPersistence(currentUser.id, examId, examId === 'new' ? creationFolder : undefined);
  const scoredQuestions = freezeExamScoring(exam).questions;
  const canEdit = ready && exam.access?.canEdit !== false;
  const canPublish = ready && exam.access?.canPublish !== false;
  const manualSourceStamp = useMemo(() => questionDraftSourceStamp(exam), [exam]);
  useEffect(() => { if (ready && saveState === 'saved') retireSavedQuestionDrafts(currentUser.id, exam); }, [ready, saveState, currentUser.id, exam]);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [manualDraftMessage, setManualDraftMessage] = useState('');
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const { hasActiveKey, openKeys } = useWorkspace();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [pendingReviewAction, setPendingReviewAction] = useState<(() => void) | null>(null);
  const reviewed = reviewExam(exam);
  const reviewBefore = (action: () => void) => { if (reviewed.issues.length) { setPendingReviewAction(() => action); setReviewOpen(true); } else action(); };
  const [keyReminder, setKeyReminder] = useState(false);
  const withAi = (action: () => void) => { if (!canEdit) return; if (!hasActiveKey) setKeyReminder(true); else action(); };
  // Layout states
  const { settingsOpen, setSettingsOpen, copilotOpen: isCopilotOpen, setCopilotOpen: setIsCopilotOpen } = useWorkspace();
  const [copilotCommand, setCopilotCommand] = useState<string>('');
  const [phonePreview, setPhonePreview] = useState(false);
  const editorScroll = useRef<HTMLDivElement>(null), editorScrollTop = useRef(0);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Selected questions for batch operations
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const templateAnchor = useRef<HTMLDivElement>(null);
  const [headerDraft, setHeaderDraft] = useState<HeaderSubmission | null>(null);
  const updateHeaderPreview = useCallback((draft: HeaderSubmission | null) => setHeaderDraft(draft), []);
  const previewExam = settingsOpen ? previewHeaderDraft(exam, headerDraft) : exam;
  const settingsAnchor = useRef<HTMLDivElement>(null), addAnchor = useRef<HTMLDivElement>(null);
  const [newQuestion, setNewQuestion] = useState<Question | null>(null);
  const sessionScope = currentUser.id + ':' + editorSessionKey;
  const [draftSession, setDraftSession] = useState(sessionScope);
  if (draftSession !== sessionScope) {
    setDraftSession(sessionScope); setNewQuestion(null); setHeaderDraft(null); setTemplateOpen(false);
  }
  const openSettings = () => { setSettingsOpen(true); setMobileTab('editor');
    requestAnimationFrame(() => settingsAnchor.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);


  const [assignmentState, setAssignmentState] = useState({ id: '', has: false });
  useEffect(() => {
    if (!exam.serverId || exam.access?.canManage === false) return;
    let live = true;
    void accountFetch(currentUser.id, '/api/assignments?examId=' + encodeURIComponent(exam.serverId)).then(async response => { if (!response.ok) return; const data = await response.json(); if (live) { const rows = data.assignments ?? []; setAssignmentState({ id: exam.id, has: rows.length > 0 }); setSubmissionCount(rows.reduce((total: number, row: { _count?: { attempts?: number } }) => total + (row._count?.attempts ?? 0), 0)); } }).catch(() => {});
    return () => { live = false; };
  }, [currentUser.id, exam.id, exam.serverId, exam.access?.canManage, isShareModalOpen]);
  // Đổi tên đề thi inline Google Docs style
  const handleUpdateTitle = (newTitle: string) => {
    setExam((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        title: newTitle,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (id: string) => {
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Di chuyển câu hỏi lên/xuống
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const questionId = exam.questions[index]?.id;
    if (!questionId) return;
    const command = { documentId: exam.id, baseOrder: exam.questions.map(question => question.id), questionId, action: direction };
    setExam(previous => applyQuestionOrderCommand(previous, command));
  };

  // Nhân bản câu hỏi
  const handleDuplicateQuestion = (index: number) => {
    const questionId = exam.questions[index]?.id;
    if (!questionId) return;
    const command = { documentId: exam.id, baseOrder: exam.questions.map(question => question.id), questionId, action: 'duplicate' as const, newId: `q_${crypto.randomUUID()}` };
    setExam(previous => applyQuestionOrderCommand(previous, command));
  };

  // Thêm câu hỏi thủ công
  const handleAddQuestion = () => {
    if (!canEdit) return;
    const recovered = listQuestionDrafts(currentUser.id, exam.id).find(entry => entry.value?.questionId.startsWith('q_new_') && !exam.questions.some(question => question.id === entry.value?.questionId));
    const seed: Question = recovered?.value?.baseQuestion ?? {
      id: 'q_new_' + crypto.randomUUID(), type: 'multiple_choice', difficulty: 'thong_hieu',
      content: '', choices: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }],
      subject: exam.metadata.subject, grade: exam.metadata.grade, step_by_step_solution: '',
    };
    setNewQuestion(seed); setMobileTab('editor');
    requestAnimationFrame(() => addAnchor.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  // Chọn/bỏ chọn câu hỏi
  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === exam.questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(exam.questions.map((q) => q.id));
    }
  };

  // Bảo AI sửa câu này
  const handleAskAiAboutQuestion = (index: number) => {
    const target = exam.questions[index];
    if (!target) return;
    setSelectedQuestionIds([target.id]);
    setIsCopilotOpen(true);
    setCopilotCommand(`Đổi số liệu hoặc nâng cấp câu ${index + 1}`);
  };

  // Gộp các câu đã chọn thành 1 câu tự luận
  const handleMergeSelected = () => {
    if (selectedQuestionIds.length < 2) return;
    const selectedQuestions = exam.questions.filter((q) => selectedQuestionIds.includes(q.id));
    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const mergedContent =
      `**Bài toán tổng hợp:**\n` +
      selectedQuestions
        .map((q, idx) => `**Ý ${alphabet[idx] || idx + 1})** ${q.content}`)
        .join('\n\n');

    const mergedSolution = selectedQuestions
      .map((q, idx) => `**Hướng dẫn giải ý ${alphabet[idx] || idx + 1}:**\n${q.step_by_step_solution || 'Đang cập nhật'}`)
      .join('\n\n');

    const mergedQuestion: Question = {
      id: `q_merged_${Date.now()}`,
      type: 'essay',
      difficulty: 'van_dung',
      content: mergedContent,
      step_by_step_solution: mergedSolution,
      tags: ['Cau_hoi_tong_hop', 'Tu_luan'],
    };

    const firstIndex = exam.questions.findIndex((q) => q.id === selectedQuestionIds[0]);
    const remainingQuestions = exam.questions.filter((q) => !selectedQuestionIds.includes(q.id));
    remainingQuestions.splice(firstIndex, 0, mergedQuestion);

    setExam((prev) => ({
      ...prev,
      questions: remainingQuestions,
      updatedAt: new Date().toISOString(),
    }));
    setSelectedQuestionIds([]);
  };

  // Xóa các câu hỏi đã chọn hàng loạt
  const handleBatchDelete = () => {
    if (selectedQuestionIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedQuestionIds.length} câu hỏi đã chọn?`)) return;
    
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => !selectedQuestionIds.includes(q.id)),
      updatedAt: new Date().toISOString(),
    }));
    setSelectedQuestionIds([]);
  };

  const handleSaveCurrentExam = async () => {
    if (hasPendingQuestionDrafts(currentUser.id, exam.id, exam.questions.map(question => question.id), exam)) {
      setManualDraftMessage('Còn nháp câu chưa áp dụng. Mở Sửa để áp dụng câu, hoặc cất riêng tại Nháp câu hỏi trước khi lưu đề.');
      return;
    }
    setManualDraftMessage('');
    await save();
  };

  const downloadDraft = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exam, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'ExamCraft-ban-nhap.json'; link.click(); URL.revokeObjectURL(url);
  };

  // Xuất file Word trực tiếp từ menu
  const handleExportWord = async (view: ExportView = 'exam') => {
    try {
      const blob = await exportExamToDocx(await prepareExportFigures(exam), view !== 'exam', view === 'matrix', view);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exam.metadata.title.replace(/\s+/g, '_')}_${exam.metadata.examCode || 'DeThi'}_${view}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Chưa xuất được Word.');
    }
  };

  return (
    <div className="print-flow @container flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {reviewOpen && <EditorReview exam={exam} onClose={() => setReviewOpen(false)} onContinue={pendingReviewAction ? () => { setReviewOpen(false); pendingReviewAction?.(); } : undefined} onQuestion={id => { setReviewOpen(false); setMobileTab('editor'); setTimeout(() => { const node = document.getElementById('editor-question-' + id); node?.scrollIntoView({ block: 'center' }); node?.focus(); }, 0); }} />}
      {keyReminder && <div role="dialog" aria-modal="true" aria-label="Cần khóa AI" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="app-dialog p-5 rounded-xl border bg-[var(--ui-surface)] max-w-sm space-y-4"><h2>Cần khóa AI</h2><p>Thêm khóa cá nhân để dùng chức năng AI. Bạn vẫn soạn và xuất đề thủ công được.</p><button type="button" className="app-button-primary p-2" onClick={() => { setKeyReminder(false); openKeys(); }}>Thêm khóa AI</button><button type="button" className="app-button-secondary p-2 ml-2" onClick={() => setKeyReminder(false)}>Đóng</button></div></div>}
      {/* HEADER GOOGLE MINIMALIST */}
      <Header
        canEdit={canEdit}
        examTitle={exam.metadata.title}
        onUpdateTitle={handleUpdateTitle}
        onShare={() => reviewBefore(() => { if (canPublish) setIsShareModalOpen(true); else setCollaborationOpen(true); })}
      >
        <button type="button" aria-label="Thông tin và thiết lập đề" onClick={() => openSettings()} className="app-button-secondary text-xs px-2 min-h-9 max-w-44 truncate hidden @min-[700px]:block">{subjectLabel(exam.metadata.subject)} {exam.metadata.grade} · {exam.metadata.durationMinutes ? exam.metadata.durationMinutes + '′' : 'chưa đặt giờ'} · {scoredQuestions.reduce((sum, q) => sum + (q.points ?? 0), 0)}đ</button>
        <EditorSaveStatus state={saveState}>        <div role="status" className="flex flex-wrap gap-2 text-sm">
          {manualDraftMessage && <p role="alert">{manualDraftMessage}</p>}
          <span className="mr-1">{saveState === 'loading' ? 'Đang mở đề…' : saveState === 'saving' ? 'Đang lưu…' : saveState === 'dirty' ? 'Có thay đổi đang chờ lưu' : saveState === 'offline' ? 'Mất kết nối — đang giữ bản nháp trên máy' : saveState === 'saved' ? saveMessage || 'Đã lưu trên máy chủ' : saveMessage || 'Chưa lưu được đề'}</span>
          {saveState !== 'loading' && saveState !== 'saving' && <button onClick={() => void handleSaveCurrentExam()} className="app-button-secondary min-h-9 px-3 text-xs">Thử lưu lại</button>}
          {folderUnavailable && ready && !exam.serverId && exam.creationFolderId && <button onClick={() => { setExam(value => ({ ...value, creationFolderId: null })); void save(); }} className="app-button-secondary min-h-9 px-3 text-xs">Lưu bản nháp ở ngoài thư mục</button>}
          <button onClick={downloadDraft} className="app-button-secondary min-h-9 px-3 text-xs">Tải bản nháp</button>
          {saveState === 'conflict' && <button onClick={() => void saveCopy()} className="app-button-secondary min-h-9 px-3 text-xs">Lưu bản nháp thành đề mới</button>}
          {saveState === 'conflict' && ready && exam.serverId && <button onClick={() => void openLatest()} className="app-button-secondary min-h-9 px-3 text-xs">Mở bản máy chủ, giữ riêng nháp</button>}
        </div>

        </EditorSaveStatus>
        <button type="button" className="app-button-secondary text-xs min-h-9 px-2 shrink-0" aria-label="Rà soát đề" onClick={() => { setPendingReviewAction(null); setReviewOpen(true); }}>{reviewed.issues.length ? '⚠ ' + reviewed.issues.length : '✓'}<span className="hidden @min-[500px]:inline"> {reviewed.issues.length ? 'cần xem' : 'Rà soát'}</span></button>
      </Header>

      <EditorToolbar
        canEdit={canEdit} ready={ready} hasQuestions={exam.questions.length > 0} hasServerExam={Boolean(exam.serverId)} hasAssignments={assignmentState.id === exam.id && assignmentState.has}
        copilotOpen={isCopilotOpen} onCopilot={() => withAi(() => setIsCopilotOpen(open => !open))}
        access={exam.access} submissionCount={submissionCount}
        onGenerate={() => { if (exam.questions.length && !window.confirm('Sinh bản nháp đề AI mới? Chỉ thay đề sau khi bạn duyệt đề xuất; bản hiện tại vẫn được giữ.')) return; withAi(() => setIsGenerateModalOpen(true)); }} onImport={() => setIsImportModalOpen(true)} onBank={() => setIsQuestionBankModalOpen(true)}
        onTemplate={() => { setTemplateOpen(true); setMobileTab('editor'); requestAnimationFrame(() => templateAnchor.current?.scrollIntoView({block: 'start', behavior: 'smooth'})); }} onSettings={() => openSettings()} onAdd={handleAddQuestion} onShuffle={() => setIsShuffleModalOpen(true)}
        onExportWord={view => reviewBefore(() => void handleExportWord(view))} onPrint={() => reviewBefore(() => window.print())} onPresent={() => reviewBefore(() => setPresentationOpen(true))}
        onCollaborate={() => setCollaborationOpen(true)} onResults={() => setIsResultsModalOpen(true)}
      />




      <nav aria-label="Chuyển vùng soạn" className="no-print @min-[900px]:hidden shrink-0 sticky top-0 z-20 flex gap-2 p-2 border-b bg-[var(--ui-surface)]">{(['editor','preview'] as const).map(tab => <button type="button" key={tab} aria-pressed={mobileTab === tab} className={(mobileTab === tab ? 'app-button-tonal' : 'app-button-secondary') + ' min-h-10 px-4 flex-1 text-sm'} onClick={() => { if (mobileTab === 'editor') editorScrollTop.current = editorScroll.current?.scrollTop ?? 0; setMobileTab(tab); requestAnimationFrame(() => { if (editorScroll.current) editorScroll.current.scrollTop = tab === 'editor' ? editorScrollTop.current : 0; }); }}>{tab === 'editor' ? 'Soạn câu' : 'Xem đề'}</button>)}</nav>
      <PhonePreview exam={previewExam} open={phonePreview} onClose={() => setPhonePreview(false)} />
      {mobileTab === 'editor' && !selectedQuestionIds.length && <button type="button" className="no-print sm:hidden fixed bottom-4 right-4 z-30 app-button-primary rounded-full px-4 min-h-11 shadow-lg" aria-label="Xem đề toàn màn hình" onClick={() => setPhonePreview(true)}>Xem đề</button>}
      {!ready && <div className="p-4">{saveMessage || 'Đang tải nội dung. Vui lòng chờ trước khi sửa.'}</div>}
      {/* 3-ZONE ARCHITECTURE: LEFT RAIL + INDEPENDENT SCROLL WORKSPACE + RIGHT COMPANION RAIL */}
      <div className="print-flow flex-1 flex overflow-hidden min-h-0 relative">
        
        

        {/* ZONE 2: VÙNG NỘI DUNG CHÍNH (CANVAS CHỦ ĐẠO MÀU TRẮNG GOOGLE, CUỘN ĐỘC LẬP) */}
        <div ref={editorScroll} className="print-flow @container flex-1 h-full overflow-y-auto px-4 sm:px-6 py-5 min-w-0">
          {/* KHU VỰC CHÍNH SPLIT PANE: DANH SÁCH CÂU HỎI & A4 PREVIEW */}
          <main className="grid grid-cols-1 @min-[900px]:grid-cols-12 gap-6 items-start pb-8">
            {/* CỘT TRÁI: DANH SÁCH CÂU HỎI (6 Cột trên màn hình lớn) */}
            <div
              className={`no-print min-w-0 @min-[900px]:col-span-6 space-y-4 ${
                mobileTab === 'preview' ? 'hidden @min-[900px]:block' : 'block'
              }`}
            >
              {recoveredDraft && saveState !== 'saved' && <div role="status" className="border rounded p-3 text-sm">Đang mở nháp trên máy của đề này. <button type="button" className="underline" onClick={dismissRecoveredDraft}>Tiếp tục với nháp</button>{exam.serverId && <button type="button" className="underline ml-3" onClick={() => void openLatest().then(value => { if (value) dismissRecoveredDraft(); })}>Mở bản máy chủ, cất riêng nháp</button>}</div>}
              <EditorPending ownerId={currentUser.id} exam={exam} onCopilot={() => setIsCopilotOpen(true)} />
              <div ref={settingsAnchor} className="scroll-mt-16">
                <section className="border rounded-xl p-4 bg-[var(--ui-surface)] flex flex-wrap items-center justify-between gap-2" aria-label="Thông tin chung của đề"><div><h2 className="font-semibold text-sm">Thông tin đề</h2><p className="text-xs text-[var(--ui-text-secondary)]">{subjectLabel(exam.metadata.subject)} · Lớp {exam.metadata.grade}{exam.metadata.durationMinutes ? ' · ' + exam.metadata.durationMinutes + ' phút' : ''}</p></div><button type="button" className="app-button-secondary min-h-10 px-3 text-sm" onClick={() => settingsOpen ? setSettingsOpen(false) : openSettings()}>{settingsOpen ? 'Thu gọn' : 'Chỉnh thông tin'}</button></section>
                <EditorSettings key={`${currentUser.id}:${editorSessionKey}`} ownerId={currentUser.id} exam={exam} canEdit={canEdit} onChange={setExam} isOpen={settingsOpen} onPreview={updateHeaderPreview} onClose={() => setSettingsOpen(false)} />
              </div>
              <div ref={templateAnchor} className="scroll-mt-16"><EditorTemplate key={currentUser.id + ':' + editorSessionKey} ownerId={currentUser.id} exam={exam} canEdit={canEdit} onChange={setExam} open={templateOpen} onClose={() => setTemplateOpen(false)} /></div>
              <EditorRequirements key={currentUser.id + ':' + editorSessionKey} ownerId={currentUser.id} exam={exam} canEdit={canEdit} hasActiveKey={hasActiveKey} onChange={setExam} />
              <fieldset disabled={!canEdit} className="space-y-4 min-w-0">
              {/* Thanh tiêu đề & Tác vụ danh sách câu hỏi */}
              <EditorQuestionHeading exam={exam} points={scoredQuestions.reduce((total, q) => total + (q.points ?? 0), 0)}>
                <div className="flex items-center gap-2">
                  {exam.questions.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      title={selectedQuestionIds.length === exam.questions.length ? "Bỏ chọn tất cả" : "Chọn tất cả câu hỏi"}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] bg-[var(--ui-surface)] dark:bg-[var(--ui-surface-variant)] border border-[var(--ui-border)] dark:border-[var(--ui-border)] hover:bg-[var(--ui-surface-variant)] dark:hover:bg-[#303134] rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      {selectedQuestionIds.length === exam.questions.length && exam.questions.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[var(--ui-text-secondary)] dark:text-[var(--ui-text-secondary)]" />
                      )}
                      <span className="hidden sm:inline">
                        {selectedQuestionIds.length === exam.questions.length ? "Bỏ chọn" : "Chọn tất cả"}
                      </span>
                    </button>
                  )}

                </div>
              </EditorQuestionHeading>



              <ExamStructureEditor exam={exam} onChange={setExam} />
              <div ref={addAnchor} className="scroll-mt-16">
              {newQuestion && <section aria-label="Soạn câu mới" className="rounded-xl border p-4 space-y-3 bg-[var(--ui-surface)]"><h3 className="font-semibold">Thêm câu hỏi</h3><QuestionEditor key={currentUser.id + ':' + editorSessionKey + ':' + newQuestion.id} creating ownerId={currentUser.id} documentId={exam.id} sourceStamp={manualSourceStamp} question={exam.questions.find(q => q.id === newQuestion.id) ?? newQuestion} frameworkId={exam.metadata.cognitiveFrameworkId} knowledgePackage={exam.metadata.knowledgePackage} knowledgeScope={exam.metadata.knowledgeScope} onSave={submission => setExam(previous => appendManualQuestion(previous, submission, currentUser.id, newQuestion))} onApplied={() => setNewQuestion(null)} onCancel={() => setNewQuestion(null)} /></section>}
              </div>
              {/* Danh sách các câu hỏi dạng thẻ Block Card */}
              <div className="space-y-3.5">
                <EditorQuestionList onChange={canEdit ? setExam : undefined} exam={exam} renderQuestion={(q, idx) => (
                  <QuestionCard selectionActive={selectedQuestionIds.length > 0} withAi={withAi} ownerId={currentUser.id}
                    displayPoints={scoredQuestions[idx]?.points}
                    hidePassage passage={exam.passages?.find(p => p.id === q.passageId)}
                    numericScore={requiresNumericScore(exam.metadata.assessmentMode)}
                    cognitiveFrameworkId={exam.metadata.cognitiveFrameworkId}
                      knowledgePackage={exam.metadata.knowledgePackage}
                      knowledgeScope={exam.metadata.knowledgeScope}
                    key={`${currentUser.id}:${editorSessionKey}:${q.id}`}
                    documentId={exam.id}
                    sourceStamp={manualSourceStamp}
                    onManualSave={submission => setExam(previous => applyQuestionManualSubmission(previous, submission, currentUser.id))}
                    index={idx}
                    question={{ ...q, subject: q.subject ?? exam.metadata.subject, grade: q.grade ?? exam.metadata.grade }}
                    onDelete={handleDeleteQuestion}
                    apiKey=""
                    onMoveUp={() => handleMoveQuestion(idx, 'up')}
                    onMoveDown={() => handleMoveQuestion(idx, 'down')}
                    onDuplicate={() => handleDuplicateQuestion(idx)}
                    isFirst={idx === 0}
                    isLast={idx === exam.questions.length - 1}
                    isSelected={selectedQuestionIds.includes(q.id)}
                    onToggleSelect={handleToggleSelectQuestion}
                    onAskAiAboutQuestion={handleAskAiAboutQuestion}
                  />
                )} />

                {exam.questions.length === 0 && !newQuestion && <EditorStart hasKey={hasActiveKey} onAdd={handleAddQuestion} onBank={() => setIsQuestionBankModalOpen(true)} onImport={() => setIsImportModalOpen(true)} onGenerate={() => withAi(() => setIsGenerateModalOpen(true))} />}
                {exam.questions.length > 0 && <button type="button" className="app-button-secondary w-full min-h-11" onClick={handleAddQuestion}>+ Thêm câu hỏi</button>}
              </div>

              {/* Thanh tác vụ hàng loạt nổi cố định ở dưới (Floating Batch Action Bar) */}
              {selectedQuestionIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--ui-accent)] backdrop-blur-md text-[var(--ui-on-primary)] px-5 py-3 rounded-full shadow-xs border border-[var(--ui-border)]/30 dark:border-[var(--ui-border)] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
                  <span className="text-xs font-bold text-[#e3e3e3] bg-[#292a2d] px-2.5 py-1 rounded-full border border-[#3c4043]">
                    Đã chọn {selectedQuestionIds.length} câu
                  </span>

                  <div className="h-4 w-px bg-[#3c4043]" />

                  {/* Nút Gộp câu */}
                  <button
                    onClick={handleMergeSelected}
                    disabled={selectedQuestionIds.length < 2}
                    title={selectedQuestionIds.length < 2 ? "Chọn ít nhất 2 câu để gộp thành 1 câu tự luận" : "Gộp các câu đã chọn thành 1 câu tự luận tổng hợp có nhiều ý a, b, c..."}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg app-button-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Gộp thành 1 câu tự luận</span>
                  </button>

                  {/* Nút Xóa các câu đã chọn */}
                  <button
                    onClick={handleBatchDelete}
                    title="Xóa các câu hỏi đã chọn"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa ({selectedQuestionIds.length})</span>
                  </button>

                  <div className="h-4 w-px bg-[#3c4043]" />

                  {/* Nút Hủy chọn */}
                  <button
                    onClick={() => setSelectedQuestionIds([])}
                    title="Hủy chọn tất cả"
                    className="p-1.5 text-[#9aa0a6] hover:text-[#e3e3e3] rounded-lg hover:bg-[#303134] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              </fieldset>
            </div>

            {/* CỘT PHẢI: KHUNG XEM TRƯỚC BẢN IN A4 (6 Cột trên màn hình lớn) */}
            <section
              className={`a4-preview-section @min-[900px]:col-span-6 sticky top-0 h-[calc(100vh-6rem)] ${
                mobileTab === 'editor' ? 'hidden @min-[900px]:block' : 'block'
              } print:!block print:!static print:!h-auto print:!w-full print:!overflow-visible`}
            >
              {previewExam !== exam && <p role="status" className="text-xs p-2 border rounded">Đang xem thử thông tin chưa áp dụng.</p>}
              <A4Preview exam={previewExam} />
            </section>
          </main>
        </div>

        {/* ZONE 3: THANH MENU DỌC BÊN PHẢI (GOOGLE GEMINI COMPANION RAIL) */}
        {canEdit && <RightCompanionRail
          key={`${currentUser.id}:${exam.id}`}
          ownerId={currentUser.id}
          onSubmitCopilot={submission => setExam(previous => applyCopilotSubmission(previous, submission, currentUser.id))}
          isExpanded={isCopilotOpen && canEdit}
          onClose={() => setIsCopilotOpen(false)}
          exam={exam}
          selectedQuestionIds={selectedQuestionIds}
          externalCommand={copilotCommand}
        />}
      </div>

      {/* CÁC MODALS NGHIỆP VỤ */}
      {presentationOpen && <ExamPresentation exam={exam} onClose={() => setPresentationOpen(false)} />}
      {collaborationOpen && exam.serverId && <div role="dialog" aria-modal="true" aria-label="Cộng tác và lịch sử" className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"><div className="app-dialog w-full max-w-3xl max-h-[90vh] overflow-auto bg-[var(--ui-surface)] dark:bg-[var(--ui-surface)] rounded-xl p-5"><button type="button" className="float-right px-3 py-2" onClick={() => setCollaborationOpen(false)}>Đóng</button><ExamCollaboratorsPanel key={`${exam.serverId}-${currentUser.id}`} examId={exam.serverId} expectedUserId={currentUser.id} questions={exam.questions.map((q, i) => ({ id: q.id, label: `Câu ${i + 1}: ${(q.content || '').replace(/\s+/g, ' ').slice(0, 40)}` }))} onRestored={document => { acceptServerDocument(document); }} beforeRestore={() => { if (saveState !== 'saved') { alert('Hãy lưu xong hoặc giữ bản nháp thành đề mới trước khi khôi phục lịch sử.'); return false; } return true; }} /></div></div>}

      <GenerateModal
        key={`${exam.metadata.subject}-${exam.metadata.grade}-${exam.metadata.knowledgePackage?.id ?? ''}-${exam.metadata.knowledgePackage?.revision ?? ''}`}
        context={exam.metadata}
        documentStamp={isGenerateModalOpen ? generationDocumentStamp(exam) : ''}
        expectedUserId={currentUser.id}
        replacesDocument
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onExamGenerated={(newExam, baseStamp) => setExam(previous => applyGeneratedDraft(previous, newExam, baseStamp))}
        apiKey=""
      />

      <ShuffleModal
        isOpen={isShuffleModalOpen}
        onClose={() => setIsShuffleModalOpen(false)}
        baseExam={exam}
        onSelectVariant={(variantExam) => setExam(previous => ({ ...variantExam, id: previous.id, serverId: previous.serverId, version: previous.version, access: previous.access }))}
      />

      <ImportModal
        ownerId={currentUser.id}
        documentId={exam.id}
        context={{ subject: exam.metadata.subject, grade: exam.metadata.grade }}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportQuestions={(newQuestions, context) => {
          setExam((prev) => prev.id !== exam.id || prev.access?.canEdit === false ? prev : ({
            ...prev,
            questions: [...prev.questions, ...newQuestions],
            passages: [...(prev.passages ?? []), ...(context.passages ?? [])],
            updatedAt: new Date().toISOString(),
          }));
        }}
        apiKey=""
      />

      <QuestionBankModal ownerId={currentUser.id} key={`bank:${currentUser.id}`}
        isOpen={isQuestionBankModalOpen}
        onClose={() => setIsQuestionBankModalOpen(false)}
        onInsertQuestion={(q, passage) => {
          const question = { ...q } as BankQuestion;
          delete question.passage; delete question.passageUnavailable;
          const newQuestion: Question = {
            ...question,
            id: crypto.randomUUID(),
          };
          setExam(prev => {
            const passages = [...(prev.passages ?? [])];
            if (passage) {
              const existing = passages.find(p => p.id === passage.id);
              const id = existing && JSON.stringify(existing) !== JSON.stringify(passage) ? crypto.randomUUID() : passage.id;
              if (!passages.some(p => p.id === id)) passages.push({ ...passage, id });
              newQuestion.passageId = id;
            }
            return { ...prev, passages, questions: [...prev.questions, newQuestion], updatedAt: new Date().toISOString() };
          });
        }}
      />

      <ShareModal
        key={`share:${currentUser.id}:${exam.id}`}
        ownerId={currentUser.id}
        onEnsureSaved={ensureSaved}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        exam={exam}
        onCloudSyncSuccess={() => { /* Server acknowledgement is tracked by the save controller. */ }}
      />

      <StudentResultsModal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        exam={exam}
        onOpenShareModal={() => {
          setIsResultsModalOpen(false);
          setIsShareModalOpen(true);
        }}
      />

      
    </div>
  );
};
export default ExamWorkspace;

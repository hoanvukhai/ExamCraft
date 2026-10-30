'use client';

import { applyCopilotSubmission } from '@/lib/copilot-submission';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Question } from '@/types/exam';
import { Header } from '@/components/Header';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { EditorSelectionProvider } from '@/components/editor/EditorSelection';
import { EditorToolbar, type ExportView } from '@/components/EditorToolbar';
import { AccountMenu, AppMenu, ExportMenu, MoreMenu } from '@/components/editor/EditorMenus';
import { EditorRail, ResizablePanel, useStoredWidth, type RailItem } from '@/components/editor/EditorPanels';
import { describeInsertion } from '@/lib/insertion-label';
import { QuestionEditor } from '@/components/QuestionEditor';
import { previewHeaderDraft, appendManualQuestion } from '@/lib/editor-draft-preview';
import type { HeaderSubmission } from '@/lib/header-layout';
import { listQuestionDrafts } from '@/lib/question-draft';
import { QuestionCard } from '@/components/QuestionCard';
import { accountFetch } from '@/lib/account-fetch';
import {
  applyQuestionManualSubmission,
  hasPendingQuestionDrafts,
  questionDraftSourceStamp,
  retireSavedQuestionDrafts,
} from '@/lib/question-draft';

import { applyQuestionOrderCommand } from '@/lib/question-commands';
import { A4Preview } from '@/components/A4Preview';
import { GenerateModal } from '@/components/GenerateModal';
import { ShuffleModal } from '@/components/ShuffleModal';
import { ImportModal } from '@/components/ImportModal';

import { EditorSettings } from '@/components/editor/EditorSettings';
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
import { DetailSlotProvider } from '@/components/editor/EditorDetailSlot';
import { reviewExam } from '@/lib/exam-review';
import { EditorSaveStatus } from '@/components/editor/EditorSaveStatus';
import { EditorTemplate } from '@/components/editor/EditorRequirements';
import { EditorPrint } from '@/components/editor/EditorPrint';
import { captureInsertion, insertQuestionBatch, type InsertionTarget } from '@/lib/outline-insertion';
import { editorInsertionPoint, importedPartPoint } from '@/lib/editor-parts';
import { OutlineEditor, type QuestionSource } from '@/components/editor/OutlineEditor';
import { insertOutlineNodes, viewSyncedOutline, type InsertPoint } from '@/lib/exam-outline';
import { EditorPending } from '@/components/editor/EditorPending';

import { generationDocumentStamp } from '@/lib/generation-plan';
import {
  Trash2,
  Link2,
  CheckSquare,
  Square,
  X,
  Database,
  Eye,
  FileUp,
  LayoutTemplate,
  ListTree,
  PencilLine,
  Presentation,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';

type RightTab = 'detail' | 'ai' | 'review' | 'collab';
type LeftTab = 'content' | 'info' | 'template' | 'bank' | 'import' | 'generate';
const railItems: RailItem<LeftTab>[] = [
  { id: 'content', label: 'Nội dung', Icon: ListTree },
  { id: 'info', label: 'Thông tin', Icon: SlidersHorizontal },
  { id: 'template', label: 'Mẫu', Icon: LayoutTemplate },
  { id: 'bank', label: 'Ngân hàng', Icon: Database },
  { id: 'import', label: 'Nhập đề', Icon: FileUp },
  { id: 'generate', label: 'AI tạo câu', Icon: Sparkles },
];
const panelTitles: Record<LeftTab, string> = {
  content: 'Nội dung đề',
  info: 'Thông tin đề',
  template: 'Mẫu',
  bank: 'Ngân hàng câu hỏi',
  import: 'Nhập đề từ Word hoặc ảnh',
  generate: 'Sinh câu bằng AI',
};

interface ExamWorkspaceProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  examId?: string;
}

const ExamWorkspaceContent: React.FC<ExamWorkspaceProps> = ({ currentUser, examId }) => {
  const creationFolder = useSearchParams().get('folder');
  const {
    exam,
    editorSessionKey,
    setExam,
    save,
    ensureSaved,
    saveCopy,
    openLatest,
    acceptServerDocument,
    state: saveState,
    message: saveMessage,
    folderUnavailable,
    recoveredDraft,
    dismissRecoveredDraft,
    ready,
  } = useExamPersistence(currentUser.id, examId, examId === 'new' ? creationFolder : undefined);
  const scoredQuestions = freezeExamScoring(exam).questions;
  const [mode, setMode] = useState<'edit' | 'comment' | 'view'>('edit');
  const mayEdit = ready && exam.access?.canEdit !== false;
  // Comment and view modes lock the sheet, so a teacher can read or discuss without touching the content.
  const canEdit = mayEdit && mode === 'edit';
  const canPublish = ready && exam.access?.canPublish !== false;
  const manualSourceStamp = useMemo(() => questionDraftSourceStamp(exam), [exam]);
  useEffect(() => {
    if (ready && saveState === 'saved') retireSavedQuestionDrafts(currentUser.id, exam);
  }, [ready, saveState, currentUser.id, exam]);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [manualDraftMessage, setManualDraftMessage] = useState('');
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const { hasActiveKey, openKeys } = useWorkspace();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [pendingReviewAction, setPendingReviewAction] = useState<(() => void) | null>(null);
  const reviewed = reviewExam(exam);
  // Marks in the sheet's margins: review findings by question, and unresolved comments by question.
  const issueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const issue of reviewed.issues) {
      const match = /^Câu (d+)/.exec(issue.location);
      const question = match && exam.questions[Number(match[1]) - 1];
      if (question) counts[question.id] = (counts[question.id] ?? 0) + 1;
    }
    return counts;
  }, [reviewed, exam.questions]);
  const [commentState, setCommentState] = useState<{ key: string; counts: Record<string, number> }>({ key: '', counts: {} });
  const reviewBefore = (action: () => void) => {
    if (reviewed.issues.length) openReview(action);
    else action();
  };
  const [keyReminder, setKeyReminder] = useState(false);
  const withAi = (action: () => void) => {
    if (!canEdit) return;
    if (!hasActiveKey) setKeyReminder(true);
    else action();
  };
  // Layout states
  const { copilotOpen: isCopilotOpen, setCopilotOpen: setIsCopilotOpen, toggleAssistant } = useWorkspace();
  const [copilotCommand, setCopilotCommand] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [leftTab, setLeftTab] = useState<LeftTab>('content');
  const [rightTab, setRightTab] = useState<RightTab>('ai');
  const [detailSlot, setDetailSlot] = useState<HTMLElement | null>(null);
  const [editingIds, setEditingIds] = useState<string[]>([]);
  const reportEditing = useCallback((id: string, editing: boolean) => {
    setEditingIds((ids) => (editing ? (ids.includes(id) ? ids : [...ids, id]) : ids.filter((x) => x !== id)));
    if (editing) setRightTab('detail');
  }, [setRightTab]);
  const detailContext = useMemo(() => ({ slot: detailSlot, report: reportEditing }), [detailSlot, reportEditing]);
  const openReview = (after: (() => void) | null) => {
    setPendingReviewAction(after ? () => after : null);
    setRightTab('review');
    setReviewOpen(true);
  };
  const openAi = () => {
    setRightTab('ai');
    setIsCopilotOpen(true);
  };
  const openCollaboration = () => {
    setRightTab('collab');
    setCollaborationOpen(true);
  };
  const [leftOpen, setLeftOpen] = useState(true);
  // Source panels keep what was typed while another tab is shown; they reset when they are closed or finished.
  const [mounted, setMounted] = useState<Partial<Record<LeftTab, boolean>>>({});
  const [leftWidth, setLeftWidth] = useStoredWidth('examcraft_editor_left', 440, 320, 720);
  const [rightWidth, setRightWidth] = useStoredWidth('examcraft_editor_right', 380, 300, 560);

  // Selected questions for batch operations
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
  const [headerDraft, setHeaderDraft] = useState<HeaderSubmission | null>(null);
  const updateHeaderPreview = useCallback((draft: HeaderSubmission | null) => setHeaderDraft(draft), []);
  const infoOpen = leftOpen && leftTab === 'info';
  const previewExam = infoOpen && headerDraft ? previewHeaderDraft(exam, headerDraft) : exam;
  const addAnchor = useRef<HTMLDivElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<InsertPoint | null>(null);
  const [newQuestionPoint, setNewQuestionPoint] = useState<InsertPoint | undefined>();
  const insertionPoint = (): InsertPoint => editorInsertionPoint(exam, selectedPoint);
  const [newQuestion, setNewQuestion] = useState<Question | null>(null);
  const sessionScope = currentUser.id + ':' + editorSessionKey;
  const [draftSession, setDraftSession] = useState(sessionScope);
  if (draftSession !== sessionScope) {
    setDraftSession(sessionScope);
    setNewQuestion(null);
    setHeaderDraft(null);
    setMounted({});
    setLeftTab('content');
    setSelectedPoint(null);
    setNewQuestionPoint(undefined);
  }
  const showTab = (tab: LeftTab) => {
    setLeftTab(tab);
    setLeftOpen(true);
    setMobileTab('editor');
    if (tab === 'bank' || tab === 'import' || tab === 'generate')
      setMounted((previous) => ({ ...previous, [tab]: true }));
  };
  // A printed header line opens "Thông tin đề" with the matching field focused.
  const focusHeaderField = (lineId: string) => {
    const labelFor: Record<string, string> = {
      'header-schoolName': 'Đơn vị chủ quản',
      'header-departmentName': 'Trường / tổ chuyên môn',
      'header-title': 'Tên đề',
      'header-examCode': 'Mã đề',
      'header-academicYear': 'Năm học',
      'header-semester': 'Học kỳ',
      'header-subjectGrade': 'Môn của đề',
      'header-durationScore': 'Thời lượng',
      'header-notes': 'Ghi chú cuối đề',
    };
    const label = labelFor[lineId];
    if (!label) return;
    showTab('info');
    setTimeout(() => {
      const field = document.querySelector<HTMLElement>(`aside[aria-label="Thông tin đề"] [aria-label="${label}"]`);
      field?.focus();
    }, 50);
  };
  // A question clicked on the sheet is selected in the tree; a double click opens its detail panel.
  const pickQuestion = (id: string, edit: boolean) => {
    showTab('content');
    setTimeout(() => {
      const node = document.getElementById('editor-question-' + id);
      node?.scrollIntoView({ block: 'center' });
      node?.focus();
      if (edit) window.dispatchEvent(new CustomEvent('examcraft:edit-question', { detail: { id } }));
    }, 0);
  };
  const commentKey = `${exam.serverId ?? ''}:${currentUser.id}:${collaborationOpen}`;
  useEffect(() => {
    const serverId = exam.serverId;
    if (!serverId) return;
    let active = true;
    fetch(`/api/exams/${encodeURIComponent(serverId)}/comments`, {
      cache: 'no-store',
      headers: { 'x-examcraft-user': currentUser.id },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { comments?: { questionId: string | null; resolvedAt: string | null }[] } | null) => {
        if (!active || !result?.comments) return;
        const counts: Record<string, number> = {};
        for (const comment of result.comments)
          if (comment.questionId && !comment.resolvedAt) counts[comment.questionId] = (counts[comment.questionId] ?? 0) + 1;
        setCommentState({ key: commentKey, counts });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [exam.serverId, currentUser.id, commentKey]);
  const closeTab = (tab: LeftTab) => {
    setMounted((previous) => ({ ...previous, [tab]: false }));
    setLeftTab((current) => (current === tab ? 'content' : current));
  };
  const pressRail = (tab: LeftTab) => {
    if (leftOpen && leftTab === tab) setLeftOpen(false);
    else {
      if (tab === 'bank' || tab === 'import' || tab === 'generate')
        openSource(tab === 'generate' ? 'generate' : tab);
      else showTab(tab);
    }
  };
  const openSettings = () => showTab('info');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const sourceTarget = useRef<InsertionTarget | null>(null);
  const [modalSession, setModalSession] = useState(sessionScope);
  if (modalSession !== sessionScope) {
    setModalSession(sessionScope);
    setReviewOpen(false);
    setPendingReviewAction(null);
  }
  const openSource = (source: Exclude<QuestionSource, 'manual'>, point = insertionPoint()) => {
    if (!canEdit) return;
    const open = () => {
      sourceTarget.current = captureInsertion(exam, currentUser.id, point);
      setSelectedPoint(point);
      showTab(source === 'generate' ? 'generate' : source === 'import' ? 'import' : 'bank');
    };
    if (source === 'generate') withAi(open);
    else open();
  };
  const acceptSource = (
    questions: Question[],
    passages?: import('@/types/exam').Passage[],
    stamp?: string,
    parts?: import('@/lib/import-outline').ImportedPart[],
  ) => {
    const target = sourceTarget.current;
    if (!target || (stamp && stamp !== target.baseStamp))
      throw Error('Vị trí thêm câu đã đổi; bản xem trước được giữ.');
    let continuation = target;
    const applied = setExam((previous) => {
      const acceptedTarget = parts?.length
        ? { ...target, point: importedPartPoint(previous, target.point) }
        : target;
      const result = insertQuestionBatch(
        previous,
        currentUser.id,
        acceptedTarget,
        questions,
        passages,
        parts,
      );
      continuation = result.target;
      return result.exam;
    });
    if (applied) {
      sourceTarget.current = continuation;
      setSelectedPoint(continuation.point);
    }
    return applied;
  };

  const [assignmentState, setAssignmentState] = useState({
    id: '',
    has: false,
  });
  useEffect(() => {
    if (!exam.serverId || exam.access?.canManage === false) return;
    let live = true;
    void accountFetch(currentUser.id, '/api/assignments?examId=' + encodeURIComponent(exam.serverId))
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (live) {
          const rows = data.assignments ?? [];
          setAssignmentState({ id: exam.id, has: rows.length > 0 });
          setSubmissionCount(
            rows.reduce(
              (total: number, row: { _count?: { attempts?: number } }) => total + (row._count?.attempts ?? 0),
              0,
            ),
          );
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
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
    const command = {
      documentId: exam.id,
      baseOrder: exam.questions.map((question) => question.id),
      questionId,
      action: direction,
    };
    setExam((previous) => applyQuestionOrderCommand(previous, command));
  };

  // Nhân bản câu hỏi
  const handleDuplicateQuestion = (index: number) => {
    const questionId = exam.questions[index]?.id;
    if (!questionId) return;
    const command = {
      documentId: exam.id,
      baseOrder: exam.questions.map((question) => question.id),
      questionId,
      action: 'duplicate' as const,
      newId: `q_${crypto.randomUUID()}`,
    };
    setExam((previous) => applyQuestionOrderCommand(previous, command));
  };

  // Thêm câu hỏi thủ công
  const handleAddQuestion = (point?: InsertPoint) => {
    if (!canEdit) return;
    const recovered = listQuestionDrafts(currentUser.id, exam.id).find(
      (entry) =>
        entry.value?.questionId.startsWith('q_new_') &&
        !exam.questions.some((question) => question.id === entry.value?.questionId),
    );
    const seed: Question = recovered?.value?.baseQuestion ?? {
      id: 'q_new_' + crypto.randomUUID(),
      type: 'multiple_choice',
      difficulty: 'thong_hieu',
      content: '',
      choices: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      subject: exam.metadata.subject,
      grade: exam.metadata.grade,
      step_by_step_solution: '',
    };
    const target = point && 'parentId' in point ? point : insertionPoint();
    setNewQuestionPoint(target);
    setSelectedPoint(target);
    setNewQuestion(seed);
    showTab('content');
    requestAnimationFrame(() => addAnchor.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  // Chọn/bỏ chọn câu hỏi
  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
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
    openAi();
    setCopilotCommand(`Đổi số liệu hoặc nâng cấp câu ${index + 1}`);
  };

  // Gộp các câu đã chọn thành 1 câu tự luận
  const handleMergeSelected = () => {
    if (selectedQuestionIds.length < 2) return;
    const selectedQuestions = exam.questions.filter((q) => selectedQuestionIds.includes(q.id));
    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const mergedContent =
      `**Bài toán tổng hợp:**\n` +
      selectedQuestions.map((q, idx) => `**Ý ${alphabet[idx] || idx + 1})** ${q.content}`).join('\n\n');

    const mergedSolution = selectedQuestions
      .map(
        (q, idx) =>
          `**Hướng dẫn giải ý ${alphabet[idx] || idx + 1}:**\n${q.step_by_step_solution || 'Đang cập nhật'}`,
      )
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
    if (
      hasPendingQuestionDrafts(
        currentUser.id,
        exam.id,
        exam.questions.map((question) => question.id),
        exam,
      )
    ) {
      setManualDraftMessage(
        'Còn nháp câu chưa áp dụng. Mở Sửa để áp dụng câu, hoặc cất riêng tại Nháp câu hỏi trước khi lưu đề.',
      );
      return;
    }
    setManualDraftMessage('');
    await save();
  };

  const downloadDraft = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exam, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ExamCraft-ban-nhap.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Xuất file Word trực tiếp từ menu
  const handleExportWord = async (view: ExportView = 'exam') => {
    try {
      const blob = await exportExamToDocx(
        await prepareExportFigures(exam),
        view !== 'exam',
        view === 'matrix',
        view,
      );
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

  const composer = newQuestion && (
    <section
      ref={addAnchor}
      aria-label="Soạn câu mới"
      className="rounded-xl border p-4 space-y-3 bg-[var(--ui-surface)]"
    >
      <h3 className="font-semibold">Thêm câu hỏi</h3>
      <QuestionEditor
        key={currentUser.id + ':' + editorSessionKey + ':' + newQuestion.id}
        creating
        ownerId={currentUser.id}
        documentId={exam.id}
        sourceStamp={manualSourceStamp}
        question={exam.questions.find((q) => q.id === newQuestion.id) ?? newQuestion}
        frameworkId={exam.metadata.cognitiveFrameworkId}
        knowledgePackage={exam.metadata.knowledgePackage}
        knowledgeScope={exam.metadata.knowledgeScope}
        onSave={(submission) => {
          const add = (previous: typeof exam) =>
            appendManualQuestion(previous, submission, currentUser.id, newQuestion, newQuestionPoint);
          // Close only after the current document accepts the insertion, including its permission and stale-draft guards.
          if (setExam(add)) setNewQuestion(null);
        }}
        onApplied={() => setNewQuestion(null)}
        onCancel={() => setNewQuestion(null)}
      />
    </section>
  );
  const sourceTab = leftTab === 'bank' || leftTab === 'import' || leftTab === 'generate';
  const addPart = () => {
    showTab('content');
    setExam((previous) =>
      insertOutlineNodes(
        previous,
        {
          parentId: null,
          afterId: viewSyncedOutline(previous).outline?.at(-1)?.id ?? null,
        },
        [{ id: crypto.randomUUID(), kind: 'part', title: '', children: [] }],
      ),
    );
  };
  const addManual = (point?: InsertPoint) => {
    showTab('content');
    handleAddQuestion(point);
  };
  const tabTitle = panelTitles[leftTab];
  const exportProps = {
    canEdit,
    ready,
    hasQuestions: exam.questions.length > 0,
    onExportWord: (view: ExportView) => reviewBefore(() => void handleExportWord(view)),
    onPrint: () => reviewBefore(() => window.print()),
    onPresent: () => reviewBefore(() => setPresentationOpen(true)),
    onShuffle: () => setIsShuffleModalOpen(true),
  };
  const moreProps = {
    canEdit,
    hasServerExam: Boolean(exam.serverId),
    hasAssignments: assignmentState.id === exam.id && assignmentState.has,
    submissionCount,
    onReview: () => openReview(null),
    onTemplate: () => showTab('template'),
    onCollaborate: openCollaboration,
    onResults: () => setIsResultsModalOpen(true),
  };
  return (
    <DetailSlotProvider value={detailContext}>
    <div className="print-flow @container flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {keyReminder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cần khóa AI"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="app-dialog p-5 rounded-xl border bg-[var(--ui-surface)] max-w-sm space-y-4">
            <h2>Cần khóa AI</h2>
            <p>Thêm khóa cá nhân để dùng chức năng AI. Bạn vẫn soạn và xuất đề thủ công được.</p>
            <button
              type="button"
              className="app-button-primary p-2"
              onClick={() => {
                setKeyReminder(false);
                openKeys();
              }}
            >
              Thêm khóa AI
            </button>
            <button
              type="button"
              className="app-button-secondary p-2 ml-2"
              onClick={() => setKeyReminder(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      <Header
        leading={<AppMenu />}
        canEdit={canEdit}
        examTitle={exam.metadata.title}
        onUpdateTitle={handleUpdateTitle}
        onShare={() =>
          reviewBefore(() => {
            if (canPublish) setIsShareModalOpen(true);
            else openCollaboration();
          })
        }
        actions={
          <>
            <nav aria-label="Chuyển vùng soạn" className="lg:hidden flex gap-1">
              {(['editor', 'preview'] as const).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  aria-pressed={mobileTab === tab}
                  className={
                    (mobileTab === tab ? 'app-button-tonal' : 'app-button-secondary') +
                    ' min-h-9 min-w-9 px-2 sm:px-2.5 text-xs whitespace-nowrap inline-flex items-center justify-center'
                  }
                  aria-label={tab === 'editor' ? 'Soạn câu' : 'Xem đề'}
                  onClick={() => setMobileTab(tab)}
                >
                  {tab === 'editor' ? (
                    <PencilLine className="w-4 h-4 sm:hidden" />
                  ) : (
                    <Eye className="w-4 h-4 sm:hidden" />
                  )}
                  <span className="max-sm:hidden">{tab === 'editor' ? 'Soạn câu' : 'Xem đề'}</span>
                </button>
              ))}
            </nav>
            {mayEdit && (
              <select
                aria-label="Chế độ"
                title="Sửa: chỉnh đề. Góp ý: đọc và để lại nhận xét. Xem: chỉ đọc."
                className="teacher-field hidden md:block min-h-9 py-0 text-xs"
                value={mode}
                onChange={(event) => {
                  const next = event.target.value as 'edit' | 'comment' | 'view';
                  setMode(next);
                  if (next === 'comment' && exam.serverId) openCollaboration();
                }}
              >
                <option value="edit">Sửa</option>
                {exam.serverId && <option value="comment">Góp ý</option>}
                <option value="view">Xem</option>
              </select>
            )}
            {exam.serverId && (
              <button
                type="button"
                aria-label="Mời cùng soạn"
                title="Mời đồng nghiệp cùng soạn, góp ý và xem lịch sử"
                className="app-button-secondary hidden sm:inline-flex items-center gap-1.5 min-h-9 px-3 rounded-lg text-xs font-medium cursor-pointer"
                onClick={openCollaboration}
              >
                <Users className="w-4 h-4" />
                <span className="max-md:hidden">Mời</span>
              </button>
            )}
            <span className="hidden sm:block">
              <ExportMenu {...exportProps} />
            </span>
            <span className="sm:hidden">
              <MoreMenu {...moreProps} phone={exportProps} />
            </span>
            <span className="hidden sm:block">
              <MoreMenu {...moreProps} />
            </span>
          </>
        }
        trailing={<AccountMenu />}
      >
        <EditorSaveStatus state={saveState}>
          <div role="status" className="flex flex-wrap items-center gap-2 text-xs">
            {manualDraftMessage && <p role="alert">{manualDraftMessage}</p>}
            <span className="mr-1">
              {saveState === 'loading'
                ? 'Đang mở đề…'
                : saveState === 'saving'
                  ? 'Đang lưu…'
                  : saveState === 'dirty'
                    ? 'Có thay đổi đang chờ lưu'
                    : saveState === 'offline'
                      ? 'Mất kết nối — đang giữ bản nháp trên máy'
                      : saveState === 'saved'
                        ? saveMessage || 'Đã lưu trên máy chủ'
                        : saveMessage || 'Chưa lưu được đề'}
            </span>
            {saveState !== 'loading' && saveState !== 'saving' && (
              <button
                onClick={() => void handleSaveCurrentExam()}
                className="app-button-secondary min-h-8 px-2.5 text-xs"
              >
                Thử lưu lại
              </button>
            )}
            {folderUnavailable && ready && !exam.serverId && exam.creationFolderId && (
              <button
                onClick={() => {
                  setExam((value) => ({ ...value, creationFolderId: null }));
                  void save();
                }}
                className="app-button-secondary min-h-8 px-2.5 text-xs"
              >
                Lưu bản nháp ở ngoài thư mục
              </button>
            )}
            <button onClick={downloadDraft} className="app-button-secondary min-h-8 px-2.5 text-xs">
              Tải bản nháp
            </button>
            {saveState === 'conflict' && (
              <button onClick={() => void saveCopy()} className="app-button-secondary min-h-8 px-2.5 text-xs">
                Lưu bản nháp thành đề mới
              </button>
            )}
            {saveState === 'conflict' && ready && exam.serverId && (
              <button
                onClick={() => void openLatest()}
                className="app-button-secondary min-h-8 px-2.5 text-xs"
              >
                Mở bản máy chủ, giữ riêng nháp
              </button>
            )}
          </div>
        </EditorSaveStatus>
      </Header>

      <EditorToolbar
        canEdit={canEdit}
        copilotOpen={isCopilotOpen}
        onCopilot={() => withAi(() => { setRightTab('ai'); setIsCopilotOpen((open) => !open); })}
        onAssistant={toggleAssistant}
        onAdd={addManual}
        onBank={() => openSource('bank')}
        onImport={() => openSource('import')}
        onGenerate={() => openSource('generate')}
        onAddPart={addPart}
        onSettings={openSettings}
      />
      {!ready && <div className="p-4">{saveMessage || 'Đang tải nội dung. Vui lòng chờ trước khi sửa.'}</div>}
      <div className="print-flow flex-1 flex overflow-hidden min-h-0 relative">
        <EditorRail items={railItems} tab={leftTab} open={leftOpen} onTab={pressRail} />

        <ResizablePanel
          side="left"
          label="Bảng nội dung và tài nguyên"
          width={leftWidth}
          onWidth={setLeftWidth}
          min={320}
          max={720}
          className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} ${leftOpen ? 'lg:flex' : 'lg:hidden'}`}
        >
          <div
            className="lg:hidden shrink-0 flex gap-1 overflow-x-auto p-2 border-b"
            role="group"
            aria-label="Chọn bảng"
          >
            {railItems.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={leftTab === id}
                className={
                  (leftTab === id ? 'app-button-tonal' : 'app-button-secondary') +
                  ' min-h-9 px-3 text-xs whitespace-nowrap shrink-0'
                }
                onClick={() =>
                  id === 'bank' || id === 'import' || id === 'generate' ? openSource(id) : showTab(id)
                }
              >
                {label}
              </button>
            ))}
          </div>
          {sourceTab && (
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b text-sm">
              <h2 className="font-semibold">{tabTitle}</h2>
              <span className="text-xs text-[var(--ui-text-secondary)] truncate">
                · thêm vào {describeInsertion(exam, insertionPoint())}
              </span>
              <button
                type="button"
                aria-label={'Đóng ' + tabTitle.toLowerCase()}
                className="ml-auto p-1.5 rounded-lg hover:bg-[var(--ui-surface-variant)] cursor-pointer"
                onClick={() => closeTab(leftTab)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className={leftTab === 'info' ? 'block p-3' : 'hidden'}>
              <EditorSettings
                key={sessionScope}
                ownerId={currentUser.id}
                exam={exam}
                canEdit={canEdit}
                hasActiveKey={hasActiveKey}
                onChange={setExam}
                isOpen={infoOpen}
                onPreview={updateHeaderPreview}
                onClose={() => setLeftTab('content')}
                preview={null}
              />
            </div>
            <div className={leftTab === 'template' ? 'block p-3 space-y-6' : 'hidden'}>
              <EditorPrint exam={exam} canEdit={canEdit} onChange={setExam} />
              <EditorTemplate
                key={currentUser.id + ':' + editorSessionKey}
                ownerId={currentUser.id}
                exam={exam}
                canEdit={canEdit}
                onChange={setExam}
                open={leftOpen && leftTab === 'template'}
                onClose={() => setLeftTab('content')}
              />
            </div>
            {mounted.bank && (
              <div className={leftTab === 'bank' ? 'h-full' : 'hidden'}>
                <QuestionBankModal
                  panel
                  ownerId={currentUser.id}
                  key={`bank:${currentUser.id}`}
                  isOpen
                  onClose={() => closeTab('bank')}
                  onInsertQuestion={(q, passage) => {
                    const question = { ...q } as BankQuestion;
                    delete question.passage;
                    delete question.passageUnavailable;
                    const inserted: Question = {
                      ...question,
                      id: crypto.randomUUID(),
                    };
                    return acceptSource([inserted], passage ? [passage] : []);
                  }}
                />
              </div>
            )}
            {mounted.import && (
              <div className={leftTab === 'import' ? 'h-full' : 'hidden'}>
                <ImportModal
                  panel
                  ownerId={currentUser.id}
                  documentId={exam.id}
                  context={{
                    subject: exam.metadata.subject,
                    grade: exam.metadata.grade,
                  }}
                  isOpen
                  onClose={() => closeTab('import')}
                  allowParts
                  onImportQuestions={(questions, context) =>
                    acceptSource(questions, context.passages, undefined, context.parts)
                  }
                  apiKey=""
                />
              </div>
            )}
            {mounted.generate && (
              <div className={leftTab === 'generate' ? 'h-full' : 'hidden'}>
                <GenerateModal
                  panel
                  key={sessionScope}
                  context={exam.metadata}
                  documentStamp={generationDocumentStamp(exam)}
                  expectedUserId={currentUser.id}
                  appendQuestions
                  planningHint={
                    exam.metadata.examPlan
                      ? 'Ma trận giáo viên đang dùng (chỉ là gợi ý cho các câu thêm): ' +
                        JSON.stringify(exam.metadata.examPlan)
                      : undefined
                  }
                  isOpen
                  onClose={() => closeTab('generate')}
                  onExamGenerated={(newExam, baseStamp) =>
                    acceptSource(newExam.questions, newExam.passages, baseStamp)
                  }
                  apiKey=""
                />
              </div>
            )}
            <div className={`p-3 space-y-3 min-w-0 ${leftTab === 'content' ? 'block' : 'hidden'}`}>
              {recoveredDraft && saveState !== 'saved' && (
                <div role="status" className="border rounded p-3 text-sm">
                  Đang mở nháp trên máy của đề này.{' '}
                  <button type="button" className="underline" onClick={dismissRecoveredDraft}>
                    Tiếp tục với nháp
                  </button>
                  {exam.serverId && (
                    <button
                      type="button"
                      className="underline ml-3"
                      onClick={() =>
                        void openLatest().then((value) => {
                          if (value) dismissRecoveredDraft();
                        })
                      }
                    >
                      Mở bản máy chủ, cất riêng nháp
                    </button>
                  )}
                </div>
              )}
              <EditorPending ownerId={currentUser.id} exam={exam} onCopilot={() => openAi()} />
              <fieldset disabled={!canEdit} id="panel-exam-content" className="space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">Nội dung đề</h2>
                    {exam.questions.length > 0 && (
                      <span className="text-[var(--ui-text-secondary)]">
                        {exam.questions.length} câu ·{' '}
                        {['comment_only', 'survey'].includes(exam.metadata.assessmentMode ?? '')
                          ? 'không chấm điểm số'
                          : `${scoredQuestions.reduce((total, q) => total + (q.points ?? 0), 0)}đ`}
                      </span>
                    )}
                  </div>
                  {exam.questions.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      title={
                        selectedQuestionIds.length === exam.questions.length
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả câu hỏi'
                      }
                      className="app-button-secondary flex items-center gap-1.5 px-2.5 min-h-8 text-xs rounded-lg cursor-pointer"
                    >
                      {selectedQuestionIds.length === exam.questions.length && exam.questions.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {selectedQuestionIds.length === exam.questions.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                      </span>
                    </button>
                  )}
                </div>
                <OutlineEditor
                  key={currentUser.id + ':' + editorSessionKey}
                  exam={exam}
                  canEdit={canEdit}
                  onChange={setExam}
                  onPoint={setSelectedPoint}
                  onSource={(point, source: QuestionSource) => {
                    setSelectedPoint(point);
                    if (source === 'manual') addManual(point);
                    else openSource(source, point);
                  }}
                  composerPoint={newQuestionPoint}
                  composer={composer}
                  renderQuestion={(q, idx, number, controls) => (
                    <QuestionCard
                      displayNumber={number}
                      extraItems={controls.moveItems}
                      selectionActive={selectedQuestionIds.length > 0}
                      withAi={withAi}
                      ownerId={currentUser.id}
                      displayPoints={scoredQuestions[idx]?.points}
                      hidePassage
                      passage={exam.passages?.find((passage) => passage.id === q.passageId)}
                      numericScore={requiresNumericScore(exam.metadata.assessmentMode)}
                      cognitiveFrameworkId={exam.metadata.cognitiveFrameworkId}
                      knowledgePackage={exam.metadata.knowledgePackage}
                      knowledgeScope={exam.metadata.knowledgeScope}
                      key={`${currentUser.id}:${editorSessionKey}:${q.id}`}
                      documentId={exam.id}
                      sourceStamp={manualSourceStamp}
                      onManualSave={(submission) =>
                        setExam((previous) =>
                          applyQuestionManualSubmission(previous, submission, currentUser.id),
                        )
                      }
                      index={idx}
                      question={{
                        ...q,
                        subject: q.subject ?? exam.metadata.subject,
                        grade: q.grade ?? exam.metadata.grade,
                      }}
                      onDelete={handleDeleteQuestion}
                      apiKey=""
                      onMoveUp={() => handleMoveQuestion(idx, 'up')}
                      onMoveDown={() => handleMoveQuestion(idx, 'down')}
                      onDuplicate={() => handleDuplicateQuestion(idx)}
                      isFirst={controls.first}
                      isLast={controls.last}
                      isSelected={selectedQuestionIds.includes(q.id)}
                      onToggleSelect={handleToggleSelectQuestion}
                      onAskAiAboutQuestion={handleAskAiAboutQuestion}
                    />
                  )}
                />
                {selectedQuestionIds.length > 0 && (
                  <div
                    className={
                      'fixed bottom-16 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--ui-accent)] text-[var(--ui-on-primary)] px-4 ' +
                      'py-2.5 rounded-full shadow-lg border border-[var(--ui-border)]/30 flex items-center gap-3'
                    }
                  >
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/20">
                      Đã chọn {selectedQuestionIds.length} câu
                    </span>
                    <button
                      onClick={handleMergeSelected}
                      disabled={selectedQuestionIds.length < 2}
                      title={
                        selectedQuestionIds.length < 2
                          ? 'Chọn ít nhất 2 câu để gộp thành 1 câu tự luận'
                          : 'Gộp các câu đã chọn thành 1 câu tự luận tổng hợp có nhiều ý a, b, c...'
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg app-button-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Gộp thành 1 câu tự luận</span>
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      title="Xóa các câu hỏi đã chọn"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedQuestionIds.length})</span>
                    </button>
                    <button
                      onClick={() => setSelectedQuestionIds([])}
                      title="Hủy chọn tất cả"
                      className="p-1.5 rounded-lg hover:bg-black/20 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </fieldset>
            </div>
          </div>
        </ResizablePanel>

        <section
          aria-label="Tờ đề"
          className={`a4-preview-section min-w-0 flex-1 min-h-0 flex-col ${
            mobileTab === 'preview' ? 'flex' : 'hidden'
          } lg:flex print:!block print:!static print:!h-auto print:!w-full print:!overflow-visible`}
        >
          {previewExam !== exam && (
            <p role="status" className="no-print text-xs px-3 py-1.5 border-b bg-[var(--ui-surface)]">
              Đang xem thử thông tin chưa áp dụng.
            </p>
          )}
          <A4Preview
            exam={previewExam}
            onPrintBlock={canEdit ? () => showTab('template') : undefined}
            onHeaderLine={canEdit ? focusHeaderField : undefined}
            onQuestion={canEdit ? pickQuestion : undefined}
            issueCounts={issueCounts}
            commentCounts={commentState.key === commentKey ? commentState.counts : undefined}
            onIssues={() => openReview(null)}
            onComments={openCollaboration}
            barExtra={
              <button
                type="button"
                className="app-button-secondary inline-flex items-center gap-1.5 min-h-9 px-3 text-xs rounded-lg cursor-pointer disabled:opacity-40"
                disabled={!ready || exam.questions.length === 0}
                onClick={() => reviewBefore(() => setPresentationOpen(true))}
              >
                <Presentation className="w-4 h-4" />
                <span>Trình chiếu</span>
              </button>
            }
          />
        </section>

        {(() => {
          const tabs: { id: RightTab; label: string; open: boolean }[] = [
            { id: 'detail', label: 'Chi tiết câu', open: canEdit && editingIds.length > 0 },
            { id: 'ai', label: 'AI', open: canEdit && isCopilotOpen },
            { id: 'review', label: 'Rà soát', open: reviewOpen },
            { id: 'collab', label: 'Góp ý', open: collaborationOpen && !!exam.serverId },
          ];
          const shown = tabs.filter((tab) => tab.open);
          const active = shown.find((tab) => tab.id === rightTab) ?? shown[0];
          const closeTab = (id: RightTab) => {
            if (id === 'ai') setIsCopilotOpen(false);
            if (id === 'review') {
              setReviewOpen(false);
              setPendingReviewAction(null);
            }
            if (id === 'collab') setCollaborationOpen(false);
          };
          const show = (id: RightTab) => (active?.id === id ? 'flex' : 'hidden');
          return (
            <ResizablePanel
              side="right"
              label="Bảng bên phải"
              width={rightWidth}
              onWidth={setRightWidth}
              min={300}
              max={560}
              className={`${
                active ? 'flex' : 'hidden'
              } max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-12 max-lg:z-40`}
            >
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div role="tablist" aria-label="Bảng bên phải" className="no-print flex shrink-0 gap-1 border-b border-[var(--ui-border)]/60 p-1.5 overflow-x-auto">
                  {shown.map((tab) => (
                    <span key={tab.id} className="inline-flex shrink-0 items-center">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={active?.id === tab.id}
                        onClick={() => setRightTab(tab.id)}
                        className={`min-h-9 rounded-lg px-3 text-xs font-semibold cursor-pointer ${
                          active?.id === tab.id ? 'app-button-tonal' : 'app-button-secondary'
                        }`}
                      >
                        {tab.label}
                      </button>
                      {tab.id !== 'detail' && (
                        <button
                          type="button"
                          aria-label={`Đóng ${tab.label}`}
                          onClick={() => closeTab(tab.id)}
                          className="min-h-9 px-2 text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div
                  ref={setDetailSlot}
                  aria-label="Chi tiết câu"
                  role="region"
                  className={`${show('detail')} min-h-0 flex-1 flex-col overflow-auto p-3`}
                />
                {canEdit && (
                  <div className={`${show('ai')} min-h-0 flex-1 flex-col`}>
                    <RightCompanionRail
                      key={`${currentUser.id}:${exam.id}`}
                      ownerId={currentUser.id}
                      onSubmitCopilot={(submission) =>
                        setExam((previous) => applyCopilotSubmission(previous, submission, currentUser.id))
                      }
                      isExpanded={isCopilotOpen && active?.id === 'ai'}
                      onClose={() => setIsCopilotOpen(false)}
                      exam={exam}
                      selectedQuestionIds={selectedQuestionIds}
                      externalCommand={copilotCommand}
                    />
                  </div>
                )}
                {reviewOpen && (
                  <div className={`${show('review')} min-h-0 flex-1 flex-col overflow-auto`}>
                    <EditorReview
                      panel
                      exam={exam}
                      onClose={() => closeTab('review')}
                      onContinue={
                        pendingReviewAction
                          ? () => {
                              setReviewOpen(false);
                              pendingReviewAction?.();
                            }
                          : undefined
                      }
                      onQuestion={(id) => {
                        showTab('content');
                        setTimeout(() => {
                          const node = document.getElementById('editor-question-' + id);
                          node?.scrollIntoView({ block: 'center' });
                          node?.focus();
                        }, 0);
                      }}
                    />
                  </div>
                )}
                {collaborationOpen && exam.serverId && (
                  <div className={`${show('collab')} min-h-0 flex-1 flex-col overflow-auto p-3`}>
                    <ExamCollaboratorsPanel
                      key={`${exam.serverId}-${currentUser.id}`}
                      examId={exam.serverId}
                      expectedUserId={currentUser.id}
                      questions={exam.questions.map((q, i) => ({
                        id: q.id,
                        label: `Câu ${i + 1}: ${(q.content || '').replace(/\s+/g, ' ').slice(0, 40)}`,
                      }))}
                      onRestored={(document) => {
                        acceptServerDocument(document);
                      }}
                      beforeRestore={() => {
                        if (saveState !== 'saved') {
                          alert('Hãy lưu xong hoặc giữ bản nháp thành đề mới trước khi khôi phục lịch sử.');
                          return false;
                        }
                        return true;
                      }}
                    />
                  </div>
                )}
              </div>
            </ResizablePanel>
          );
        })()}
      </div>

      {presentationOpen && <ExamPresentation exam={exam} onClose={() => setPresentationOpen(false)} />}

      <ShuffleModal
        isOpen={isShuffleModalOpen}
        onClose={() => setIsShuffleModalOpen(false)}
        baseExam={exam}
        onSelectVariant={(variantExam) =>
          setExam((previous) => ({
            ...variantExam,
            id: previous.id,
            serverId: previous.serverId,
            version: previous.version,
            access: previous.access,
          }))
        }
      />

      <ShareModal
        key={`share:${currentUser.id}:${exam.id}`}
        ownerId={currentUser.id}
        onEnsureSaved={ensureSaved}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        exam={exam}
        onCloudSyncSuccess={() => {
          /* Server acknowledgement is tracked by the save controller. */
        }}
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
    </DetailSlotProvider>
  );
};

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = (props) => (
  <EditorSelectionProvider key={props.currentUser.id + ':' + props.examId}>
    <ExamWorkspaceContent {...props} />
  </EditorSelectionProvider>
);

export default ExamWorkspace;

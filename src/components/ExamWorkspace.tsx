'use client';

import { applyCopilotSubmission } from '@/lib/copilot-submission';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Question } from '@/types/exam';
import type { Exam } from '@/types/exam';
import { Header } from '@/components/Header';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { EditorSelectionProvider } from '@/components/editor/EditorSelection';
import { EditorToolbar, ToolMenu, type ExportView, type MenuItem, type ToolCommand } from '@/components/EditorToolbar';
import { AccountMenu, AppMenu, ExportMenu, MoreMenu } from '@/components/editor/EditorMenus';
import { EditorRail, ResizablePanel, useStoredWidth, type RailItem } from '@/components/editor/EditorPanels';
import { describeInsertion } from '@/lib/insertion-label';
import { previewHeaderDraft } from '@/lib/editor-draft-preview';
import type { HeaderSubmission } from '@/lib/header-layout';
import {
  applyQuestionManualSubmission,
  questionDraftSourceStamp,
  questionValueStamp,
  retireSavedQuestionDrafts,
} from '@/lib/question-draft';
import { accountFetch } from '@/lib/account-fetch';
import { applyQuestionOrderCommand } from '@/lib/question-commands';
import { A4Preview } from '@/components/A4Preview';
import { GenerateModal } from '@/components/GenerateModal';
import { ShuffleModal } from '@/components/ShuffleModal';
import { ImportModal } from '@/components/ImportModal';
import { QuestionBankModal } from '@/components/QuestionBankModal';
import { RightCompanionRail } from '@/components/RightCompanionRail';
import { ShareModal } from '@/components/ShareModal';
import { StudentResultsModal } from '@/components/StudentResultsModal';
import { exportExamToDocx } from '@/lib/docx-export';
import { prepareExportFigures } from '@/lib/export-figures';
import { useExamPersistence } from '@/components/useExamPersistence';
import { ExamCollaboratorsPanel } from '@/components/ExamCollaboratorsPanel';
import { normalizeQuestion } from '@/lib/exam-document';
import { dbSaveQuestionToBank } from '@/lib/db';
import type { BankQuestion } from '@/lib/question-client';
import { ExamPresentation } from '@/components/ExamPresentation';
import { EditorReview } from '@/components/editor/EditorReview';
import { reviewExam } from '@/lib/exam-review';
import { EditorSaveStatus } from '@/components/editor/EditorSaveStatus';
import { EditorTemplate } from '@/components/editor/EditorRequirements';
import { EditorPrint } from '@/components/editor/EditorPrint';
import { EditorDetail } from '@/components/editor/EditorDetail';
import { EditorOutline } from '@/components/editor/EditorOutline';
import { EditorAiPanel, type AiTab } from '@/components/editor/EditorAiPanel';
import { QuestionVerify } from '@/components/editor/QuestionVerify';
import { EditorPending } from '@/components/editor/EditorPending';
import { captureInsertion, insertQuestionBatch, type InsertionTarget } from '@/lib/outline-insertion';
import { importedPartPoint, withEditorParts } from '@/lib/editor-parts';
import {
  insertOutlineNodes,
  moveOutlineNode,
  outlineEntries,
  outlineNodes,
  removeOutlineNode,
  viewSyncedOutline,
  type InsertPoint,
} from '@/lib/exam-outline';
import { duplicateOutlineNode, nudgeOutlineNode, outlineLocation } from '@/lib/outline-editing';
import {
  EXAM_CODE,
  displayOutline,
  firstChildCode,
  insertionFor,
  neighbourCode,
  nodeOfQuestion,
  objectExists,
  parentCode,
  parseCode,
  questionOf,
  selectionChain,
} from '@/lib/canvas-objects';
import { blankQuestion, QUESTION_KINDS } from '@/lib/question-seeds';
import { freezeExamScoring } from '@/lib/snapshot-scoring';
import { generationDocumentStamp } from '@/lib/generation-plan';
import { makeChange, mergeChange, revertChange, type Change } from '@/lib/undo-history';
import {
  Database,
  FileUp,
  LayoutTemplate,
  ListTree,
  Redo2,
  SlidersHorizontal,
  Undo2,
  Users,
} from 'lucide-react';

type RightTab = 'ai' | 'review' | 'collab';
type LeftTab = 'detail' | 'template' | 'bank' | 'import' | 'outline';
type QuestionSource = 'bank' | 'import' | 'generate';
const railItems: RailItem<LeftTab>[] = [
  { id: 'detail', label: 'Chi tiết', Icon: SlidersHorizontal },
  { id: 'template', label: 'Mẫu', Icon: LayoutTemplate },
  { id: 'bank', label: 'Ngân hàng', Icon: Database },
  { id: 'import', label: 'Nhập đề', Icon: FileUp },
  { id: 'outline', label: 'Dàn ý', Icon: ListTree },
];
const panelTitles: Record<LeftTab, string> = {
  detail: 'Chi tiết',
  template: 'Mẫu',
  bank: 'Ngân hàng câu hỏi',
  import: 'Nhập đề từ Word hoặc ảnh',
  outline: 'Dàn ý',
};
const HISTORY_LIMIT = 100;

interface ExamWorkspaceProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  examId?: string;
}

/** A new question that is still exactly as inserted: leaving it removes it instead of leaving an empty question behind. */
function isPristine(question: Question) {
  const blank = (value?: string) => !value?.trim();
  return (
    blank(question.content) &&
    blank(question.step_by_step_solution) &&
    blank(question.correct_answer) &&
    !question.figures?.length &&
    !question.parts?.length &&
    !question.accepted_answers?.some((value) => !blank(value)) &&
    (question.choices ?? []).every((choice) => blank(choice.text) && !choice.figures?.length) &&
    (question.sub_questions ?? []).every((item) => blank(item.content)) &&
    (question.matchingPairs ?? []).every((pair) => blank(pair.left) && blank(pair.right)) &&
    (question.correctOrder ?? []).every((item) => blank(item))
  );
}

const ExamWorkspaceContent: React.FC<ExamWorkspaceProps> = ({ currentUser, examId }) => {
  const creationFolder = useSearchParams().get('folder');
  const {
    exam,
    editorSessionKey,
    setExam: setExamRaw,
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
  const canEdit = ready && exam.access?.canEdit !== false;
  const canPublish = ready && exam.access?.canPublish !== false;
  const manualSourceStamp = useMemo(() => questionDraftSourceStamp(exam), [exam]);
  useEffect(() => {
    if (ready && saveState === 'saved') retireSavedQuestionDrafts(currentUser.id, exam);
  }, [ready, saveState, currentUser.id, exam]);

  // ----- Undo and redo: every edit made here is a step; only objects still as the edit left them are put back.
  const localEdit = useRef(false);
  const lastExam = useRef(exam);
  const [history, setHistory] = useState<{ undo: Change[]; redo: Change[] }>({ undo: [], redo: [] });
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = useCallback((text: string) => {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 6000);
  }, []);
  const setExam = useCallback(
    (value: React.SetStateAction<Exam>) => {
      localEdit.current = true;
      const applied = setExamRaw(value);
      if (!applied) localEdit.current = false;
      return applied;
    },
    [setExamRaw],
  );
  useEffect(() => {
    const before = lastExam.current;
    lastExam.current = exam;
    if (!localEdit.current || before === exam) return;
    localEdit.current = false;
    const change = makeChange(before, exam);
    if (!change) return;
    // Typing in one field is many edits; they become one step.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory((value) => ({
      undo: [...value.undo.slice(0, -1), ...mergeChange(value.undo.at(-1), change)].slice(-HISTORY_LIMIT),
      redo: [],
    }));
  }, [exam]);
  const travel = (direction: 'undo' | 'redo') => {
    const stack = history[direction];
    const entry = stack.at(-1);
    if (!entry || !canEdit) return;
    const step: Change = direction === 'undo' ? entry : { ...entry, before: entry.after, after: entry.before };
    const result = revertChange(exam, step);
    if (result.changed) {
      localEdit.current = false;
      if (!setExamRaw(() => result.exam)) return;
    }
    setHistory((value) => ({
      undo: direction === 'undo' ? value.undo.slice(0, -1) : [...value.undo, entry],
      redo: direction === 'undo' ? [...value.redo, entry] : value.redo.slice(0, -1),
    }));
    say(
      result.skipped.length
        ? `Đã ${direction === 'undo' ? 'hoàn tác' : 'làm lại'}, bỏ qua: ${result.skipped.join('; ')}.`
        : direction === 'undo'
          ? 'Đã hoàn tác.'
          : 'Đã làm lại.',
    );
  };
  const undo = () => travel('undo');
  const redo = () => travel('redo');

  // ----- Panels
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [collabFocus, setCollabFocus] = useState<string | undefined>();
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [manualDraftMessage, setManualDraftMessage] = useState('');
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const { hasActiveKey, openKeys } = useWorkspace();
  const { copilotOpen: isCopilotOpen, setCopilotOpen: setIsCopilotOpen } = useWorkspace();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [pendingReviewAction, setPendingReviewAction] = useState<(() => void) | null>(null);
  const reviewed = reviewExam(exam);
  const issueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const issue of reviewed.issues) {
      const match = /^Câu ([0-9]+)/.exec(issue.location);
      const question = match && exam.questions[Number(match[1]) - 1];
      if (question) counts[question.id] = (counts[question.id] ?? 0) + 1;
    }
    return counts;
  }, [reviewed, exam.questions]);
  const [commentState, setCommentState] = useState<{ key: string; counts: Record<string, number> }>({
    key: '',
    counts: {},
  });
  const [copilotCommand, setCopilotCommand] = useState<string>('');
  const [aiTab, setAiTab] = useState<AiTab>('chat');
  const [rightTab, setRightTab] = useState<RightTab>('ai');
  const [leftTab, setLeftTab] = useState<LeftTab>('detail');
  const [leftOpen, setLeftOpen] = useState(true);
  const [phonePanel, setPhonePanel] = useState(false);
  // Source panels keep what was typed while another tab is shown; they reset when they are closed or finished.
  const [mounted, setMounted] = useState<{ bank?: boolean; import?: boolean; generate?: boolean }>({});
  const [leftWidth, setLeftWidth] = useStoredWidth('examcraft_editor_left', 400, 320, 720);
  const [rightWidth, setRightWidth] = useStoredWidth('examcraft_editor_right', 380, 300, 560);
  const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [headerDraft, setHeaderDraft] = useState<HeaderSubmission | null>(null);
  const updateHeaderPreview = useCallback((draft: HeaderSubmission | null) => setHeaderDraft(draft), []);
  const [structureMessage, setStructureMessage] = useState('');

  // ----- Selection: a list of codes (see canvas-objects); the last one is the one the panels talk about.
  const [picked, setPicked] = useState<string[]>([EXAM_CODE]);
  const [focusDetail, setFocusDetail] = useState(false);
  const rawCode = picked.at(-1) ?? EXAM_CODE;
  const selectedCode = objectExists(exam, rawCode) ? rawCode : EXAM_CODE;
  const pickedQuestionIds = useMemo(
    () =>
      picked
        .filter((code) => parseCode(code).kind === 'question' && objectExists(exam, code))
        .map((code) => questionOf(code)!),
    [picked, exam],
  );
  const blankIds = useRef(new Set<string>());
  const sessionScope = currentUser.id + ':' + editorSessionKey;
  const [draftSession, setDraftSession] = useState(sessionScope);
  if (draftSession !== sessionScope) {
    setDraftSession(sessionScope);
    setHeaderDraft(null);
    setMounted({});
    setLeftTab('detail');
    setPicked([EXAM_CODE]);
  }
  const sheetCode = selectedCode;

  const withAi = (action: () => void) => {
    if (!canEdit) return;
    if (!hasActiveKey) {
      setAiTab('chat');
      setRightTab('ai');
      setIsCopilotOpen(true);
    } else action();
  };
  const openReview = (after: (() => void) | null) => {
    setPendingReviewAction(after ? () => after : null);
    setRightTab('review');
    setReviewOpen(true);
  };
  const openAi = (tab: AiTab = 'chat') => {
    setAiTab(tab);
    setRightTab('ai');
    setIsCopilotOpen(true);
  };
  const openCollaboration = (questionId?: string) => {
    setCollabFocus(questionId);
    setRightTab('collab');
    setCollaborationOpen(true);
  };
  /** Only giving the exam to students waits for the review; exporting, printing and presenting never do. */
  const reviewBefore = (action: () => void) => {
    if (reviewed.issues.length) openReview(action);
    else action();
  };

  const showTab = (tab: LeftTab) => {
    setLeftTab(tab);
    setLeftOpen(true);
    if (tab === 'bank' || tab === 'import') setMounted((previous) => ({ ...previous, [tab]: true }));
  };
  const closeTab = (tab: LeftTab) => {
    setMounted((previous) => ({ ...previous, [tab]: false }));
    setLeftTab((current) => (current === tab ? 'detail' : current));
  };
  const pressRail = (tab: LeftTab) => {
    if (leftOpen && leftTab === tab) setLeftOpen(false);
    else if (tab === 'bank' || tab === 'import') openSource(tab);
    else showTab(tab);
  };
  const removeBlankIfLeft = (next: string) => {
    const leaving = questionOf(rawCode);
    if (!leaving || !blankIds.current.has(leaving) || questionOf(next) === leaving) return;
    blankIds.current.delete(leaving);
    const question = exam.questions.find((item) => item.id === leaving);
    if (question && isPristine(question) && canEdit) {
      setExam((previous) => ({ ...previous, questions: previous.questions.filter((item) => item.id !== leaving) }));
      say('Đã bỏ câu trống. Bấm Hoàn tác nếu cần lấy lại.');
    }
  };
  const select = (code: string, how: 'replace' | 'toggle' | 'range' = 'replace', focus = false) => {
    removeBlankIfLeft(code);
    setFocusDetail(focus);
    const kind = parseCode(code).kind;
    if (how === 'toggle' && kind === 'question') {
      setPicked((previous) => {
        const clean = previous.filter((item) => parseCode(item).kind === 'question');
        return clean.includes(code) ? clean.filter((item) => item !== code) || [EXAM_CODE] : [...clean, code];
      });
    } else if (how === 'range' && kind === 'question') {
      const ids = displayOutline(exam)
        .flatMap(function walk(node): string[] {
          return node.kind === 'question' ? [node.questionId!] : (node.children ?? []).flatMap(walk);
        });
      const from = ids.indexOf(questionOf(rawCode) ?? '');
      const to = ids.indexOf(questionOf(code)!);
      if (from >= 0 && to >= 0) {
        const [a, b] = from < to ? [from, to] : [to, from];
        setPicked(ids.slice(a, b + 1).map((id) => `question:${id}`));
      } else setPicked([code]);
    } else setPicked([code]);
    // The panel beside the sheet follows the selection, except while a source (bank, import) is being filled in.
    if (leftTab !== 'bank' && leftTab !== 'import') {
      setLeftTab('detail');
      setLeftOpen(true);
    }
    if (kind === 'insert' && typeof window !== 'undefined' && window.innerWidth < 1024) setPhonePanel(false);
  };
  const tick = (questionId: string) => select(`question:${questionId}`, 'toggle');

  // ----- Comments counts for the margin bubbles
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
          if (comment.questionId && !comment.resolvedAt)
            counts[comment.questionId] = (counts[comment.questionId] ?? 0) + 1;
        setCommentState({ key: commentKey, counts });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [exam.serverId, currentUser.id, commentKey]);
  const commentCounts = commentState.key === commentKey ? commentState.counts : {};

  // ----- Adding content: one menu for the toolbar, the "+" points on the sheet and the Điểm chèn form
  const sourceTarget = useRef<InsertionTarget | null>(null);
  const [sourcePoint, setSourcePoint] = useState<InsertPoint | null>(null);
  const [modalSession, setModalSession] = useState(sessionScope);
  if (modalSession !== sessionScope) {
    setModalSession(sessionScope);
    setReviewOpen(false);
    setPendingReviewAction(null);
  }
  const applyStructure = (update: (value: Exam) => Exam) => {
    if (!canEdit) return;
    try {
      setExam((previous) => update(withEditorParts(previous)));
      setStructureMessage('');
    } catch (error) {
      setStructureMessage(error instanceof Error ? error.message : 'Chưa áp dụng được. Nội dung vẫn được giữ.');
    }
  };
  const openSource = (source: QuestionSource, point: InsertPoint = insertionFor(exam, selectedCode)) => {
    if (!canEdit) return;
    const open = () => {
      sourceTarget.current = captureInsertion(exam, currentUser.id, point);
      setSourcePoint(point);
      if (source === 'generate') {
        setMounted((previous) => ({ ...previous, generate: true }));
        openAi('generate');
      } else showTab(source);
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
      const result = insertQuestionBatch(previous, currentUser.id, acceptedTarget, questions, passages, parts);
      continuation = result.target;
      return result.exam;
    });
    if (applied) {
      sourceTarget.current = continuation;
      setSourcePoint(continuation.point);
    }
    return applied;
  };
  const insertBlank = (point: InsertPoint, type: Question['type'] = 'multiple_choice') => {
    if (!canEdit) return;
    const question = blankQuestion(exam, type);
    const node = { id: 'question:' + question.id, kind: 'question' as const, questionId: question.id };
    try {
      if (!setExam((previous) => insertOutlineNodes(withEditorParts(previous), point, [node], [question]))) return;
    } catch (error) {
      setStructureMessage(error instanceof Error ? error.message : 'Chưa thêm được câu.');
      return;
    }
    blankIds.current.add(question.id);
    setPicked([`question:${question.id}`]);
    setLeftTab('detail');
    setLeftOpen(true);
    if (window.innerWidth < 1024) setPhonePanel(true);
  };
  const insertPart = (point: InsertPoint) =>
    applyStructure((previous) =>
      insertOutlineNodes(
        previous,
        { parentId: null, afterId: parentCodeAnchor(point) },
        [{ id: crypto.randomUUID(), kind: 'part', title: '', children: [] }],
      ),
    );
  /** A new part always sits at the top level: after the part that holds the insertion point. */
  const parentCodeAnchor = (point: InsertPoint): string | null => {
    const outline = displayOutline(exam);
    const holder = outline.find(
      (node) => node.id === point.parentId || outlineNodes([node]).some((item) => item.id === point.parentId),
    );
    return holder?.id ?? outline.at(-1)?.id ?? null;
  };
  const insertGroup = (point: InsertPoint, passageId?: string) => {
    const id = crypto.randomUUID();
    const material = passageId ?? crypto.randomUUID();
    applyStructure((previous) =>
      insertOutlineNodes(
        {
          ...previous,
          ...(passageId ? {} : { passages: [...(previous.passages ?? []), { id: material, title: '', content: '' }] }),
        },
        point,
        [{ id, kind: 'group', title: '', passageId: material, children: [] }],
      ),
    );
    setPicked([`group:${id}`]);
  };
  const pageBreakAt = (point: InsertPoint) => {
    // The break belongs to the block after the point: set on the part or group that follows it, else on a new part.
    const outline = displayOutline(exam);
    const list = point.parentId ? outlineNodes(outline).find((node) => node.id === point.parentId)?.children : outline;
    const index = point.afterId ? (list?.findIndex((node) => node.id === point.afterId) ?? -1) + 1 : 0;
    const next = list?.[index];
    if (next && next.kind !== 'question')
      applyStructure((previous) =>
        previous.outline
          ? { ...previous, outline: structuredClone(previous.outline).map(function mark(node): typeof node {
              return node.id === next.id ? { ...node, startOnNewPage: true } : { ...node, ...(node.children ? { children: node.children.map(mark) } : {}) };
            }) }
          : previous,
      );
    else say('Đặt "Bắt đầu ở trang mới" ở phần hoặc ngữ liệu đứng sau chỗ này.');
  };
  const reusablePassages = (exam.passages ?? []).slice(0, 5);
  const editQuestion = (id: string, change: (question: Question) => Question) => {
    const current = exam.questions.find((item) => item.id === id);
    if (!current || current.locked || !canEdit) return;
    const display: Question = {
      ...current,
      subject: current.subject ?? exam.metadata.subject,
      grade: current.grade ?? exam.metadata.grade,
    };
    const value: Question = {
      ...change(display),
      status: 'draft',
      verifiedBy: 'none',
      version: (current.version ?? 1) + 1,
    };
    try {
      normalizeQuestion(value);
    } catch {
      return;
    }
    setExam((previous) =>
      applyQuestionManualSubmission(
        previous,
        {
          ownerId: currentUser.id,
          documentId: exam.id,
          questionId: id,
          baseStamp: questionValueStamp(display),
          baseSourceStamp: manualSourceStamp,
          token: crypto.randomUUID(),
          value,
        },
        currentUser.id,
      ),
    );
  };
  const addRow = (question: Question) => {
    const next = (keys: string[], pool: string) => pool.split('').find((key) => !keys.includes(key));
    if (question.type === 'multiple_choice') {
      const key = next((question.choices ?? []).map((choice) => choice.key), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
      if (key) editQuestion(question.id, (value) => ({ ...value, choices: [...(value.choices ?? []), { key, text: '' }] }));
      if (key) setPicked([`choice:${question.id}:${key}`]);
    } else if (question.type === 'true_false_group') {
      const key = next((question.sub_questions ?? []).map((item) => item.key), 'abcdefghijklmnopqrstuvwxyz');
      if (key) editQuestion(question.id, (value) => ({ ...value, sub_questions: [...(value.sub_questions ?? []), { key, content: '' }] }));
      if (key) setPicked([`statement:${question.id}:${key}`]);
    } else if (question.type === 'matching') {
      const id = crypto.randomUUID();
      editQuestion(question.id, (value) => ({ ...value, matchingPairs: [...(value.matchingPairs ?? []), { id, left: '', right: '' }] }));
    } else if (question.type === 'ordering') {
      editQuestion(question.id, (value) => ({ ...value, correctOrder: [...(value.correctOrder ?? []), ''] }));
    } else if (question.type === 'essay' || question.type === 'short_answer') {
      const id = crypto.randomUUID();
      editQuestion(question.id, (value) => ({ ...value, parts: [...(value.parts ?? []), { id, content: '' }] }));
      setPicked([`item:${question.id}:${id}`]);
    }
  };
  const addItemsFor = (code: string): MenuItem[] => {
    if (!canEdit) return [];
    const object = parseCode(code);
    const point = insertionFor(exam, code);
    const items: MenuItem[] = QUESTION_KINDS.map((kind) => ({
      label: kind.label,
      onClick: () => insertBlank(point, kind.type),
    }));
    const inQuestion = ['question', 'choice', 'statement', 'item', 'pair', 'order', 'figure'].includes(object.kind);
    const question = inQuestion ? exam.questions.find((item) => item.id === questionOf(code)) : undefined;
    const rowLabel: Partial<Record<Question['type'], string>> = {
      multiple_choice: 'Phương án mới',
      true_false_group: 'Mệnh đề mới',
      essay: 'Ý mới',
      short_answer: 'Ý mới',
      matching: 'Cặp ghép mới',
      ordering: 'Mục mới',
    };
    const inGroup = object.kind !== 'part' && nodeOfQuestion(exam, questionOf(code) ?? '')?.parent?.kind === 'group';
    return [
      ...(question && rowLabel[question.type]
        ? [{ label: rowLabel[question.type]!, disabled: !!question.locked, onClick: () => addRow(question) }]
        : []),
      ...items,
      ...(inGroup && object.kind === 'group' ? [] : [{ label: 'Ngữ liệu', onClick: () => insertGroup(point) }]),
      ...reusablePassages.map((passage, index) => ({
        label: `Dùng lại ngữ liệu: ${passage.title?.trim() || `Nội dung ${index + 1}`}`.slice(0, 48),
        onClick: () => insertGroup(point, passage.id),
      })),
      { label: 'Phần mới', onClick: () => insertPart(point) },
      { label: 'Ngắt trang', onClick: () => pageBreakAt(point) },
      { label: 'Từ ngân hàng', onClick: () => openSource('bank', point) },
      { label: 'Nhập Word/Ảnh', onClick: () => openSource('import', point) },
      { label: 'Sinh bằng AI', onClick: () => openSource('generate', point) },
    ];
  };

  // ----- Assignments, title, exports
  const [assignmentState, setAssignmentState] = useState({ id: '', has: false });
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
  const handleUpdateTitle = (newTitle: string) => {
    setExam((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, title: newTitle },
      updatedAt: new Date().toISOString(),
    }));
  };
  const downloadDraft = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exam, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ExamCraft-ban-nhap.json';
    link.click();
    URL.revokeObjectURL(url);
  };
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
  const handleSaveCurrentExam = async () => {
    setManualDraftMessage('');
    await save();
  };

  // ----- Commands of the selection
  const removeQuestions = (ids: string[]) => {
    const locked = exam.questions.filter((question) => ids.includes(question.id) && question.locked);
    if (locked.length) {
      say('Có câu đang khóa. Mở khóa trước khi xóa.');
      return;
    }
    const message =
      ids.length === 1 ? 'Xóa câu đang chọn khỏi đề?' : `Bạn có chắc chắn muốn xóa ${ids.length} câu hỏi đã chọn?`;
    if (!window.confirm(message)) return;
    setExam((previous) => ({ ...previous, questions: previous.questions.filter((question) => !ids.includes(question.id)) }));
    setPicked([EXAM_CODE]);
  };
  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const command = {
      documentId: exam.id,
      baseOrder: exam.questions.map((question) => question.id),
      questionId: id,
      action: direction,
    };
    setExam((previous) => applyQuestionOrderCommand(previous, command));
  };
  const duplicateQuestion = (id: string) => {
    const newId = `q_${crypto.randomUUID()}`;
    const command = {
      documentId: exam.id,
      baseOrder: exam.questions.map((question) => question.id),
      questionId: id,
      action: 'duplicate' as const,
      newId,
    };
    if (setExam((previous) => applyQuestionOrderCommand(previous, command))) setPicked([`question:${newId}`]);
  };
  const toggleLock = (ids: string[]) => {
    const lock = !ids.every((id) => exam.questions.find((question) => question.id === id)?.locked);
    setExam((previous) => ({
      ...previous,
      questions: previous.questions.map((question) => {
        if (!ids.includes(question.id)) return question;
        const next = { ...question };
        if (lock) next.locked = true;
        else delete next.locked;
        return next;
      }),
    }));
  };
  const labelOfNode = (id: string) => {
    const entry = outlineEntries(viewSyncedOutline(exam)).find((item) => item.node.id === id);
    const title = entry?.node.title?.trim();
    return entry?.node.kind === 'part'
      ? ['Phần', entry.label, title].filter(Boolean).join(' ')
      : `Ngữ liệu ${title ?? ''}`.trim();
  };
  const moveInto = (questionIds: string[], parentId: string) => {
    applyStructure((previous) => {
      let result = previous;
      for (const id of questionIds) {
        const node = outlineNodes(result.outline ?? []).find((item) => item.questionId === id);
        const target = outlineNodes(result.outline ?? []).find((item) => item.id === parentId);
        if (node && target) result = moveOutlineNode(result, node.id, { parentId, afterId: target.children?.at(-1)?.id ?? null });
      }
      return result;
    });
  };
  const removeNode = (id: string, keep: boolean) => {
    const target = displayOutline(exam).length ? outlineNodes(displayOutline(exam)).find((node) => node.id === id) : undefined;
    const members = outlineNodes(target ? [target] : []).filter((node) => node.kind === 'question');
    if (!keep && members.some((node) => exam.questions.find((q) => q.id === node.questionId)?.locked)) {
      say('Có câu đang khóa trong mục này. Mở khóa trước khi xóa.');
      return;
    }
    if (!window.confirm(keep ? 'Bỏ mục này nhưng giữ các câu bên trong?' : `Xóa mục này và ${members.length} câu bên trong?`))
      return;
    applyStructure((previous) => {
      const frozen = new Map(freezeExamScoring(previous).questions.map((q) => [q.id, q.points]));
      const affected = new Set(members.map((node) => node.questionId));
      const prepared = keep
        ? {
            ...previous,
            questions: previous.questions.map((q) =>
              affected.has(q.id) && q.points === undefined && frozen.get(q.id) !== undefined
                ? { ...q, points: frozen.get(q.id) }
                : q,
            ),
          }
        : previous;
      return withEditorParts(removeOutlineNode(prepared, id, keep), id);
    });
    setPicked([EXAM_CODE]);
  };
  const mergeSelected = () => {
    if (pickedQuestionIds.length < 2) return;
    const chosen = exam.questions.filter((q) => pickedQuestionIds.includes(q.id));
    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const merged: Question = {
      id: `q_merged_${Date.now()}`,
      type: 'essay',
      difficulty: 'van_dung',
      content:
        `**Bài toán tổng hợp:**\n` +
        chosen.map((q, idx) => `**Ý ${alphabet[idx] || idx + 1})** ${q.content}`).join('\n\n'),
      step_by_step_solution: chosen
        .map((q, idx) => `**Hướng dẫn giải ý ${alphabet[idx] || idx + 1}:**\n${q.step_by_step_solution || 'Đang cập nhật'}`)
        .join('\n\n'),
      tags: ['Cau_hoi_tong_hop', 'Tu_luan'],
    };
    const firstIndex = exam.questions.findIndex((q) => q.id === pickedQuestionIds[0]);
    const rest = exam.questions.filter((q) => !pickedQuestionIds.includes(q.id));
    rest.splice(firstIndex, 0, merged);
    setExam((prev) => ({ ...prev, questions: rest, updatedAt: new Date().toISOString() }));
    setPicked([`question:${merged.id}`]);
  };
  const saveToBank = async (question: Question) => {
    try {
      await dbSaveQuestionToBank(
        question,
        currentUser.id,
        exam.passages?.find((passage) => passage.id === question.passageId),
      );
      say('Đã lưu bản sao riêng vào ngân hàng.');
    } catch (error) {
      say(error instanceof Error ? error.message : 'Chưa lưu được câu hỏi vào ngân hàng.');
    }
  };
  const commandsFor = (): ToolCommand[] => {
    if (!canEdit) return [];
    const object = parseCode(selectedCode);
    const ask = (id?: string): ToolCommand => ({
      label: 'Góp ý',
      title: 'Xem và gửi góp ý',
      disabled: !exam.serverId,
      onClick: () => openCollaboration(id),
    });
    if (pickedQuestionIds.length > 1)
      return [
        {
          label: `${pickedQuestionIds.length} câu`,
          disabled: true,
          onClick: () => {},
        },
        { label: 'Gộp thành 1 câu tự luận', onClick: mergeSelected },
        { label: 'Khóa / mở khóa', onClick: () => toggleLock(pickedQuestionIds) },
        ...displayOutline(exam)
          .filter((node) => node.kind === 'part')
          .map((part) => ({
            label: `Chuyển sang ${labelOfNode(part.id)}`,
            onClick: () => moveInto(pickedQuestionIds, part.id),
          })),
        { label: `Xóa (${pickedQuestionIds.length})`, onClick: () => removeQuestions(pickedQuestionIds) },
      ];
    switch (object.kind) {
      case 'exam':
        return [ask()];
      case 'part':
      case 'group': {
        const location = outlineLocation(displayOutline(exam), object.id);
        return [
          { label: 'Lên', disabled: !location || location.index === 0, onClick: () => applyStructure((p) => nudgeOutlineNode(p, object.id, 'up')) },
          { label: 'Xuống', disabled: !location || location.index === location.siblings.length - 1, onClick: () => applyStructure((p) => nudgeOutlineNode(p, object.id, 'down')) },
          { label: 'Nhân bản', onClick: () => applyStructure((p) => duplicateOutlineNode(p, object.id, () => crypto.randomUUID())) },
          ask(),
          { label: object.kind === 'part' ? 'Bỏ phần, giữ câu' : 'Bỏ nhóm, giữ câu', onClick: () => removeNode(object.id, true) },
          { label: object.kind === 'part' ? 'Xóa phần và câu' : 'Xóa nhóm và câu', onClick: () => removeNode(object.id, false) },
        ];
      }
      case 'question': {
        const question = exam.questions.find((item) => item.id === object.id);
        if (!question) return [];
        const node = nodeOfQuestion(exam, question.id);
        const locked = !!question.locked;
        return [
          { label: 'Lên', disabled: locked || !node || node.index === 0, onClick: () => moveQuestion(question.id, 'up') },
          { label: 'Xuống', disabled: locked || !node || node.index === node.siblings.length - 1, onClick: () => moveQuestion(question.id, 'down') },
          { label: 'Nhân bản', onClick: () => duplicateQuestion(question.id) },
          { label: locked ? 'Mở khóa' : 'Khóa', onClick: () => toggleLock([question.id]) },
          ask(question.id),
          { label: 'Hỏi AI về câu này', onClick: () => withAi(() => { setCopilotCommand(`Đổi số liệu hoặc nâng cấp câu ${(exam.questions.indexOf(question)) + 1}`); openAi('chat'); }) },
          ...displayOutline(exam)
            .filter((part) => part.kind === 'part' && part.id !== node?.parent?.id)
            .map((part) => ({
              label: `Chuyển sang ${labelOfNode(part.id)}`,
              disabled: locked,
              onClick: () => moveInto([question.id], part.id),
            })),
          ...outlineNodes(displayOutline(exam))
            .filter((item) => item.kind === 'group' && item.id !== node?.parent?.id)
            .map((group) => {
              const material = exam.passages?.find((item) => item.id === group.passageId);
              const name = material?.title || group.title || material?.content.slice(0, 32) || 'nội dung chung';
              return { label: `Đưa vào ${name}`, disabled: locked, onClick: () => moveInto([question.id], group.id) };
            }),
          { label: 'Lưu bản sao vào ngân hàng', onClick: () => void saveToBank(question) },
          { label: 'Xóa câu', disabled: locked, onClick: () => removeQuestions([question.id]) },
        ];
      }
      case 'choice': {
        const question = exam.questions.find((item) => item.id === object.question);
        if (!question) return [];
        const choice = question.choices?.find((item) => item.key === object.key);
        return [
          { label: 'Đặt là đáp án đúng', disabled: !!question.locked || question.correct_answer === object.key, onClick: () => editQuestion(question.id, (value) => ({ ...value, correct_answer: object.key })) },
          { label: choice?.pinned ? 'Bỏ ghim vị trí' : 'Ghim vị trí', disabled: !!question.locked, onClick: () => editQuestion(question.id, (value) => ({ ...value, choices: value.choices?.map((item) => item.key === object.key ? { ...item, pinned: !item.pinned } : item) })) },
          { label: 'Xóa phương án', disabled: !!question.locked, onClick: () => { editQuestion(question.id, (value) => ({ ...value, choices: value.choices?.filter((item) => item.key !== object.key), correct_answer: value.correct_answer === object.key ? undefined : value.correct_answer })); setPicked([`question:${question.id}`]); } },
        ];
      }
      case 'statement': {
        const question = exam.questions.find((item) => item.id === object.question);
        if (!question) return [];
        const setTruth = (isCorrect: boolean) => editQuestion(question.id, (value) => ({ ...value, sub_questions: value.sub_questions?.map((item) => item.key === object.key ? { ...item, isCorrect } : item) }));
        return [
          { label: 'Đúng', disabled: !!question.locked, onClick: () => setTruth(true) },
          { label: 'Sai', disabled: !!question.locked, onClick: () => setTruth(false) },
          { label: 'Xóa mệnh đề', disabled: !!question.locked, onClick: () => { editQuestion(question.id, (value) => ({ ...value, sub_questions: value.sub_questions?.filter((item) => item.key !== object.key) })); setPicked([`question:${question.id}`]); } },
        ];
      }
      case 'item': {
        const question = exam.questions.find((item) => item.id === object.question);
        if (!question) return [];
        return [{ label: 'Xóa ý', disabled: !!question.locked, onClick: () => { editQuestion(question.id, (value) => ({ ...value, parts: value.parts?.filter((part) => part.id !== object.key) })); setPicked([`question:${question.id}`]); } }];
      }
      case 'figure': {
        const question = exam.questions.find((item) => item.id === object.question);
        if (!question) return [];
        return [{ label: 'Xóa hình', disabled: !!question.locked, onClick: () => { editQuestion(question.id, (value) => ({ ...value, figures: value.figures?.filter((figure) => figure.id !== object.id) })); setPicked([`question:${question.id}`]); } }];
      }
      default:
        return [];
    }
  };

  // ----- Keyboard on the sheet
  const onSheetKey = (event: React.KeyboardEvent) => {
    const area = event.currentTarget.querySelector('[aria-label="Vùng trang"]');
    if (event.target !== area) return;
    const code = selectedCode;
    const go = (next?: string) => {
      if (next) {
        event.preventDefault();
        select(next);
      }
    };
    const key = event.key;
    if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'y') {
      event.preventDefault();
      redo();
    } else if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'd') {
      event.preventDefault();
      const object = parseCode(code);
      if (object.kind === 'question') duplicateQuestion(object.id);
      else if (object.kind === 'part' || object.kind === 'group') applyStructure((p) => duplicateOutlineNode(p, object.id, () => crypto.randomUUID()));
    } else if (event.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
      event.preventDefault();
      const object = parseCode(code);
      const direction = key === 'ArrowUp' ? 'up' : 'down';
      if (object.kind === 'question') moveQuestion(object.id, direction);
      else if (object.kind === 'part' || object.kind === 'group') applyStructure((p) => nudgeOutlineNode(p, object.id, direction));
    } else if (key === 'ArrowDown') go(neighbourCode(exam, code, 1));
    else if (key === 'ArrowUp') go(neighbourCode(exam, code, -1));
    else if (key === 'ArrowRight') go(firstChildCode(exam, code));
    else if (key === 'ArrowLeft' || key === 'Escape') go(code === EXAM_CODE ? undefined : parentCode(exam, code));
    else if (key === 'Enter') {
      event.preventDefault();
      document.querySelector<HTMLElement>('[aria-label="Bảng nội dung và tài nguyên"] [data-format-field], [aria-label="Bảng nội dung và tài nguyên"] input, [aria-label="Bảng nội dung và tài nguyên"] textarea')?.focus();
    } else if (key === 'Delete' || key === 'Backspace') {
      const object = parseCode(code);
      if (object.kind === 'question') removeQuestions([object.id]);
      else if (object.kind === 'part' || object.kind === 'group') removeNode(object.id, false);
    }
  };

  // ----- Layout
  const chain = selectionChain(exam, selectedCode);
  const examDetail = selectedCode === EXAM_CODE || selectedCode.startsWith('print:header');
  const detailInfoOpen = leftOpen && leftTab === 'detail' && examDetail;
  const detailProps = {
    exam,
    canEdit,
    ownerId: currentUser.id,
    sessionScope,
    hasActiveKey,
    sourceStamp: manualSourceStamp,
    onChange: setExam,
    onStructure: applyStructure,
    onPreview: updateHeaderPreview,
    addItems: addItemsFor,
    focus: focusDetail,
    onManualSave: (submission: Parameters<typeof applyQuestionManualSubmission>[1]) =>
      setExam((previous) => applyQuestionManualSubmission(previous, submission, currentUser.id)),
  };
  const previewExam = detailInfoOpen && headerDraft ? previewHeaderDraft(exam, headerDraft) : exam;
  const sourceTab = leftTab === 'bank' || leftTab === 'import';
  const exportProps = {
    canEdit,
    ready,
    hasQuestions: exam.questions.length > 0,
    reviewCount: reviewed.issues.length,
    onReview: () => openReview(null),
    onExportWord: (view: ExportView) => void handleExportWord(view),
    onPrint: () => window.print(),
    onPresent: () => setPresentationOpen(true),
    onShuffle: () => setIsShuffleModalOpen(true),
  };
  const aiTarget =
    pickedQuestionIds.length > 1
      ? `${pickedQuestionIds.length} câu`
      : questionOf(selectedCode)
        ? (chain.find((step) => step.code.startsWith('question:'))?.label ?? 'Câu')
        : selectedCode === EXAM_CODE
          ? 'Toàn đề'
          : (chain.at(-1)?.label ?? 'Toàn đề');
  const single = pickedQuestionIds.length === 1 ? exam.questions.find((q) => q.id === pickedQuestionIds[0]) : undefined;
  const aiQuestion = single ?? (questionOf(selectedCode) ? exam.questions.find((q) => q.id === questionOf(selectedCode)) : undefined);

  const rightTabs: { id: RightTab; label: string; open: boolean }[] = [
    { id: 'ai', label: 'AI', open: canEdit && isCopilotOpen },
    { id: 'review', label: 'Rà soát', open: reviewOpen },
    { id: 'collab', label: 'Góp ý', open: collaborationOpen && !!exam.serverId },
  ];
  const shownRight = rightTabs.filter((tab) => tab.open);
  const activeRight = shownRight.find((tab) => tab.id === rightTab) ?? shownRight[0];
  const closeRight = (id: RightTab) => {
    if (id === 'ai') setIsCopilotOpen(false);
    if (id === 'review') {
      setReviewOpen(false);
      setPendingReviewAction(null);
    }
    if (id === 'collab') setCollaborationOpen(false);
  };
  const showRight = (id: RightTab) => (activeRight?.id === id ? 'flex' : 'hidden');

  return (
    <div className="print-flow @container flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Header
        leading={
          <>
            <AppMenu />
            {canEdit && (
              <span className="hidden sm:flex items-center gap-0.5" role="group" aria-label="Hoàn tác">
                <button
                  type="button"
                  aria-label="Hoàn tác"
                  title="Hoàn tác (Ctrl+Z)"
                  disabled={!history.undo.length}
                  onClick={undo}
                  className="app-button-secondary min-h-9 min-w-9 rounded-lg inline-flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Làm lại"
                  title="Làm lại (Ctrl+Shift+Z)"
                  disabled={!history.redo.length}
                  onClick={redo}
                  className="app-button-secondary min-h-9 min-w-9 rounded-lg inline-flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </span>
            )}
          </>
        }
        canEdit={canEdit}
        examTitle={exam.metadata.title}
        onUpdateTitle={handleUpdateTitle}
        onShare={() =>
          reviewBefore(() => {
            if (canPublish) setIsShareModalOpen(true);
            else openCollaboration();
          })
        }
        shareMenu={
          assignmentState.id === exam.id && assignmentState.has ? (
            <ToolMenu
              label="Kết quả bài đã giao"
              compact
              Icon={Users}
              items={[{ label: `Kết quả (${submissionCount})`, onClick: () => setIsResultsModalOpen(true) }]}
            />
          ) : undefined
        }
        actions={
          <>
            {reviewed.issues.length > 0 && (
              <button
                type="button"
                aria-label="Rà soát"
                onClick={() => openReview(null)}
                className="app-button-secondary hidden sm:inline-flex items-center min-h-9 px-3 rounded-lg text-xs font-medium cursor-pointer"
              >
                Rà soát · {reviewed.issues.length}
              </button>
            )}
            {exam.serverId && (
              <button
                type="button"
                aria-label="Mời cùng soạn"
                title="Mời đồng nghiệp cùng soạn, góp ý và xem lịch sử"
                className="app-button-secondary hidden sm:inline-flex items-center gap-1.5 min-h-9 px-3 rounded-lg text-xs font-medium cursor-pointer"
                onClick={() => openCollaboration()}
              >
                <Users className="w-4 h-4" />
                <span className="max-md:hidden">Mời</span>
              </button>
            )}
            <span className="hidden sm:block">
              <ExportMenu {...exportProps} />
            </span>
            <span className="sm:hidden">
              <MoreMenu
                canEdit={canEdit}
                hasServerExam={Boolean(exam.serverId)}
                hasAssignments={assignmentState.id === exam.id && assignmentState.has}
                submissionCount={submissionCount}
                onReview={() => openReview(null)}
                onCollaborate={() => openCollaboration()}
                onResults={() => setIsResultsModalOpen(true)}
                phone={exportProps}
                canUndo={history.undo.length > 0}
                canRedo={history.redo.length > 0}
                onUndo={undo}
                onRedo={redo}
              />
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
              <button onClick={() => void openLatest()} className="app-button-secondary min-h-8 px-2.5 text-xs">
                Mở bản máy chủ, giữ riêng nháp
              </button>
            )}
          </div>
        </EditorSaveStatus>
      </Header>

      <EditorToolbar
        canEdit={canEdit}
        addItems={addItemsFor(selectedCode)}
        aiOpen={isCopilotOpen}
        onAi={() => withAi(() => (isCopilotOpen && rightTab === 'ai' ? setIsCopilotOpen(false) : openAi('chat')))}
        steps={chain}
        onStep={(code) => select(code)}
        commands={commandsFor()}
        onPanel={() => setPhonePanel((open) => !open)}
      />
      {(notice || structureMessage) && (
        <p role="status" className="no-print shrink-0 border-b px-3 py-1.5 text-xs bg-[var(--ui-surface)]">
          {structureMessage || notice}
        </p>
      )}
      {!ready && <div className="p-4">{saveMessage || 'Đang tải nội dung. Vui lòng chờ trước khi sửa.'}</div>}
      <div className="print-flow flex-1 flex overflow-hidden min-h-0 relative" onKeyDown={onSheetKey}>
        <EditorRail items={railItems} tab={leftTab} open={leftOpen} onTab={pressRail} />

        <ResizablePanel
          side="left"
          label="Bảng nội dung và tài nguyên"
          width={leftWidth}
          onWidth={setLeftWidth}
          min={320}
          max={720}
          className={`${leftOpen ? 'lg:flex' : 'lg:hidden'} ${
            phonePanel ? 'max-lg:flex max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-12 max-lg:z-40' : 'max-lg:hidden'
          }`}
        >
          <div className="lg:hidden shrink-0 flex gap-1 overflow-x-auto p-2 border-b" role="group" aria-label="Chọn bảng">
            {railItems.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={leftTab === id}
                className={(leftTab === id ? 'app-button-tonal' : 'app-button-secondary') + ' min-h-9 px-3 text-xs whitespace-nowrap shrink-0'}
                onClick={() => (id === 'bank' || id === 'import' ? openSource(id) : showTab(id))}
              >
                {label}
              </button>
            ))}
            <button type="button" className="app-button-secondary min-h-9 px-3 text-xs ml-auto shrink-0" onClick={() => setPhonePanel(false)}>
              Đóng
            </button>
          </div>
          {sourceTab && (
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b text-sm">
              <h2 className="font-semibold">{panelTitles[leftTab]}</h2>
              <span className="text-xs text-[var(--ui-text-secondary)] truncate">
                · thêm vào {describeInsertion(exam, sourcePoint ?? insertionFor(exam, selectedCode))}
              </span>
              <button
                type="button"
                aria-label={'Đóng ' + panelTitles[leftTab].toLowerCase()}
                className="ml-auto p-1.5 rounded-lg hover:bg-[var(--ui-surface-variant)] cursor-pointer"
                onClick={() => closeTab(leftTab)}
              >
                ×
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className={leftTab === 'detail' ? 'block p-3 space-y-3 min-w-0' : 'hidden'} data-detail-panel>
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
              <EditorPending ownerId={currentUser.id} exam={exam} onCopilot={() => openAi('chat')} />
              {pickedQuestionIds.length > 1 ? (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold">{pickedQuestionIds.length} câu đã chọn</h2>
                  <p className="text-xs text-[var(--ui-text-secondary)]">
                    Dùng hàng công cụ để gộp, khóa, chuyển phần hoặc xóa các câu này.
                  </p>
                </div>
              ) : null}
              {/* The exam details stay mounted: what was typed in "Thông tin đề" survives a look at another object. */}
              <div className={pickedQuestionIds.length <= 1 && examDetail ? 'block' : 'hidden'}>
                <EditorDetail {...detailProps} code={EXAM_CODE} />
              </div>
              {pickedQuestionIds.length <= 1 && !examDetail && <EditorDetail {...detailProps} code={selectedCode} />}
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
                onClose={() => setLeftTab('detail')}
              />
            </div>
            <div className={leftTab === 'outline' ? 'block p-3' : 'hidden'}>
              <EditorOutline
                exam={exam}
                selectedCode={selectedCode}
                ticked={pickedQuestionIds}
                canEdit={canEdit}
                issueCounts={issueCounts}
                commentCounts={commentCounts}
                onSelect={(code) => select(code)}
                onTick={tick}
                onMove={(nodeId, point) => applyStructure((previous) => moveOutlineNode(previous, nodeId, point))}
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
                    const inserted: Question = { ...question, id: crypto.randomUUID() };
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
                  context={{ subject: exam.metadata.subject, grade: exam.metadata.grade }}
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
          </div>
        </ResizablePanel>

        <section
          aria-label="Tờ đề"
          className="a4-preview-section min-w-0 flex-1 min-h-0 flex flex-col print:!block print:!static print:!h-auto print:!w-full print:!overflow-visible"
        >
          {previewExam !== exam && (
            <p role="status" className="no-print text-xs px-3 py-1.5 border-b bg-[var(--ui-surface)]">
              Đang xem thử thông tin chưa áp dụng.
            </p>
          )}
          <A4Preview
            exam={previewExam}
            selectedCode={canEdit ? sheetCode : undefined}
            onSelectCode={(code, how) => select(code, how ?? 'replace', true)}
            insertItems={canEdit ? addItemsFor : undefined}
            issueCounts={issueCounts}
            commentCounts={commentCounts}
            onIssues={(id) => {
              select(`question:${id}`);
              openReview(null);
            }}
            onComments={(id) => {
              select(`question:${id}`);
              openCollaboration(id);
            }}
          />
        </section>

        <ResizablePanel
          side="right"
          label="Bảng bên phải"
          width={rightWidth}
          onWidth={setRightWidth}
          min={300}
          max={560}
          className={`${activeRight ? 'flex' : 'hidden'} max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-12 max-lg:z-40`}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div role="tablist" aria-label="Bảng bên phải" className="no-print flex shrink-0 gap-1 border-b border-[var(--ui-border)]/60 p-1.5 overflow-x-auto">
              {shownRight.map((tab) => (
                <span key={tab.id} className="inline-flex shrink-0 items-center">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeRight?.id === tab.id}
                    onClick={() => setRightTab(tab.id)}
                    className={`min-h-9 rounded-lg px-3 text-xs font-semibold cursor-pointer ${
                      activeRight?.id === tab.id ? 'app-button-tonal' : 'app-button-secondary'
                    }`}
                  >
                    {tab.label}
                  </button>
                  <button
                    type="button"
                    aria-label={`Đóng ${tab.label}`}
                    onClick={() => closeRight(tab.id)}
                    className="min-h-9 px-2 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {canEdit && (
              <div className={`${showRight('ai')} min-h-0 flex-1 flex-col`}>
                <EditorAiPanel
                  tab={aiTab}
                  onTab={setAiTab}
                  target={aiTarget}
                  hasKey={hasActiveKey}
                  onKeys={openKeys}
                  chat={
                    <RightCompanionRail
                      key={`${currentUser.id}:${exam.id}`}
                      ownerId={currentUser.id}
                      onSubmitCopilot={(submission) =>
                        setExam((previous) => applyCopilotSubmission(previous, submission, currentUser.id))
                      }
                      isExpanded={isCopilotOpen && activeRight?.id === 'ai' && aiTab === 'chat'}
                      onClose={() => setIsCopilotOpen(false)}
                      exam={exam}
                      selectedQuestionIds={pickedQuestionIds.length ? pickedQuestionIds : aiQuestion ? [aiQuestion.id] : []}
                      externalCommand={copilotCommand}
                    />
                  }
                  generate={
                    mounted.generate ? (
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
                        onClose={() => {
                          setMounted((previous) => ({ ...previous, generate: false }));
                          setAiTab('chat');
                        }}
                        onExamGenerated={(newExam, baseStamp) => acceptSource(newExam.questions, newExam.passages, baseStamp)}
                        apiKey=""
                      />
                    ) : (
                      <div className="p-3 space-y-2 text-sm">
                        <p>Sinh câu mới bằng AI vào đúng chỗ đang chọn.</p>
                        <button
                          type="button"
                          className="app-button-secondary rounded-lg px-3 min-h-9 text-xs"
                          onClick={() => openSource('generate')}
                        >
                          Bắt đầu sinh câu
                        </button>
                      </div>
                    )
                  }
                  verify={
                    aiQuestion ? (
                      <QuestionVerify
                        key={aiQuestion.id}
                        question={{ ...aiQuestion, subject: aiQuestion.subject ?? exam.metadata.subject, grade: aiQuestion.grade ?? exam.metadata.grade }}
                        ownerId={currentUser.id}
                        documentId={exam.id}
                        sourceStamp={manualSourceStamp}
                        withAi={withAi}
                      />
                    ) : null
                  }
                />
              </div>
            )}
            {reviewOpen && (
              <div className={`${showRight('review')} min-h-0 flex-1 flex-col overflow-auto`}>
                <EditorReview
                  panel
                  exam={exam}
                  onClose={() => closeRight('review')}
                  onContinue={
                    pendingReviewAction
                      ? () => {
                          setReviewOpen(false);
                          pendingReviewAction?.();
                        }
                      : undefined
                  }
                  onQuestion={(id) => select(`question:${id}`)}
                />
              </div>
            )}
            {collaborationOpen && exam.serverId && (
              <div className={`${showRight('collab')} min-h-0 flex-1 flex-col overflow-auto p-3`}>
                <ExamCollaboratorsPanel
                  key={`${exam.serverId}-${currentUser.id}`}
                  examId={exam.serverId}
                  expectedUserId={currentUser.id}
                  focusQuestionId={collabFocus}
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
  );
};

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = (props) => (
  <EditorSelectionProvider key={props.currentUser.id + ':' + props.examId}>
    <ExamWorkspaceContent {...props} />
  </EditorSelectionProvider>
);

export default ExamWorkspace;

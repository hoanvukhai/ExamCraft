'use client';

import { metadataStamp } from '@/lib/copilot-metadata';
import { useEffect, useRef, useState } from 'react';
import type { Exam } from '@/types/exam';
import { AiProposalPreview } from './AiProposalPreview';
import {MathRenderer} from './MathRenderer';
import {FigureView} from './FigureView';
const displayValue=(value:unknown)=>value&&typeof value==='object'?Object.entries(value).map(([key,item])=>`${({kind:'Mục tiêu',year:'Năm',targetGrade:'Lớp đích',locality:'Địa phương',branch:'Nhánh'} as Record<string,string>)[key]??key}: ${String(item)}`).join(' · '):String(value??'');
import { copilotBaseMatches, copilotQuestionsStamp, prepareCopilotSubmission, type CopilotActionResult, type CopilotBase, type CopilotSubmission } from '@/lib/copilot-submission';
import { sameQuestionSourceStamp, questionDraftSourceStamp } from '@/lib/question-draft';

export function CopilotProposalReview({ base, result, ownerId, exam, onSubmit, onApplied, onDiscard }: {
  base: CopilotBase; result: CopilotActionResult; ownerId: string; exam: Exam;
  onSubmit: (submission: CopilotSubmission) => void; onApplied: (submission: CopilotSubmission) => void; onDiscard: () => void;
}) {
  const [attempt, setAttempt] = useState<CopilotSubmission | null>(null);
  const [message, setMessage] = useState('');
  const applied = useRef<string | null>(null);
  const acknowledged = !!attempt && ownerId === base.ownerId && exam.id === base.documentId && (attempt.metadata ? metadataStamp(exam.metadata) === metadataStamp(attempt.metadata) : sameQuestionSourceStamp(questionDraftSourceStamp(exam), base.sourceStamp)) && (!attempt.candidate || sameQuestionSourceStamp(questionDraftSourceStamp(exam),questionDraftSourceStamp(attempt.candidate))) && (attempt.base.metadataOnly || copilotQuestionsStamp(exam.questions) === copilotQuestionsStamp(attempt.questions));
  const stale = !acknowledged && !copilotBaseMatches(base, ownerId, exam);
  const preview = result.modifiedQuestion ? { ...result.modifiedQuestion, points: result.action === 'modify_single_question' ? base.questions.find(question => question.id === result.targetQuestionId)?.points : undefined } : undefined;
  useEffect(() => {
    if (acknowledged && attempt && applied.current !== attempt.token) { applied.current = attempt.token; onApplied(attempt); }
  }, [acknowledged, attempt, onApplied]);
  const apply = () => {
    const submission = prepareCopilotSubmission(base, result, ownerId, exam);
    if (!submission) { setMessage('Đề xuất chưa hợp lệ hoặc bản nền đã đổi. Chưa áp dụng; đề xuất vẫn được giữ để đối chiếu.'); return; }
    setAttempt(submission); setMessage('Đã gửi thay đổi. Chỉ đóng đề xuất khi bản soạn xác nhận nhận đúng nội dung.'); onSubmit(submission);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ base, result }, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'examcraft-de-xuat-bien-tap.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="m-3 p-3 border rounded-xl text-sm space-y-3 overflow-auto" aria-label="Đề xuất AI chưa áp dụng">
    <p>{result.explanation || 'Đề xuất biên tập đề — giáo viên duyệt trước khi áp dụng'}</p>
    {stale && <p role="alert">Câu, thứ tự hoặc phạm vi đã đổi từ khi gửi AI. Chưa áp dụng để giữ bản mới; đề xuất vẫn ở đây.</p>}
    {message && <p role="status">{message}</p>}
    {result.action === 'delete_question' && <p>Đề xuất bỏ câu: {base.questions.find(question => question.id === result.targetQuestionId)?.content ?? 'Chưa xác định câu'}. Chỉ bỏ khỏi bản soạn khi bấm Áp dụng.</p>}
    {result.metadataPatch && <table className="w-full break-words text-xs"><caption>Thông tin đề sẽ thay đổi</caption><thead><tr><th>Trường</th><th>Hiện tại</th><th>Đề xuất</th></tr></thead><tbody>{Object.entries(result.metadataPatch).map(([key,value])=><tr key={key}><td>{({title:'Tên đề',subject:'Môn',grade:'Lớp',durationMinutes:'Số phút',academicYear:'Năm học',semester:'Học kỳ',schoolName:'Đơn vị',departmentName:'Trường/tổ',examCode:'Mã đề',notes:'Ghi chú',examKind:'Loại bài',locality:'Địa phương',targetExam:'Mục tiêu kỳ thi'} as Record<string,string>)[key] ?? key}</td><td>{displayValue(exam.metadata[key as keyof typeof exam.metadata])}</td><td>{displayValue(value)}</td></tr>)}</tbody></table>}
    {result.candidate && <details><summary>Đề luyện tập mới · {result.candidate.questions.length} câu · nhận một lần để thay nội dung</summary><p>{result.candidate.metadata.title} · Lớp {result.candidate.metadata.grade} · {result.candidate.metadata.durationMinutes} phút</p><p>{result.candidate.metadata.notes}</p>{result.candidate.passages?.map(passage=><div key={passage.id}><MathRenderer content={passage.content}/>{passage.figures?.map(figure=><FigureView key={figure.id} figure={figure}/>)}</div>)}{result.candidate.questions.map((question,index)=><div key={question.id} className="border-t py-2"><b>Câu {index+1}</b><AiProposalPreview question={question}/></div>)}</details>}
    {result.modifiedQuestions?.map(question=><AiProposalPreview key={question.id} question={question} before={exam.questions.find(original=>original.id===question.id)} />)}
    {preview && <AiProposalPreview question={preview} before={exam.questions.find(question => question.id === result.targetQuestionId)} />}
    <div className="flex flex-wrap gap-3"><button type="button" disabled={stale || acknowledged} onClick={apply}>Áp dụng</button><button type="button" onClick={download}>Tải đề xuất</button><button type="button" onClick={onDiscard}>Cất đề xuất</button></div>
    <p className="text-xs">Bản đối chiếu có trong mục Đề xuất AI trên máy, kể cả sau khi cất hoặc áp dụng. Tải về để dự phòng; áp dụng vào bản soạn chưa phải xác nhận lưu máy chủ.</p>
    <p className="text-xs">Sửa câu giữ điểm và liên kết hiện có. Câu thêm mới được chèn tại vùng đã chọn và chưa đặt điểm; giáo viên kiểm tra phần, ngữ liệu và điểm trước khi chốt.</p>
  </section>;
}

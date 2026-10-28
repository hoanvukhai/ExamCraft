'use client';
import type { Question } from '@/types/exam';
import type { StructureBlock } from '@/lib/outline-view';
import { questionPartLabel } from '@/lib/outline-view';
import { MathRenderer } from '@/components/MathRenderer';
import { FigureView } from '@/components/FigureView';

export function StructureBlocks({ blocks, light = false }: { blocks?: StructureBlock[]; light?: boolean }) {
  return <>{blocks?.map(block => (
    <section key={block.id} data-outline-block={block.id} className="my-3 space-y-2 break-inside-avoid">
      {block.title && <h3 className="font-bold"><MathRenderer content={block.title} inline /></h3>}
      {block.instructions && <MathRenderer content={block.instructions} />}
      {block.missingPassageId && <p>Chưa tìm thấy nội dung dùng chung: {block.missingPassageId}</p>}
      {block.passage && <div className="border rounded-lg p-3 text-sm space-y-2">
        {block.passage.title && <h4 className="font-semibold">{block.passage.title}</h4>}
        <MathRenderer content={block.passage.content} />
        {block.passage.figures?.map(figure => <FigureView key={figure.id} figure={figure} forceLight={light} />)}
        {block.passage.source && <p className="text-xs italic">{block.passage.source}</p>}
      </div>}
    </section>
  ))}</>;
}
export function QuestionParts({ question, number, reveal = 'none' }: {
  question: Question;
  number?: number;
  reveal?: 'none' | 'answers' | 'solutions';
}) {
  return <>{question.parts?.map((part, index) => (
    <section key={part.id} className="ml-4 my-2 space-y-1" data-question-part={part.id}>
      <p><b>{questionPartLabel(question, index, number)}) </b>
        {reveal === 'none' && <MathRenderer content={part.content} inline />}
        {part.points !== undefined && <span> ({part.points} điểm)</span>}
      </p>
      {reveal !== 'none' && <>
        <MathRenderer content={part.answer || 'Chưa có đáp án cho ý này'} />
        {part.rubric?.map((row, i) => <p key={i}>{row.criterion}: {row.maxPoints} điểm</p>)}
      </>}
      {reveal === 'solutions' && part.solution && <MathRenderer content={part.solution} />}
    </section>
  ))}</>;
}

import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import { TutorialLesson, LanguageCode } from '../types';
import { TUTORIAL_LESSONS } from '../data/tutorials';
import { translations } from '../i18n/translations';
import { ChessBoard } from './ChessBoard';
import { soundFX } from '../utils/audio';
import { recordLessonCompleted } from '../utils/storage';
import { BookOpen, CheckCircle2, ChevronRight, Award, RotateCcw, Brain } from 'lucide-react';

interface TutorialsModalProps {
  lang: LanguageCode;
  completedLessons: string[];
  onLessonComplete: (lessonId: string) => void;
}

export const TutorialsModal: React.FC<TutorialsModalProps> = ({
  lang,
  completedLessons,
  onLessonComplete,
}) => {
  const t = translations[lang] || translations.es;

  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const currentLesson: TutorialLesson = TUTORIAL_LESSONS[activeLessonIndex] || TUTORIAL_LESSONS[0];

  const [practiceGame, setPracticeGame] = useState<Chess>(() => new Chess(currentLesson.initialFen));
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isLessonFinished, setIsLessonFinished] = useState<boolean>(false);

  // Switch lesson
  const loadLesson = (index: number) => {
    const lesson = TUTORIAL_LESSONS[index];
    if (!lesson) return;
    setActiveLessonIndex(index);
    setPracticeGame(new Chess(lesson.initialFen));
    setStepIndex(0);
    setFeedbackMsg(null);
    setIsLessonFinished(false);
  };

  // Handle move on interactive practice board
  const handlePracticeMove = (from: Square, to: Square, promotion?: string): boolean => {
    const targetMove = currentLesson.targetMoves[stepIndex];
    const userMoveStr = `${from}${to}${promotion || ''}`;

    try {
      const move = practiceGame.move({ from, to, promotion });
      if (!move) return false;

      // Check if move matches lesson target
      if (
        userMoveStr === targetMove ||
        move.san === targetMove ||
        currentLesson.targetMoves.includes(userMoveStr)
      ) {
        soundFX.playHint();
        setFeedbackMsg(t.correctMove);

        if (stepIndex + 1 >= currentLesson.targetMoves.length) {
          setIsLessonFinished(true);
          soundFX.playWin();
          recordLessonCompleted(currentLesson.id);
          onLessonComplete(currentLesson.id);
        } else {
          setStepIndex(stepIndex + 1);
        }
      } else {
        soundFX.playMove();
        setFeedbackMsg(t.incorrectMove);
      }

      setPracticeGame(new Chess(practiceGame.fen()));
      return true;
    } catch {
      return false;
    }
  };

  const isCompleted = completedLessons.includes(currentLesson.id);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-stone-900/90 p-5 rounded-2xl border border-stone-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> {t.tutorialTitle}
          </h2>
          <p className="text-xs text-stone-400 mt-1">{t.tutorialSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-stone-800 px-3.5 py-1.5 rounded-xl border border-stone-700">
          <Award className="w-4 h-4 text-amber-400" />
          Completadas: {completedLessons.length} / {TUTORIAL_LESSONS.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Lesson Selection Sidebar */}
        <div className="lg:col-span-4 bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xl space-y-2 max-h-[520px] overflow-y-auto">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">
            {t.lessonsTab}
          </h3>
          {TUTORIAL_LESSONS.map((lesson, idx) => {
            const isDone = completedLessons.includes(lesson.id);
            const isActive = activeLessonIndex === idx;

            return (
              <button
                key={lesson.id}
                onClick={() => loadLesson(idx)}
                className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3 border ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-500/50 text-stone-100 shadow'
                    : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/50 text-stone-300'
                }`}
              >
                <div className="mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-stone-500 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block truncate">{lesson.titleKey}</span>
                  <span className="text-[10px] text-stone-400 block">{lesson.categoryKey}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Interactive Lesson Stage */}
        <div className="lg:col-span-8 bg-stone-900/90 p-6 rounded-2xl border border-stone-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Lección {activeLessonIndex + 1} • {currentLesson.categoryKey}
              </span>
              <h3 className="text-lg font-bold text-stone-100">{currentLesson.titleKey}</h3>
            </div>
            {isCompleted && (
              <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completada
              </span>
            )}
          </div>

          <p className="text-xs leading-relaxed text-stone-300 bg-stone-800/60 p-3 rounded-xl border border-stone-700/60">
            {currentLesson.descriptionKey}
          </p>

          {/* Interactive Chess Board */}
          <div className="flex flex-col items-center space-y-4">
            <ChessBoard
              game={practiceGame}
              onMove={handlePracticeMove}
              showLegalMoves={true}
            />

            {/* Instruction Banner */}
            <div className="w-full max-w-xl bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-xl text-center space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Instrucción Práctica</span>
              <p className="text-xs text-amber-200 font-medium">
                {currentLesson.instructionKeys[stepIndex] || currentLesson.instructionKeys[0]}
              </p>
            </div>

            {/* Feedback & Progress Controls */}
            {feedbackMsg && (
              <div
                className={`text-xs font-bold px-4 py-2 rounded-lg ${
                  feedbackMsg === t.correctMove
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {feedbackMsg}
              </div>
            )}

            {isLessonFinished && (
              <div className="w-full max-w-xl bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-xl text-center space-y-3 shadow-lg">
                <h4 className="text-sm font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {t.lessonCompleted}
                </h4>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => loadLesson(activeLessonIndex)}
                    className="px-3 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg font-semibold transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {t.tryAgain}
                  </button>
                  {activeLessonIndex + 1 < TUTORIAL_LESSONS.length && (
                    <button
                      onClick={() => loadLesson(activeLessonIndex + 1)}
                      className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition shadow flex items-center gap-1"
                    >
                      {t.nextStep} <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cognitive Benefit Note */}
          <div className="flex items-start gap-2.5 bg-stone-800/80 p-3 rounded-xl border border-stone-700 text-xs text-stone-300">
            <Brain className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block mb-0.5">{t.cognitiveBenefitLabel}:</span>
              {currentLesson.cognitiveBenefitKey}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

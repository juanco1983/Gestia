import { useCallback, useEffect, useState } from 'react';
import { TOUR_STEPS, TOUR_STORAGE_KEY, type TourStep } from './steps';

export interface TourProgress {
  stepIndex: number;
  completed: boolean;
  resumido: boolean;
}

const DEFAULT_PROGRESS: TourProgress = { stepIndex: 0, completed: false, resumido: false };

function readProgress(): TourProgress {
  try {
    const raw = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      stepIndex: typeof parsed.stepIndex === 'number' ? Math.min(parsed.stepIndex, TOUR_STEPS.length - 1) : 0,
      completed: Boolean(parsed.completed),
      resumido: Boolean(parsed.resumido),
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export interface UseTourReturn {
  active: boolean;
  stepIndex: number;
  currentStep: TourStep;
  totalSteps: number;
  completed: boolean;
  start: () => void;
  resume: () => void;
  startFrom: (index: number) => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  finish: () => void;
  reset: () => void;
  storeProgress: (index: number, isCompleted: boolean) => void;
}

export function useTour(): UseTourReturn {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(() => readProgress().stepIndex);
  const [completed, setCompleted] = useState(() => readProgress().completed);

  const storeProgress = useCallback((index: number, isCompleted: boolean) => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({
        stepIndex: index,
        completed: isCompleted,
        resumido: true,
      } satisfies TourProgress));
    } catch {
      return;
    }
  }, []);

  const start = useCallback(() => {
    const prog = readProgress();
    setStepIndex(prog.completed ? 0 : prog.stepIndex);
    setActive(true);
    window.dispatchEvent(new CustomEvent('tour:start', { detail: { stepIndex: prog.completed ? 0 : prog.stepIndex } }));
  }, []);

  const startFrom = useCallback((index: number) => {
    setStepIndex(Math.max(0, Math.min(index, TOUR_STEPS.length - 1)));
    setActive(true);
    window.dispatchEvent(new CustomEvent('tour:start', { detail: { stepIndex: index } }));
  }, []);

  const resume = useCallback(() => {
    const prog = readProgress();
    setStepIndex(prog.completed ? 0 : prog.stepIndex);
    setActive(true);
    window.dispatchEvent(new CustomEvent('tour:start', { detail: { stepIndex: prog.completed ? 0 : prog.stepIndex } }));
  }, []);

  const next = useCallback(() => {
    setStepIndex(prev => {
      const lastIndex = TOUR_STEPS.length - 1;
      if (prev >= lastIndex) {
        setCompleted(true);
        storeProgress(0, true);
        setActive(false);
        return prev;
      }
      const nextIndex = Math.min(prev + 1, lastIndex);
      if (nextIndex === lastIndex) {
        storeProgress(nextIndex, false);
      }
      return nextIndex;
    });
  }, [storeProgress]);

  const prev = useCallback(() => {
    setStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const skip = useCallback(() => {
    setActive(false);
    storeProgress(stepIndex, false);
  }, [stepIndex, storeProgress]);

  const finish = useCallback(() => {
    setCompleted(true);
    storeProgress(0, true);
    setActive(false);
  }, [storeProgress]);

  const reset = useCallback(() => {
    setCompleted(false);
    setStepIndex(0);
    setActive(true);
    window.dispatchEvent(new CustomEvent('tour:start', { detail: { stepIndex: 0 } }));
  }, []);

  const currentStep = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];

  useEffect(() => {
    if (active) {
      storeProgress(stepIndex, completed);
    }
  }, [active, stepIndex, completed, storeProgress]);

  return {
    active,
    stepIndex,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    completed,
    start,
    resume,
    startFrom,
    next,
    prev,
    skip,
    finish,
    reset,
    storeProgress,
  };
}
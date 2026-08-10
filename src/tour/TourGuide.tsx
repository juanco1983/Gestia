import { useEffect, useRef, useCallback } from 'react';
import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { TOUR_STEPS, type TourModule } from './steps';
import './tour.css';

interface TourGuideProps {
  active: boolean;
  stepIndex: number;
  totalSteps: number;
  currentRole: string;
  onNavigate: (module: TourModule) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

type FooterKind = 'intermediate' | 'first' | 'last';

function buildFooterActions(popover: {
  footer: HTMLElement;
  progress: HTMLElement;
}, kind: FooterKind, handlers: { next: () => void; prev: () => void; skip: () => void; finish: () => void }) {
  const { footer, progress } = popover;
  if (!footer) return;
  footer.style.display = 'flex';
  footer.style.flexDirection = 'column';
  footer.style.gap = '10px';
  footer.style.marginTop = '16px';
  footer.style.alignItems = 'stretch';

  const existing = footer.querySelector('.tour-guide-footer-actions');
  if (existing) existing.remove();

  const actions = document.createElement('div');
  actions.className = 'tour-guide-footer-actions';
  actions.style.display = 'flex';
  actions.style.alignItems = 'center';
  actions.style.justifyContent = 'space-between';
  actions.style.gap = '8px';

  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className =
    'tour-guide-skip text-[10px] font-sans font-bold text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer py-2 rounded-lg transition-colors';
  skipBtn.textContent = 'Saltar tour';
  skipBtn.onclick = (e) => { e.stopPropagation(); handlers.skip(); };

  const navWrap = document.createElement('div');
  navWrap.style.display = 'flex';
  navWrap.style.gap = '8px';

  if (kind !== 'first') {
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className =
      'tour-guide-prev bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-sans font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-all';
    prevBtn.textContent = 'Atrás';
    prevBtn.onclick = (e) => { e.stopPropagation(); handlers.prev(); };
    navWrap.appendChild(prevBtn);
  }

  const isLast = kind === 'last';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = `tour-guide-next text-xs font-sans font-bold px-4 py-2 rounded-xl cursor-pointer transition-all shadow-sm ${
    isLast
      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
      : 'bg-teal-brand hover:bg-teal-deep text-white'
  }`;
  nextBtn.textContent = isLast ? 'Terminar' : 'Siguiente';
  nextBtn.onclick = (e) => {
    e.stopPropagation();
    if (isLast) {
      handlers.finish();
    } else {
      handlers.next();
    }
  };
  navWrap.appendChild(nextBtn);

  actions.appendChild(skipBtn);
  actions.appendChild(navWrap);
  footer.appendChild(actions);

  if (progress) {
    progress.textContent = '';
  }
}

export default function TourGuide({
  active,
  stepIndex,
  totalSteps,
  currentRole,
  onNavigate,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}: TourGuideProps) {
  const driverRef = useRef<Driver | null>(null);
  const handlersRef = useRef({ next: onNext, prev: onPrev, skip: onSkip, finish: onFinish, navigate: onNavigate });
  handlersRef.current = { next: onNext, prev: onPrev, skip: onSkip, finish: onFinish, navigate: onNavigate };
  const stepIndexRef = useRef(stepIndex);
  stepIndexRef.current = stepIndex;
  const currentRoleRef = useRef(currentRole);
  currentRoleRef.current = currentRole;

  const buildSteps = useCallback((): DriveStep[] => {
    return TOUR_STEPS.map((stepConfig) => ({
      element: stepConfig.selector,
      popover: {
        title: stepConfig.title,
        description: [stepConfig.description, stepConfig.note ? ` ⚠ ${stepConfig.note}` : '', stepConfig.tip ? ` · ${stepConfig.tip}` : ''].filter(Boolean).join('\n\n'),
        side: stepConfig.side ?? 'bottom',
        align: stepConfig.align ?? 'center',
        showButtons: [],
        showProgress: true,
        progressText: `Paso {{current}} de ${totalSteps}`,
        popoverClass: stepConfig.banner === 'final' ? 'tour-guide-popover step-final' : 'tour-guide-popover',
      } satisfies DriveStep['popover'],
    }));
  }, [totalSteps]);

  useEffect(() => {
    if (!active) return;
    const d = driver({
      animate: true,
      smoothScroll: true,
      allowClose: false,
      allowKeyboardControl: false,
      overlayColor: 'rgb(15 23 42)',
      overlayOpacity: 0.55,
      stagePadding: 12,
      stageRadius: 18,
      popoverClass: 'tour-guide-popover',
      steps: buildSteps(),
      onPopoverRender: (popover, opts) => {
        const index = opts.index ?? 0;
        const kind: FooterKind = index === 0 ? 'first' : index === TOUR_STEPS.length - 1 ? 'last' : 'intermediate';
        buildFooterActions(popover, kind, {
          next: () => { handlersRef.current.next(); },
          prev: () => { handlersRef.current.prev(); },
          skip: () => { handlersRef.current.skip(); },
          finish: () => { handlersRef.current.finish(); },
        });
      },
    });
    driverRef.current = d;
    return () => { d.destroy(); driverRef.current = null; };
  }, [active, buildSteps]);

  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[stepIndex];
    if (!step) return;
    if (step.module !== currentRole) {
      handlersRef.current.navigate(step.module);
      return;
    }
    const d = driverRef.current;
    if (!d) return;
    const t = window.setTimeout(() => {
      // driver.js maneja por sí solo el elemento faltante: usa un dummy centrado.
      try {
        d.drive(stepIndex);
      } catch (err) {
        console.warn('[Gestia·Tour] No se pudo mostrar el paso', stepIndex, err);
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [active, stepIndex, currentRole]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.skip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlersRef.current.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlersRef.current.prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return <span id="tour-guide-root" style={{ display: 'none' }} aria-hidden="true" />;
}
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollAnimationConfig {
  trigger?: string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  animation: () => void;
}

export function useScrollAnimation(config: ScrollAnimationConfig) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const animation = config.animation();

      if (ref.current && animation) {
        ScrollTrigger.create({
          trigger: config.trigger || ref.current,
          start: config.start || 'top 80%',
          end: config.end || 'bottom 20%',
          scrub: config.scrub || false,
          pin: config.pin || false,
          animation,
        });
      }
    }, ref);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return ref;
}

// Pre-built animation presets
export const fadeInUp = (element: HTMLElement, duration = 1, delay = 0) => {
  return gsap.from(element, {
    opacity: 0,
    y: 60,
    duration,
    delay,
    ease: 'power3.out',
  });
};

export const scaleIn = (element: HTMLElement, duration = 0.8, delay = 0) => {
  return gsap.from(element, {
    opacity: 0,
    scale: 0.8,
    duration,
    delay,
    ease: 'back.out(1.7)',
  });
};

export const slideInLeft = (element: HTMLElement, duration = 1, delay = 0) => {
  return gsap.from(element, {
    opacity: 0,
    x: -100,
    duration,
    delay,
    ease: 'power3.out',
  });
};

export const slideInRight = (element: HTMLElement, duration = 1, delay = 0) => {
  return gsap.from(element, {
    opacity: 0,
    x: 100,
    duration,
    delay,
    ease: 'power3.out',
  });
};

export const staggerFade = (elements: NodeListOf<Element>, stagger = 0.1) => {
  return gsap.from(elements, {
    opacity: 0,
    y: 40,
    duration: 0.8,
    stagger,
    ease: 'power2.out',
  });
};

// Parallax effect
export const parallax = (element: HTMLElement, speed = 0.5) => {
  return gsap.to(element, {
    yPercent: -50 * speed,
    ease: 'none',
    scrollTrigger: {
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
};

// Text reveal animation
export const textReveal = (element: HTMLElement) => {
  return gsap.from(element, {
    opacity: 0,
    y: 100,
    duration: 1.2,
    ease: 'power4.out',
  });
};

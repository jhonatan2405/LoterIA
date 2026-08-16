import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlidingNumberProps {
  value: number | string;
  className?: string;
  padDigits?: number;
  suffix?: string;
  prefix?: string;
}

function Digit({ char }: { char: string }) {
  if (isNaN(Number(char))) {
    return <span className="inline-block">{char}</span>;
  }

  return (
    <div className="relative inline-block h-[1em] overflow-hidden leading-none tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export const SlidingNumber: React.FC<SlidingNumberProps> = ({
  value,
  className = '',
  padDigits,
  suffix = '',
  prefix = ''
}) => {
  let strValue = String(value);
  if (padDigits && !isNaN(Number(value))) {
    strValue = strValue.padStart(padDigits, '0');
  }

  return (
    <span className={`inline-flex items-center font-mono ${className}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      {strValue.split('').map((char, index) => (
        <Digit key={`${index}-${char}`} char={char} />
      ))}
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
};

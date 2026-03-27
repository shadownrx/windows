import React, { useState } from 'react';

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (n: string) => {
    setDisplay(prev => prev === '0' ? n : prev + n);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const result = eval(equation + display);
      setDisplay(String(result));
      setEquation('');
    } catch {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  return (
    <div className="calc-container">
      <div className="calc-screen">
        <div className="calc-equation">{equation}</div>
        <div className="calc-display">{display}</div>
      </div>
      <div className="calc-buttons">
        <button onClick={clear} className="span-2">C</button>
        <button onClick={() => setDisplay(prev => prev.slice(0, -1))}>DEL</button>
        <button onClick={() => handleOperator('/')}>÷</button>
        
        <button onClick={() => handleNumber('7')}>7</button>
        <button onClick={() => handleNumber('8')}>8</button>
        <button onClick={() => handleNumber('9')}>9</button>
        <button onClick={() => handleOperator('*')}>×</button>
        
        <button onClick={() => handleNumber('4')}>4</button>
        <button onClick={() => handleNumber('5')}>5</button>
        <button onClick={() => handleNumber('6')}>6</button>
        <button onClick={() => handleOperator('-')}>-</button>
        
        <button onClick={() => handleNumber('1')}>1</button>
        <button onClick={() => handleNumber('2')}>2</button>
        <button onClick={() => handleNumber('3')}>3</button>
        <button onClick={() => handleOperator('+')}>+</button>
        
        <button onClick={() => handleNumber('0')} className="span-2">0</button>
        <button onClick={() => handleNumber('.')}>.</button>
        <button onClick={calculate} className="btn-blue">=</button>
      </div>

      <style>{`
        .calc-container {
          background: #202020;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 12px;
        }
        .calc-screen {
          background: rgba(0,0,0,0.3);
          border-radius: 4px;
          padding: 20px;
          text-align: right;
          margin-bottom: 12px;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .calc-equation {
          font-size: 14px;
          opacity: 0.6;
          min-height: 20px;
        }
        .calc-display {
          font-size: 32px;
          font-weight: 600;
        }
        .calc-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          flex: 1;
        }
        .calc-buttons button {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 4px;
          color: white;
          font-size: 18px;
          cursor: pointer;
        }
        .calc-buttons button:hover {
          background: rgba(255,255,255,0.1);
        }
        .span-2 { grid-column: span 2; }
        .btn-blue { background: var(--win-blue) !important; }
        .btn-blue:hover { background: #0086f1 !important; }
      `}</style>
    </div>
  );
};

export default Calculator;

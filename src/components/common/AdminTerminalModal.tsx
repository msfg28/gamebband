import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { commandService, ALL_COMMANDS_HELP } from '../../services/CommandService';
import { Terminal, X, CornerDownLeft, Sparkles, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminTerminalModalProps {
  admin: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

interface LogLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export const AdminTerminalModal: React.FC<AdminTerminalModalProps> = ({
  admin,
  isOpen,
  onClose,
}) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: `BANDIT OS Security Kernel v2.5 [Admin Level: ${admin.admin_level}]`,
    },
    {
      id: 'init-2',
      type: 'system',
      text: 'Введите /ahelp для списка разрешенных команд или нажмите TAB для автодополнения.',
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input.trim();
    const newLogs: LogLine[] = [
      ...logs,
      {
        id: `in_${Date.now()}`,
        type: 'input',
        text: currentInput,
      },
    ];

    const result = commandService.executeCommand(admin, currentInput);
    if (Array.isArray(result.output)) {
      result.output.forEach((line, idx) => {
        newLogs.push({
          id: `out_${Date.now()}_${idx}`,
          type: result.success ? 'output' : 'error',
          text: line,
        });
      });
    } else {
      newLogs.push({
        id: `out_${Date.now()}`,
        type: result.success ? 'output' : 'error',
        text: result.output,
      });
    }

    setLogs(newLogs);
    setInput('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const history = commandService.getHistory();
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex + 1 < history.length ? historyIndex + 1 : history.length - 1;
      setHistoryIndex(nextIdx);
      setInput(history[history.length - 1 - nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(history[history.length - 1 - nextIdx] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (input.startsWith('/')) {
        const matching = ALL_COMMANDS_HELP.filter((c) =>
          c.command.startsWith(input.toLowerCase())
        );
        if (matching.length === 1) {
          setInput(matching[0].command + ' ');
        }
      }
    }
  };

  const availableCommands = commandService.getAvailableCommandsForUser(admin.admin_level);

  return (
    <div id="admin-terminal-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-2xl bg-zinc-950 border border-red-500/40 shadow-2xl shadow-red-950/40 flex flex-col h-[580px] overflow-hidden text-zinc-100 font-mono"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-950 text-red-400 border border-red-800">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                  BANDIT ROOT CLI
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase">
                  LVL {admin.admin_level}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-sans">
                Авторизован: {admin.username}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogs([])}
              title="Очистить терминал"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              id="close-terminal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Output Console Log Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-1.5 text-xs selection:bg-red-500 selection:text-white">
          {logs.map((log) => (
            <div key={log.id} className="leading-relaxed">
              {log.type === 'input' && (
                <div className="flex items-start gap-2 text-zinc-100">
                  <span className="text-red-500 font-bold select-none">{admin.username}@bandit:~$</span>
                  <span className="font-semibold">{log.text}</span>
                </div>
              )}
              {log.type === 'output' && (
                <div className="text-emerald-400 pl-4 border-l border-emerald-500/30">
                  {log.text}
                </div>
              )}
              {log.type === 'error' && (
                <div className="text-red-400 font-semibold pl-4 border-l border-red-500/40">
                  [ERROR] {log.text}
                </div>
              )}
              {log.type === 'system' && (
                <div className="text-zinc-500 italic pl-4 border-l border-zinc-700">
                  {log.text}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Command Quick Autocomplete Pills */}
        <div className="px-4 py-2 border-t border-zinc-900 bg-zinc-900/50 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0">Быстрые:</span>
          {availableCommands.slice(0, 6).map((cmd) => (
            <button
              key={cmd.command}
              type="button"
              onClick={() => {
                setInput(cmd.command + ' ');
                inputRef.current?.focus();
              }}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono shrink-0 transition-colors"
            >
              {cmd.command}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-zinc-900 border-t border-zinc-800">
          <span className="text-red-500 font-bold select-none pl-2">{admin.username}@bandit:~$</span>
          <input
            id="admin-terminal-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите команду... (например: /ahelp, /ban, /givemoney)"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none font-mono"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            id="submit-terminal-cmd-btn"
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-sans uppercase flex items-center gap-1 transition-colors"
          >
            Enter
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

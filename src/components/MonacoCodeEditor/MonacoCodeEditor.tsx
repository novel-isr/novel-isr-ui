import Editor, { loader, type Monaco } from '@monaco-editor/react';
import { Component, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { Button } from '../Button';
import { Textarea } from '../Textarea';
import { Spinner } from '../Spinner';
import { FormLabel } from '../FormControl';
import { Alert } from '../Alert';
import { cn } from '../../utils/cn';

export interface MonacoCodeEditorProps {
  /** One shared local engine per application; configure workers in the host. */
  monaco: Monaco;
  value: string;
  onChange: (value: string) => void;
  language?: string;
  label: string;
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  className?: string;
}

let configuredMonaco: Monaco | undefined;

function configureLocalEngine(monaco: Monaco) {
  if (typeof monaco?.editor?.create !== 'function') throw new Error('A local Monaco engine is required');
  if (configuredMonaco && configuredMonaco !== monaco) throw new Error('Monaco loader already uses another engine');
  if (!configuredMonaco) {
    loader.config({ monaco });
    configuredMonaco = monaco;
  }
}

class EditorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onError(); }
  override render() { return this.state.failed ? null : this.props.children; }
}

function positive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function MonacoCodeEditor({ monaco, value, onChange, language = 'plaintext', label,
  height = 420, minHeight = 160, maxHeight = 800, disabled = false, className,
}: MonacoCodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const inputId = useId();
  const editor = useRef<ReturnType<Monaco['editor']['create']> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'mounted' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const readyEngine = useRef<Monaco | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const minimum = positive(minHeight, 160);
  const maximum = Math.max(minimum, positive(maxHeight, 800));
  const editorHeight = Math.min(maximum, Math.max(minimum, positive(height, 420)));

  useEffect(() => {
    let active = true;
    readyEngine.current = null;
    editor.current = null;
    setStatus('loading');
    function fail() {
      if (!active) return;
      active = false;
      clearTimeout(timer.current);
      setStatus('error');
    }
    // The adapter has no onError callback; bound both loader and mount time.
    timer.current = setTimeout(fail, 10000);
    try {
      configureLocalEngine(monaco);
      loader.init().then(engine => {
        if (!active) return;
        if (engine !== monaco) { fail(); return; }
        readyEngine.current = engine;
        setStatus('ready');
      }).catch(fail);
    } catch {
      fail();
    }
    return () => { active = false; clearTimeout(timer.current); };
  }, [monaco, attempt]);

  function handleFailure() {
    clearTimeout(timer.current);
    editor.current = null;
    setStatus('error');
  }

  return (
    <div className={cn('ui-monaco-code-editor', className)} role="group" aria-label={label}>
      <FormLabel className="ui-monaco-code-editor-label" htmlFor={inputId}
        onClick={() => { if (status === 'mounted') editor.current?.focus(); }}>{label}</FormLabel>
      <div className="ui-monaco-code-editor-surface" style={{ height: editorHeight }}
        aria-busy={status === 'loading' || status === 'ready'}>
        {status === 'error' ? (
          <>
            <div className="ui-monaco-code-editor-error">
              <Alert status="warning" hideIcon>编辑器暂不可用</Alert>
              <Button variant="ghost" intent="neutral" size="sm" aria-label="重试编辑器"
                leftIcon={<RotateCw size={16} aria-hidden="true" />} onClick={() => setAttempt(previous => previous + 1)}>
                重试
              </Button>
            </div>
            <Textarea id={inputId} aria-label={label} value={value} disabled={disabled} spellCheck={false}
              className="ui-monaco-code-editor-fallback" onChange={event => { if (!disabled) onChange(event.target.value); }} />
          </>
        ) : (
          <>
            {(status === 'loading' || status === 'ready') && (
              <div className="ui-monaco-code-editor-loading"><Spinner label="加载编辑器" /></div>
            )}
            {readyEngine.current === monaco && (status === 'ready' || status === 'mounted') && (
              <EditorBoundary key={attempt} onError={handleFailure}>
                <Editor value={value} language={language} height="100%" width="100%" loading={null}
                  theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                  options={{ readOnly: disabled, domReadOnly: disabled, ariaLabel: label,
                    automaticLayout: true, minimap: { enabled: false }, wordWrap: 'on', scrollBeyondLastLine: false }}
                  onMount={instance => { editor.current = instance; clearTimeout(timer.current); setStatus('mounted'); }}
                  onChange={next => { if (!disabled) onChange(next ?? ''); }} />
              </EditorBoundary>
            )}
          </>
        )}
      </div>
    </div>
  );
}

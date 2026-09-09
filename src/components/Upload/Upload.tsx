import { useId, useRef, useState, type ReactNode } from 'react';
import { RotateCw, Upload as UploadIcon, X } from 'lucide-react';
import { Button } from '../Button/Button';
import { IconButton } from '../Button/IconButton';
import { Alert } from '../Alert/Alert';
import { cn } from '../../utils/cn';

export interface UploadItem {
  id: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
  previewUrl?: string;
}

export interface UploadProps {
  label: string;
  value: UploadItem[];
  onFilesSelected: (files: File[]) => void;
  onRemove?: (item: UploadItem) => void;
  onRetry?: (item: UploadItem) => void;
  accept?: string;
  multiple?: boolean;
  replace?: boolean;
  maxCount?: number;
  maxSize?: number;
  busy?: boolean;
  disabled?: boolean;
  selectLabel?: ReactNode;
  className?: string;
}

function matchesAccept(file: File, accept: string) {
  return accept.split(',').some(part => {
    const rule = part.trim().toLowerCase();
    if (!rule || rule === '*' || rule === '*/*') return true;
    if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule);
    return rule.endsWith('/*') ? file.type.toLowerCase().startsWith(rule.slice(0, -1)) : file.type.toLowerCase() === rule;
  });
}

/** Controlled presentation only; transport, cancellation and persisted URLs belong to the caller. */
export function Upload({ label, value, onFilesSelected, onRemove, onRetry, accept = '*', multiple = false, replace = false,
  maxCount = multiple ? 50 : 1, maxSize, busy = false, disabled = false, selectLabel = '选择文件', className }: UploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const existingCount = replace && !multiple ? 0 : value.length;
  const blocked = disabled || busy || existingCount >= maxCount;
  const select = (files: File[]) => {
    if (blocked || !files.length) return;
    if ((!multiple && files.length > 1) || files.length + existingCount > maxCount) {
      setError(`最多选择 ${maxCount} 个文件`); return;
    }
    const invalid = files.find(file => !matchesAccept(file, accept));
    if (invalid) { setError(`${invalid.name}：不支持此文件类型`); return; }
    const oversized = files.find(file => maxSize !== undefined && file.size > maxSize);
    if (oversized) { setError(`${oversized.name}：文件大小超过限制`); return; }
    setError('');
    onFilesSelected(files);
  };
  return (
    <div className={cn('ui-upload', className)} role="group" aria-labelledby={`${id}-label`} aria-busy={busy}>
      <span id={`${id}-label`} className="ui-upload-label">{label}</span>
      <div className={cn('ui-upload-dropzone', dragging && !blocked && 'is-dragging')}
        onDragOver={event => { event.preventDefault(); if (!blocked) setDragging(true); }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={event => { event.preventDefault(); setDragging(false); select(Array.from(event.dataTransfer.files)); }}>
        <Button variant="outline" disabled={blocked} isLoading={busy} leftIcon={<UploadIcon size={16} />}
          onClick={() => input.current?.click()}>{selectLabel}</Button>
        <input ref={input} type="file" hidden aria-label={label} disabled={blocked} accept={accept} multiple={multiple}
          onChange={event => { const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ''; select(files); }} />
      </div>
      {error && <Alert status="danger">{error}</Alert>}
      {value.length > 0 && <ul className="ui-upload-list">{value.map(item => (
        <li key={item.id} className="ui-upload-item">
          {item.previewUrl && <img src={item.previewUrl} alt="" className="ui-upload-preview" />}
          <div className="ui-upload-info"><span>{item.name}</span>
            <span role={item.status === 'error' ? 'alert' : 'status'} className={cn('ui-upload-status', item.status === 'error' && 'is-error')}>
              {item.status === 'uploading' ? '上传中' : item.status === 'error' ? item.error || '上传失败' : '已上传'}
            </span>
          </div>
          <div className="ui-upload-actions">
            {item.status === 'error' && onRetry && <IconButton label={`重试 ${item.name}`} disabled={disabled || busy}
              onClick={() => onRetry(item)}><RotateCw size={16} /></IconButton>}
            {onRemove && <IconButton label={`移除 ${item.name}`} disabled={disabled} onClick={() => onRemove(item)}><X size={16} /></IconButton>}
          </div>
        </li>
      ))}</ul>}
    </div>
  );
}

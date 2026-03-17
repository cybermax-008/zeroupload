import { useState } from 'react';
import { theme } from '../lib/theme';
import { unlockPdf } from '../lib/pdfSecurityEngine';
import { saveFile, baseName } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, StatusBadge } from './ui';

export default function PdfUnlockTab() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState('');

  const onFiles = (files) => {
    const f = files[0];
    if (f?.type !== 'application/pdf') return;
    setFile(f);
    setStatus('');
  };

  const process = async () => {
    if (!file || !password) return;
    setStatus('Decrypting…');
    try {
      const result = await unlockPdf(file, password, setStatus);
      await saveFile(result.blob, baseName(file.name) + '_unlocked.pdf');
      setStatus(`Unlocked ✓ (${result.pageCount} pages)`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const reset = () => {
    setFile(null);
    setPassword('');
    setStatus('');
  };

  const inputStyle = {
    width: '100%',
    maxWidth: 320,
    padding: '9px 12px',
    borderRadius: 6,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    fontSize: 13,
    fontFamily: theme.fontMono,
    outline: 'none',
    transition: theme.transitionFast,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!file ? (
        <DropZone
          accept=".pdf"
          onFiles={onFiles}
          label="Drop a password-protected PDF"
          sublabel="Unlock it locally — your file stays on your device"
        />
      ) : (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>
                PDF Password
              </label>
              <div style={{ position: 'relative', maxWidth: 320 }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the PDF password"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = theme.accent}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                  onKeyDown={(e) => e.key === 'Enter' && process()}
                />
                <button
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 8, top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none', background: 'none',
                    color: theme.textDim, cursor: 'pointer',
                    fontSize: 12, fontFamily: theme.fontMono,
                  }}
                >{showPw ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginTop: 4,
            }}>
              <Btn onClick={process} disabled={!password}>
                Unlock PDF
              </Btn>
              <StatusBadge status={status} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

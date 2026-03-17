import { useState } from 'react';
import { theme } from '../lib/theme';
import { protectPdf } from '../lib/pdfSecurityEngine';
import { saveFile, baseName, humanSize } from '../lib/fileUtils';
import { DropZone, FileChip, Btn, StatusBadge } from './ui';

export default function PdfProtectTab() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
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
    if (password !== confirmPw) {
      setStatus('Error: Passwords do not match');
      return;
    }
    setStatus('Encrypting…');
    try {
      const result = await protectPdf(file, password, setStatus);
      await saveFile(result.blob, baseName(file.name) + '_protected.pdf');
      setStatus(`Protected ✓ (${result.pageCount} pages)`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const reset = () => {
    setFile(null);
    setPassword('');
    setConfirmPw('');
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
          label="Drop a PDF to password-protect"
          sublabel="Add encryption — your file stays on your device"
        />
      ) : (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>
                Password
              </label>
              <div style={{ position: 'relative', maxWidth: 320 }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = theme.accent}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500 }}>
                Confirm Password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm password"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = theme.accent}
                onBlur={(e) => e.target.style.borderColor = theme.border}
              />
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginTop: 4,
            }}>
              <Btn
                onClick={process}
                disabled={!password || password !== confirmPw}
              >
                Protect PDF
              </Btn>
              <StatusBadge status={status} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

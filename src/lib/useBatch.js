import { useState, useRef, useCallback } from 'react';

let nextId = 1;

export function useBatch() {
  const [items, setItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  const cancelRef = useRef(false);

  const addFiles = useCallback((files) => {
    setItems((prev) => {
      const remaining = 50 - prev.length;
      if (remaining <= 0) return prev;
      const toAdd = Array.from(files).slice(0, remaining).map((file) => ({
        id: nextId++,
        file,
        status: 'pending',
        result: null,
        error: null,
      }));
      return [...prev, ...toAdd];
    });
  }, []);

  const removeFile = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setProcessing(false);
    cancelRef.current = false;
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const processBatch = useCallback(async (processOneFn, { onOperationComplete }) => {
    setProcessing(true);
    cancelRef.current = false;

    // Get current items snapshot for iteration
    let currentItems;
    setItems((prev) => { currentItems = prev; return prev; });

    for (const item of currentItems) {
      if (item.status === 'done' || item.status === 'error') continue;

      // Check cancel
      if (cancelRef.current) break;

      // Set processing
      setItems((prev) => prev.map((it) =>
        it.id === item.id ? { ...it, status: 'processing' } : it
      ));

      try {
        const result = await processOneFn(item.file);
        setItems((prev) => prev.map((it) =>
          it.id === item.id ? { ...it, status: 'done', result } : it
        ));
        if (onOperationComplete) onOperationComplete();
      } catch (e) {
        setItems((prev) => prev.map((it) =>
          it.id === item.id ? { ...it, status: 'error', error: e.message } : it
        ));
      }
    }

    setProcessing(false);
  }, []);

  // Derived counts
  const doneCount = items.filter((it) => it.status === 'done').length;
  const errorCount = items.filter((it) => it.status === 'error').length;
  const pendingCount = items.filter((it) => it.status === 'pending').length;
  const progress = { total: items.length, done: doneCount + errorCount };

  return {
    items,
    processing,
    addFiles,
    removeFile,
    processBatch,
    cancel,
    reset,
    doneCount,
    errorCount,
    pendingCount,
    progress,
  };
}

import { useState, useRef, useCallback } from 'react';

let nextId = 1;

export function useBatch() {
  const [items, setItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  const cancelRef = useRef(false);
  const itemsRef = useRef([]);

  const updateItems = (fn) => {
    setItems((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      itemsRef.current = next;
      return next;
    });
  };

  const addFiles = useCallback((files) => {
    updateItems((prev) => {
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
    updateItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    updateItems([]);
    setProcessing(false);
    cancelRef.current = false;
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const processBatch = useCallback(async (processOneFn) => {
    setProcessing(true);
    cancelRef.current = false;

    // Read current items from ref (always in sync)
    const snapshot = itemsRef.current;

    for (const item of snapshot) {
      if (item.status === 'done' || item.status === 'error') continue;
      if (cancelRef.current) break;

      // Mark processing
      updateItems((prev) => prev.map((it) =>
        it.id === item.id ? { ...it, status: 'processing' } : it
      ));

      // Yield to let React render the status update
      await new Promise((r) => setTimeout(r, 0));

      try {
        const result = await processOneFn(item.file);
        updateItems((prev) => prev.map((it) =>
          it.id === item.id ? { ...it, status: 'done', result } : it
        ));
      } catch (e) {
        updateItems((prev) => prev.map((it) =>
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

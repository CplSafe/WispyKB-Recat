/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from 'react';

import { i18n } from '../i18n';

/**
 * Hook to trigger re-render when locale changes
 */
export function useI18n() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = i18n.onChange(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  return i18n;
}

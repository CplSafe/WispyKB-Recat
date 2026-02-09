/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect, useCallback } from 'react';

import { Tooltip, IconButton } from '@douyinfe/semi-ui';
import { IconLanguage } from '@douyinfe/semi-icons';

import { i18n } from '@flowgram/i18n';

export const LanguageSwitch = () => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // 监听语言变化，强制组件重新渲染
    const unsubscribe = i18n.onChange(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  const handleSwitch = useCallback(() => {
    i18n.toggle();
  }, []);

  const currentLanguage = i18n.locale === 'zh-CN' ? '中文' : 'English';

  return (
    <Tooltip content={i18n.t('language')}>
      <IconButton
        type="tertiary"
        theme="borderless"
        icon={<IconLanguage />}
        onClick={handleSwitch}
      />
    </Tooltip>
  );
};

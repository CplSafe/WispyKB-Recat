/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from 'react';

import {
  usePlaygroundTools,
  type InteractiveType as IdeInteractiveType,
} from '@flowgram.ai/free-layout-editor';
import { Tooltip, Button, Dropdown } from '@douyinfe/semi-ui';

import { useI18n } from '@flowgram/hooks';
import { IconMouseTool } from '../../assets/icon-mouse';
import { IconPadTool } from '../../assets/icon-pad';

export const CACHE_KEY = 'workflow_prefer_interactive_type';
export const IS_MAC_OS = /(Macintosh|MacIntel|MacPPC|Mac68K|iPad)/.test(navigator.userAgent);

export const getPreferInteractiveType = () => {
  const data = localStorage.getItem(CACHE_KEY) as string;
  if (data && [InteractiveType.Mouse, InteractiveType.Pad].includes(data as InteractiveType)) {
    return data;
  }
  return IS_MAC_OS ? InteractiveType.Pad : InteractiveType.Mouse;
};

export const setPreferInteractiveType = (type: InteractiveType) => {
  localStorage.setItem(CACHE_KEY, type);
};

export enum InteractiveType {
  Mouse = 'MOUSE',
  Pad = 'PAD',
}

export const Interactive = () => {
  const i18n = useI18n();
  const tools = usePlaygroundTools();

  const [interactiveType, setInteractiveType] = useState<InteractiveType>(
    () => getPreferInteractiveType() as InteractiveType
  );

  useEffect(() => {
    const preferInteractiveType = getPreferInteractiveType();
    tools.setInteractiveType(preferInteractiveType as IdeInteractiveType);
  }, [tools]);

  const isMouseMode = interactiveType === InteractiveType.Mouse;
  const tooltip = isMouseMode ? '鼠标友好' : '触控板友好';
  const currentIcon = isMouseMode ? <IconMouseTool /> : <IconPadTool />;

  return (
    <Dropdown
      trigger="click"
      position="top"
      render={
        <Dropdown.Menu>
          <Dropdown.Item
            selected={interactiveType === InteractiveType.Mouse}
            onClick={() => {
              setInteractiveType(InteractiveType.Mouse);
              setPreferInteractiveType(InteractiveType.Mouse);
              tools.setInteractiveType(InteractiveType.Mouse as unknown as IdeInteractiveType);
            }}
          >
            {i18n.t('mouseMode')}
          </Dropdown.Item>
          <Dropdown.Item
            selected={interactiveType === InteractiveType.Pad}
            onClick={() => {
              setInteractiveType(InteractiveType.Pad);
              setPreferInteractiveType(InteractiveType.Pad);
              tools.setInteractiveType(InteractiveType.Pad as unknown as IdeInteractiveType);
            }}
          >
            {i18n.t('touchpadMode')}
          </Dropdown.Item>
        </Dropdown.Menu>
      }
    >
      <Tooltip content={tooltip}>
        <Button
          icon={currentIcon}
          size="small"
          type="tertiary"
          theme="borderless"
          style={{ height: '32px', width: '32px', padding: '0' }}
        />
      </Tooltip>
    </Dropdown>
  );
};

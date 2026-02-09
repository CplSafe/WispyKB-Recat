/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';

import { usePlayground, usePlaygroundTools } from '@flowgram.ai/free-layout-editor';
import { Divider, Dropdown } from '@douyinfe/semi-ui';

import { useI18n } from '@flowgram/hooks';

import { SelectZoom } from './styles';

export const ZoomSelect = () => {
  const i18n = useI18n();
  const tools = usePlaygroundTools({ maxZoom: 2, minZoom: 0.25 });
  const playground = usePlayground();
  const [dropDownVisible, openDropDown] = useState(false);
  return (
    <Dropdown
      position="top"
      trigger="custom"
      visible={dropDownVisible}
      onClickOutSide={() => openDropDown(false)}
      render={
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => tools.zoomin()}>{i18n.t('zoomIn')}</Dropdown.Item>
          <Dropdown.Item onClick={() => tools.zoomout()}>{i18n.t('zoomOut')}</Dropdown.Item>
          <Divider layout="horizontal" />
          <Dropdown.Item onClick={() => playground.config.updateZoom(0.5)}>
            {i18n.t('zoomTo')} 50%
          </Dropdown.Item>
          <Dropdown.Item onClick={() => playground.config.updateZoom(1)}>
            {i18n.t('zoomTo')} 100%
          </Dropdown.Item>
          <Dropdown.Item onClick={() => playground.config.updateZoom(1.5)}>
            {i18n.t('zoomTo')} 150%
          </Dropdown.Item>
          <Dropdown.Item onClick={() => playground.config.updateZoom(2.0)}>
            {i18n.t('zoomTo')} 200%
          </Dropdown.Item>
        </Dropdown.Menu>
      }
    >
      <SelectZoom onClick={() => openDropDown(true)}>{Math.floor(tools.zoom * 100)}%</SelectZoom>
    </Dropdown>
  );
};

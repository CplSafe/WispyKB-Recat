/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import styled from 'styled-components';

export const BottomBarContainer = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  gap: 8px;
  z-index: 20;
`;

export const LeftCard = styled.div`
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid rgba(68, 83, 130, 0.25);
  border-radius: 10px;
  box-shadow: rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.02) 0px 4px 12px 0px;
  column-gap: 2px;
  height: 40px;
  padding: 0 6px;
  pointer-events: auto;
`;

export const RightCard = styled.div`
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid rgba(68, 83, 130, 0.25);
  border-radius: 10px;
  box-shadow: rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.02) 0px 4px 12px 0px;
  column-gap: 4px;
  height: 40px;
  padding: 0 6px;
  pointer-events: auto;
`;

// 保留旧组件的导出以保持兼容
export const BottomBarSection = LeftCard;
export const RightActionButtons = RightCard;
export const ZoomTools = LeftCard;

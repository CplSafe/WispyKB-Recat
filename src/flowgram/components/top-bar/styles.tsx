/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import styled from 'styled-components';

export const TopBarContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid rgba(68, 83, 130, 0.15);
  z-index: 100;
  pointer-events: auto;
`;

export const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .workflow-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--semi-color-bg-2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .workflow-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .workflow-title-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .workflow-name {
    font-size: 15px;
    font-weight: 600;
    color: #060709;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .workflow-save-status {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .workflow-desc {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: 4px;
  }
`;

export const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SaveStatus = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  margin-left: 8px;
  background-color: ${props => {
    switch (props.$status) {
      case 'saving': return 'rgba(250, 173, 20, 0.1)';
      case 'saved': return 'rgba(82, 196, 26, 0.1)';
      case 'error': return 'rgba(245, 34, 45, 0.1)';
      default: return 'transparent';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'saving': return '#faad14';
      case 'saved': return '#52c41a';
      case 'error': return '#f5222d';
      default: return 'var(--semi-color-text-2)';
    }
  }};
`;

// 保留旧导出以兼容
export const TopBarCenter = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

export const WorkflowInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const MoreMenuContent = styled.div`
  min-width: 150px;
  padding: 4px 0;

  .more-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .menu-icon {
      display: flex;
      align-items: center;
      color: #060709cc;
    }

    .menu-name {
      font-size: 14px;
      color: #060709;
    }
  }
`;

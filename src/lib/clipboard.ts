/**
 * 兼容 HTTP 环境的剪贴板复制
 *
 * navigator.clipboard 仅在 HTTPS 或 localhost 下可用，
 * 生产环境 HTTP 部署时回退到 execCommand('copy')。
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // fallback: textarea + execCommand
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

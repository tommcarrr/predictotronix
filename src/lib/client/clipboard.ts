interface ClipboardContent {
  text: string;
  html?: string;
}

function legacyCopyToClipboard({ text, html }: ClipboardContent) {
  if (typeof document.execCommand !== 'function') return false;

  const selection = window.getSelection();
  const previousRanges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index))
    : [];
  const copyTarget = html ? document.createElement('div') : document.createElement('textarea');

  copyTarget.setAttribute('aria-hidden', 'true');
  copyTarget.style.position = 'fixed';
  copyTarget.style.left = '-9999px';
  copyTarget.style.top = '0';

  if (copyTarget instanceof HTMLTextAreaElement) {
    copyTarget.value = text;
    copyTarget.readOnly = true;
  } else {
    copyTarget.contentEditable = 'true';
    copyTarget.innerHTML = html!;
  }

  document.body.appendChild(copyTarget);

  try {
    copyTarget.focus();
    if (copyTarget instanceof HTMLTextAreaElement) {
      copyTarget.select();
    } else {
      const range = document.createRange();
      range.selectNodeContents(copyTarget);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    return document.execCommand('copy');
  } finally {
    copyTarget.remove();
    selection?.removeAllRanges();
    for (const range of previousRanges) selection?.addRange(range);
  }
}

/** Copy rich or plain text, with an execCommand fallback for Safari. */
export async function copyToClipboard(content: ClipboardContent) {
  const clipboard = navigator.clipboard;

  if (content.html && clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      await clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([content.html], { type: 'text/html' }),
          'text/plain': new Blob([content.text], { type: 'text/plain' }),
        }),
      ]);
      return;
    } catch {
      // Safari can expose the async Clipboard API but reject writes after awaited work.
    }

    if (legacyCopyToClipboard(content)) return;
  }

  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(content.text);
      return;
    } catch {
      // Fall through to the synchronous API supported by older Safari versions.
    }
  }

  if (!legacyCopyToClipboard(content)) {
    throw new Error('Clipboard access is unavailable');
  }
}

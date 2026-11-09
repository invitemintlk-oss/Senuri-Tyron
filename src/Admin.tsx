import React, { useEffect, useRef, useState } from 'react';
import { Check, Link as LinkIcon, MessageSquare, Sparkles } from 'lucide-react';
import { INVITATION, GUEST_PREFIXES, GuestPrefix, buildDisplayName, buildInviteLink, cleanName } from './config';

type Generated = { displayName: string; link: string; message: string };

const buildMessage = (displayName: string, link: string) => `Dear ${displayName} ❤️

With joyful hearts, we warmly invite you to celebrate one of the most special days of our lives as we begin our journey together.

Please view our wedding invitation and all the event details through the link below 🌐:

${link}

Your presence would truly mean the world to us, and we would be honored to celebrate this beautiful moment together.

With love,
❤️ ${INVITATION.couple.groom} & ${INVITATION.couple.bride}`;

/** Clipboard with a fallback for non-secure (http) contexts. */
async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!ok) throw new Error('Copy failed');
}

export default function Admin() {
  const [prefix, setPrefix] = useState<GuestPrefix>('Mr.');
  const [guestName, setGuestName] = useState('');
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = (text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2000);
  };

  // A generated link is tied to the inputs it was made from; editing them requires regenerating.
  const isStale =
    generated !== null && generated.displayName !== buildDisplayName(prefix, guestName);
  const canCopy = generated !== null && !isStale;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanName(guestName)) {
      setError('Please enter a guest name.');
      setGenerated(null);
      return;
    }
    setError('');
    const displayName = buildDisplayName(prefix, guestName);
    const link = buildInviteLink(window.location.origin, displayName);
    setGenerated({ displayName, link, message: buildMessage(displayName, link) });
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await copyText(text);
      showToast(label);
    } catch {
      showToast('Copy failed – please copy manually');
    }
  };

  const fieldClass =
    'w-full p-4 rounded-xl border border-[#C0C0C0] focus:outline-none focus:border-[#6B8BA4] bg-[#F7F8FA] text-[#333333] font-medium transition-colors';

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 md:p-12 font-sans text-[#4A4F55]">
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-12 rounded-3xl shadow-xl border border-[#6B8BA4]/20">
        <h1 className="text-4xl text-center font-playball text-[#6B8BA4] mb-2">
          {INVITATION.couple.bride} &amp; {INVITATION.couple.groom}
        </h1>
        <h2 className="text-base md:text-xl text-center font-cinzel mb-10 tracking-widest font-bold">
          Invitation Link Generator
        </h2>

        <form onSubmit={handleGenerate} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="prefix" className="block text-sm font-bold uppercase tracking-wider">
                Select Prefix
              </label>
              <select
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value as GuestPrefix)}
                className={fieldClass}
              >
                {GUEST_PREFIXES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="guestName" className="block text-sm font-bold uppercase tracking-wider">
                Guest Name
              </label>
              <input
                id="guestName"
                type="text"
                placeholder="e.g. Sanjaya"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setError('');
                }}
                className={fieldClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#6B8BA4] text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#557590] transition-all shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Generate Link
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#6B8BA4]/20 space-y-6">
          {isStale && (
            <p className="text-sm text-amber-600 font-semibold">
              Details changed – click “Generate Link” again to update.
            </p>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider">Generated Link</h3>
            <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#C0C0C0] break-all text-sm md:text-base">
              {generated ? (
                <a href={generated.link} target="_blank" rel="noreferrer" className="text-[#6B8BA4] underline underline-offset-2">
                  {generated.link}
                </a>
              ) : (
                <span className="text-gray-400 italic">Click “Generate Link” to create the invitation link…</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider">Message Preview</h3>
            <div className="bg-[#F7F8FA] p-5 rounded-2xl border border-[#C0C0C0] whitespace-pre-wrap break-words text-sm md:text-base text-[#333333] leading-relaxed">
              {generated ? (
                generated.message
              ) : (
                <span className="text-gray-400 italic">The personalized WhatsApp message will appear here…</span>
              )}
            </div>
            {generated && (
              <p className="text-xs text-gray-500">
                Website greeting: “We cordially invite <strong>{generated.displayName}</strong> to celebrate our special day with us.”
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => generated && handleCopy(generated.link, 'Link copied!')}
              disabled={!canCopy}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-[#6B8BA4] text-[#6B8BA4] font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#6B8BA4] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#6B8BA4]"
            >
              <LinkIcon className="w-5 h-5" />
              Copy Link Only
            </button>
            <button
              type="button"
              onClick={() => generated && handleCopy(generated.message, 'Message copied!')}
              disabled={!canCopy}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-[#6B8BA4] text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#557590] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#6B8BA4]"
            >
              <MessageSquare className="w-5 h-5" />
              Copy Full Message
            </button>
          </div>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full bg-[#4A4F55] text-white text-sm font-semibold shadow-xl transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <Check className="w-4 h-4" />
        {toast}
      </div>
    </div>
  );
}

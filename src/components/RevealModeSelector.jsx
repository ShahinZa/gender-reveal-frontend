import React, { useId } from 'react';

const modes = [
  { synced: true, title: 'Everyone together', description: 'You start while signed in. Guests join the same countdown.' },
  { synced: false, title: 'At their own pace', description: 'Each guest starts their own countdown whenever they’re ready.' },
];

export default function RevealModeSelector({ syncedReveal, loading, loadError, saveStatus, saveError, onChange, onRetry, onReload }) {
  const name = useId();
  const unavailable = loading || !!loadError;

  return (
    <fieldset className="min-w-0 px-1 pt-1">
      <legend className="text-white/90 text-sm font-semibold mb-3">How should guests reveal?</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {modes.map(mode => {
          const selected = !unavailable && syncedReveal === mode.synced;
          return (
            <label key={String(mode.synced)} className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-purple-300/80 ${unavailable ? 'cursor-wait opacity-50' : 'cursor-pointer'} ${selected ? 'border-purple-400/60 bg-purple-500/15' : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'}`}>
              <input type="radio" name={name} value={String(mode.synced)} checked={selected} disabled={unavailable} onChange={() => onChange(mode.synced)} aria-labelledby={`${name}-${mode.synced}-title`} aria-describedby={`${name}-${mode.synced}-description`} className="mt-1 h-4 w-4 shrink-0 accent-purple-400" />
              <span className="min-w-0">
                <span id={`${name}-${mode.synced}-title`} className={`block text-sm font-semibold ${selected ? 'text-purple-100' : 'text-white/80'}`}>{mode.title}</span>
                <span id={`${name}-${mode.synced}-description`} className="block mt-1 text-xs leading-relaxed text-white/60">{mode.description}</span>
              </span>
            </label>
          );
        })}
      </div>
      <div aria-live="polite" className="min-h-7 pt-2 text-xs text-white/55">
        {loading ? 'Loading your choice…' : loadError ? (
          <span>Your saved choice couldn’t load. <button type="button" onClick={onReload} className="text-purple-200 underline underline-offset-2 py-2">Load again</button></span>
        ) : saveStatus === 'error' ? (
          <span className="text-pink-200">Your changes haven’t saved. <button type="button" onClick={onRetry} title={saveError || undefined} className="underline underline-offset-2 py-2">Try saving again</button></span>
        ) : saveStatus === 'pending' ? 'Saving…' : saveStatus === 'saved' ? 'Saved automatically' : 'Your choice saves automatically.'}
      </div>
    </fieldset>
  );
}

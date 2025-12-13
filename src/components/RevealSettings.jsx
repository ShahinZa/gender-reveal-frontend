import React, { useState, useEffect, useCallback, useRef } from 'react';
import { THEME_COLORS, INTENSITY_SETTINGS, COUNTDOWN_OPTIONS, BABY_COUNT_OPTIONS, EMOJI_OPTIONS, SKIN_TONES, applySkintone, DEFAULT_PREFERENCES } from '../constants/revealThemes';
import { authService } from '../api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * RevealSettings Component
 * Single Responsibility: Manage user preferences for the reveal experience
 *
 * @param {Object} props
 * @param {boolean} props.isGenderSet - Whether the gender has been set
 * @param {string} props.revealCode - The reveal code for preview URLs
 * @param {function} props.onPreferencesChange - Callback when preferences change
 */
function RevealSettings({ isGenderSet = false, revealCode, onPreferencesChange }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error' | null
  const [loading, setLoading] = useState(true);
  const [audioUploading, setAudioUploading] = useState({ countdown: false, celebration: false });
  const [audioError, setAudioError] = useState({ countdown: null, celebration: null });
  const countdownInputRef = useRef(null);
  const celebrationInputRef = useRef(null);

  /**
   * Open preview in a new tab
   * Opens the actual reveal page with preview query parameters
   */
  const openPreview = useCallback((gender) => {
    if (!revealCode) {
      console.error('No reveal code available for preview');
      return;
    }
    const previewUrl = `/reveal/${revealCode}?preview=true&gender=${gender}`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  }, [revealCode]);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await authService.getPreferences();
        if (data.preferences) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences });
        }
      } catch (err) {
        console.error('Failed to fetch preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  // Debounced save
  const savePreferences = useCallback(async (newPrefs) => {
    setSaving(true);
    setSaveStatus(null);
    try {
      await authService.updatePreferences(newPrefs);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
      // Notify parent of preference changes
      onPreferencesChange?.(newPrefs);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [onPreferencesChange]);

  // Handle preference change with debounce
  const handleChange = useCallback((key, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, [key]: value };
      // Debounce save
      const timeoutId = setTimeout(() => savePreferences(newPrefs), 500);
      // Clear previous timeout
      if (window.preferenceSaveTimeout) {
        clearTimeout(window.preferenceSaveTimeout);
      }
      window.preferenceSaveTimeout = timeoutId;
      return newPrefs;
    });
  }, [savePreferences]);

  // Handle skin tone change - also update emojis with new skin tone
  const handleSkinToneChange = useCallback((newSkinTone) => {
    setPreferences(prev => {
      // Find base emojis by removing any existing skin tone modifiers
      const getBaseEmoji = (emoji) => {
        if (!emoji) return emoji;
        // Skin tone modifiers are in range U+1F3FB to U+1F3FF
        return emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
      };

      const baseBoyEmoji = getBaseEmoji(prev.boyEmoji);
      const baseGirlEmoji = getBaseEmoji(prev.girlEmoji);

      // Check if current emojis support skin tones
      const boySupports = EMOJI_OPTIONS.boy.find(e => e.base === baseBoyEmoji)?.supportsSkinTone;
      const girlSupports = EMOJI_OPTIONS.girl.find(e => e.base === baseGirlEmoji)?.supportsSkinTone;

      const newPrefs = {
        ...prev,
        skinTone: newSkinTone,
        boyEmoji: boySupports ? applySkintone(baseBoyEmoji, newSkinTone) : prev.boyEmoji,
        girlEmoji: girlSupports ? applySkintone(baseGirlEmoji, newSkinTone) : prev.girlEmoji,
      };

      // Debounce save
      const timeoutId = setTimeout(() => savePreferences(newPrefs), 500);
      if (window.preferenceSaveTimeout) {
        clearTimeout(window.preferenceSaveTimeout);
      }
      window.preferenceSaveTimeout = timeoutId;
      return newPrefs;
    });
  }, [savePreferences]);

  // Handle audio file upload
  const handleAudioUpload = useCallback(async (type, file) => {
    setAudioError(prev => ({ ...prev, [type]: null }));

    // Validate file type
    if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
      setAudioError(prev => ({ ...prev, [type]: 'Only MP3 files are allowed' }));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setAudioError(prev => ({ ...prev, [type]: 'File must be less than 5MB' }));
      return;
    }

    setAudioUploading(prev => ({ ...prev, [type]: true }));

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          await authService.uploadAudio(type, base64Data, file.name);

          // Update local preferences state - include data for demo preview
          setPreferences(prev => ({
            ...prev,
            customAudio: {
              ...prev.customAudio,
              [type]: { fileName: file.name, size: file.size, data: base64Data },
            },
          }));
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
          console.error('Failed to upload audio:', err);
          setAudioError(prev => ({ ...prev, [type]: err.message || 'Upload failed' }));
        } finally {
          setAudioUploading(prev => ({ ...prev, [type]: false }));
        }
      };
      reader.onerror = () => {
        setAudioError(prev => ({ ...prev, [type]: 'Failed to read file' }));
        setAudioUploading(prev => ({ ...prev, [type]: false }));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to process audio:', err);
      setAudioError(prev => ({ ...prev, [type]: 'Failed to process file' }));
      setAudioUploading(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  // Handle audio delete
  const handleAudioDelete = useCallback(async (type) => {
    setAudioUploading(prev => ({ ...prev, [type]: true }));
    setAudioError(prev => ({ ...prev, [type]: null }));

    try {
      await authService.deleteAudio(type);
      setPreferences(prev => ({
        ...prev,
        customAudio: {
          ...prev.customAudio,
          [type]: null,
        },
      }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Failed to delete audio:', err);
      setAudioError(prev => ({ ...prev, [type]: err.message || 'Delete failed' }));
    } finally {
      setAudioUploading(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Truncate long file names
  const truncateFileName = (name, maxLength = 20) => {
    if (!name || name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.slice(0, maxLength - ext.length - 4) + '...';
    return `${truncatedName}.${ext}`;
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div id="reveal-settings" className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">Customize Your Reveal</h3>
            <p className="text-white/50 text-sm">Theme, countdown, animations & more</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          )}
          {saveStatus === 'saved' && (
            <span className="text-green-400 text-xs">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-400 text-xs">Error</span>
          )}
          <svg
            className={`w-5 h-5 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-6 border-t border-white/10 pt-5">
          {/* Theme Selection */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-3">Color Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(THEME_COLORS).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleChange('theme', key)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    preferences.theme === key
                      ? 'border-white/50 bg-white/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex gap-1 mb-2 justify-center">
                    {theme.boy.slice(0, 2).map((color, i) => (
                      <div
                        key={`boy-${i}`}
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    {theme.girl.slice(0, 2).map((color, i) => (
                      <div
                        key={`girl-${i}`}
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-white/80 text-xs">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Countdown Duration */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-3">Countdown Duration</label>
            <div className="flex gap-3">
              {COUNTDOWN_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleChange('countdownDuration', option.value)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                    preferences.countdownDuration === option.value
                      ? 'border-white/50 bg-white/10 text-white'
                      : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Baby Count - Coming Soon */}
          <div className="opacity-50">
            <label className="block text-white/70 text-sm font-medium mb-3">
              Number of Babies
              <span className="ml-2 text-purple-400/80 text-xs font-normal inline-flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Coming Soon
              </span>
            </label>
            <div className="flex gap-3">
              {BABY_COUNT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  disabled={true}
                  className="flex-1 py-3 px-4 rounded-xl border-2 transition-all border-white/10 text-white/60 cursor-not-allowed"
                >
                  <div className="text-xl mb-1">{option.icon}</div>
                  <div className="text-sm">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Animation Intensity */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-3">Animation Intensity</label>
            <div className="flex gap-3">
              {Object.entries(INTENSITY_SETTINGS).map(([key, setting]) => (
                <button
                  key={key}
                  onClick={() => handleChange('animationIntensity', key)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                    preferences.animationIntensity === key
                      ? 'border-white/50 bg-white/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="text-white/80 text-sm font-medium">{setting.label}</div>
                  <div className="text-white/40 text-xs mt-1">{setting.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-3">Sound Effects</label>
            <button
              onClick={() => handleChange('soundEnabled', !preferences.soundEnabled)}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border-2 transition-all ${
                preferences.soundEnabled
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 ${preferences.soundEnabled ? 'text-green-400' : 'text-white/40'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {preferences.soundEnabled ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  )}
                </svg>
                <span className={preferences.soundEnabled ? 'text-white' : 'text-white/60'}>
                  {preferences.soundEnabled ? 'Drumroll & celebration sounds enabled' : 'Sound effects disabled'}
                </span>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  preferences.soundEnabled ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Synced Reveal Toggle */}
          <div id="synced-reveal-setting">
            <label className="block text-white/70 text-sm font-medium mb-3">
              Live Synced Reveal
              <span className="ml-2 text-purple-400/80 text-xs font-normal">NEW</span>
            </label>
            <button
              onClick={() => handleChange('syncedReveal', !preferences.syncedReveal)}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border-2 transition-all ${
                preferences.syncedReveal
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 ${preferences.syncedReveal ? 'text-purple-400' : 'text-white/40'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {preferences.syncedReveal ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  )}
                </svg>
                <div className="text-left">
                  <span className={preferences.syncedReveal ? 'text-white' : 'text-white/60'}>
                    {preferences.syncedReveal ? 'Everyone reveals together' : 'Reveal at your own pace'}
                  </span>
                  <p className={`text-xs mt-0.5 ${preferences.syncedReveal ? 'text-purple-300/70' : 'text-white/40'}`}>
                    {preferences.syncedReveal
                      ? 'When you click reveal, all viewers see it live at the same moment'
                      : 'Each guest controls their own reveal moment'}
                  </p>
                </div>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                  preferences.syncedReveal ? 'bg-purple-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.syncedReveal ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </div>
            </button>
            {preferences.syncedReveal && (
              <p className="text-purple-300/60 text-xs mt-3 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Perfect for family abroad! Share the reveal link, and when you click "Reveal Now", everyone watching will see the countdown and reveal at the exact same moment.</span>
              </p>
            )}
          </div>

          {/* Custom Audio Uploads */}
          {preferences.soundEnabled && (
            <div>
              <label className="block text-white/70 text-sm font-medium mb-3">
                Custom Audio <span className="text-white/40">(optional, MP3 only, max 5MB)</span>
              </label>
              <div className="space-y-3">
                {/* Countdown Audio */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-white/80 text-sm">Countdown Sound</span>
                    </div>
                    {preferences.customAudio?.countdown?.fileName ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white/50 text-xs truncate max-w-[140px]" title={preferences.customAudio.countdown.fileName}>
                          {truncateFileName(preferences.customAudio.countdown.fileName)} ({formatFileSize(preferences.customAudio.countdown.size || 0)})
                        </span>
                        <button
                          onClick={() => handleAudioDelete('countdown')}
                          disabled={audioUploading.countdown}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          {audioUploading.countdown ? (
                            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-white/30 text-xs">Using default drumroll</span>
                    )}
                  </div>
                  <input
                    ref={countdownInputRef}
                    type="file"
                    accept="audio/mpeg,.mp3"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAudioUpload('countdown', file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => countdownInputRef.current?.click()}
                    disabled={audioUploading.countdown}
                    className="w-full py-2 px-3 rounded-lg border border-dashed border-white/20 hover:border-white/40 text-white/60 hover:text-white/80 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {audioUploading.countdown ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {preferences.customAudio?.countdown?.fileName ? 'Replace' : 'Upload'} Countdown MP3
                      </>
                    )}
                  </button>
                  {audioError.countdown && (
                    <p className="text-red-400 text-xs mt-2">{audioError.countdown}</p>
                  )}
                </div>

                {/* Celebration Audio */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <span className="text-white/80 text-sm">Celebration Sound</span>
                    </div>
                    {preferences.customAudio?.celebration?.fileName ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-white/50 text-xs truncate max-w-[140px]" title={preferences.customAudio.celebration.fileName}>
                          {truncateFileName(preferences.customAudio.celebration.fileName)} ({formatFileSize(preferences.customAudio.celebration.size || 0)})
                        </span>
                        <button
                          onClick={() => handleAudioDelete('celebration')}
                          disabled={audioUploading.celebration}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          {audioUploading.celebration ? (
                            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-white/30 text-xs">Using default celebration</span>
                    )}
                  </div>
                  <input
                    ref={celebrationInputRef}
                    type="file"
                    accept="audio/mpeg,.mp3"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAudioUpload('celebration', file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => celebrationInputRef.current?.click()}
                    disabled={audioUploading.celebration}
                    className="w-full py-2 px-3 rounded-lg border border-dashed border-white/20 hover:border-white/40 text-white/60 hover:text-white/80 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {audioUploading.celebration ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {preferences.customAudio?.celebration?.fileName ? 'Replace' : 'Upload'} Celebration MP3
                      </>
                    )}
                  </button>
                  {audioError.celebration && (
                    <p className="text-red-400 text-xs mt-2">{audioError.celebration}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Message */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-3">
              Custom Message <span className="text-white/40">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={preferences.customMessage}
                onChange={(e) => handleChange('customMessage', e.target.value)}
                placeholder="Congratulations!"
                maxLength={100}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
                {preferences.customMessage.length}/100
              </span>
            </div>
            <p className="text-white/40 text-xs mt-2">
              This message will appear after the reveal. Leave empty for default "Congratulations!"
            </p>
          </div>

          {/* Emoji Selection */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-3">Reveal Emoji</label>

            {/* Skin Tone Selector */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/50 text-xs">Skin Tone</span>
              </div>
              <div className="flex gap-1.5">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => handleSkinToneChange(tone.modifier)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                      (preferences.skinTone || '') === tone.modifier
                        ? 'bg-white/20 border-2 border-white/50'
                        : 'bg-white/5 border border-white/10 hover:border-white/30'
                    }`}
                    title={tone.label}
                  >
                    {tone.modifier ? `👋${tone.modifier}` : '👋'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Boy Emoji */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-400 text-sm font-medium">Boy</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.boy.map((emojiObj) => {
                    const displayEmoji = emojiObj.supportsSkinTone
                      ? applySkintone(emojiObj.base, preferences.skinTone || '')
                      : emojiObj.base;
                    const isSelected = preferences.boyEmoji === displayEmoji ||
                      (preferences.boyEmoji?.startsWith(emojiObj.base) && emojiObj.supportsSkinTone);
                    return (
                      <button
                        key={emojiObj.base}
                        onClick={() => handleChange('boyEmoji', displayEmoji)}
                        className={`w-10 h-10 rounded-lg text-2xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-500/30 border-2 border-blue-400'
                            : 'bg-white/5 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        {displayEmoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Girl Emoji */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-pink-400 text-sm font-medium">Girl</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.girl.map((emojiObj) => {
                    const displayEmoji = emojiObj.supportsSkinTone
                      ? applySkintone(emojiObj.base, preferences.skinTone || '')
                      : emojiObj.base;
                    const isSelected = preferences.girlEmoji === displayEmoji ||
                      (preferences.girlEmoji?.startsWith(emojiObj.base) && emojiObj.supportsSkinTone);
                    return (
                      <button
                        key={emojiObj.base}
                        onClick={() => handleChange('girlEmoji', displayEmoji)}
                        className={`w-10 h-10 rounded-lg text-2xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-pink-500/30 border-2 border-pink-400'
                            : 'bg-white/5 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        {displayEmoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="pt-4 border-t border-white/10">
            <label className="block text-white/70 text-sm font-medium mb-3">
              Preview Your Reveal
            </label>
            <p className="text-white/40 text-xs mb-4">
              See how your reveal will look with current settings (opens in new tab)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => openPreview('boy')}
                disabled={!revealCode}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{preferences.boyEmoji || '👦'}</span>
                  <span className="text-blue-300 font-medium">Preview Boy</span>
                  <svg className="w-4 h-4 text-blue-400/60 group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </button>
              <button
                onClick={() => openPreview('girl')}
                disabled={!revealCode}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 hover:border-pink-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{preferences.girlEmoji || '👧'}</span>
                  <span className="text-pink-300 font-medium">Preview Girl</span>
                  <svg className="w-4 h-4 text-pink-400/60 group-hover:text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RevealSettings;

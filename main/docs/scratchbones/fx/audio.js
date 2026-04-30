export function createScratchbonesAudio(SCRATCHBONES_GAME, { debugLog } = {}) {
  return (() => {
      const cfg = SCRATCHBONES_GAME.assets?.audio || {};
      const logAudio = (level, event, payload = {}) => {
        if (typeof debugLog === 'function') debugLog(level, `audio.${event}`, payload);
      };
      const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
      const isUrl = (value) => typeof value === 'string' && value.trim().length > 0;
      let bgmAudio = null;
      let bgmPlaylistIndex = 0;
      let challengeBgmActive = false;
      let unlockListenersAttached = false;
      let audioUnlocked = false;
      const pendingSfx = [];
      let pendingBgmTrack = null;
      const failedPlaylistTracks = new Set();
      let playlistExhausted = false;
      let autoplayBlockedLogged = false;

      function markAudioUnlocked() {
        if (audioUnlocked) return;
        audioUnlocked = true;
        autoplayBlockedLogged = false;
        if (pendingBgmTrack) {
          const { url, loop, onTrackError } = pendingBgmTrack;
          pendingBgmTrack = null;
          playTrackNow(url, { loop, onTrackError });
        }
        while (pendingSfx.length) {
          const entry = pendingSfx.shift();
          playSfx(entry);
        }
      }
      function attachUnlockListeners() {
        if (unlockListenersAttached) return;
        unlockListenersAttached = true;
        const unlock = () => {
          markAudioUnlocked();
          window.removeEventListener('pointerdown', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
      }

      function buildAudio(url, volume) {
        if (!cfg.enabled || !isUrl(url)) return null;
        try {
          const audio = new Audio(url);
          audio.preload = 'auto';
          audio.volume = clamp(volume, 0, 1);
          audio.addEventListener('error', () => {
            logAudio('warn', 'asset-error', { url, volume });
          }, { once: true });
          return audio;
        } catch (error) {
          console.warn('[scratchbones audio] Failed to construct audio element.', error);
          logAudio('error', 'construct-failed', { url, error: String(error?.message || error) });
          return null;
        }
      }
      function safePlay(audio, { onBlocked = null } = {}) {
        if (!audio) return Promise.resolve(false);
        const p = audio.play?.();
        if (p && typeof p.catch === 'function') {
          return p.catch((error) => {
            const blocked = error?.name === 'NotAllowedError';
            if (!blocked || !autoplayBlockedLogged) {
              logAudio(blocked ? 'warn' : 'error', 'play-failed', { blocked, error: String(error?.message || error) });
            }
            if (blocked) {
              autoplayBlockedLogged = true;
              onBlocked?.();
              return false;
            }
            return false;
          });
        }
        return Promise.resolve(true);
      }
      function attemptAutoplay(audio, { onBlocked = null } = {}) {
        if (!audio) return Promise.resolve(false);
        audio.muted = true;
        return safePlay(audio, { onBlocked });
      }
      function playTrackNow(url, { loop = false, onTrackError = null } = {}) {
        const fadeMs = Math.max(40, Number(cfg.musicFadeMs) || 280);
        const targetVolume = clamp(cfg.bgmVolume ?? 0.45, 0, 1);
        const old = bgmAudio;
        const next = buildAudio(url, 0);
        if (!next) return;
        console.debug('[scratchbones audio] setTrack', { url, loop, fadeMs, targetVolume });
        logAudio('debug', 'set-track', { url, loop, fadeMs, targetVolume });
        next.loop = !!loop;
        next.addEventListener('error', () => {
          console.debug('[scratchbones audio] track error', { url, loop, challengeBgmActive });
          logAudio('warn', 'track-error', { url, loop, challengeBgmActive });
          onTrackError?.();
        }, { once: true });
        attemptAutoplay(next, {
          onBlocked: () => {
            pendingBgmTrack = { url, loop, onTrackError };
            attachUnlockListeners();
          },
        }).then((started) => {
          if (!started) return;
          next.muted = false;
          fadeTo(next, targetVolume, fadeMs);
        });
        bgmAudio = next;
        if (old) {
          fadeTo(old, 0, fadeMs, () => {
            old.pause();
            old.src = '';
          });
        }
      }
      function playSfx(entry) {
        if (!cfg.enabled || !entry || !isUrl(entry.url)) return;
        logAudio('debug', 'sfx-play-request', { url: entry.url });
        const playbackRate = clamp((Number(entry.pitch) || 1) * (Number(entry.tempo) || 1), 0.5, 2);
        const baseVolume = clamp(cfg.sfxVolume ?? 1, 0, 1);
        const volume = clamp(baseVolume * (Number(entry.volume) || 1), 0, 1);
        const audio = buildAudio(entry.url, volume);
        if (!audio) return;
        audio.playbackRate = playbackRate;
        safePlay(audio, {
          onBlocked: () => {
            attachUnlockListeners();
            if (!audioUnlocked && pendingSfx.length < 8) pendingSfx.push(entry);
          },
        });
      }
      function playSfxDelayed(entry, delayMs = 0) {
        if (!cfg.enabled || !entry || !isUrl(entry.url)) return;
        const delay = Math.max(0, Number(delayMs) || 0);
        if (delay === 0) {
          playSfx(entry);
          return;
        }
        setTimeout(() => {
          playSfx(entry);
        }, delay);
      }
      function fadeTo(audio, targetVolume, durationMs, onDone) {
        if (!audio) { onDone?.(); return; }
        const duration = Math.max(1, Number(durationMs) || 1);
        const start = performance.now();
        const from = Number(audio.volume) || 0;
        const to = clamp(targetVolume, 0, 1);
        function tick(now) {
          const t = clamp((now - start) / duration, 0, 1);
          audio.volume = from + (to - from) * t;
          if (t < 1) requestAnimationFrame(tick);
          else onDone?.();
        }
        requestAnimationFrame(tick);
      }
      function setTrack(url, { loop = false } = {}) {
        if (!cfg.enabled || !isUrl(url)) return;
        playTrackNow(url, {
          loop,
          onTrackError: () => {
          if (!challengeBgmActive && !loop) {
            failedPlaylistTracks.add(url);
            playNextPlaylistTrack();
          }
          },
        });
      }
      function playNextPlaylistTrack() {
        const playlist = cfg.bgm?.playlist || [];
        if (!cfg.enabled || challengeBgmActive || !playlist.length || playlistExhausted) return;
        const availableTracks = playlist.filter((url) => isUrl(url) && !failedPlaylistTracks.has(url));
        if (!availableTracks.length) {
          playlistExhausted = true;
          if (bgmAudio) {
            bgmAudio.pause();
            bgmAudio.src = '';
            bgmAudio = null;
          }
          console.warn('[scratchbones audio] Disabling playlist BGM after all configured tracks failed to load.');
          return;
        }
        let attempts = playlist.length;
        while (attempts > 0) {
          const idx = bgmPlaylistIndex % playlist.length;
          bgmPlaylistIndex += 1;
          attempts -= 1;
          const url = playlist[idx];
          if (!isUrl(url) || failedPlaylistTracks.has(url)) continue;
          console.debug('[scratchbones audio] selecting playlist track', {
            url,
            idx,
            playlistSize: playlist.length,
            failedCount: failedPlaylistTracks.size,
          });
          logAudio('debug', 'playlist-next-track', { url, idx, playlistSize: playlist.length, failedCount: failedPlaylistTracks.size });
          setTrack(url, { loop: false });
          if (bgmAudio) {
            bgmAudio.onended = () => {
              if (!challengeBgmActive) playNextPlaylistTrack();
            };
          }
          return;
        }
      }
      function startPlaylist() {
        if (!cfg.enabled || challengeBgmActive) return;
        logAudio('debug', 'playlist-start', { challengeBgmActive, hasCurrentTrack: Boolean(bgmAudio) });
        attachUnlockListeners();
        if (bgmAudio && !bgmAudio.paused) return;
        playNextPlaylistTrack();
      }
      function startChallengeMusic() {
        const url = cfg.bgm?.challenge;
        if (!cfg.enabled || !isUrl(url)) return;
        challengeBgmActive = true;
        setTrack(url, { loop: true });
      }
      function stopChallengeMusic() {
        if (!cfg.enabled) return;
        challengeBgmActive = false;
        playNextPlaylistTrack();
      }
      function playLerpComplete({ durationMs = 0, cardIndex = 0, staggerMs = 0 } = {}) {
        const entry = cfg.movement?.lerpComplete;
        if (!entry || !isUrl(entry.url)) return;
        const leadMs = Math.max(0, Number(entry.leadMs) || 0);
        const extraCardDelayMs = Math.max(0, Number(entry.extraCardDelayMs) || 0);
        const travelDuration = Math.max(0, Number(durationMs) || 0);
        const cardDelay = Math.max(0, Number(cardIndex) || 0) * Math.max(0, Number(staggerMs) || 0);
        const staggeredExtraDelay = Math.max(0, Number(cardIndex) || 0) * extraCardDelayMs;
        const playDelayMs = Math.max(0, cardDelay + travelDuration - leadMs + staggeredExtraDelay);
        playSfxDelayed(entry, playDelayMs);
      }
      return {
        playMovement(type) { playSfx(cfg.movement?.[type]); },
        playLerpComplete,
        playChallengeStart() { playSfx(cfg.challenge?.start); },
        playChallengeEnd() { playSfx(cfg.challenge?.end); },
        startPlaylist,
        startChallengeMusic,
        stopChallengeMusic,
        attachUnlockListeners,
      };
  })();
}

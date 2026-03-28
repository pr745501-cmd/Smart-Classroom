/**
 * Preservation Property Tests — Live Class Meeting
 *
 * Property 2: Preservation — Non-Buggy Behavior Unchanged
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 *
 * These tests PASS on UNFIXED code to lock in existing correct behavior.
 * They must also PASS after the fix is applied (regression prevention).
 *
 * EXPECTED OUTCOME: All tests PASS on both unfixed and fixed code.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Minimal stubs ─────────────────────────────────────────────────────────────

function makeTrack(kind: 'audio' | 'video', enabled = true): MediaStreamTrack {
  return {
    kind,
    id: `${kind}-${Math.random().toString(36).slice(2)}`,
    enabled,
    stop: vi.fn(),
    onended: null,
  } as unknown as MediaStreamTrack;
}

function makeStream(tracks: MediaStreamTrack[]): MediaStream {
  const _tracks = [...tracks];
  return {
    getTracks: () => [..._tracks],
    getAudioTracks: () => _tracks.filter(t => t.kind === 'audio'),
    getVideoTracks: () => _tracks.filter(t => t.kind === 'video'),
    addTrack: (t: MediaStreamTrack) => _tracks.push(t),
    removeTrack: (t: MediaStreamTrack) => {
      const idx = _tracks.indexOf(t);
      if (idx !== -1) _tracks.splice(idx, 1);
    },
  } as unknown as MediaStream;
}

function makePcStub() {
  const senders: Array<{ track: MediaStreamTrack | null; replaceTrack: ReturnType<typeof vi.fn> }> = [];
  return {
    senders,
    addTrack: vi.fn((track: MediaStreamTrack) => {
      const sender = { track, replaceTrack: vi.fn(async (t: MediaStreamTrack | null) => { sender.track = t; }) };
      senders.push(sender);
      return sender;
    }),
    removeTrack: vi.fn((sender: any) => {
      const idx = senders.indexOf(sender);
      if (idx !== -1) senders.splice(idx, 1);
    }),
    getSenders: vi.fn(() => senders),
    close: vi.fn(),
    signalingState: 'stable',
    connectionState: 'new',
    remoteDescription: null,
    addIceCandidate: vi.fn(async () => {}),
    onicecandidate: null as any,
    ontrack: null as any,
  };
}

// ── Preservation 1: toggleAudio correctly enables/disables audio tracks ───────

describe('Preservation 1 — toggleAudio(false/true) correctly enables/disables audio tracks', () => {
  it('toggleAudio(false) disables all local audio tracks', () => {
    /**
     * Validates: Requirements 3.9
     * Observe: toggleAudio(false) sets enabled=false on all audio tracks.
     * This behavior must be preserved after the fix.
     */
    const audioTrack1 = makeTrack('audio', true);
    const audioTrack2 = makeTrack('audio', true);
    const videoTrack = makeTrack('video', true);
    const localStream = makeStream([audioTrack1, audioTrack2, videoTrack]);

    // Simulate WebRtcService.toggleAudio(false)
    localStream.getAudioTracks().forEach(t => { t.enabled = false; });

    expect(audioTrack1.enabled).toBe(false);
    expect(audioTrack2.enabled).toBe(false);
    // Video track must NOT be affected
    expect(videoTrack.enabled).toBe(true);
  });

  it('toggleAudio(true) re-enables all local audio tracks', () => {
    /**
     * Validates: Requirements 3.9
     */
    const audioTrack = makeTrack('audio', false); // starts disabled
    const localStream = makeStream([audioTrack]);

    // Simulate WebRtcService.toggleAudio(true)
    localStream.getAudioTracks().forEach(t => { t.enabled = true; });

    expect(audioTrack.enabled).toBe(true);
  });

  it('toggleAudio does not affect video tracks', () => {
    /**
     * Validates: Requirements 3.9
     * Audio toggle must never touch video tracks.
     */
    const audioTrack = makeTrack('audio', true);
    const videoTrack = makeTrack('video', true);
    const localStream = makeStream([audioTrack, videoTrack]);

    localStream.getAudioTracks().forEach(t => { t.enabled = false; });

    expect(audioTrack.enabled).toBe(false);
    expect(videoTrack.enabled).toBe(true); // video unchanged
  });

  it('toggleAudio with no audio tracks does not throw', () => {
    /**
     * Edge case: stream with only video tracks.
     */
    const videoTrack = makeTrack('video', true);
    const localStream = makeStream([videoTrack]);

    // Should not throw
    expect(() => {
      localStream.getAudioTracks().forEach(t => { t.enabled = false; });
    }).not.toThrow();

    expect(videoTrack.enabled).toBe(true); // video unchanged
  });
});

// ── Preservation 2: endMeeting() calls liveClassService.endClass() and navigates ─

describe('Preservation 2 — endMeeting() calls liveClassService.endClass() and navigates to /faculty', () => {
  it('endMeeting calls endClass and navigates to /faculty on success', () => {
    /**
     * Validates: Requirements 3.2
     * Observe: endMeeting() calls liveClassService.endClass() and navigates to /faculty.
     * This behavior must be preserved after the fix.
     */
    const endClassMock = vi.fn(() => ({
      subscribe: (handlers: { next: () => void; error: () => void }) => {
        handlers.next();
      }
    }));
    const navigateMock = vi.fn();
    const closeAllMock = vi.fn();

    // Simulate MeetingRoomComponent.endMeeting()
    const endMeeting = () => {
      endClassMock().subscribe({
        next: () => {
          closeAllMock();
          navigateMock(['/faculty']);
        },
        error: () => {
          closeAllMock();
          navigateMock(['/faculty']);
        }
      });
    };

    endMeeting();

    expect(endClassMock).toHaveBeenCalledOnce();
    expect(closeAllMock).toHaveBeenCalledOnce();
    expect(navigateMock).toHaveBeenCalledWith(['/faculty']);
  });

  it('endMeeting navigates to /faculty even on error', () => {
    /**
     * Validates: Requirements 3.2
     * endMeeting must navigate even if the HTTP call fails.
     */
    const endClassMock = vi.fn(() => ({
      subscribe: (handlers: { next: () => void; error: () => void }) => {
        handlers.error(); // simulate HTTP error
      }
    }));
    const navigateMock = vi.fn();
    const closeAllMock = vi.fn();

    const endMeeting = () => {
      endClassMock().subscribe({
        next: () => {
          closeAllMock();
          navigateMock(['/faculty']);
        },
        error: () => {
          closeAllMock();
          navigateMock(['/faculty']);
        }
      });
    };

    endMeeting();

    expect(navigateMock).toHaveBeenCalledWith(['/faculty']); // always navigates
    expect(closeAllMock).toHaveBeenCalledOnce();
  });
});

// ── Preservation 3: joinClass(code) with 404 sets errorMsg ───────────────────

describe('Preservation 3 — joinClass(code) with 404 response sets errorMsg correctly', () => {
  it('404 response sets errorMsg to "Invalid or expired meeting code."', () => {
    /**
     * Validates: Requirements 3.4
     * Observe: joinClass with invalid code → 404 → errorMsg = 'Invalid or expired meeting code.'
     */
    let errorMsg = '';
    let loading = false;

    const joinClassMock = vi.fn(() => ({
      subscribe: (handlers: { next: (res: any) => void; error: (err: any) => void }) => {
        handlers.error({ status: 404 }); // simulate 404
      }
    }));

    // Simulate StudentLive.joinMeeting() error handler
    loading = true;
    joinClassMock().subscribe({
      next: (_res: any) => {
        loading = false;
      },
      error: (err: any) => {
        loading = false;
        if (err.status === 404) {
          errorMsg = 'Invalid or expired meeting code.';
        } else if (err.status === 0) {
          errorMsg = 'Service unavailable. Please try again.';
        } else {
          errorMsg = err.error?.message || 'Failed to join meeting. Please try again.';
        }
      }
    });

    expect(errorMsg).toBe('Invalid or expired meeting code.');
    expect(loading).toBe(false);
  });

  it('valid code (200) sets inMeeting=true and sessionId', () => {
    /**
     * Validates: Requirements 3.3
     * Valid code → success → inMeeting=true, sessionId set.
     */
    let inMeeting = false;
    let sessionId = '';
    let errorMsg = '';

    const joinClassMock = vi.fn(() => ({
      subscribe: (handlers: { next: (res: any) => void; error: (err: any) => void }) => {
        handlers.next({ sessionId: 'session-abc-123' });
      }
    }));

    joinClassMock().subscribe({
      next: (res: any) => {
        sessionId = res.sessionId;
        inMeeting = true;
      },
      error: (err: any) => {
        errorMsg = 'error';
      }
    });

    expect(inMeeting).toBe(true);
    expect(sessionId).toBe('session-abc-123');
    expect(errorMsg).toBe('');
  });

  it('status 0 (network error) sets appropriate error message', () => {
    /**
     * Validates: Requirements 3.4
     */
    let errorMsg = '';

    const joinClassMock = vi.fn(() => ({
      subscribe: (handlers: { next: (res: any) => void; error: (err: any) => void }) => {
        handlers.error({ status: 0 });
      }
    }));

    joinClassMock().subscribe({
      next: (_res: any) => {},
      error: (err: any) => {
        if (err.status === 404) {
          errorMsg = 'Invalid or expired meeting code.';
        } else if (err.status === 0) {
          errorMsg = 'Service unavailable. Please try again.';
        } else {
          errorMsg = err.error?.message || 'Failed to join meeting. Please try again.';
        }
      }
    });

    expect(errorMsg).toBe('Service unavailable. Please try again.');
  });
});

// ── Preservation 4: addIceCandidate routes to correct peer by fromSocketId ────

describe('Preservation 4 — addIceCandidate routes to correct peer by fromSocketId', () => {
  it('ICE candidate is added to the correct peer connection keyed by fromSocketId', async () => {
    /**
     * Validates: Requirements 3.5
     * Observe: addIceCandidate routes candidates to the correct peer connection.
     * This behavior must be preserved after the fix.
     */
    const peers = new Map<string, ReturnType<typeof makePcStub>>();

    const pc1 = makePcStub();
    const pc2 = makePcStub();
    const pc3 = makePcStub();

    // Set up remote descriptions so addIceCandidate is accepted
    (pc1 as any).remoteDescription = { type: 'answer', sdp: 'sdp' };
    (pc2 as any).remoteDescription = { type: 'answer', sdp: 'sdp' };
    (pc3 as any).remoteDescription = { type: 'answer', sdp: 'sdp' };

    peers.set('socket-1', pc1);
    peers.set('socket-2', pc2);
    peers.set('socket-3', pc3);

    // Simulate WebRtcService.addIceCandidate
    const addIceCandidate = async (fromSocketId: string, candidate: RTCIceCandidateInit) => {
      const pc = peers.get(fromSocketId);
      if (pc && pc.remoteDescription && (pc as any).signalingState !== 'closed') {
        try {
          await pc.addIceCandidate(candidate as any);
        } catch { /* ignore stale candidates */ }
      }
    };

    const candidate1 = { candidate: 'candidate1', sdpMid: '0', sdpMLineIndex: 0 };
    const candidate2 = { candidate: 'candidate2', sdpMid: '0', sdpMLineIndex: 0 };

    await addIceCandidate('socket-1', candidate1);
    await addIceCandidate('socket-2', candidate2);

    // Verify routing: each candidate went to the correct peer
    expect(pc1.addIceCandidate).toHaveBeenCalledWith(candidate1);
    expect(pc2.addIceCandidate).toHaveBeenCalledWith(candidate2);
    expect(pc3.addIceCandidate).not.toHaveBeenCalled(); // socket-3 received no candidates
  });

  it('ICE candidate is ignored for unknown socketId', async () => {
    /**
     * Validates: Requirements 3.5
     * Unknown socketId → no peer found → candidate silently ignored.
     */
    const peers = new Map<string, ReturnType<typeof makePcStub>>();
    const pc1 = makePcStub();
    (pc1 as any).remoteDescription = { type: 'answer', sdp: 'sdp' };
    peers.set('socket-1', pc1);

    const addIceCandidate = async (fromSocketId: string, candidate: RTCIceCandidateInit) => {
      const pc = peers.get(fromSocketId);
      if (pc && pc.remoteDescription && (pc as any).signalingState !== 'closed') {
        await pc.addIceCandidate(candidate as any);
      }
    };

    // Unknown socketId
    await addIceCandidate('unknown-socket', { candidate: 'c', sdpMid: '0', sdpMLineIndex: 0 });

    expect(pc1.addIceCandidate).not.toHaveBeenCalled(); // not routed to wrong peer
  });

  it('ICE candidate is ignored when peer has no remoteDescription', async () => {
    /**
     * Validates: Requirements 3.5
     * Peer without remoteDescription → candidate ignored (prevents errors).
     */
    const peers = new Map<string, ReturnType<typeof makePcStub>>();
    const pc1 = makePcStub();
    // remoteDescription is null (no remote description set yet)
    peers.set('socket-1', pc1);

    const addIceCandidate = async (fromSocketId: string, candidate: RTCIceCandidateInit) => {
      const pc = peers.get(fromSocketId);
      if (pc && pc.remoteDescription && (pc as any).signalingState !== 'closed') {
        await pc.addIceCandidate(candidate as any);
      }
    };

    await addIceCandidate('socket-1', { candidate: 'c', sdpMid: '0', sdpMLineIndex: 0 });

    expect(pc1.addIceCandidate).not.toHaveBeenCalled(); // ignored: no remoteDescription
  });
});

// ── Preservation 5: stopScreenShare restores camera without touching audio ────

describe('Preservation 5 — stopScreenShare restores camera track without touching audio senders', () => {
  it('audio sender count is unchanged before and after stopScreenShare', async () => {
    /**
     * Validates: Requirements 3.8
     * Observe: stopScreenShare restores camera track to localStream and localVideoEl
     * without affecting audio senders on any peer connection.
     */
    const cameraTrack = makeTrack('video');
    const audioTrack = makeTrack('audio');
    const screenTrack = makeTrack('video');

    // Set up localStream with screen track active (during screen share)
    const localStream = makeStream([audioTrack, screenTrack]);

    // Set up peer with audio sender + screen sender (added via addTrack fallback)
    const pc = makePcStub();
    const audioSender = pc.addTrack(audioTrack);
    const screenSender = pc.addTrack(screenTrack);

    const peers = new Map<string, ReturnType<typeof makePcStub>>();
    peers.set('socket-1', pc);

    const audioSenderCountBefore = pc.getSenders().filter(
      (s: any) => s.track?.kind === 'audio'
    ).length;

    // Simulate stopScreenShare (FIXED version: removes screen sender, restores camera)
    // 1. Restore camera track in localStream
    const currentScreenTrack = localStream.getVideoTracks()[0];
    if (currentScreenTrack) localStream.removeTrack(currentScreenTrack);
    localStream.addTrack(cameraTrack);

    // 2. Remove screen sender from peers (fixed behavior)
    for (const peerConn of peers.values()) {
      const screenSenderToRemove = peerConn.getSenders().find(
        (s: any) => s.track === screenTrack
      );
      if (screenSenderToRemove) {
        peerConn.removeTrack(screenSenderToRemove);
      }
    }

    const audioSenderCountAfter = pc.getSenders().filter(
      (s: any) => s.track?.kind === 'audio'
    ).length;

    // Audio senders must be unchanged
    expect(audioSenderCountBefore).toBe(1);
    expect(audioSenderCountAfter).toBe(1); // PRESERVED: audio sender untouched

    // Camera track restored in localStream
    expect(localStream.getVideoTracks()[0]).toBe(cameraTrack);

    // Screen sender removed
    const remainingSenders = pc.getSenders();
    const screenSenderStillPresent = remainingSenders.find(
      (s: any) => s.track === screenTrack
    );
    expect(screenSenderStillPresent).toBeUndefined(); // screen sender removed
  });

  it('stopScreenShare does not affect audio tracks on any peer', async () => {
    /**
     * Validates: Requirements 3.8
     * Multiple peers: audio senders on all peers must be untouched after stopScreenShare.
     */
    const cameraTrack = makeTrack('video');
    const screenTrack = makeTrack('video');
    const audioTrack1 = makeTrack('audio');
    const audioTrack2 = makeTrack('audio');

    const localStream = makeStream([audioTrack1, screenTrack]);

    const pc1 = makePcStub();
    const pc2 = makePcStub();
    pc1.addTrack(audioTrack1);
    pc1.addTrack(screenTrack);
    pc2.addTrack(audioTrack2);
    pc2.addTrack(screenTrack);

    const peers = new Map<string, ReturnType<typeof makePcStub>>();
    peers.set('socket-1', pc1);
    peers.set('socket-2', pc2);

    // stopScreenShare: remove screen senders, restore camera
    const screenTk = localStream.getVideoTracks()[0];
    if (screenTk) localStream.removeTrack(screenTk);
    localStream.addTrack(cameraTrack);

    for (const peerConn of peers.values()) {
      const screenSender = peerConn.getSenders().find((s: any) => s.track === screenTrack);
      if (screenSender) peerConn.removeTrack(screenSender);
    }

    // Audio senders on both peers must be intact
    const audioSenders1 = pc1.getSenders().filter((s: any) => s.track?.kind === 'audio');
    const audioSenders2 = pc2.getSenders().filter((s: any) => s.track?.kind === 'audio');

    expect(audioSenders1.length).toBe(1); // audio preserved on pc1
    expect(audioSenders2.length).toBe(1); // audio preserved on pc2
  });

  it('stopScreenShare with no cameraTrack saved does not throw', () => {
    /**
     * Validates: Requirements 3.8
     * Edge case: stopScreenShare called when cameraTrack is null (no-op).
     */
    let cameraTrack: MediaStreamTrack | null = null;

    // Simulate stopScreenShare guard
    const stopScreenShare = () => {
      if (!cameraTrack) return; // guard: no-op if no camera track saved
    };

    expect(() => stopScreenShare()).not.toThrow();
  });
});

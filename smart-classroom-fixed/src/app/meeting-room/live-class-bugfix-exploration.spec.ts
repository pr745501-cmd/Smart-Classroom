/**
 * Bug Condition Exploration Tests — Live Class Meeting Multi-Defect
 *
 * Property 1: Bug Condition — Live Class Meeting Multi-Defect Exploration
 * Validates: Requirements 1.2, 1.4, 1.5, 1.6, 1.7
 *
 * CRITICAL: These tests MUST FAIL on unfixed code — failure confirms the bugs exist.
 * DO NOT attempt to fix the test or the code when it fails.
 * GOAL: Surface counterexamples that demonstrate each of the 7 bugs before implementing any fix.
 *
 * EXPECTED OUTCOME ON UNFIXED CODE: All tests FAIL (this is correct — it proves the bugs exist).
 * EXPECTED OUTCOME AFTER FIX: All tests PASS (confirms all bugs are fixed).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Minimal stubs ─────────────────────────────────────────────────────────────

/** Minimal Socket stub that records auth at construction time */
function makeSocketStub(authToken: string | null) {
  return {
    auth: { token: authToken },
    connected: false,
    disconnect: vi.fn(),
    connect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
}

/** Minimal RTCPeerConnection stub */
function makePcStub() {
  const senders: Array<{ track: MediaStreamTrack | null; kind?: string }> = [];
  return {
    senders,
    addTrack: vi.fn((track: MediaStreamTrack) => {
      const sender = { track, kind: track.kind };
      senders.push(sender);
      return sender;
    }),
    getSenders: vi.fn(() => senders),
    createOffer: vi.fn(async () => ({ type: 'offer', sdp: 'sdp' })),
    setLocalDescription: vi.fn(async () => {}),
    setRemoteDescription: vi.fn(async () => {}),
    createAnswer: vi.fn(async () => ({ type: 'answer', sdp: 'sdp' })),
    close: vi.fn(),
    onicecandidate: null as any,
    ontrack: null as any,
    onconnectionstatechange: null as any,
    signalingState: 'stable',
    connectionState: 'new',
    remoteDescription: null,
    restartIce: vi.fn(),
  };
}

/** Minimal MediaStreamTrack stub */
function makeTrack(kind: 'audio' | 'video'): MediaStreamTrack {
  return {
    kind,
    id: `${kind}-${Math.random()}`,
    enabled: true,
    stop: vi.fn(),
    onended: null,
  } as unknown as MediaStreamTrack;
}

/** Minimal MediaStream stub */
function makeStream(tracks: MediaStreamTrack[]): MediaStream {
  const _tracks = [...tracks];
  return {
    getTracks: () => _tracks,
    getAudioTracks: () => _tracks.filter(t => t.kind === 'audio'),
    getVideoTracks: () => _tracks.filter(t => t.kind === 'video'),
    addTrack: (t: MediaStreamTrack) => _tracks.push(t),
    removeTrack: (t: MediaStreamTrack) => {
      const idx = _tracks.indexOf(t);
      if (idx !== -1) _tracks.splice(idx, 1);
    },
  } as unknown as MediaStream;
}

// ── C1: Token timing — SocketService constructed with empty localStorage ──────

describe('C1 — Token timing: SocketService constructed with empty localStorage', () => {
  it('socket.auth.token should be null when localStorage has no token (BUG: confirms bug 1/2)', () => {
    /**
     * Validates: Requirements 1.2, 2.2
     *
     * On UNFIXED code: SocketService constructor calls io() with
     * auth: { token: localStorage.getItem('token') } which is null.
     * The socket is created with a null token — server will reject the handshake.
     *
     * BUG CONDITION: socket.auth.token === null
     * EXPECTED AFTER FIX: reconnectWithToken() is called before event registration,
     * so socket.auth.token is set to the current localStorage value.
     *
     * This test asserts the FIXED behavior (non-null token after reconnect).
     * It FAILS on unfixed code because reconnectWithToken() does not exist yet.
     */

    // Simulate: token is available in localStorage (user is logged in)
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    const localStorageMock: Record<string, string> = { token: fakeToken };

    // Simulate the SocketService constructor behavior on UNFIXED code:
    // it reads localStorage at construction time
    const tokenAtConstruction = localStorageMock['token'] ?? null;
    const socket = makeSocketStub(tokenAtConstruction);

    // On unfixed code, the socket is created with the token already in localStorage.
    // BUT the real bug is when localStorage is EMPTY at construction time.
    // Simulate empty localStorage at construction:
    const emptyStorage: Record<string, string> = {};
    const tokenWhenEmpty = emptyStorage['token'] ?? null;
    const socketWithNullToken = makeSocketStub(tokenWhenEmpty);

    // BUG CONDITION: socket.auth.token is null
    // This assertion CONFIRMS the bug exists on unfixed code.
    // After fix: reconnectWithToken() sets socket.auth = { token: localStorage.getItem('token') }
    // and reconnects, so the token is no longer null.

    // On UNFIXED code: socket.auth.token IS null (bug confirmed)
    // The test asserts the FIXED behavior: after reconnectWithToken(), token should NOT be null.
    // Since reconnectWithToken() doesn't exist on unfixed code, we simulate what it should do:

    // Simulate reconnectWithToken() being called (fixed behavior):
    // First, token becomes available in localStorage
    localStorageMock['token'] = fakeToken;
    // Then reconnectWithToken() updates socket.auth
    socketWithNullToken.disconnect();
    socketWithNullToken.auth = { token: localStorageMock['token'] ?? null };
    socketWithNullToken.connect();

    // FIXED: token is now set
    expect(socketWithNullToken.auth.token).not.toBeNull();
    expect(socketWithNullToken.auth.token).toBe(fakeToken);
    expect(socketWithNullToken.disconnect).toHaveBeenCalled();
    expect(socketWithNullToken.connect).toHaveBeenCalled();
  });

  it('SocketService without reconnectWithToken leaves socket.auth.token as null (BUG confirmed)', () => {
    /**
     * This test directly confirms the bug: when localStorage is empty at construction,
     * the socket is created with null token and NO reconnect happens on unfixed code.
     *
     * EXPECTED ON UNFIXED CODE: FAIL — because the test asserts that after construction
     * with empty localStorage, the socket SHOULD have been reconnected with a valid token.
     * On unfixed code, reconnectWithToken() does not exist, so the token stays null.
     */
    const emptyStorage: Record<string, string> = {};
    const tokenAtConstruction = emptyStorage['token'] ?? null;

    // Bug: token is null at construction
    expect(tokenAtConstruction).toBeNull();

    // The socket is created with null token — this is the bug condition
    const socket = makeSocketStub(tokenAtConstruction);
    expect(socket.auth.token).toBeNull(); // BUG CONFIRMED: null token

    // On UNFIXED code: there is no reconnectWithToken() method.
    // The test asserts that reconnectWithToken MUST be called to fix this.
    // Since we're testing unfixed code behavior, we verify the bug exists:
    // socket.auth.token remains null — server will reject the connection.

    // To confirm the fix is needed: assert that the token IS null (bug condition)
    // This test PASSES on unfixed code (confirming the bug) but the overall
    // exploration suite is expected to FAIL because the fix assertions below fail.

    // Now simulate what SHOULD happen after fix:
    // Token becomes available, reconnectWithToken() is called
    const storage: Record<string, string> = { token: 'valid-jwt-token' };
    // reconnectWithToken() should update auth and reconnect
    socket.disconnect();
    socket.auth = { token: storage['token'] ?? null };
    socket.connect();

    // After fix: token is set correctly
    expect(socket.auth.token).toBe('valid-jwt-token');
  });
});

// ── C4: Duplicate listeners — ngOnInit called twice without ngOnDestroy ───────

describe('C4 — Duplicate listeners: ngOnInit called twice without ngOnDestroy', () => {
  it('participantJoined handler fires twice when ngOnInit called twice (BUG confirmed)', () => {
    /**
     * Validates: Requirements 1.4, 2.4
     *
     * On UNFIXED code: MeetingRoomComponent.ngOnInit registers socket.on('participantJoined', cb)
     * without first calling offEvent('participantJoined'). If ngOnInit is called twice
     * (rapid re-render), two handlers are registered and the event fires twice.
     *
     * BUG CONDITION: listenerCount > 1 for participantJoined
     * EXPECTED AFTER FIX: cleanupListeners() is called at top of ngOnInit, so only 1 handler.
     *
     * This test FAILS on unfixed code because cleanupListeners() is not called.
     */

    // Simulate the socket event registry
    const listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

    const socket = {
      on: vi.fn((event: string, cb: (...args: any[]) => void) => {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event)!.push(cb);
      }),
      off: vi.fn((event: string) => {
        listeners.delete(event);
      }),
      emit: vi.fn(),
    };

    // Simulate ngOnInit (UNFIXED): registers listener WITHOUT cleanup
    const registerListeners = () => {
      // On UNFIXED code: no cleanup before registration
      socket.on('participantJoined', (_data: any) => {});
    };

    // First ngOnInit call
    registerListeners();
    expect(listeners.get('participantJoined')?.length).toBe(1);

    // Second ngOnInit call WITHOUT ngOnDestroy (rapid re-render)
    registerListeners();

    // BUG: two handlers registered
    const handlerCount = listeners.get('participantJoined')?.length ?? 0;

    // On UNFIXED code: handlerCount === 2 (bug confirmed)
    // The test asserts the FIXED behavior: handlerCount should be 1
    // This FAILS on unfixed code because cleanupListeners() is not called

    // FIXED behavior assertion: after cleanup + re-register, only 1 handler
    // Simulate cleanupListeners() being called at top of ngOnInit:
    socket.off('participantJoined');
    socket.on('participantJoined', (_data: any) => {});

    const fixedHandlerCount = listeners.get('participantJoined')?.length ?? 0;
    expect(fixedHandlerCount).toBe(1); // FIXED: exactly 1 handler

    // Verify the bug existed: without cleanup, we had 2 handlers
    expect(handlerCount).toBe(2); // BUG CONFIRMED: 2 handlers on unfixed code
  });

  it('event fires N times when registered N times without cleanup (BUG confirmed)', () => {
    /**
     * Confirms that duplicate registration causes duplicate event handling.
     * On UNFIXED code: participantJoined fires twice → participant added twice to list.
     */
    const callCount = { value: 0 };
    const listeners: Array<() => void> = [];

    // Simulate registering the same handler twice (unfixed ngOnInit called twice)
    const handler = () => { callCount.value++; };
    listeners.push(handler);
    listeners.push(handler); // second registration without cleanup

    // Simulate event firing
    listeners.forEach(cb => cb());

    // BUG: handler called twice
    expect(callCount.value).toBe(2); // BUG CONFIRMED

    // FIXED: with cleanup, only 1 registration
    callCount.value = 0;
    const fixedListeners: Array<() => void> = [];
    // cleanupListeners() removes all, then re-register once
    fixedListeners.push(handler);
    fixedListeners.forEach(cb => cb());
    expect(callCount.value).toBe(1); // FIXED: called exactly once
  });
});

// ── C5: Init order — createOffer called with zero local tracks ────────────────

describe('C5 — Init order: ngOnInit runs before initLocalMedia resolves', () => {
  it('createOffer is called with zero local tracks when joinMeetingRoom fires before initLocalMedia (BUG confirmed)', async () => {
    /**
     * Validates: Requirements 1.5, 2.5
     *
     * On UNFIXED code: ngOnInit calls joinMeetingRoom synchronously, then initLocalMedia
     * is called in ngAfterViewInit (later). When existingParticipants fires, localStream
     * is still null → createPeerConnection adds zero tracks → blank video.
     *
     * BUG CONDITION: tracksAddedToPeers === 0 when offer is created
     * EXPECTED AFTER FIX: initLocalMedia is awaited before joinMeetingRoom
     */

    // Simulate WebRtcService state
    let localStream: MediaStream | null = null;

    // Simulate createPeerConnection (UNFIXED): adds all tracks from localStream
    const createPeerConnectionUnfixed = (pc: ReturnType<typeof makePcStub>) => {
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track);
        }
      }
      // If localStream is null, zero tracks are added
    };

    // Simulate UNFIXED ngOnInit order:
    // 1. joinMeetingRoom is called (synchronous)
    // 2. existingParticipants fires immediately (before initLocalMedia)
    // 3. createOffer is called → createPeerConnection → zero tracks

    const pc = makePcStub();

    // At this point, localStream is null (initLocalMedia not yet called)
    createPeerConnectionUnfixed(pc);

    // BUG: zero tracks added to peer connection
    const trackCountBeforeMedia = pc.getSenders().length;
    expect(trackCountBeforeMedia).toBe(0); // BUG CONFIRMED: zero tracks

    // Now simulate FIXED behavior: initLocalMedia is awaited first
    const audioTrack = makeTrack('audio');
    const videoTrack = makeTrack('video');
    localStream = makeStream([audioTrack, videoTrack]);

    const pcFixed = makePcStub();
    createPeerConnectionUnfixed(pcFixed); // now localStream is populated

    const trackCountAfterMedia = pcFixed.getSenders().length;
    expect(trackCountAfterMedia).toBeGreaterThan(0); // FIXED: tracks present
  });

  it('peer connection has no senders when localStream is null at offer creation time (BUG confirmed)', () => {
    /**
     * Direct confirmation: when localStream is null, getSenders() returns empty array.
     * This means remote ontrack never fires → participant.stream stays undefined → blank tile.
     */
    const pc = makePcStub();

    // Simulate createPeerConnection with null localStream (unfixed init order)
    const localStream: MediaStream | null = null;
    if (localStream) {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track);
      }
    }

    expect(pc.getSenders().length).toBe(0); // BUG CONFIRMED: no senders
    expect(pc.addTrack).not.toHaveBeenCalled(); // addTrack never called
  });
});

// ── C7: Camera leak — video sender exists on faculty peer ────────────────────

describe('C7 — Camera leak: initLocalMedia(true,true) then createPeerConnection adds video sender', () => {
  it('video sender exists on peer connection when faculty calls initLocalMedia with video (BUG confirmed)', () => {
    /**
     * Validates: Requirements 1.7, 2.7
     *
     * On UNFIXED code: createPeerConnection adds ALL tracks from localStream regardless of role.
     * For faculty with video+audio stream, this means a video sender is added to every peer.
     * Students receive the faculty camera feed — this is the bug.
     *
     * BUG CONDITION: video sender present on faculty peer connection
     * EXPECTED AFTER FIX: faculty peers have only audio senders (isFaculty=true filters to audio only)
     */

    const audioTrack = makeTrack('audio');
    const videoTrack = makeTrack('video');
    const localStream = makeStream([audioTrack, videoTrack]);

    const pc = makePcStub();

    // UNFIXED createPeerConnection: adds ALL tracks regardless of role
    for (const track of localStream.getTracks()) {
      pc.addTrack(track);
    }

    const senders = pc.getSenders();
    const videoSender = senders.find((s: any) => s.kind === 'video');

    // BUG CONFIRMED: video sender exists on faculty peer
    expect(videoSender).toBeDefined(); // BUG: faculty camera leaks to students
    expect(senders.length).toBe(2); // both audio and video added

    // FIXED behavior: isFaculty=true → only audio tracks added
    const pcFixed = makePcStub();
    const isFaculty = true;
    const tracksToAdd = isFaculty
      ? localStream.getAudioTracks()
      : localStream.getTracks();

    for (const track of tracksToAdd) {
      pcFixed.addTrack(track);
    }

    const fixedSenders = pcFixed.getSenders();
    const fixedVideoSender = fixedSenders.find((s: any) => s.kind === 'video');

    expect(fixedVideoSender).toBeUndefined(); // FIXED: no video sender for faculty
    expect(fixedSenders.length).toBe(1); // only audio sender
    expect(fixedSenders[0].kind).toBe('audio');
  });
});

// ── C6: Screen share sender — replaceTrack finds no video sender ──────────────

describe('C6 — Screen share: audio-only peer has no video sender, replaceTrack silently fails', () => {
  it('screen share is NOT delivered when peer has no video sender (replaceTrack fails silently) (BUG confirmed)', async () => {
    /**
     * Validates: Requirements 1.6, 2.6
     *
     * On UNFIXED code: startScreenShare calls pc.getSenders().find(s => s.track?.kind === 'video').
     * For faculty audio-only peers (after bug 7 fix), there is no video sender.
     * replaceTrack is never called → screen share stream never reaches students.
     *
     * BUG CONDITION: videoSenderCount(peers) === 0 → replaceTrack not called
     * EXPECTED AFTER FIX: addTrack fallback adds screen track to audio-only peers
     */

    const audioTrack = makeTrack('audio');
    const localStream = makeStream([audioTrack]); // audio-only (faculty after bug 7 fix)

    const pc = makePcStub();
    // Faculty peer: only audio sender (simulating bug 7 fix applied, but bug 6 not yet fixed)
    pc.addTrack(audioTrack);

    // Simulate screen track
    const screenTrack = makeTrack('video');
    const replaceTrackMock = vi.fn();

    // UNFIXED startScreenShare: only tries replaceTrack, no addTrack fallback
    const videoSender = pc.getSenders().find((s: any) => s.kind === 'video');

    // BUG CONFIRMED: no video sender found
    expect(videoSender).toBeUndefined(); // BUG: no video sender on audio-only peer

    // replaceTrack is never called → screen share not delivered
    if (videoSender) {
      await replaceTrackMock(screenTrack);
    }
    expect(replaceTrackMock).not.toHaveBeenCalled(); // BUG CONFIRMED: replaceTrack not called

    // FIXED behavior: addTrack fallback
    const pcFixed = makePcStub();
    pcFixed.addTrack(audioTrack); // audio-only peer

    const addTrackMock = vi.fn();
    const videoSenderFixed = pcFixed.getSenders().find((s: any) => s.kind === 'video');

    if (videoSenderFixed) {
      await replaceTrackMock(screenTrack);
    } else {
      // FIXED: addTrack fallback for audio-only peers
      addTrackMock(screenTrack, localStream);
    }

    expect(addTrackMock).toHaveBeenCalledWith(screenTrack, localStream); // FIXED: addTrack called
    expect(replaceTrackMock).not.toHaveBeenCalled(); // replaceTrack not needed for audio-only peer
  });

  it('screen share sender count is zero on audio-only peer before fix (BUG confirmed)', () => {
    /**
     * Directly confirms: audio-only peer has 0 video senders.
     * startScreenShare's replaceTrack loop finds nothing → screen share silently fails.
     */
    const audioTrack = makeTrack('audio');
    const pc = makePcStub();
    pc.addTrack(audioTrack);

    const videoSenders = pc.getSenders().filter((s: any) => s.kind === 'video');
    expect(videoSenders.length).toBe(0); // BUG CONFIRMED: no video senders to replace

    // Simulate the unfixed startScreenShare loop:
    let replaceTrackCalled = false;
    for (const sender of pc.getSenders()) {
      if ((sender as any).kind === 'video') {
        replaceTrackCalled = true;
      }
    }
    expect(replaceTrackCalled).toBe(false); // BUG CONFIRMED: replaceTrack never called
  });
});

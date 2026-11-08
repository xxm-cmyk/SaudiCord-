let activeScreenShareRequests = 0;
let screenShareAudioActive = false;

export function beginScreenShareRequest() {
    activeScreenShareRequests++;
    let released = false;

    return () => {
        if (released) return;
        released = true;
        activeScreenShareRequests = Math.max(0, activeScreenShareRequests - 1);
    };
}

export function isScreenShareRequestActive() {
    return activeScreenShareRequests > 0;
}

export function setScreenShareAudioActive(active: boolean) {
    screenShareAudioActive = active;
}

export function isScreenShareAudioActive() {
    return screenShareAudioActive;
}

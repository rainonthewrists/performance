function smoothScrollToBottom() {
    const canvas = document.getElementById('main-canvas');
    const canvasHeight = canvas?.style.height ? parseInt(canvas.style.height, 10) : 0;
    const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    window.scrollTo({ top: Math.max(canvasHeight, docHeight), behavior: 'smooth' });
}

function waitForCanvas(callback, attempts = 50) {
    const canvas = document.getElementById('main-canvas');
    const height = canvas?.style.height ? parseInt(canvas.style.height, 10) : 0;
    
    if (height >= 100) {
        requestAnimationFrame(callback);
    } else if (attempts > 0) {
        setTimeout(() => waitForCanvas(callback, attempts - 1), 100);
    } else {
        callback();
    }
}

function handleHashOnLoad() {
    if (window.location.hash === '#open') {
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'auto' });
            waitForCanvas(() => setTimeout(smoothScrollToBottom, 200));
        });
    }
}

window.addEventListener('load', handleHashOnLoad);
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#open') waitForCanvas(smoothScrollToBottom);
});

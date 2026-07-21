(function () {
    'use strict';

    var loader = document.getElementById('gb-loader');
    if (!loader) return;

    var hideTimer = null;

    function resetLoader() {
        clearTimeout(hideTimer);
        loader.classList.remove('is-loading', 'is-done');
        loader.style.transform = 'scaleX(0)';
        loader.style.opacity = '0';
    }

    function finishLoader() {
        clearTimeout(hideTimer);
        loader.classList.remove('is-loading');
        loader.classList.add('is-done');
        loader.style.transform = 'scaleX(1)';
        hideTimer = setTimeout(resetLoader, 500);
    }

    function startLoader() {
        clearTimeout(hideTimer);
        loader.classList.remove('is-done');
        loader.style.transition = 'none';
        loader.style.opacity = '0';
        loader.style.transform = 'scaleX(0)';
        // Force a reflow so the reset above is committed before the
        // "is-loading" transition starts, otherwise the browser can
        // collapse both states into a single, invisible jump to 85%.
        void loader.offsetWidth;
        loader.style.transition = '';
        loader.classList.add('is-loading');
        requestAnimationFrame(function () {
            loader.style.transform = 'scaleX(0.85)';
        });
    }

    function isModifiedClick(event) {
        return event.defaultPrevented || event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    }

    function shouldSkipLink(link) {
        if (!link || !link.href) return true;
        if (link.hasAttribute('download')) return true;
        if (link.dataset.noLoader !== undefined) return true;

        var target = link.getAttribute('target');
        if (target && target !== '_self') return true;

        var href = link.getAttribute('href') || '';
        if (href === '' || href.charAt(0) === '#' ||
            href.indexOf('javascript:') === 0 ||
            href.indexOf('mailto:') === 0 ||
            href.indexOf('tel:') === 0) return true;

        var url;
        try {
            url = new URL(link.href, window.location.href);
        } catch (e) {
            return true;
        }
        if (url.origin !== window.location.origin) return true;
        if (url.pathname === window.location.pathname &&
            url.search === window.location.search && url.hash) return true;

        return false;
    }

    document.addEventListener('click', function (event) {
        if (isModifiedClick(event)) return;
        var link = event.target.closest && event.target.closest('a[href]');
        if (shouldSkipLink(link)) return;
        startLoader();
    });

    document.addEventListener('submit', function (event) {
        var form = event.target;
        if (!form || event.defaultPrevented) return;
        if (form.dataset && form.dataset.noLoader !== undefined) return;
        startLoader();
    });

    // Pages restored from the back/forward cache never re-run the
    // "finish" step below, so the bar would otherwise stay stuck mid-way.
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) resetLoader();
    });

    finishLoader();
})();

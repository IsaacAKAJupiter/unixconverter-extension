document.addEventListener('DOMContentLoaded', async () => {
    // Load the browser storage.
    let settings = await browser.storage.local.get();

    // Set the checkbox for milliseconds.
    let millisecondsCheckbox = document.getElementById(
        'unixconverter-popup-milliseconds'
    );
    if (settings.hasOwnProperty('milliseconds') && settings.milliseconds) {
        millisecondsCheckbox.checked = settings.milliseconds;
    }

    // Set the input for format.
    let formatInput = document.getElementById('unixconverter-popup-format');
    if (settings.hasOwnProperty('format') && settings.format) {
        formatInput.value = settings.format;
    }

    // Set the input for offset.
    let offsetInput = document.getElementById('unixconverter-popup-offset');
    if (settings.hasOwnProperty('offset') && settings.offset) {
        offsetInput.value = settings.offset;
    }

    // Set the event listener for the milliseconds checkbox.
    millisecondsCheckbox.addEventListener('change', async () => {
        // If the new value is true, add milliseconds to the browser local storage.
        if (millisecondsCheckbox.checked) {
            await browser.storage.local.set({ milliseconds: true });
        } else {
            // Otherwise, remove from browser local storage.
            await browser.storage.local.set({ milliseconds: false });
        }
    });

    // Set the event listener for the format input.
    formatInput.addEventListener('change', async () => {
        // Set the value in browser local storage.
        await browser.storage.local.set({ format: formatInput.value });
    });

    // Set the event listener for the offset input.
    offsetInput.addEventListener('change', async () => {
        // Set the value in browser local storage.
        await browser.storage.local.set({ offset: offsetInput.value });
    });

    // Set the loading to false (add dn to loading, remove dn from content).
    let loading = document.querySelector('.loading');
    let content = document.querySelector('.content');

    loading.classList.add('dn');
    content.classList.remove('dn');
});

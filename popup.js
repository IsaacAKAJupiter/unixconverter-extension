function getTimezoneOffset(timezone) {
    if (timezone.text.slice(0, 5) === '(UTC)') {
        return '00:00';
    } else {
        return timezone.text.slice(4, 10);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load the browser storage.
    let settings = await browser.storage.local.get();

    // Get all the timezones.
    let timezones = await (await fetch(
        await browser.runtime.getURL('timezones.json')
    )).json();

    // Create a datalist for the timezones.
    let datalist = document.getElementById('timezones');
    for (let i = 0; i < timezones.length; i++) {
        let option = document.createElement('option');
        option.value = timezones[i].value;
        option.text = `${timezones[i].abbr} (${getTimezoneOffset(
            timezones[i]
        )})`;
        datalist.appendChild(option);
    }

    // Set the radio input for fetch type.
    let radioButtons = document.querySelectorAll('input[name="fetchFormat"]');
    for (let i = 0; i < radioButtons.length; i++) {
        // Set input to checked if current setting.
        if (radioButtons[i].id === settings.fetchFormat) {
            radioButtons[i].checked = true;
        }

        // Add event listener to the input on click to set it to the settings.
        radioButtons[i].addEventListener('click', async () => {
            await browser.storage.local.set({
                fetchFormat: radioButtons[i].id
            });
        });
    }

    // Set the input for format.
    let formatInput = document.getElementById('unixconverter-popup-format');
    if (settings.hasOwnProperty('format') && settings.format) {
        formatInput.value = settings.format;
    }

    // Set the input for offset.
    let offsetInput = document.getElementById('unixconverter-popup-offset');
    if (
        settings.hasOwnProperty('offset') &&
        settings.offset &&
        settings.hasOwnProperty('timezone') &&
        settings.timezone
    ) {
        offsetInput.value = timezones.find(
            timezone => timezone.value === settings.timezone
        )['value'];
    }

    // Set the event listener for the format input.
    formatInput.addEventListener('change', async () => {
        // Set the value in browser local storage.
        await browser.storage.local.set({ format: formatInput.value });
    });

    // Set the event listener for the offset input.
    offsetInput.addEventListener('input', async () => {
        if (!offsetInput.value) {
            await browser.storage.local.set({ offset: null, timezone: null });
            return;
        }

        let timezone = timezones.find(
            timezone => timezone.value === offsetInput.value
        );
        let offset;
        if (timezone) {
            offset = getTimezoneOffset(timezone);
        } else if (offsetInput.value.match(/^[+-]?[0-9]{2}:[0-9]{2}$/)) {
            offset = offsetInput.value;
        }

        if (offset) {
            await browser.storage.local.set({
                offset,
                timezone: timezone.value
            });
        }
    });

    // Set the loading to false (add dn to loading, remove dn from content).
    let loading = document.querySelector('.loading');
    let content = document.querySelector('.content');

    loading.classList.add('dn');
    content.classList.remove('dn');
});

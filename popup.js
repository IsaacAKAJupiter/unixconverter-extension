document.addEventListener('DOMContentLoaded', async () => {
    // Start the loop for the current unix time at the top.
    let currentUnix = document.getElementById('current-unix');
    currentUnix.textContent = dayjs().unix();
    setInterval(() => {
        currentUnix.textContent = dayjs().unix();
    }, 500);

    // Load the browser storage.
    let settings = await browser.storage.local.get();

    // Get all the timezones.
    let timezones = await (await fetch(
        await browser.runtime.getURL('timezones.json')
    )).json();

    // Get the timezone from storage.
    let timezone = timezones.find(
        timezone => timezone.value === settings.timezone
    );

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
        offsetInput.value = timezone.value;
    }

    // Set the input for from-unix.
    let fromUnix = document.getElementById('unixconverter-popup-from-unix');
    fromUnix.value = dayjs().unix();

    // Set the input for human-readable.
    let humanReadable = document.getElementById(
        'unixconverter-popup-human-readable'
    );
    humanReadable.value = `${(await fixOffset(dayjs())).format(
        'MMM D, YYYY HH:mm:ss'
    )}${timezone ? ' ' + timezone.abbr : ''}`;

    // Set event listener to only allow numbers for the unix input.
    fromUnix.addEventListener('input', () => {
        fromUnix.value = fromUnix.value.replace(/[^0-9]/g, '');
    });

    // Set event listener for unix timestamp convert button.
    let fromUnixButton = document.getElementById('convert-unix-timestamp');
    fromUnixButton.addEventListener('click', async () => {
        // Fetch the date.
        let { textContent, fetchedIn } = await getFormattedDate(fromUnix.value);
        if (!textContent || !fetchedIn) return;

        let resultElement = document.getElementById(
            'convert-unix-timestamp-result'
        );

        resultElement.classList.remove('dn');
        resultElement.textContent = `Result (from ${fetchedIn}): ${textContent}`;
    });

    // Set event listener for human readable convert button.
    let humanReadableButton = document.getElementById('convert-human-readable');
    humanReadableButton.addEventListener('click', async () => {
        let date = Date.parse(humanReadable.value) / 1000;

        // Check if there was a timezone in the parsed date and if the user had a timezone setting set.
        if (
            !timezones.filter(timezone =>
                humanReadable.value.includes(timezone.abbr)
            ).length
        ) {
            // date = (await fixOffset(dayjs.unix(date))).unix();
        }

        let resultElement = document.getElementById(
            'convert-human-readable-result'
        );

        if (date) {
            resultElement.classList.remove('dn');
            resultElement.textContent = `Result (seconds): ${date}`;
        } else {
            resultElement.classList.remove('dn');
            resultElement.textContent =
                'Invalid input. If having issues, hover over the help icon.';
        }
    });

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

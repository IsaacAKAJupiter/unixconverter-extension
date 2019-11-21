async function format() {
    let date = await fixOffset(dayjs());
    return date.format('MMM DD YYYY HH:mm:ss');
}

async function getElapsed() {
    let settings = await browser.storage.local.get();
    let date = dayjs().startOf('year');
    date = date
        .year(settings.elapsedYear)
        .month(settings.elapsedMonth - 1)
        .date(settings.elapsedDay);
    return dayjs().diff(date);
}

function showActionOverlay(icon, text, time) {
    let action = document.getElementsByClassName('action')[0];

    // Set the icon textContent.
    action.children[0].textContent = icon;

    // Set the title textContent.
    action.children[1].textContent = text;

    // Add shown class to action.
    action.classList.add('shown');

    setTimeout(() => {
        action.classList.remove('shown');
    }, time);
}

document.addEventListener('DOMContentLoaded', async () => {
    loadDefaultSettings();

    // Make all onlyNumber inputs only allow inputting numbers.
    let numberInputs = document.querySelectorAll('input[onlyNumber]');
    for (let i = 0; i < numberInputs.length; i++) {
        // Set event listener to only allow numbers for the unix input.
        numberInputs[i].addEventListener('input', () => {
            numberInputs[i].value = numberInputs[i].value.replace(
                /[^0-9-]/g,
                ''
            );
        });
    }

    // Load the browser storage.
    let settings = await browser.storage.local.get();

    // Get all the timezones.
    let timezones = await (
        await fetch(await browser.runtime.getURL('timezones.json'))
    ).json();

    // Set variables for pausing the current timestamps at the top.
    let currentUnixPaused = false;
    let currentUnixMSPaused = false;
    let currentUnixReadablePaused = false;

    // Set variables for pausing the elapsed timestamps (third tab).
    let elapsedPaused = false;
    let elapsedMSPaused = false;

    // Start the loop for the current unix time at the top.
    let currentUnix = document.getElementById('current-unix');
    let currentUnixReadable = document.getElementById('current-unix-readable');
    currentUnix.textContent = dayjs().unix();
    currentUnixReadable.textContent = await format();
    setInterval(async () => {
        // Set the currentUnix if not paused.
        if (!currentUnixPaused) {
            currentUnix.textContent = dayjs().unix();
        }

        // Set the current unix readable if not paused.
        if (!currentUnixReadablePaused) {
            currentUnixReadable.textContent = await format();
        }
    }, 500);

    // Start the loop for the current unix time (ms) at the top.
    let currentUnixMS = document.getElementById('current-unix-ms');
    currentUnixMS.textContent = dayjs().valueOf();
    setInterval(() => {
        // Set the currentUnixMS if not paused.
        if (!currentUnixMSPaused) {
            currentUnixMS.textContent = dayjs().valueOf();
        }
    }, 1);

    // Start the loop for the elapsed time (third tab).
    let currentElapsed = document.getElementById('current-elapsed');
    currentElapsed.textContent = Math.round((await getElapsed()) / 1000);
    setInterval(async () => {
        // Set the currentElapsed if not paused.
        if (!elapsedPaused) {
            currentElapsed.textContent = Math.round(
                (await getElapsed()) / 1000
            );
        }
    }, 500);

    // Start the loop for the current unix time (ms) at the top.
    let currentElapsedMS = document.getElementById('current-elapsed-ms');
    currentElapsedMS.textContent = await getElapsed();
    setInterval(async () => {
        // Set the currentElapsedMS if not paused.
        if (!elapsedMSPaused) {
            currentElapsedMS.textContent = await getElapsed();
        }
    }, 1);

    // Set event listeners for the current timestamps.
    // Mouse enter.
    currentUnix.addEventListener('mouseenter', _ => (currentUnixPaused = true));
    currentUnixMS.addEventListener(
        'mouseenter',
        _ => (currentUnixMSPaused = true)
    );
    currentUnixReadable.addEventListener(
        'mouseenter',
        _ => (currentUnixReadablePaused = true)
    );
    // Mouse leave.
    currentUnix.addEventListener(
        'mouseleave',
        _ => (currentUnixPaused = false)
    );
    currentUnixMS.addEventListener(
        'mouseleave',
        _ => (currentUnixMSPaused = false)
    );
    currentUnixReadable.addEventListener(
        'mouseleave',
        _ => (currentUnixReadablePaused = false)
    );
    // Click
    currentUnix.addEventListener('click', _ => {
        copyToClipboard(currentUnix.textContent);
        showActionOverlay('checkmark', 'Copied to Clipboard', 1000);
    });
    currentUnixMS.addEventListener('click', _ => {
        copyToClipboard(currentUnixMS.textContent);
        showActionOverlay('checkmark', 'Copied to Clipboard', 1000);
    });
    currentUnixReadable.addEventListener('click', _ => {
        copyToClipboard(currentUnixReadable.textContent);
        showActionOverlay('checkmark', 'Copied to Clipboard', 1000);
    });

    // Set event listeners for the elapsed time (third tab).
    // Mouse enter.
    currentElapsed.addEventListener('mouseenter', _ => (elapsedPaused = true));
    currentElapsedMS.addEventListener(
        'mouseenter',
        _ => (elapsedMSPaused = true)
    );
    // Mouse leave.
    currentElapsed.addEventListener('mouseleave', _ => (elapsedPaused = false));
    currentElapsedMS.addEventListener(
        'mouseleave',
        _ => (elapsedMSPaused = false)
    );
    // Click
    currentElapsed.addEventListener('click', _ => {
        copyToClipboard(currentElapsed.textContent);
        showActionOverlay('checkmark', 'Copied to Clipboard', 1000);
    });
    currentElapsedMS.addEventListener('click', _ => {
        copyToClipboard(currentElapsedMS.textContent);
        showActionOverlay('checkmark', 'Copied to Clipboard', 1000);
    });

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
    } else if (
        settings.hasOwnProperty('offset') &&
        settings.offset &&
        (!settings.hasOwnProperty('timezone') || !settings.timezone)
    ) {
        offsetInput.value = settings.offset;
    }

    // Set the input for from-unix.
    let fromUnix = document.getElementById('unixconverter-popup-from-unix');
    fromUnix.value = dayjs().unix();

    // Set the input for human-readable.
    let humanReadable = document.getElementById(
        'unixconverter-popup-human-readable'
    );
    // Get the first part of the input value.
    let hrFirst = (await fixOffset(dayjs())).format('MMM D, YYYY HH:mm:ss');
    // Get the offset if set.
    let hrSecond = settings.offset ? `GMT${settings.offset}` : '';
    humanReadable.value = `${hrFirst} ${hrSecond}`;

    // Set the input for elapsedYear and also set event listeners for it.
    let elapsedYear = document.getElementById(
        'unixconverter-popup-elapsed-year'
    );
    if (settings.hasOwnProperty('elapsedYear') && settings.elapsedYear) {
        elapsedYear.value = settings.elapsedYear;
    }
    elapsedYear.addEventListener('input', async () => {
        if (elapsedYear.value.match(/^-?[0-9]+$/)) {
            // Set the value in browser local storage.
            await browser.storage.local.set({ elapsedYear: elapsedYear.value });
        }
    });

    // Set the input for elapsedMonth and also set event listeners for it.
    let elapsedMonth = document.getElementById(
        'unixconverter-popup-elapsed-month'
    );
    if (settings.hasOwnProperty('elapsedMonth') && settings.elapsedMonth) {
        elapsedMonth.value = settings.elapsedMonth;
    }
    elapsedMonth.addEventListener('input', async () => {
        if (elapsedMonth.value.match(/^-?[0-9]+$/)) {
            // Set the value in browser local storage.
            await browser.storage.local.set({
                elapsedMonth: elapsedMonth.value
            });
        }
    });

    // Set the input for elapsedDay.
    let elapsedDay = document.getElementById('unixconverter-popup-elapsed-day');
    if (settings.hasOwnProperty('elapsedDay') && settings.elapsedDay) {
        elapsedDay.value = settings.elapsedDay;
    }
    elapsedDay.addEventListener('input', async () => {
        if (elapsedDay.value.match(/^-?[0-9]+$/)) {
            // Set the value in browser local storage.
            await browser.storage.local.set({ elapsedDay: elapsedDay.value });
        }
    });

    // Set the input for contextMenu.
    let contextMenu = document.getElementById(
        'unixconverter-popup-contextmenu'
    );
    contextMenu.checked = settings.contextMenu;

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

        // Get the result element.
        let resultElement = document.getElementById(
            'convert-human-readable-result'
        );

        // Check if the date exists and set the result element's textContent.
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
        let tz;
        let newTimezone = timezones.find(
            timezone => timezone['value'] === offsetInput.value
        );
        if (newTimezone) {
            offset = getTimezoneOffset(newTimezone);
            tz = newTimezone.value;
        } else if (offsetInput.value.match(/^[+-]?[0-9]{2}:[0-9]{2}$/)) {
            offset = offsetInput.value;
            tz = null;
        }

        if (offset) {
            await browser.storage.local.set({
                offset,
                timezone: tz
            });
        }
    });

    // Set the event listener for the contextMenu checkbox.
    contextMenu.addEventListener('change', async () => {
        // Update the contextMenu browser storage setting.
        await browser.storage.local.set({ contextMenu: contextMenu.checked });
    });

    // Set the loading to false (add dn to loading, remove dn from content).
    let loading = document.querySelector('.loading');
    let content = document.querySelector('.content');

    loading.classList.add('dn');
    content.classList.remove('dn');
});

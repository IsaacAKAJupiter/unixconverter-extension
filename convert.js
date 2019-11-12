async function fixOffset(date) {
    let settings = await browser.storage.local.get();

    if (settings.hasOwnProperty('offset') && settings.offset) {
        let splitOffset = settings.offset.split(':');
        date = date
            .subtract(date.utcOffset(), 'minute')
            .add(parseInt(splitOffset[0]), 'hour')
            .add(parseInt(splitOffset[1]), 'minute');
    }

    return date;
}

async function getFormattedDate(text) {
    // Regex out the spaces.
    text = text.replace(/[ ]/g, '');

    // Check if you selected a number.
    if (!/^[0-9]{1,}([\.]?[0-9]{1,})?$/.test(text)) {
        return { textContent: null, fetchedIn: null };
    }

    // Get the extension settings.
    let settings = await browser.storage.local.get();

    // Replace all non digits/periods then replace all except the last period.
    text = parseFloat(
        text.replace(/[^0-9\.]+/g, '').replace(/[.](?=.*[.])/g, '')
    );

    // Get the date based on the settings.
    let date;
    let fetchedIn;
    switch (settings.fetchFormat) {
        case 'auto':
            // Replace the decimal and numbers after it to get proper length.
            let stringLen = `${text}`.replace(/\.[0-9]*/g, '').length;

            if (stringLen >= 12 && stringLen < 15) {
                date = dayjs(text);
                fetchedIn = 'milliseconds';
            } else if (stringLen >= 15 && stringLen < 17) {
                date = dayjs(text / 1000);
                fetchedIn = 'microseconds';
            } else if (stringLen >= 17) {
                date = dayjs(text / 1000000);
                fetchedIn = 'nanoseconds';
            } else {
                date = dayjs.unix(text);
                fetchedIn = 'seconds';
            }
            break;
        case 'seconds':
            date = dayjs.unix(text);
            fetchedIn = 'seconds';
            break;
        case 'milliseconds':
            date = dayjs(text);
            fetchedIn = 'milliseconds';
            break;
        case 'microseconds':
            date = dayjs(text / 1000);
            fetchedIn = 'microseconds';
            break;
        case 'nanoseconds':
            date = dayjs(text / 1000000);
            fetchedIn = 'nanoseconds';
            break;
        default:
            return { textContent: null, fetchedIn: null };
    }

    // Do math on the date depending on the timezone.
    date = await fixOffset(date);

    // Get the text content that the p tag is going to be in.
    let textContent;
    if (settings.hasOwnProperty('format') && settings.format) {
        textContent = date.format(settings.format);
    } else {
        let format;

        // Check if offset setting is set.
        if (settings.hasOwnProperty('offset') && settings.offset) {
            format = `ddd MMM DD YYYY HH:mm:ss [GMT]${settings.offset.replace(
                ':',
                ''
            )}`;
        } else {
            format = 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ';
        }

        textContent = date.format(format);
    }

    return { textContent, fetchedIn };
}

function getTimezoneOffset(timezone) {
    if (timezone.text.slice(0, 5) === '(UTC)') {
        return '00:00';
    } else {
        return timezone.text.slice(4, 10);
    }
}

function copyToClipboard(text) {
    function oncopy(event) {
        document.removeEventListener('copy', oncopy, true);
        // Hide the event from the page to prevent tampering.
        event.stopImmediatePropagation();

        // Overwrite the clipboard content.
        event.preventDefault();
        event.clipboardData.setData('text/plain', text);
    }
    document.addEventListener('copy', oncopy, true);

    // Execute the copy command.
    document.execCommand('copy');
}

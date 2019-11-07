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
    // Check if you selected regex.
    if (!/^[0-9]{1,}([\.]?[0-9]{1,})?$/.test(text)) {
        return { textContent: null, fetchedIn: null };
    }

    // Get the extension settings.
    let settings = await browser.storage.local.get();

    // Get the date based on the settings.
    text = parseFloat(text);
    let date;
    let fetchedIn;
    switch (settings.fetchFormat) {
        case 'auto':
            let textString = `${text}`;

            if (textString.length >= 12 && textString.length < 15) {
                date = dayjs(text);
                fetchedIn = 'milliseconds';
            } else if (textString.length >= 15 && textString.length < 17) {
                date = dayjs(text / 1000);
                fetchedIn = 'microseconds';
            } else if (textString.length >= 17) {
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

function getSelectedText() {
    // Try window.getSelection. If not found use document.selection.
    if (window.getSelection) {
        var activeElement = document.activeElement;
        if (activeElement && activeElement.value) {
            return activeElement.value
                .substring(
                    activeElement.selectionStart,
                    activeElement.selectionEnd
                )
                .trim();
        } else {
            let selection = window.getSelection();
            if (selection) {
                return selection.toString().trim();
            }
        }

        // Check if the selection exists.
    } else if (document.selection) {
        return document.selection.createRange().text.trim();
    }

    // If neither was found, console error.
    console.error('Cannot get the selected text.');
    return '';
}

document.addEventListener('mouseup', async ev => {
    // Get the base div.
    let baseDiv = document.getElementById('unixconverter-base');

    // If the base div exists, do not allow more conversions.
    if (baseDiv) {
        // Check if target was not the base or the date and if neither, remove the base div.
        if (
            ev.target.id !== 'unixconverter-base' &&
            ev.target.id !== 'unixconverter-date'
        ) {
            baseDiv.remove();
        }

        return;
    }

    // Check if CTRL was held down.
    if (!ev.ctrlKey) return;

    // Get the selected text.
    let text = getSelectedText();
    // If there is no text, just return.
    if (!text) return;

    // Check if you selected regex.
    if (/^[0-9]{1,}[\.]?[0-9]{1,}$/.test(text)) {
        // Get the extension settings.
        let settings = await browser.storage.local.get();

        // Get the date based on the settings.
        text = parseFloat(text);
        let date;
        if (settings.hasOwnProperty('milliseconds') && settings.milliseconds) {
            date = dayjs(text);
        } else {
            date = dayjs.unix(text);
        }

        // Do math on the date depending on the timezone.
        if (settings.hasOwnProperty('offset') && settings.offset) {
            let splitOffset = settings.offset.split(':');
            date = date
                .add(date.utcOffset(), 'minute')
                .add(parseInt(splitOffset[0]), 'hour')
                .add(parseInt(splitOffset[1]), 'minute');
        }

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

        // Create an element in the body.
        let div = document.createElement('div');
        // Set the ID and the top/left style based on the mouse position.
        div.id = 'unixconverter-base';
        div.style.left = `${ev.clientX}px`;
        div.style.top = `${ev.clientY + 30}px`;

        // Create the actual timestamp.
        let p = document.createElement('p');
        p.id = 'unixconverter-date';
        p.textContent = textContent;

        // Append elements.
        div.appendChild(p);
        document.body.appendChild(div);
    }
});
